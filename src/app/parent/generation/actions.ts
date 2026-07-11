"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getParentAccessState } from "@/lib/auth/parent";
import type { ArtifactKind } from "@/lib/generation/contracts";
import { generateValidatedArtifact } from "@/lib/generation/pipeline";
import { createClient } from "@/lib/supabase/server";

const allowedKinds = new Set<ArtifactKind>(["weekly_plan", "daily_lesson", "review_lesson", "story_lesson"]);

export async function requestGeneration(formData: FormData) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent/login");

  const kind = formData.get("kind")?.toString() as ArtifactKind | undefined;
  const unitId = formData.get("unitId")?.toString();
  const parentRequest = formData.get("parentRequest")?.toString().trim();
  const dayValue = formData.get("day")?.toString();
  const previousArtifactId = formData.get("previousArtifactId")?.toString() || null;
  const idempotencyKey = formData.get("idempotencyKey")?.toString();
  const day = dayValue ? Number(dayValue) : null;

  if (!kind || !allowedKinds.has(kind) || !unitId || !parentRequest || parentRequest.length < 8) {
    redirect("/parent/generation?error=invalid_request");
  }

  const outcome = await generateValidatedArtifact({
    kind: kind as Exclude<ArtifactKind, "parent_summary">,
    unitId,
    parentRequest,
    day,
    previousArtifactId,
    idempotencyKey,
  });
  if (!outcome.ok) redirect(`/parent/generation?error=${encodeURIComponent(outcome.code)}&message=${encodeURIComponent(outcome.message)}`);

  revalidatePath("/parent");
  revalidatePath("/parent/generation");
  redirect(`/parent/artifacts/${outcome.artifactId}?generated=1${outcome.reused ? "&reused=1" : ""}`);
}

export async function approveArtifact(formData: FormData) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent/login");
  const artifactId = formData.get("artifactId")?.toString();
  const note = formData.get("note")?.toString().trim();
  if (!artifactId || !note || note.length < 5) redirect(`/parent/artifacts/${artifactId ?? ""}?error=note`);

  const supabase = await createClient();
  const result = await supabase.rpc("approve_generated_artifact", { p_artifact_id: artifactId, p_note: note });
  if (result.error) redirect(`/parent/artifacts/${artifactId}?error=approval`);
  revalidatePath("/parent");
  revalidatePath("/parent/generation");
  revalidatePath(`/parent/artifacts/${artifactId}`);
  redirect(`/parent/artifacts/${artifactId}?approved=1`);
}

export async function rejectArtifact(formData: FormData) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent/login");
  const artifactId = formData.get("artifactId")?.toString();
  const note = formData.get("note")?.toString().trim();
  if (!artifactId || !note || note.length < 5) redirect(`/parent/artifacts/${artifactId ?? ""}?error=note`);

  const supabase = await createClient();
  const result = await supabase.rpc("reject_generated_artifact", { p_artifact_id: artifactId, p_note: note });
  if (result.error) redirect(`/parent/artifacts/${artifactId}?error=rejection`);
  revalidatePath("/parent");
  revalidatePath("/parent/generation");
  revalidatePath(`/parent/artifacts/${artifactId}`);
  redirect(`/parent/artifacts/${artifactId}?rejected=1`);
}
