import "server-only";

import { getElevenLabsConfiguration } from "@/lib/env/server";
import { isDevelopmentFixtureRequest } from "@/lib/development-fixtures/source";

const API_ROOT = "https://api.elevenlabs.io/v1";

export class AudioProviderError extends Error {
  constructor(public readonly category: "not_configured" | "unauthorized" | "rate_limited" | "unavailable" | "invalid_audio", message: string) {
    super(message);
  }
}

function classify(response: Response) {
  if (response.status === 401 || response.status === 403) return new AudioProviderError("unauthorized", "Audio is not available right now.");
  if (response.status === 400 || response.status === 422) return new AudioProviderError("invalid_audio", "I could not hear that recording clearly.");
  if (response.status === 429) return new AudioProviderError("rate_limited", "Audio needs a short rest. Try again soon.");
  return new AudioProviderError("unavailable", "Audio is not available right now.");
}

export async function createSpeech(text: string) {
  if (await isDevelopmentFixtureRequest()) throw new AudioProviderError("unavailable", "Fixture audio never calls ElevenLabs.");
  const config = getElevenLabsConfiguration();
  if (!config.apiKey || !config.voiceId) throw new AudioProviderError("not_configured", "A parent still needs to choose the lesson voice.");

  const response = await fetch(`${API_ROOT}/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": config.apiKey },
    body: JSON.stringify({ text, model_id: config.ttsModel }),
    signal: AbortSignal.timeout(25_000),
  }).catch(() => null);
  if (!response) throw new AudioProviderError("unavailable", "Audio is not available right now.");
  if (!response.ok) throw classify(response);
  return { bytes: Buffer.from(await response.arrayBuffer()), modelId: config.ttsModel, voiceId: config.voiceId };
}

type TranscriptResponse = {
  text?: string;
  language_code?: string;
  language_probability?: number;
  words?: Array<{ text?: string; type?: string; logprob?: number; start?: number; end?: number }>;
};

export async function transcribeSpeech(bytes: Uint8Array, mimeType: string) {
  if (await isDevelopmentFixtureRequest()) throw new AudioProviderError("unavailable", "Fixture speech never calls ElevenLabs.");
  const config = getElevenLabsConfiguration();
  if (!config.apiKey) throw new AudioProviderError("not_configured", "Speaking practice is not ready yet.");

  const form = new FormData();
  const audioBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(audioBuffer).set(bytes);
  form.set("model_id", config.sttModel);
  form.set("language_code", "en");
  form.set("tag_audio_events", "false");
  form.set("diarize", "false");
  form.set("file", new Blob([audioBuffer], { type: mimeType }), `response.${mimeType.includes("mp4") ? "m4a" : "webm"}`);

  const response = await fetch(`${API_ROOT}/speech-to-text?enable_logging=false`, {
    method: "POST",
    headers: { "xi-api-key": config.apiKey },
    body: form,
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!response) throw new AudioProviderError("unavailable", "I could not listen right now.");
  if (!response.ok) throw classify(response);

  const payload = await response.json() as TranscriptResponse;
  const transcript = payload.text?.trim() || "";
  const spokenWords = payload.words?.filter((word) => word.type === "word" && typeof word.logprob === "number") ?? [];
  const confidence = spokenWords.length
    ? spokenWords.reduce((sum, word) => sum + Math.exp(word.logprob!), 0) / spokenWords.length
    : payload.language_probability ?? null;
  return { transcript, confidence: confidence === null ? null : Math.max(0, Math.min(1, confidence)), modelId: config.sttModel };
}
