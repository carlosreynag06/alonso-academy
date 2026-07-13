"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getParentAccessState } from "@/lib/auth/parent";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { createClient } from "@/lib/supabase/server";

type ActivationMode = "assigned" | "scheduled" | "published";

function value(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() ?? "";
}

function validNote(formData: FormData, field = "note") {
  const note = value(formData, field);
  return note.length >= 5 ? note : null;
}

function isoDateTime(raw: string) {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function artifactPath(artifactId: string, result: string, failed = false) {
  const key = failed ? "publicationError" : "publication";
  return `/parent/artifacts/${encodeURIComponent(artifactId)}?${key}=${encodeURIComponent(result)}`;
}

function refreshPublication(artifactId?: string) {
  revalidatePath("/parent");
  revalidatePath("/parent/generation");
  revalidatePath("/parent/recovery");
  revalidatePath("/alonso");
  if (artifactId) revalidatePath(`/parent/artifacts/${artifactId}`);
}

async function authorizedClient(artifactId: string) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  if (access.fixture) redirect(artifactPath(artifactId, "fixture", true));
  if (ACTIVE_RECOVERY.productMutationsLocked) redirect(artifactPath(artifactId, "locked", true));
  return createClient();
}

export async function createLearningWeek(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const childId = value(formData, "childId");
  const note = validNote(formData);
  if (!artifactId || !childId || !note) redirect(artifactPath(artifactId, "invalid-week", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("create_learning_week_from_plan", {
    p_weekly_plan_artifact_id: artifactId,
    p_child_id: childId,
    p_starts_on: value(formData, "startsOn") || null,
    p_timezone: value(formData, "timezone") || "America/New_York",
    p_note: note,
  });
  if (error) redirect(artifactPath(artifactId, "week", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "week-created"));
}

export async function scheduleLessonAssignment(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const slotId = value(formData, "slotId");
  const note = validNote(formData);
  const availableFrom = isoDateTime(value(formData, "availableFrom"));
  const untilRaw = value(formData, "availableUntil");
  const availableUntil = isoDateTime(untilRaw);
  if (!artifactId || !slotId || !note || !availableFrom || (untilRaw && !availableUntil)) redirect(artifactPath(artifactId, "invalid-schedule", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("schedule_lesson_assignment", {
    p_week_day_slot_id: slotId,
    p_lesson_artifact_id: artifactId,
    p_available_from: availableFrom,
    p_available_until: availableUntil,
    p_note: note,
  });
  if (error) redirect(artifactPath(artifactId, "schedule", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "scheduled"));
}

export async function publishLessonAssignment(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const assignmentId = value(formData, "assignmentId");
  const note = validNote(formData);
  if (!artifactId || !assignmentId || !note) redirect(artifactPath(artifactId, "invalid-publish", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("publish_lesson_assignment", { p_assignment_id: assignmentId, p_note: note });
  if (error) redirect(artifactPath(artifactId, "publish", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "published"));
}

export async function setLessonAssignmentReplay(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const assignmentId = value(formData, "assignmentId");
  const replayAllowed = value(formData, "replayAllowed") === "true";
  const note = validNote(formData);
  if (!artifactId || !assignmentId || !note) redirect(artifactPath(artifactId, "invalid-replay", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("set_lesson_assignment_replay", {
    p_assignment_id: assignmentId,
    p_replay_allowed: replayAllowed,
    p_note: note,
  });
  if (error) redirect(artifactPath(artifactId, "replay", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, replayAllowed ? "replay-enabled" : "replay-disabled"));
}

export async function replaceLessonAssignment(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const assignmentId = value(formData, "assignmentId");
  const replacementArtifactId = value(formData, "replacementArtifactId");
  const activationMode = value(formData, "activationMode") as ActivationMode;
  const note = validNote(formData);
  const fromRaw = value(formData, "availableFrom");
  const untilRaw = value(formData, "availableUntil");
  const availableFrom = isoDateTime(fromRaw);
  const availableUntil = isoDateTime(untilRaw);
  if (!artifactId || !assignmentId || !replacementArtifactId || !["assigned", "scheduled", "published"].includes(activationMode) || !note || (fromRaw && !availableFrom) || (untilRaw && !availableUntil) || (activationMode === "scheduled" && !availableFrom)) redirect(artifactPath(artifactId, "invalid-replacement", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("replace_lesson_assignment", {
    p_assignment_id: assignmentId,
    p_replacement_lesson_artifact_id: replacementArtifactId,
    p_activation_mode: activationMode,
    p_available_from: availableFrom,
    p_available_until: availableUntil,
    p_note: note,
  });
  if (error) redirect(artifactPath(artifactId, "replace", true));
  refreshPublication(artifactId);
  revalidatePath(`/parent/artifacts/${replacementArtifactId}`);
  redirect(artifactPath(replacementArtifactId, "replaced"));
}

export async function withdrawLessonAssignment(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const assignmentId = value(formData, "assignmentId");
  const reason = validNote(formData, "reason");
  if (!artifactId || !assignmentId || !reason) redirect(artifactPath(artifactId, "invalid-withdrawal", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("withdraw_lesson_assignment", { p_assignment_id: assignmentId, p_reason: reason });
  if (error) redirect(artifactPath(artifactId, "withdraw", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "withdrawn"));
}

export async function archiveLessonAssignment(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const assignmentId = value(formData, "assignmentId");
  const reason = validNote(formData, "reason");
  if (!artifactId || !assignmentId || !reason) redirect(artifactPath(artifactId, "invalid-assignment-archive", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("archive_lesson_assignment", { p_assignment_id: assignmentId, p_reason: reason });
  if (error) redirect(artifactPath(artifactId, "assignment-archive", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "assignment-archived"));
}

export async function revokeArtifactApproval(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const reason = validNote(formData, "reason");
  if (!artifactId || !reason) redirect(artifactPath(artifactId, "invalid-revocation", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("revoke_generated_artifact_approval", { p_artifact_id: artifactId, p_reason: reason });
  if (error) redirect(artifactPath(artifactId, "revoke", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "approval-revoked"));
}

export async function archiveArtifact(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const reason = validNote(formData, "reason");
  if (!artifactId || !reason) redirect(artifactPath(artifactId, "invalid-artifact-archive", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("archive_generated_artifact", { p_artifact_id: artifactId, p_reason: reason });
  if (error) redirect(artifactPath(artifactId, "artifact-archive", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "artifact-archived"));
}

export async function archiveLearningWeek(formData: FormData) {
  const artifactId = value(formData, "artifactId");
  const learningWeekId = value(formData, "learningWeekId");
  const reason = validNote(formData, "reason");
  if (!artifactId || !learningWeekId || !reason) redirect(artifactPath(artifactId, "invalid-week-archive", true));
  const supabase = await authorizedClient(artifactId);
  const { error } = await supabase.rpc("archive_learning_week", { p_learning_week_id: learningWeekId, p_reason: reason });
  if (error) redirect(artifactPath(artifactId, "week-archive", true));
  refreshPublication(artifactId);
  redirect(artifactPath(artifactId, "week-archived"));
}
