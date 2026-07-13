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

export const fixtureProviderBehaviorSchema = z.object({
  openai: z.enum(["success", "unavailable"]),
  tts: z.enum(["success", "unavailable"]),
  stt: z.enum(["success", "silence", "unavailable"]),
}).strict();

export const fixtureCurriculumSchema = z.object({
  id: z.string().uuid(),
  code: z.literal("A-U1"),
  title: z.string().min(1),
  description: z.string().min(1),
  version: z.number().int().positive(),
  status: z.enum(["draft", "approved"]),
  scope: curriculumScopeSchema.nullable(),
}).strict().superRefine((curriculum, context) => {
  if (curriculum.status === "approved" && !curriculum.scope) {
    context.addIssue({
      code: "custom",
      path: ["scope"],
      message: "An approved fixture curriculum requires a validated scope.",
    });
  }
});

export const fixtureWeeklyPlanSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "validated", "approved"]),
  version: z.number().int().positive(),
  content: weeklyPlanDraftSchema,
  validationReport: validationReportSchema.nullable(),
}).strict();

export const fixtureLessonSchema = z.object({
  id: z.string().uuid(),
  day: z.number().int().min(1).max(5),
  status: z.enum(["draft", "validation_failed", "validated", "approved"]),
  fixtureState: z.enum([
    "draft",
    "validation_failed",
    "awaiting_parent_review",
    "available",
    "attempted",
  ]),
  version: z.number().int().positive(),
  content: dailyLessonDraftSchema,
  validationReport: validationReportSchema.nullable(),
}).strict();

export const fixtureAttemptSchema = z.object({
  id: z.string().uuid(),
  lessonArtifactId: z.string().uuid(),
  status: z.enum(["in_progress", "paused", "completed"]),
  currentBlockIndex: z.number().int().nonnegative(),
  breakCount: z.number().int().nonnegative(),
  playerState: z.record(z.string(), z.unknown()),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
}).strict();

export const fixtureEvidenceSchema = z.object({
  id: z.string().uuid(),
  attemptId: z.string().uuid(),
  blockId: z.string().min(1),
  targetId: z.string().uuid().nullable(),
  evidenceType: z.string().min(1),
  firstAttempt: z.boolean(),
  supportLevel: z.enum([
    "independent",
    "replay",
    "prompted",
    "reduced_choices",
    "modeled",
  ]),
  correct: z.boolean().nullable(),
  responseLatencyMs: z.number().int().nonnegative().nullable(),
  retryCount: z.number().int().nonnegative(),
  transcript: z.string().nullable(),
  providerConfidence: z.number().min(0).max(1).nullable(),
  metadata: z.record(z.string(), z.unknown()),
}).strict();

export const fixtureProviderFailureSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(["openai", "elevenlabs"]),
  operation: z.string().min(1),
  category: z.enum([
    "authentication",
    "rate_limit",
    "malformed_output",
    "unavailable",
    "silence",
  ]),
  safeMessage: z.string().min(1),
  occurredAt: z.string().datetime(),
}).strict();

export const fixtureCatalogSchema = z.object({
  curriculum: fixtureCurriculumSchema,
  weeklyPlan: fixtureWeeklyPlanSchema.nullable(),
  lessons: z.array(fixtureLessonSchema).length(5),
  attempts: z.array(fixtureAttemptSchema),
  evidence: z.array(fixtureEvidenceSchema),
  providerFailures: z.array(fixtureProviderFailureSchema),
}).strict().superRefine((catalog, context) => {
  const days = catalog.lessons.map((lesson) => lesson.day).sort();
  if (days.join(",") !== "1,2,3,4,5") {
    context.addIssue({
      code: "custom",
      path: ["lessons"],
      message: "The development fixture catalog requires exactly one lesson for each day.",
    });
  }

  const lessonIds = new Set(catalog.lessons.map((lesson) => lesson.id));
  const attemptIds = new Set(catalog.attempts.map((attempt) => attempt.id));
  catalog.attempts.forEach((attempt, index) => {
    if (!lessonIds.has(attempt.lessonArtifactId)) {
      context.addIssue({
        code: "custom",
        path: ["attempts", index, "lessonArtifactId"],
        message: "A fixture attempt must reference a fixture lesson.",
      });
    }
  });
  catalog.evidence.forEach((evidence, index) => {
    if (!attemptIds.has(evidence.attemptId)) {
      context.addIssue({
        code: "custom",
        path: ["evidence", index, "attemptId"],
        message: "Fixture evidence must reference a fixture attempt.",
      });
    }
  });
});

export const developmentFixtureStateSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sessionId: z.string().uuid(),
  scenario: fixtureScenarioKeySchema,
  role: fixtureRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  activeAttemptId: z.string().uuid().nullable(),
  providers: fixtureProviderBehaviorSchema,
  catalog: fixtureCatalogSchema,
}).strict().superRefine((state, context) => {
  if (state.activeAttemptId && !state.catalog.attempts.some((attempt) => attempt.id === state.activeAttemptId)) {
    context.addIssue({
      code: "custom",
      path: ["activeAttemptId"],
      message: "The active fixture attempt must exist in the fixture catalog.",
    });
  }
});

export type FixtureScenarioKey = z.infer<typeof fixtureScenarioKeySchema>;
export type FixtureRole = z.infer<typeof fixtureRoleSchema>;
export type FixtureProviderBehavior = z.infer<typeof fixtureProviderBehaviorSchema>;
export type FixtureCatalog = z.infer<typeof fixtureCatalogSchema>;
export type DevelopmentFixtureState = z.infer<typeof developmentFixtureStateSchema>;
