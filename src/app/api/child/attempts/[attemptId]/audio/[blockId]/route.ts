import { NextResponse } from "next/server";
import { getChildAccessState } from "@/lib/auth/child";
import { getOrCreateLessonAudio } from "@/lib/audio/cache";
import { AudioProviderError } from "@/lib/audio/provider";
import { getChildLessonAttempt } from "@/lib/lesson/repository";

function spokenText(block: Awaited<ReturnType<typeof getChildLessonAttempt>>["lesson"]["content"]["blocks"][number]) {
  if (block.type === "model_audio" || block.type === "letter_work") return block.modelText;
  if (block.type === "listen_select" || block.type === "picture_action_select" || block.type === "phonemic_awareness" || block.type === "exit_check") return block.promptText;
  return null;
}

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string; blockId: string }> }) {
  if ((await getChildAccessState()).status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { attemptId, blockId } = await params;
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
