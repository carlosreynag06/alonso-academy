import { NextResponse } from "next/server";
import { getChildAccessState } from "@/lib/auth/child";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { completeFixtureLesson, FixtureCommandError } from "@/lib/development-fixtures/commands";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { attemptId } = await params;
  if (access.fixture) {
    try {
      await completeFixtureLesson(attemptId);
      return NextResponse.json({ ok: true, fixture: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof FixtureCommandError ? error.code : "fixture_lesson_not_completed" }, { status: error instanceof FixtureCommandError ? error.status : 500 });
    }
  }
  if (ACTIVE_RECOVERY.productMutationsLocked) return NextResponse.json({ error: "recovery_lock" }, { status: 423 });
  const supabase = await createClient();
  const result = await supabase.rpc("complete_child_lesson", { p_attempt_id: attemptId });
  if (result.error) return NextResponse.json({ error: "lesson_not_completed" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
