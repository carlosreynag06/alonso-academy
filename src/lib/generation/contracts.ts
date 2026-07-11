import { z } from "zod";

const Id = z.string().min(1);

export const curriculumTargetSchema = z.object({
  id: Id,
  text: z.string().min(1),
  kind: z.enum(["vocabulary", "sentence_frame", "phonics", "writing"]),
  oralReady: z.boolean(),
  readingReady: z.boolean(),
  writingReady: z.boolean(),
}).strict();

export const curriculumScopeSchema = z.object({
  snapshotId: z.string().min(16),
  phaseCode: z.string().min(1),
  unitId: Id,
  unitCode: z.string().min(1),
  unitVersion: z.number().int().positive(),
  approvedAt: z.string().datetime(),
  approvedTargetIds: z.array(Id),
  bannedTargetIds: z.array(Id),
  targets: z.array(curriculumTargetSchema),
  constraints: z.record(z.string(), z.unknown()),
  masteryContext: z.array(z.object({ targetId: Id, stage: z.string(), evidenceCount: z.number().int().nonnegative() }).strict()),
  reviewContext: z.array(z.object({ targetId: Id, dueAt: z.string().datetime(), reason: z.string() }).strict()),
  safetyRules: z.array(z.string().min(1)),
}).strict();

export const weeklyDaySchema = z.object({
  day: z.number().int().min(1).max(5),
  title: z.string().min(1).max(80),
  objective: z.string().min(1).max(240),
  targetIds: z.array(Id).min(1),
  reviewTargetIds: z.array(Id),
  durationMinutes: z.number().int().min(10).max(30),
  lessonKind: z.enum(["daily_lesson", "review_lesson", "story_lesson"]),
  parentRationale: z.string().min(1).max(500),
}).strict();

export const weeklyPlanDraftSchema = z.object({
  schemaVersion: z.literal("1.0"),
  curriculumSnapshotId: Id,
  title: z.string().min(1).max(100),
  weekObjective: z.string().min(1).max(400),
  days: z.array(weeklyDaySchema).length(5),
  parentNotes: z.array(z.string().max(300)).max(6),
}).strict();

const blockBase = {
  id: Id,
  targetIds: z.array(Id),
  estimatedSeconds: z.number().int().min(15).max(600),
  instruction: z.string().min(1).max(240),
};

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBase, type: z.literal("model_audio"), modelText: z.string().min(1), replayAllowed: z.boolean() }).strict(),
  z.object({ ...blockBase, type: z.literal("listen_select"), promptText: z.string().min(1), options: z.array(z.string().min(1)).min(2).max(4), correctIndex: z.number().int().min(0).max(3) }).strict(),
  z.object({ ...blockBase, type: z.literal("picture_action_select"), promptText: z.string().min(1), optionLabels: z.array(z.string().min(1)).min(2).max(4), correctIndex: z.number().int().min(0).max(3) }).strict(),
  z.object({ ...blockBase, type: z.literal("phonemic_awareness"), promptText: z.string().min(1), responseMode: z.enum(["tap", "choose", "say"]), acceptableResponses: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ ...blockBase, type: z.literal("letter_work"), grapheme: z.string().min(1).max(4), demand: z.enum(["notice", "match", "trace"]), modelText: z.string().min(1) }).strict(),
  z.object({ ...blockBase, type: z.literal("movement_break"), movement: z.string().min(1).max(160), scored: z.literal(false) }).strict(),
  z.object({ ...blockBase, type: z.literal("controlled_story"), storyId: Id, responsePrompt: z.string().min(1).max(240) }).strict(),
  z.object({ ...blockBase, type: z.literal("exit_check"), promptText: z.string().min(1), evidenceType: z.enum(["recognition", "comprehension", "supported_use", "independent_use"]), acceptableResponses: z.array(z.string().min(1)).min(1) }).strict(),
]);

