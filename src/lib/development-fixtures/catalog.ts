import "server-only";

import type { DailyLessonDraft, ValidationReport } from "@/lib/generation/contracts";
import {
  developmentFixtureStateSchema,
  fixtureCatalogSchema,
  type DevelopmentFixtureState,
  type FixtureProviderBehavior,
  type FixtureScenarioKey,
} from "./contracts";
import { getFixtureScenario } from "./scenarios";

export const FIXTURE_IDS = {
  unit: "10000000-0000-4000-8000-000000000001",
  actor: "10000000-0000-4000-8000-000000000002",
  child: "10000000-0000-4000-8000-000000000003",
  week: "10000000-0000-4000-8000-000000000010",
  targets: {
    hello: "10000000-0000-4000-8000-000000000101",
    yes: "10000000-0000-4000-8000-000000000102",
    no: "10000000-0000-4000-8000-000000000103",
    listen: "10000000-0000-4000-8000-000000000104",
    frame: "10000000-0000-4000-8000-000000000105",
    phonics: "10000000-0000-4000-8000-000000000106",
  },
  lessons: [
    "10000000-0000-4000-8000-000000000201",
    "10000000-0000-4000-8000-000000000202",
    "10000000-0000-4000-8000-000000000203",
    "10000000-0000-4000-8000-000000000204",
    "10000000-0000-4000-8000-000000000205",
  ],
  pausedAttempt: "10000000-0000-4000-8000-000000000301",
  completedAttempt: "10000000-0000-4000-8000-000000000302",
  evidence: [
    "10000000-0000-4000-8000-000000000401",
    "10000000-0000-4000-8000-000000000402",
    "10000000-0000-4000-8000-000000000403",
    "10000000-0000-4000-8000-000000000404",
  ],
} as const;

const SNAPSHOT_ID = "a10f1e2d3c4b5a697887766554433221a10f1e2d3c4b5a697887766554433221";
const APPROVED_AT = "2026-07-01T14:00:00.000Z";
const VALIDATED_AT = "2026-07-01T14:15:00.000Z";

const validReport: ValidationReport = {
  schemaVersion: "1.0",
  valid: true,
  deterministicValid: true,
  semanticValid: true,
  issues: [],
  validatorVersion: "fixture-recovery-0",
  validatedAt: VALIDATED_AT,
};

const failedReport: ValidationReport = {
  schemaVersion: "1.0",
  valid: false,
  deterministicValid: false,
  semanticValid: null,
  issues: [{
    code: "FIXTURE_UNAPPROVED_TARGET",
    severity: "error",
    path: "$.blocks[2].targetIds[0]",
    message: "Synthetic validation failure used to exercise the parent recovery path.",
    targetId: null,
  }],
  validatorVersion: "fixture-recovery-0",
  validatedAt: VALIDATED_AT,
};

const targets = FIXTURE_IDS.targets;

function lesson(day: number, title: string, primaryTargetId: string): DailyLessonDraft {
  return {
    schemaVersion: "1.0",
    curriculumSnapshotId: SNAPSHOT_ID,
    weeklyPlanId: FIXTURE_IDS.week,
    day,
    title,
    objective: "Hear, understand, and use one familiar English response in a short supported routine.",
    durationMinutes: 15,
    targetIds: [primaryTargetId, targets.frame],
    blocks: [
      {
        id: `day-${day}-model`,
        type: "model_audio",
        targetIds: [primaryTargetId],
        estimatedSeconds: 60,
        instruction: "Listen to the model.",
        modelText: day === 1 ? "Hello!" : day === 2 ? "Yes." : day === 3 ? "No." : "Hello, Alonso!",
        replayAllowed: true,
      },
      {
        id: `day-${day}-listen`,
        type: "listen_select",
        targetIds: [primaryTargetId],
        estimatedSeconds: 120,
        instruction: "Listen and choose.",
        promptText: "Which answer did you hear?",
        options: ["Hello", "Goodbye"],
        correctIndex: 0,
      },
      {
        id: `day-${day}-picture`,
        type: "picture_action_select",
        targetIds: [primaryTargetId],
        estimatedSeconds: 120,
        instruction: "Choose the matching action.",
        promptText: "Show me hello.",
        optionLabels: ["Wave", "Sit"],
        correctIndex: 0,
      },
      {
        id: `day-${day}-move`,
        type: "movement_break",
        targetIds: [],
        estimatedSeconds: 60,
        instruction: "Stand, stretch, and breathe.",
        movement: "Reach up, touch your shoulders, and sit down slowly.",
        scored: false,
      },
      {
        id: `day-${day}-exit`,
        type: "exit_check",
        targetIds: [primaryTargetId, targets.frame],
        estimatedSeconds: 120,
        instruction: "Answer the character by yourself.",
        promptText: "The character waves. What can you say?",
        evidenceType: "independent_use",
        acceptableResponses: ["hello", "hi"],
      },
    ],
    remediation: {
      triggerAfterIncorrectAttempts: 2,
      scaffoldInstruction: "Replay the model, then choose between two familiar answers.",
      reducedChoiceCount: 2,
    },
    parentRationale: "Synthetic content for exercising lifecycle and recovery states only. It is not a real approval or pilot lesson.",
  };
}

