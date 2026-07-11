import { NextResponse } from "next/server";
import { getChildAccessState } from "@/lib/auth/child";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  if ((await getChildAccessState()).status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { attemptId } = await params;
  const supabase = await createClient();
  const result = await supabase.rpc("complete_child_lesson", { p_attempt_id: attemptId });
  if (result.error) return NextResponse.json({ error: "lesson_not_completed" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
