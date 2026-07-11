import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChildAccessState } from "@/lib/auth/child";
import { AudioProviderError, transcribeSpeech } from "@/lib/audio/provider";
import { scoreTranscript } from "@/lib/audio/scoring";
import { getChildLessonAttempt } from "@/lib/lesson/repository";
import { createClient } from "@/lib/supabase/server";

const fieldsSchema = z.object({
  clientEventId: z.string().uuid(), firstAttempt: z.enum(["true", "false"]),
  supportLevel: z.enum(["independent", "replay", "prompted", "reduced_choices", "modeled"]),
  responseLatencyMs: z.coerce.number().int().nonnegative().max(120_000), retryCount: z.coerce.number().int().nonnegative().max(20),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string; blockId: string }> }) {
  if ((await getChildAccessState()).status !== "ready") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { attemptId, blockId } = await params;
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const fields = fieldsSchema.safeParse(form ? Object.fromEntries(["clientEventId", "firstAttempt", "supportLevel", "responseLatencyMs", "retryCount"].map((key) => [key, form.get(key)])) : null);
  if (!(audio instanceof File) || audio.size < 100 || audio.size > 4_000_000 || !fields.success) return NextResponse.json({ error: "invalid_recording" }, { status: 400 });

  const data = await getChildLessonAttempt(attemptId).catch(() => null);
  const block = data?.lesson.content.blocks.find((candidate) => candidate.id === blockId);
  const speechBlock = block?.type === "phonemic_awareness" && block.responseMode === "say" || block?.type === "exit_check" ? block : null;
  if (!speechBlock) return NextResponse.json({ error: "speech_not_available" }, { status: 404 });

  try {
    // The recording exists only in this request's memory and is released after transcription.
    const transcript = await transcribeSpeech(new Uint8Array(await audio.arrayBuffer()), audio.type || "audio/webm");
    const score = scoreTranscript(transcript.transcript, speechBlock.acceptableResponses);
    const supabase = await createClient();
    const evidence = await supabase.rpc("record_child_speech_evidence", {
      p_client_event_id: fields.data.clientEventId, p_attempt_id: attemptId, p_block_id: blockId,
      p_target_id: speechBlock.targetIds[0] ?? null, p_evidence_type: speechBlock.type === "exit_check" ? speechBlock.evidenceType : "phonemic_awareness",
      p_first_attempt: fields.data.firstAttempt === "true", p_support_level: fields.data.supportLevel, p_correct: score.correct,
      p_response_latency_ms: fields.data.responseLatencyMs, p_retry_count: fields.data.retryCount,
      p_transcript: transcript.transcript || null, p_provider_confidence: transcript.confidence,
      p_provider_model: transcript.modelId, p_outcome: score.outcome,
    });
    if (evidence.error) return NextResponse.json({ error: "evidence_not_saved" }, { status: 403 });
    return NextResponse.json({ outcome: score.outcome, transcript: transcript.transcript, confidence: transcript.confidence, feedback: score.feedback });
  } catch (error) {
    const message = error instanceof AudioProviderError ? error.message : "I could not listen right now.";
    return NextResponse.json({ error: "speech_unavailable", message }, { status: 503 });
  }
}
