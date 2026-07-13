import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChildAccessState } from "@/lib/auth/child";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { FixtureCommandError, recordFixtureActivityEvidence } from "@/lib/development-fixtures/commands";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  clientEventId: z.string().uuid(), blockId: z.string().min(1), targetId: z.string().nullable(), evidenceType: z.string().min(1),
  firstAttempt: z.boolean(), supportLevel: z.string().min(1), correct: z.boolean().nullable(), responseLatencyMs: z.number().int().nonnegative().nullable(), retryCount: z.number().int().nonnegative(), metadata: z.record(z.string(), z.json()),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_evidence" }, { status: 400 });
  const { attemptId } = await params;
  if (access.fixture) {
    try {
      await recordFixtureActivityEvidence(attemptId, parsed.data);
      return NextResponse.json({ ok: true, fixture: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof FixtureCommandError ? error.code : "fixture_evidence_not_saved" }, { status: error instanceof FixtureCommandError ? error.status : 500 });
    }
  }
  if (ACTIVE_RECOVERY.productMutationsLocked) return NextResponse.json({ error: "recovery_lock" }, { status: 423 });
  const supabase = await createClient();
  const result = await supabase.rpc("record_child_activity_evidence", {
    p_client_event_id: parsed.data.clientEventId, p_attempt_id: attemptId, p_block_id: parsed.data.blockId,
    p_target_id: parsed.data.targetId, p_evidence_type: parsed.data.evidenceType, p_first_attempt: parsed.data.firstAttempt,
    p_support_level: parsed.data.supportLevel, p_correct: parsed.data.correct, p_response_latency_ms: parsed.data.responseLatencyMs,
    p_retry_count: parsed.data.retryCount, p_metadata: parsed.data.metadata,
  });
  if (result.error) return NextResponse.json({ error: "evidence_not_saved" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
