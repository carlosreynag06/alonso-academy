import { dailyLessonDraftSchema, type DailyLessonDraft, type LessonBlock } from "@/lib/generation/contracts";

export const SUPPORTED_CHILD_BLOCK_TYPES = new Set<LessonBlock["type"]>([
  "model_audio",
  "listen_select",
  "picture_action_select",
  "phonemic_awareness",
  "letter_work",
  "movement_break",
  "exit_check",
]);

export function parseSupportedChildLesson(value: unknown): DailyLessonDraft | null {
  const parsed = dailyLessonDraftSchema.safeParse(value);
  if (!parsed.success) return null;
  if (parsed.data.blocks.some((block) => !SUPPORTED_CHILD_BLOCK_TYPES.has(block.type))) return null;
  return parsed.data;
}

export function isScoredBlock(block: LessonBlock) {
  return !["model_audio", "movement_break"].includes(block.type);
}
