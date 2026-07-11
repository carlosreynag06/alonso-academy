import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChildAccessState } from "@/lib/auth/child";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ blockIndex: z.number().int().nonnegative(), status: z.enum(["in_progress", "paused"]), breakCount: z.number().int().nonnegative(), playerState: z.record(z.string(), z.json()) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  if ((await getChildAccessState()).status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
  const { attemptId } = await params;
  const supabase = await createClient();
  const result = await supabase.rpc("save_child_lesson_progress", {
    p_attempt_id: attemptId,
    p_block_index: parsed.data.blockIndex,
    p_status: parsed.data.status,
    p_break_count: parsed.data.breakCount,
    p_player_state: parsed.data.playerState,
  });
  if (result.error) return NextResponse.json({ error: "progress_not_saved" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
