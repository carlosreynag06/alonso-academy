import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChildAccessState } from "@/lib/auth/child";
import { applyFixtureProgressCommand, FixtureCommandError } from "@/lib/development-fixtures/commands";
import { attemptMutationResponseSchema, attemptProgressCommandSchema } from "@/lib/lesson/runtime-contracts";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  clientEventId: z.string().uuid(),
  expectedStateVersion: z.number().int().nonnegative(),
  blockId: z.string().min(1),
  command: attemptProgressCommandSchema,
}).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!access.fixture && ACTIVE_RECOVERY.childDeliveryLocked) return NextResponse.json({ error: "recovery_lock" }, { status: 423 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
  const { attemptId } = await params;
  if (access.fixture) {
    try {
      return NextResponse.json(await applyFixtureProgressCommand(attemptId, parsed.data));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof FixtureCommandError ? error.code : "fixture_progress_not_saved" },
        { status: error instanceof FixtureCommandError ? error.status : 500 },
      );
    }
  }
  const supabase = await createClient();
  const result = await supabase.rpc("command_child_attempt", {
    p_attempt_id: attemptId,
    p_client_event_id: parsed.data.clientEventId,
    p_expected_state_version: parsed.data.expectedStateVersion,
    p_block_id: parsed.data.blockId,
    p_command: parsed.data.command,
    p_payload: {},
  });
  const response = attemptMutationResponseSchema.safeParse(result.data);
  if (result.error || !response.success) {
    const stale = result.error?.message.toLowerCase().includes("stale");
    return NextResponse.json({ error: stale ? "stale_attempt_state" : "progress_not_saved" }, { status: stale ? 409 : 403 });
  }
  return NextResponse.json(response.data);
}
