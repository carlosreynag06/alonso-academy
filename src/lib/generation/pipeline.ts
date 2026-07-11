import "server-only";

import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { Json } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { artifactSchemas, type ArtifactKind } from "./contracts";
import { createOrReuseGenerationJob, hashGenerationRequest, markGenerationJobFailed, markGenerationJobRunning, markGenerationJobSucceeded } from "./jobs";
import { INSTRUCTIONAL_MODEL, INSTRUCTIONAL_REASONING_EFFORT, PROMPT_VERSION } from "./models";
import { buildGenerationPrompt } from "./prompts";
import { requestStructuredArtifact, validateSemantics } from "./provider";
import { getLatestApprovedWeeklyPlan } from "./repository";
import { buildApprovedCurriculumSnapshot } from "./snapshot";
import { mergeSemanticValidation, validateArtifactDeterministically } from "./validator";

export type GenerationRequest = {
  kind: Exclude<ArtifactKind, "parent_summary">;
  unitId: string;
  parentRequest: string;
  day: number | null;
  previousArtifactId: string | null;
  idempotencyKey?: string;
};

export type GenerationOutcome =
  | { ok: true; artifactId: string; reused: boolean }
  | { ok: false; code: string; message: string };

function asJson(value: unknown): Json {
  return value as Json;
}

