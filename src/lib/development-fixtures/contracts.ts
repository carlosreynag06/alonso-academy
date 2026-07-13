import "server-only";

import { z } from "zod";
import {
  curriculumScopeSchema,
  dailyLessonDraftSchema,
  validationReportSchema,
  weeklyPlanDraftSchema,
} from "@/lib/generation/contracts";

export const fixtureScenarioKeySchema = z.enum([
  "parent-baseline",
  "curriculum-blocked",
  "approved-week",
  "review-queue",
  "alonso-available",
  "alonso-paused",
  "alonso-completed",
  "openai-unavailable",
  "tts-unavailable",
  "stt-silence",
  "stt-unavailable",
]);

export const fixtureRoleSchema = z.enum(["parent", "child"]);
export const fixtureAttemptModeSchema = z.enum(["learning", "replay", "scheduled_retrieval"]);
export const fixtureViewModeSchema = z.enum(["activity", "feedback", "break", "complete", "provider_recovery"]);
export const fixtureSupportLevelSchema = z.enum(["independent", "replay", "prompted", "reduced_choices", "modeled"]);
export const fixtureAssignmentStatusSchema = z.enum(["scheduled", "published", "completed", "withdrawn", "replaced"]);

export const fixtureProviderBehaviorSchema = z.object({
  openai: z.enum(["success", "unavailable"]),
  tts: z.enum(["success", "unavailable"]),
  stt: z.enum(["success", "silence", "unavailable"]),
}).strict();

export const fixtureCurriculumSchema = z.object({
  id: z.string().uuid(), code: z.literal("A-U1"), title: z.string().min(1), description: z.string().min(1),
  version: z.number().int().positive(), status: z.enum(["draft", "approved"]), scope: curriculumScopeSchema.nullable(),
}).strict().superRefine((curriculum, context) => {
  if (curriculum.status === "approved" && !curriculum.scope) context.addIssue({ code: "custom", path: ["scope"], message: "An approved fixture curriculum requires a validated scope." });
});

export const fixtureWeeklyPlanSchema = z.object({
  id: z.string().uuid(), status: z.enum(["draft", "validated", "approved"]), version: z.number().int().positive(),
  content: weeklyPlanDraftSchema, validationReport: validationReportSchema.nullable(),
}).strict();

export const fixtureDaySlotSchema = z.object({
  id: z.string().uuid(), weeklyPlanId: z.string().uuid(), dayNumber: z.number().int().min(1).max(5),
  objective: z.string().min(1), lessonKind: z.enum(["daily_lesson", "review_lesson", "story_lesson"]),
  targetIds: z.array(z.string().uuid()).min(1), reviewTargetIds: z.array(z.string().uuid()), contractHash: z.string().min(16),
  immutable: z.literal(true), fixtureOnly: z.literal(true), hostedPublication: z.literal(false),
}).strict();

export const fixtureLessonSchema = z.object({
  id: z.string().uuid(), slotId: z.string().uuid(), slotContractHash: z.string().min(16), day: z.number().int().min(1).max(5),
  kind: z.enum(["daily_lesson", "review_lesson", "story_lesson"]), status: z.enum(["draft", "validation_failed", "validated", "approved"]),
  publicationState: z.enum(["unapproved", "approved_private"]), fixtureState: z.enum(["draft", "validation_failed", "awaiting_parent_review", "approved_private", "attempted"]),
  version: z.number().int().positive(), content: dailyLessonDraftSchema, validationReport: validationReportSchema.nullable(),
  bindingValid: z.literal(true), fixtureOnly: z.literal(true), hostedPublication: z.literal(false),
}).strict();

export const fixtureAssignmentSchema = z.object({
  id: z.string().uuid(), childId: z.string().uuid(), slotId: z.string().uuid(), lessonArtifactId: z.string().uuid(),
  status: fixtureAssignmentStatusSchema, scheduledFor: z.string().datetime().nullable(), publishedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(), withdrawnAt: z.string().datetime().nullable(), replacedAt: z.string().datetime().nullable(),
  replacesAssignmentId: z.string().uuid().nullable(), replacedByAssignmentId: z.string().uuid().nullable(), lockVersion: z.number().int().positive(),
  fixtureOnly: z.literal(true), hostedPublication: z.literal(false),
}).strict();

export const fixtureBlockStateSchema = z.object({
  blockId: z.string().min(1), ordinal: z.number().int().nonnegative(), status: z.enum(["not_started", "presented", "awaiting_response", "remediating", "passed", "completed"]),
  responseCount: z.number().int().nonnegative(), incorrectCount: z.number().int().nonnegative(), replayCount: z.number().int().nonnegative(),
  supportLevel: fixtureSupportLevelSchema, stateVersion: z.number().int().positive(),
}).strict();