export const dailyLessonDraftSchema = z.object({
  schemaVersion: z.literal("1.0"),
  curriculumSnapshotId: Id,
  weeklyPlanId: Id,
  day: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  objective: z.string().min(1).max(300),
  durationMinutes: z.number().int().min(10).max(30),
  targetIds: z.array(Id).min(1),
  blocks: z.array(lessonBlockSchema).min(3).max(14),
  remediation: z.object({ triggerAfterIncorrectAttempts: z.number().int().min(1).max(3), scaffoldInstruction: z.string().min(1), reducedChoiceCount: z.number().int().min(2).max(3) }).strict(),
  parentRationale: z.string().min(1).max(500),
}).strict();

export const controlledStoryDraftSchema = z.object({
  schemaVersion: z.literal("1.0"),
  curriculumSnapshotId: Id,
  title: z.string().min(1).max(100),
  lines: z.array(z.string().min(1).max(180)).min(4).max(16),
  targetIds: z.array(Id).min(1),
  novelOralWords: z.array(z.string().min(1)).max(3),
  retellPrompts: z.array(z.string().min(1).max(180)).min(1).max(3),
  parentRationale: z.string().min(1).max(500),
}).strict();

export const parentSummaryDraftSchema = z.object({
  schemaVersion: z.literal("1.0"),
  evidenceIds: z.array(Id).min(1),
  headline: z.string().min(1).max(120),
  observedStrengths: z.array(z.string().min(1).max(220)),
  developingTargets: z.array(z.string().min(1).max(220)),
  supportObserved: z.array(z.string().min(1).max(220)),
  nextRecommendation: z.string().min(1).max(300),
  certainty: z.enum(["insufficient_evidence", "early_signal", "supported"]),
}).strict();

export const validationIssueSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["error", "warning"]),
  path: z.string(),
  message: z.string().min(1),
  targetId: z.string().nullable(),
}).strict();

export const validationReportSchema = z.object({
  schemaVersion: z.literal("1.0"),
  valid: z.boolean(),
  deterministicValid: z.boolean(),
  semanticValid: z.boolean().nullable(),
  issues: z.array(validationIssueSchema),
  validatorVersion: z.string().min(1),
  validatedAt: z.string().datetime(),
}).strict();

export type CurriculumScope = z.infer<typeof curriculumScopeSchema>;
export type WeeklyPlanDraft = z.infer<typeof weeklyPlanDraftSchema>;
export type DailyLessonDraft = z.infer<typeof dailyLessonDraftSchema>;
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type ControlledStoryDraft = z.infer<typeof controlledStoryDraftSchema>;
export type ParentSummaryDraft = z.infer<typeof parentSummaryDraftSchema>;
export type ValidationReport = z.infer<typeof validationReportSchema>;

export type ApprovalRecord = { entityId: string; action: "approved" | "rejected" | "revoked"; actorId: string; note: string | null; createdAt: string };
export type ActivityEvidence = { id: string; targetId: string | null; evidenceType: string; firstAttempt: boolean; supportLevel: string; correct: boolean | null; responseLatencyMs: number | null };
export type MasteryRecord = { targetId: string; stage: string; evidenceCount: number; lastRetrievedAt: string | null };
export type ReviewRecommendation = { targetId: string; dueAt: string; priority: number; reason: string };
export type ProviderResult<T> =
  | { ok: true; value: T; responseId: string; model: string }
  | { ok: false; category: "authentication" | "rate_limit" | "quota" | "unavailable" | "refusal" | "malformed_output" | "unknown"; retryable: boolean; safeMessage: string };

export const artifactSchemas = {
  weekly_plan: weeklyPlanDraftSchema,
  daily_lesson: dailyLessonDraftSchema,
  review_lesson: dailyLessonDraftSchema,
  story_lesson: controlledStoryDraftSchema,
  parent_summary: parentSummaryDraftSchema,
} as const;

export type ArtifactKind = keyof typeof artifactSchemas;