export async function generateValidatedArtifact(request: GenerationRequest): Promise<GenerationOutcome> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub?.toString();
  if (!actorId) return { ok: false, code: "AUTH_REQUIRED", message: "Parent authentication is required." };

  const recent = await supabase.from("generation_jobs").select("id", { count: "exact", head: true })
    .eq("requested_by", actorId).gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString());
  if (recent.error) throw recent.error;
  if ((recent.count ?? 0) >= 3) return { ok: false, code: "RATE_LIMIT", message: "Please wait a few minutes before requesting another generation." };

  const snapshot = await buildApprovedCurriculumSnapshot(request.unitId);
  if (!snapshot.ready) return { ok: false, code: snapshot.code, message: snapshot.message };

  const needsWeeklyPlan = request.kind !== "weekly_plan";
  const weeklyPlan = needsWeeklyPlan ? await getLatestApprovedWeeklyPlan(request.unitId) : null;
  if (needsWeeklyPlan && !weeklyPlan) return { ok: false, code: "APPROVED_WEEK_REQUIRED", message: "Approve a validated weekly plan before generating individual lessons." };
  if (needsWeeklyPlan && (!request.day || request.day < 1 || request.day > 5)) return { ok: false, code: "DAY_REQUIRED", message: "Choose a day from the approved weekly plan." };

  let lineageKey = request.kind === "weekly_plan" ? "weekly" : `${weeklyPlan!.id}:day-${request.day}:${request.kind}`;
  if (request.previousArtifactId) {
    const previous = await supabase.from("generated_artifacts").select("lineage_key").eq("id", request.previousArtifactId).single();
    if (previous.error) return { ok: false, code: "VERSION_NOT_FOUND", message: "The version selected for regeneration no longer exists." };
    lineageKey = previous.data.lineage_key;
  }

  const requestBody = {
    kind: request.kind,
    unitId: request.unitId,
    snapshotId: snapshot.scope.snapshotId,
    request: request.parentRequest,
    day: request.day,
    weeklyPlanId: weeklyPlan?.id ?? null,
    lineageKey,
  };
  const requestHash = hashGenerationRequest(requestBody);
  const idempotencyKey = request.idempotencyKey?.trim() || randomUUID();
  const jobResult = await createOrReuseGenerationJob({
    idempotencyKey,
    artifactKind: request.kind,
    curriculumUnitId: request.unitId,
    curriculumSnapshotId: snapshot.scope.snapshotId,
    requestHash,
  });
  if (jobResult.reused && jobResult.job.artifact_id) return { ok: true, artifactId: jobResult.job.artifact_id, reused: true };
  if (jobResult.reused && jobResult.job.status !== "queued") return { ok: false, code: "REQUEST_ALREADY_HANDLED", message: jobResult.job.safe_error_message ?? "This request is already being processed." };
  await markGenerationJobRunning(jobResult.job.id);

  const prompt = buildGenerationPrompt({
    kind: request.kind,
    scope: snapshot.scope,
    durationMinutes: 15,
    request: [
      request.parentRequest,
      weeklyPlan ? `Use weeklyPlanId exactly as ${weeklyPlan.id}. Create day ${request.day}.` : "Create exactly five ordered lesson days.",
    ].join("\n"),
    approvedWeeklyPlan: weeklyPlan ? { id: weeklyPlan.id, content: weeklyPlan.content } : undefined,
  });

  const schema = artifactSchemas[request.kind] as z.ZodType<unknown>;
  const generated = await requestStructuredArtifact({ schema, schemaName: request.kind, system: prompt.system, user: prompt.user });
  if (!generated.ok) {
    await markGenerationJobFailed(jobResult.job.id, generated.category, generated.safeMessage);
    await supabase.from("provider_metadata").insert({ provider: "openai", operation: `generate.${request.kind}`, model_id: INSTRUCTIONAL_MODEL, status: "failed", safe_metadata: { category: generated.category, retryable: generated.retryable } });
    return { ok: false, code: generated.category.toUpperCase(), message: generated.safeMessage };
  }

  const previousResult = await supabase.from("generated_artifacts").select("id, version")
    .eq("kind", request.kind).eq("curriculum_unit_id", request.unitId).eq("lineage_key", lineageKey)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (previousResult.error) throw previousResult.error;
  const version = (previousResult.data?.version ?? 0) + 1;
  const inserted = await supabase.from("generated_artifacts").insert({
    kind: request.kind,
    status: "validating",
    version,
    previous_version_id: previousResult.data?.id ?? null,
    curriculum_unit_id: request.unitId,
    curriculum_snapshot: asJson(snapshot.scope),
    content: asJson(generated.value),
    model_id: generated.model,
    prompt_version: PROMPT_VERSION,
    request_hash: requestHash,
    reasoning_effort: INSTRUCTIONAL_REASONING_EFFORT,
    semantic_validator_model_id: INSTRUCTIONAL_MODEL,
    lineage_key: lineageKey,
    parent_artifact_id: weeklyPlan?.id ?? null,
    day_number: request.day,
    created_by: actorId,
  }).select("*").single();
  if (inserted.error) {
    await markGenerationJobFailed(jobResult.job.id, "DATABASE_WRITE", "The draft could not be stored. Existing content is unchanged.");
    throw inserted.error;
  }

  const deterministic = validateArtifactDeterministically(request.kind, generated.value, snapshot.scope);
  if (!deterministic.deterministicValid) {
    await supabase.from("generated_artifacts").update({ status: "validation_failed", validation_report: asJson(deterministic) }).eq("id", inserted.data.id);
    await markGenerationJobSucceeded(jobResult.job.id, inserted.data.id);
    return { ok: true, artifactId: inserted.data.id, reused: false };
  }

  const semantic = await validateSemantics({ artifact: generated.value, curriculumSnapshot: snapshot.scope });
  if (!semantic.ok) {
    const failedReport = { ...deterministic, valid: false, semanticValid: false, issues: [...deterministic.issues, { code: "SEMANTIC_VALIDATION_UNAVAILABLE", severity: "error" as const, path: "$", message: semantic.safeMessage, targetId: null }] };
    await supabase.from("generated_artifacts").update({ status: "validation_failed", validation_report: asJson(failedReport) }).eq("id", inserted.data.id);
    await markGenerationJobSucceeded(jobResult.job.id, inserted.data.id);
    return { ok: true, artifactId: inserted.data.id, reused: false };
  }

  const report = mergeSemanticValidation(deterministic, semantic.value);
  await supabase.from("generated_artifacts").update({ status: report.valid ? "validated" : "validation_failed", validation_report: asJson(report) }).eq("id", inserted.data.id);
  await markGenerationJobSucceeded(jobResult.job.id, inserted.data.id);
  await supabase.from("provider_metadata").insert({ provider: "openai", operation: `generate.${request.kind}`, external_id: generated.responseId, model_id: generated.model, status: report.valid ? "validated" : "validation_failed", safe_metadata: { artifact_id: inserted.data.id, version } });
  await supabase.from("audit_events").insert({ actor_id: actorId, event_type: "artifact.generated", entity_type: "generated_artifact", entity_id: inserted.data.id, safe_details: { kind: request.kind, version, validation_status: report.valid ? "validated" : "validation_failed" } });
  return { ok: true, artifactId: inserted.data.id, reused: false };
}
