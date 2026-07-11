import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSpeech } from "./provider";

const cacheDirectory = path.join(process.cwd(), ".local-data", "lesson-audio");

export function audioCacheKey(text: string, voiceId: string, modelId: string) {
  return createHash("sha256").update(`${voiceId}\u0000${modelId}\u0000${text.trim()}`).digest("hex");
}

export async function getOrCreateLessonAudio(text: string) {
  const configVoice = process.env.ELEVENLABS_VOICE_ID?.trim() || "unapproved";
  const configModel = process.env.ELEVENLABS_TTS_MODEL?.trim() || "eleven_multilingual_v2";
  const key = audioCacheKey(text, configVoice, configModel);
  const filePath = path.join(cacheDirectory, `${key}.mp3`);
  try { return { bytes: await readFile(filePath), key, cached: true }; } catch { /* generate below */ }

  const generated = await createSpeech(text);
  await mkdir(cacheDirectory, { recursive: true });
  const temporary = `${filePath}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, generated.bytes, { flag: "wx" });
  await rename(temporary, filePath).catch(async () => { await unlink(temporary).catch(() => undefined); });
  return { bytes: generated.bytes, key, cached: false };
}
