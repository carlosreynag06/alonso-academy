import { NextResponse } from "next/server";
import { getChildAccessState } from "@/lib/auth/child";
import { getOrCreateLessonAudio } from "@/lib/audio/cache";
import { AudioProviderError } from "@/lib/audio/provider";
import { getChildLessonAttempt } from "@/lib/lesson/repository";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { FixtureCommandError, getFixtureAudioOutcome } from "@/lib/development-fixtures/commands";

function spokenText(block: Awaited<ReturnType<typeof getChildLessonAttempt>>["lesson"]["content"]["blocks"][number]) {
  if (block.type === "model_audio" || block.type === "letter_work") return block.modelText;
  if (block.type === "listen_select" || block.type === "picture_action_select" || block.type === "phonemic_awareness" || block.type === "exit_check") return block.promptText;
  return null;
}

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string; blockId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { attemptId, blockId } = await params;
  if (access.fixture) {
    try {
      const outcome = await getFixtureAudioOutcome(attemptId, blockId);
      if (!outcome.ok) return NextResponse.json({ error: outcome.error, message: outcome.message, fixture: true }, { status: outcome.status });
      const body = new ArrayBuffer(outcome.bytes.byteLength);
      new Uint8Array(body).set(outcome.bytes);
      return new NextResponse(body, { headers: { "Content-Type": outcome.contentType, "Cache-Control": "no-store", "X-Alonso-Data-Source": "development-fixture" } });
    } catch (error) {
      return NextResponse.json({ error: error instanceof FixtureCommandError ? error.code : "fixture_audio_unavailable" }, { status: error instanceof FixtureCommandError ? error.status : 500 });
    }
  }
  if (ACTIVE_RECOVERY.childDeliveryLocked) return NextResponse.json({ error: "recovery_lock" }, { status: 423 });
  const data = await getChildLessonAttempt(attemptId).catch(() => null);
  const block = data?.lesson.content.blocks.find((candidate) => candidate.id === blockId);
  const text = block ? spokenText(block) : null;
  if (!text) return NextResponse.json({ error: "audio_not_available" }, { status: 404 });

  try {
    const audio = await getOrCreateLessonAudio(text);
    return new NextResponse(new Uint8Array(audio.bytes), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    const message = error instanceof AudioProviderError ? error.message : "Audio is not available right now.";
    return NextResponse.json({ error: "audio_unavailable", message }, { status: 503 });
  }
}