export const fixtureAttemptSchema = z.object({
  id: z.string().uuid(), assignmentId: z.string().uuid(), lessonArtifactId: z.string().uuid(), mode: fixtureAttemptModeSchema,
  attemptNumber: z.number().int().positive(), status: z.enum(["not_started", "in_progress", "paused", "completed"]),
  stateVersion: z.number().int().positive(), currentBlockId: z.string().min(1).nullable(), currentBlockIndex: z.number().int().nonnegative(),
  viewMode: fixtureViewModeSchema, breakCount: z.number().int().nonnegative(), blockStates: z.array(fixtureBlockStateSchema),
  playerState: z.record(z.string(), z.unknown()), startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
}).strict();

export const fixtureEvidenceSchema = z.object({
  id: z.string().uuid(), attemptId: z.string().uuid(), blockId: z.string().min(1), responseOrdinal: z.number().int().positive(),
  targetId: z.string().uuid().nullable(), evidenceType: z.string().min(1), firstAttempt: z.boolean(), supportLevel: fixtureSupportLevelSchema,
  correct: z.boolean().nullable(), responseLatencyMs: z.number().int().nonnegative().nullable(), retryCount: z.number().int().nonnegative(),
  transcript: z.string().nullable(), providerConfidence: z.number().min(0).max(1).nullable(), metadata: z.record(z.string(), z.unknown()),
}).strict().superRefine((evidence, context) => {
  if (evidence.firstAttempt !== (evidence.responseOrdinal === 1)) context.addIssue({ code: "custom", path: ["firstAttempt"], message: "First attempt is derived from response ordinal." });
  if (evidence.retryCount !== evidence.responseOrdinal - 1) context.addIssue({ code: "custom", path: ["retryCount"], message: "Retry count is derived from response ordinal." });
});

export const fixtureProviderFailureSchema = z.object({
  id: z.string().uuid(), provider: z.enum(["openai", "elevenlabs"]), operation: z.string().min(1),
  category: z.enum(["authentication", "rate_limit", "malformed_output", "unavailable", "silence"]),
  safeMessage: z.string().min(1), occurredAt: z.string().datetime(),
}).strict();

