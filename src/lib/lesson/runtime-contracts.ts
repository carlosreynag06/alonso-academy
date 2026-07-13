import { z } from "zod";

const Id = z.string().min(1);

export const childLessonOptionSchema = z.object({
  key: Id,
  label: z.string().min(1),
}).strict();

const childBlockBase = {
  id: Id,
  estimatedSeconds: z.number().int().min(0),
  instruction: z.string().min(1),
};

export const childSafeLessonBlockSchema = z.discriminatedUnion("type", [
  z.object({
    ...childBlockBase,
    type: z.literal("model_audio"),
    modelText: z.string().min(1),
    replayAllowed: z.boolean(),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("listen_select"),
    promptText: z.string().min(1),
    options: z.array(childLessonOptionSchema).min(2).max(4),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("picture_action_select"),
    promptText: z.string().min(1),
    options: z.array(childLessonOptionSchema).min(2).max(4),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("phonemic_awareness"),
    promptText: z.string().min(1),
    responseMode: z.enum(["tap", "choose", "say"]),
    responseOptions: z.array(childLessonOptionSchema),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("letter_work"),
    grapheme: z.string().min(1).max(4),
    demand: z.enum(["notice", "match", "trace"]),
    modelText: z.string().min(1),
    options: z.array(childLessonOptionSchema).min(2).max(4),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("movement_break"),
    movement: z.string().min(1),
  }).strict(),
  z.object({
    ...childBlockBase,
    type: z.literal("exit_check"),
    promptText: z.string().min(1),
    responseOptions: z.array(childLessonOptionSchema),
  }).strict(),
]);

export const childSafeLessonSchema = z.object({
  artifactId: Id,
  day: z.number().int().min(1).max(5),
  title: z.string().min(1),
  objective: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  blocks: z.array(childSafeLessonBlockSchema).min(1),
  remediation: z.object({
    scaffoldInstruction: z.string().min(1),
  }).strict(),
}).strict();

export const attemptModeSchema = z.enum(["learning", "replay", "scheduled_retrieval"]);
export const attemptStatusSchema = z.enum(["in_progress", "paused", "completed", "abandoned"]);
export const attemptViewModeSchema = z.enum(["activity", "feedback", "break", "complete", "provider_recovery"]);
export const attemptSupportLevelSchema = z.enum(["independent", "replay", "prompted", "reduced_choices", "modeled"]);
export const attemptOutcomeSchema = z.enum(["correct", "incorrect", "matched", "try_again", "silence", "unavailable", "acknowledged", "completed"]);

export const attemptFeedbackSchema = z.object({
  tone: z.enum(["success", "retry", "neutral"]),
  title: z.string().min(1),
  message: z.string().min(1),
}).strict();

export const authoritativeAttemptSnapshotSchema = z.object({
  attemptId: Id,
  assignmentId: Id,
  attemptMode: attemptModeSchema,
  status: attemptStatusSchema,
  stateVersion: z.number().int().nonnegative(),
  currentBlockId: Id.nullable(),
  currentBlockIndex: z.number().int().nonnegative(),
  viewMode: attemptViewModeSchema,
  retryCount: z.number().int().nonnegative(),
  supportLevel: attemptSupportLevelSchema,
  selectedOptionKey: Id.nullable(),
  visibleOptionKeys: z.array(Id).nullable(),
  outcome: attemptOutcomeSchema.nullable(),
  feedback: attemptFeedbackSchema.nullable(),
  fallbackAvailable: z.boolean(),
  canAdvance: z.boolean(),
  breakCount: z.number().int().nonnegative(),
  progress: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  }).strict(),
}).strict();

export const childAttemptRuntimePayloadSchema = z.object({
  lesson: childSafeLessonSchema,
  snapshot: authoritativeAttemptSnapshotSchema,
}).strict();

export const childAssignmentSummarySchema = z.object({
  id: Id,
  lessonArtifactId: Id,
  mode: attemptModeSchema,
  state: z.enum(["scheduled", "published", "completed"]),
  day: z.number().int().min(1).max(5),
  title: z.string().min(1),
  objective: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  activeAttemptId: Id.nullable(),
}).strict();

export const childLessonHomeSchema = z.object({
  child: z.object({ id: Id, preferredName: z.string().min(1) }).strict(),
  todayAssignment: childAssignmentSummarySchema.nullable(),
  replayAssignments: z.array(childAssignmentSummarySchema),
  retrievalAssignments: z.array(childAssignmentSummarySchema),
}).strict();

export const attemptProgressCommandSchema = z.enum([
  "pause",
  "resume",
  "start_break",
  "end_break",
  "record_listen",
  "request_hint",
  "acknowledge",
  "retry",
  "advance",
]);

export const attemptResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choice"), optionKey: Id }).strict(),
  z.object({ type: z.literal("acknowledgement") }).strict(),
]);

export const attemptMutationResponseSchema = z.object({
  snapshot: authoritativeAttemptSnapshotSchema,
  outcome: attemptOutcomeSchema.optional(),
}).strict();

export type ChildLessonOption = z.infer<typeof childLessonOptionSchema>;
export type ChildSafeLessonBlock = z.infer<typeof childSafeLessonBlockSchema>;
export type ChildSafeLesson = z.infer<typeof childSafeLessonSchema>;
export type AttemptMode = z.infer<typeof attemptModeSchema>;
export type AttemptSupportLevel = z.infer<typeof attemptSupportLevelSchema>;
export type AttemptOutcome = z.infer<typeof attemptOutcomeSchema>;
export type AuthoritativeAttemptSnapshot = z.infer<typeof authoritativeAttemptSnapshotSchema>;
export type ChildAttemptRuntimePayload = z.infer<typeof childAttemptRuntimePayloadSchema>;
export type AttemptProgressCommand = z.infer<typeof attemptProgressCommandSchema>;
export type AttemptResponse = z.infer<typeof attemptResponseSchema>;