const approvedScope = {
  snapshotId: SNAPSHOT_ID,
  phaseCode: "A",
  unitId: FIXTURE_IDS.unit,
  unitCode: "A-U1",
  unitVersion: 1,
  approvedAt: APPROVED_AT,
  approvedTargetIds: Object.values(targets),
  bannedTargetIds: [],
  targets: [
    { id: targets.hello, text: "hello", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.yes, text: "yes", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.no, text: "no", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.listen, text: "listen", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.frame, text: "Hello, ___.", kind: "sentence_frame" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.phonics, text: "/h/ / h", kind: "phonics" as const, oralReady: true, readingReady: false, writingReady: false },
  ],
  constraints: {
    fixtureOnly: true,
    maxNovelOralWords: 2,
    readingDemand: "none",
    writingDemand: "none",
  },
  masteryContext: [],
  reviewContext: [],
  safetyRules: [
    "This fixture never represents a real parent approval.",
    "Do not require reading or writing in Phase A.",
    "Keep support, replay, and first-attempt evidence distinct.",
  ],
};

const baseCatalog = fixtureCatalogSchema.parse({
  curriculum: {
    id: FIXTURE_IDS.unit,
    code: "A-U1",
    title: "Hello, Listen, and Respond",
    description: "Synthetic oral-first Unit 1 boundary for isolated development fixtures.",
    version: 1,
    status: "approved",
    scope: approvedScope,
  },
  weeklyPlan: {
    id: FIXTURE_IDS.week,
    status: "approved",
    version: 1,
    content: {
      schemaVersion: "1.0",
      curriculumSnapshotId: SNAPSHOT_ID,
      title: "A friendly first week",
      weekObjective: "Understand and use a small set of greetings and classroom responses through listening and supported speech.",
      days: [
        { day: 1, title: "Hello", objective: "Recognize hello.", targetIds: [targets.hello], reviewTargetIds: [], durationMinutes: 15, lessonKind: "daily_lesson", parentRationale: "Begin with one useful greeting." },
        { day: 2, title: "Yes", objective: "Recognize yes.", targetIds: [targets.yes], reviewTargetIds: [targets.hello], durationMinutes: 15, lessonKind: "daily_lesson", parentRationale: "Add one concrete response." },
        { day: 3, title: "No", objective: "Recognize no.", targetIds: [targets.no], reviewTargetIds: [targets.hello, targets.yes], durationMinutes: 15, lessonKind: "daily_lesson", parentRationale: "Contrast two familiar responses." },
        { day: 4, title: "Listen and respond", objective: "Respond to a familiar greeting.", targetIds: [targets.listen, targets.frame], reviewTargetIds: [targets.hello], durationMinutes: 15, lessonKind: "review_lesson", parentRationale: "Practice a short guided exchange." },
        { day: 5, title: "Say hello", objective: "Use hello independently in context.", targetIds: [targets.hello, targets.frame], reviewTargetIds: [targets.yes, targets.no], durationMinutes: 15, lessonKind: "daily_lesson", parentRationale: "Collect independent retrieval evidence." },
      ],
      parentNotes: ["Fixture week only; no real approval is implied."],
    },
    validationReport: validReport,
  },
  lessons: [
    { id: FIXTURE_IDS.lessons[0], day: 1, status: "draft", fixtureState: "draft", version: 1, content: lesson(1, "Hello", targets.hello), validationReport: null },
    { id: FIXTURE_IDS.lessons[1], day: 2, status: "validation_failed", fixtureState: "validation_failed", version: 1, content: lesson(2, "Yes", targets.yes), validationReport: failedReport },
    { id: FIXTURE_IDS.lessons[2], day: 3, status: "validated", fixtureState: "awaiting_parent_review", version: 1, content: lesson(3, "No", targets.no), validationReport: validReport },
    { id: FIXTURE_IDS.lessons[3], day: 4, status: "approved", fixtureState: "available", version: 1, content: lesson(4, "Listen and respond", targets.listen), validationReport: validReport },
    { id: FIXTURE_IDS.lessons[4], day: 5, status: "approved", fixtureState: "attempted", version: 1, content: lesson(5, "Say hello", targets.hello), validationReport: validReport },
  ],
  attempts: [
    {
      id: FIXTURE_IDS.pausedAttempt,
      lessonArtifactId: FIXTURE_IDS.lessons[3],
      status: "paused",
      currentBlockIndex: 2,
      breakCount: 1,
      playerState: { retries: 1, supportLevel: "replay", lastCompletedBlockId: "day-4-listen" },
      startedAt: "2026-07-02T14:00:00.000Z",
      completedAt: null,
    },
    {
      id: FIXTURE_IDS.completedAttempt,
      lessonArtifactId: FIXTURE_IDS.lessons[4],
      status: "completed",
      currentBlockIndex: 5,
      breakCount: 1,
      playerState: { exitOutcome: "matched", supportLevel: "independent" },
      startedAt: "2026-07-03T14:00:00.000Z",
      completedAt: "2026-07-03T14:14:00.000Z",
    },
  ],
  evidence: [
    {
      id: FIXTURE_IDS.evidence[0], attemptId: FIXTURE_IDS.pausedAttempt, blockId: "day-4-listen", targetId: targets.listen,
      evidenceType: "recognition", firstAttempt: true, supportLevel: "independent", correct: false,
      responseLatencyMs: 4200, retryCount: 0, transcript: null, providerConfidence: null,
      metadata: { fixture: true, choiceIndex: 1 },
    },
    {
      id: FIXTURE_IDS.evidence[1], attemptId: FIXTURE_IDS.pausedAttempt, blockId: "day-4-listen", targetId: targets.listen,
      evidenceType: "recognition", firstAttempt: false, supportLevel: "replay", correct: true,
      responseLatencyMs: 3100, retryCount: 1, transcript: null, providerConfidence: null,
      metadata: { fixture: true, choiceIndex: 0 },
    },
    {
      id: FIXTURE_IDS.evidence[2], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-picture", targetId: targets.hello,
      evidenceType: "comprehension", firstAttempt: false, supportLevel: "reduced_choices", correct: true,
      responseLatencyMs: 5100, retryCount: 1, transcript: null, providerConfidence: null,
      metadata: { fixture: true, scaffoldSuccessful: true },
    },
    {
      id: FIXTURE_IDS.evidence[3], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-exit", targetId: targets.hello,
      evidenceType: "independent_use", firstAttempt: true, supportLevel: "independent", correct: true,
      responseLatencyMs: 2600, retryCount: 0, transcript: "hello", providerConfidence: 0.89,
      metadata: { fixture: true, rawAudioStored: false, outcome: "matched" },
    },
  ],
  providerFailures: [
    { id: "10000000-0000-4000-8000-000000000501", provider: "openai", operation: "generate.weekly_plan", category: "authentication", safeMessage: "OpenAI authorization failed. The synthetic approved content is unchanged.", occurredAt: "2026-07-04T12:00:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000502", provider: "openai", operation: "generate.daily_lesson", category: "rate_limit", safeMessage: "Generation is temporarily rate-limited.", occurredAt: "2026-07-04T12:01:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000503", provider: "openai", operation: "generate.daily_lesson", category: "malformed_output", safeMessage: "The provider response did not match the required schema.", occurredAt: "2026-07-04T12:02:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000504", provider: "openai", operation: "generate.daily_lesson", category: "unavailable", safeMessage: "OpenAI is temporarily unavailable. Existing content is unchanged.", occurredAt: "2026-07-04T12:03:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000505", provider: "elevenlabs", operation: "tts", category: "unavailable", safeMessage: "Audio is not available right now.", occurredAt: "2026-07-04T12:04:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000506", provider: "elevenlabs", operation: "stt", category: "silence", safeMessage: "No speech was detected. Nothing was marked incorrect.", occurredAt: "2026-07-04T12:05:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000507", provider: "elevenlabs", operation: "stt", category: "unavailable", safeMessage: "Speaking practice is unavailable. A non-voice fallback remains available.", occurredAt: "2026-07-04T12:06:00.000Z" },
  ],
});

