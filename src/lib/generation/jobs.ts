import "server-only";

import { createHash } from "node:crypto";
import type { ArtifactKind } from "./contracts";
import { createClient } from "@/lib/supabase/server";

export function hashGenerationRequest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function createOrReuseGenerationJob(input: {
  idempotencyKey: string;
  artifactKind: ArtifactKind;
  curriculumUnitId: string;
  curriculumSnapshotId: string;
  requestHash: string;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const requestedBy = claims?.claims?.sub?.toString();
  if (!requestedBy) throw new Error("Authenticated parent access is required.");

  const inserted = await supabase.from("generation_jobs").insert({
    idempotency_key: input.idempotencyKey,
    artifact_kind: input.artifactKind,
    curriculum_unit_id: input.curriculumUnitId,
    curriculum_snapshot_id: input.curriculumSnapshotId,
    request_hash: input.requestHash,
    requested_by: requestedBy,
  }).select("*").single();

  if (!inserted.error) return { job: inserted.data, reused: false };
  if (inserted.error.code !== "23505") throw inserted.error;

  const existing = await supabase.from("generation_jobs").select("*").eq("idempotency_key", input.idempotencyKey).single();
  if (existing.error) throw existing.error;
  if (existing.data.request_hash !== input.requestHash) {
    throw new Error("This idempotency key was already used for a different request.");
  }
  return { job: existing.data, reused: true };
}

export async function markGenerationJobRunning(jobId: string) {
  const supabase = await createClient();
  const current = await supabase.from("generation_jobs").select("attempts").eq("id", jobId).single();
  if (current.error) throw current.error;
  const result = await supabase.from("generation_jobs").update({ status: "running", attempts: current.data.attempts + 1, started_at: new Date().toISOString() }).eq("id", jobId).eq("status", "queued").select("*").maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function markGenerationJobSucceeded(jobId: string, artifactId: string) {
  const supabase = await createClient();
  const result = await supabase.from("generation_jobs").update({
    status: "succeeded",
    artifact_id: artifactId,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function markGenerationJobFailed(jobId: string, code: string, safeMessage: string) {
  const supabase = await createClient();
  const result = await supabase.from("generation_jobs").update({
    status: "failed",
    safe_error_code: code,
    safe_error_message: safeMessage,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}
