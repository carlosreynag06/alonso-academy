"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getChildAccessState } from "@/lib/auth/child";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { startFixtureLesson } from "@/lib/development-fixtures/commands";
import { getChildLessonHome } from "@/lib/lesson/repository";
import { childAttemptRuntimePayloadSchema } from "@/lib/lesson/runtime-contracts";
import { createClient } from "@/lib/supabase/server";

export async function startLesson(formData: FormData) {
  const access = await getChildAccessState();
  if (access.status !== "ready") redirect("/login");
  const assignmentId = formData.get("assignmentId")?.toString();
  if (!assignmentId) redirect("/alonso?error=lesson");
  const home = await getChildLessonHome().catch(() => null);
  const assignment = [
    home?.todayAssignment,
    ...(home?.replayAssignments ?? []),
    ...(home?.retrievalAssignments ?? []),
  ].find((candidate) => candidate?.id === assignmentId);
  if (!assignment) redirect("/alonso?error=lesson");
  if (access.fixture) {
    const attempt = await startFixtureLesson(assignment.id, assignment.mode).catch(() => null);
    if (!attempt) redirect("/alonso?error=lesson");
    redirect(`/alonso/lesson/${attempt.snapshot.attemptId}`);
  }
  if (ACTIVE_RECOVERY.childDeliveryLocked) redirect("/alonso?error=recovery_lock");
  const supabase = await createClient();
  const result = await supabase.rpc("start_child_assignment", {
    p_assignment_id: assignment.id,
    p_mode: assignment.mode,
    p_client_event_id: randomUUID(),
  });
  const runtime = childAttemptRuntimePayloadSchema.safeParse(result.data);
  if (result.error || !runtime.success) redirect("/alonso?error=lesson");
  redirect(`/alonso/lesson/${runtime.data.snapshot.attemptId}`);
}