export function createDevelopmentFixtureState(sessionId: string, scenario: FixtureScenarioKey): DevelopmentFixtureState {
  const definition = getFixtureScenario(scenario);
  const now = new Date().toISOString();
  const catalog = structuredClone(baseCatalog);
  const providers: FixtureProviderBehavior = { openai: "success", tts: "success", stt: "success" };
  let activeAttemptId: string | null = null;

  if (scenario === "curriculum-blocked") {
    catalog.curriculum.status = "draft";
    catalog.curriculum.scope = null;
    catalog.weeklyPlan = null;
  }
  if (scenario === "alonso-paused") activeAttemptId = FIXTURE_IDS.pausedAttempt;
  if (scenario === "openai-unavailable") providers.openai = "unavailable";
  if (scenario === "tts-unavailable") providers.tts = "unavailable";
  if (scenario === "stt-silence") providers.stt = "silence";
  if (scenario === "stt-unavailable") providers.stt = "unavailable";

  return developmentFixtureStateSchema.parse({
    schemaVersion: "1.0",
    sessionId,
    scenario,
    role: definition.role,
    createdAt: now,
    updatedAt: now,
    activeAttemptId,
    providers,
    catalog,
  });
}

export function getBaseFixtureCatalog() {
  return structuredClone(baseCatalog);
}