export const fixtureCatalogSchema = z.object({
  curriculum: fixtureCurriculumSchema, weeklyPlan: fixtureWeeklyPlanSchema.nullable(), slots: z.array(fixtureDaySlotSchema),
  lessons: z.array(fixtureLessonSchema), assignments: z.array(fixtureAssignmentSchema), attempts: z.array(fixtureAttemptSchema),
  evidence: z.array(fixtureEvidenceSchema), providerFailures: z.array(fixtureProviderFailureSchema),
}).strict().superRefine((catalog, context) => {
  if (catalog.weeklyPlan) {
    const days = catalog.slots.map((slot) => slot.dayNumber).sort();
    if (days.join(",") !== "1,2,3,4,5") context.addIssue({ code: "custom", path: ["slots"], message: "An approved fixture week requires five immutable day slots." });
  } else if (catalog.slots.length || catalog.assignments.length || catalog.attempts.length || catalog.evidence.length) {
    context.addIssue({ code: "custom", path: ["weeklyPlan"], message: "Blocked curriculum fixtures cannot imply planning, assignment, or learning records." });
  }

  const slots = new Map(catalog.slots.map((slot) => [slot.id, slot]));
  const lessons = new Map(catalog.lessons.map((lesson) => [lesson.id, lesson]));
  catalog.lessons.forEach((lesson, index) => {
    const slot = slots.get(lesson.slotId);
    const lessonTargets = [...lesson.content.targetIds].sort().join(",");
    const slotTargets = slot ? [...slot.targetIds].sort().join(",") : "";
    if (!slot || lesson.slotContractHash !== slot.contractHash || lesson.day !== slot.dayNumber || lesson.kind !== slot.lessonKind || lesson.content.objective !== slot.objective || lessonTargets !== slotTargets) {
      context.addIssue({ code: "custom", path: ["lessons", index], message: "Every fixture lesson must bind to its exact immutable week/day contract." });
    }
  });

  const activeSlotKeys = new Set<string>();
  let published = 0;
  const assignments = new Map(catalog.assignments.map((assignment) => [assignment.id, assignment]));
  catalog.assignments.forEach((assignment, index) => {
    const slot = slots.get(assignment.slotId); const lesson = lessons.get(assignment.lessonArtifactId);
    if (!slot || !lesson || lesson.slotId !== slot.id || lesson.status !== "approved" || lesson.publicationState !== "approved_private") {
      context.addIssue({ code: "custom", path: ["assignments", index], message: "Assignments may reference only approved-private lessons bound to the same slot." });
    }
    if (assignment.status === "published") published += 1;
    if (assignment.status === "published" && !assignment.publishedAt) context.addIssue({ code: "custom", path: ["assignments", index, "publishedAt"], message: "Synthetic publication requires its fixture timestamp." });
    if (assignment.status === "completed" && !assignment.completedAt) context.addIssue({ code: "custom", path: ["assignments", index, "completedAt"], message: "Completed assignment requires its fixture timestamp." });
    if (assignment.status === "withdrawn" && !assignment.withdrawnAt) context.addIssue({ code: "custom", path: ["assignments", index, "withdrawnAt"], message: "Withdrawn assignment requires its fixture timestamp." });
    if (assignment.status === "replaced" && (!assignment.replacedAt || !assignment.replacedByAssignmentId)) context.addIssue({ code: "custom", path: ["assignments", index, "replacedByAssignmentId"], message: "Replaced assignment requires immutable replacement linkage." });
    if (assignment.status === "scheduled" || assignment.status === "published") {
      const key = `${assignment.childId}:${assignment.slotId}`;
      if (activeSlotKeys.has(key)) context.addIssue({ code: "custom", path: ["assignments", index], message: "Only one current fixture assignment is allowed per child/week/day." });
      activeSlotKeys.add(key);
    }
  });
  if (published > 1) context.addIssue({ code: "custom", path: ["assignments"], message: "A fixture child may have only one synthetic published assignment." });

  const attemptIds = new Set(catalog.attempts.map((attempt) => attempt.id));
  const attemptMap = new Map(catalog.attempts.map((attempt) => [attempt.id, attempt]));
  catalog.attempts.forEach((attempt, index) => {
    const assignment = assignments.get(attempt.assignmentId); const lesson = lessons.get(attempt.lessonArtifactId);
    if (!assignment || !lesson || assignment.lessonArtifactId !== lesson.id) context.addIssue({ code: "custom", path: ["attempts", index], message: "Fixture attempt ownership must match its assignment and lesson." });
    const blockIds = lesson ? new Set(lesson.content.blocks.map((block) => block.id)) : new Set<string>();
    if (attempt.blockStates.some((block) => !blockIds.has(block.blockId)) || (attempt.currentBlockId && !blockIds.has(attempt.currentBlockId))) context.addIssue({ code: "custom", path: ["attempts", index, "blockStates"], message: "Attempt state may reference only immutable lesson blocks." });
  });
  catalog.evidence.forEach((evidence, index) => {
    if (!attemptIds.has(evidence.attemptId)) context.addIssue({ code: "custom", path: ["evidence", index, "attemptId"], message: "Fixture evidence must reference a fixture attempt." });
    const attempt = attemptMap.get(evidence.attemptId);
    const blockState = attempt?.blockStates.find((block) => block.blockId === evidence.blockId);
    if (!blockState || evidence.responseOrdinal > blockState.responseCount) context.addIssue({ code: "custom", path: ["evidence", index, "responseOrdinal"], message: "Evidence ordinal must be authorized by server-held block state." });
  });
});

export const developmentFixtureStateSchema = z.object({
  schemaVersion: z.literal("2.0"), sessionId: z.string().uuid(), scenario: fixtureScenarioKeySchema, role: fixtureRoleSchema,
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(), activeAttemptId: z.string().uuid().nullable(),
  providers: fixtureProviderBehaviorSchema, catalog: fixtureCatalogSchema, fixtureOnly: z.literal(true), hostedPublication: z.literal(false),
}).strict().superRefine((state, context) => {
  if (state.activeAttemptId && !state.catalog.attempts.some((attempt) => attempt.id === state.activeAttemptId)) context.addIssue({ code: "custom", path: ["activeAttemptId"], message: "The active fixture attempt must exist in the fixture catalog." });
  if (state.activeAttemptId && !state.catalog.attempts.some((attempt) => attempt.id === state.activeAttemptId && ["in_progress", "paused"].includes(attempt.status))) context.addIssue({ code: "custom", path: ["activeAttemptId"], message: "The active fixture attempt must be resumable." });
});

export type FixtureScenarioKey = z.infer<typeof fixtureScenarioKeySchema>;
export type FixtureRole = z.infer<typeof fixtureRoleSchema>;
export type FixtureProviderBehavior = z.infer<typeof fixtureProviderBehaviorSchema>;
export type FixtureAssignmentStatus = z.infer<typeof fixtureAssignmentStatusSchema>;
export type FixtureAttemptMode = z.infer<typeof fixtureAttemptModeSchema>;
export type FixtureBlockState = z.infer<typeof fixtureBlockStateSchema>;
export type FixtureEvidence = z.infer<typeof fixtureEvidenceSchema>;
export type FixtureCatalog = z.infer<typeof fixtureCatalogSchema>;
export type DevelopmentFixtureState = z.infer<typeof developmentFixtureStateSchema>;
export type { ChildSafeLesson, AuthoritativeAttemptSnapshot } from "@/lib/lesson/runtime-contracts";
