import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChildAccessState } from "@/lib/auth/child";
import { FixtureCommandError, recordFixtureSpeechOutcome } from "@/lib/development-fixtures/commands";
import { attemptMutationResponseSchema } from "@/lib/lesson/runtime-contracts";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";

const fieldsSchema = z.object({
  clientEventId: z.string().uuid(),
  expectedStateVersion: z.coerce.number().int().nonnegative(),
}).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string; blockId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!access.fixture && ACTIVE_RECOVERY.liveSpeechLocked) {
    return NextResponse.json(
      { error: "speech_unavailable", message: "Use the answer choices while speech processing is being prepared." },
      { status: 503 },
    );
  }

  const { attemptId, blockId } = await params;
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const fields = fieldsSchema.safeParse(form ? {
    clientEventId: form.get("clientEventId"),
    expectedStateVersion: form.get("expectedStateVersion"),
  } : null);
  if (!(audio instanceof File) || audio.size < 100 || audio.size > 4_000_000 || !fields.success) {
    return NextResponse.json({ error: "invalid_recording" }, { status: 400 });
  }

  if (access.fixture) {
    try {
      const result = await recordFixtureSpeechOutcome(attemptId, blockId, fields.data);
      const parsed = attemptMutationResponseSchema.safeParse(result);
      if (!parsed.success) return NextResponse.json({ error: "fixture_speech_unavailable" }, { status: 503 });
      return NextResponse.json(parsed.data);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof FixtureCommandError ? error.code : "fixture_speech_unavailable" },
        { status: error instanceof FixtureCommandError ? error.status : 500 },
      );
    }
  }

  // Recovery 1 deliberately has no browser-authorized provider write path.
  // Activation requires the server-only provider adapter in the audio recovery phase.
  return NextResponse.json(
    { error: "speech_unavailable", message: "Use the answer choices while speech processing is being prepared." },
    { status: 503 },
  );
}
