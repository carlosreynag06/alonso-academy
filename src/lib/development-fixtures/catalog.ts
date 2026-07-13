import "server-only";

import type { DailyLessonDraft, ValidationReport } from "@/lib/generation/contracts";
import {
  developmentFixtureStateSchema,
  fixtureCatalogSchema,
  type DevelopmentFixtureState,
  type FixtureBlockState,
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
    hello: "10000000-0000-4000-8000-000000000101", yes: "10000000-0000-4000-8000-000000000102",
    no: "10000000-0000-4000-8000-000000000103", listen: "10000000-0000-4000-8000-000000000104",
    frame: "10000000-0000-4000-8000-000000000105", phonics: "10000000-0000-4000-8000-000000000106",
  },
  slots: [
    "10000000-0000-4000-8000-000000000111", "10000000-0000-4000-8000-000000000112", "10000000-0000-4000-8000-000000000113",
    "10000000-0000-4000-8000-000000000114", "10000000-0000-4000-8000-000000000115",
  ],
  lessons: [
    "10000000-0000-4000-8000-000000000201", "10000000-0000-4000-8000-000000000202", "10000000-0000-4000-8000-000000000203",
    "10000000-0000-4000-8000-000000000204", "10000000-0000-4000-8000-000000000205",
  ],
  dayOneReplacementLesson: "10000000-0000-4000-8000-000000000206",
  assignments: {
    dayOneReplaced: "10000000-0000-4000-8000-000000000211", dayOneScheduled: "10000000-0000-4000-8000-000000000212",
    dayTwoWithdrawn: "10000000-0000-4000-8000-000000000213", dayThreeScheduled: "10000000-0000-4000-8000-000000000214",
    dayFourPublished: "10000000-0000-4000-8000-000000000215", dayFiveCompleted: "10000000-0000-4000-8000-000000000216",
  },
  pausedAttempt: "10000000-0000-4000-8000-000000000301",
  completedAttempt: "10000000-0000-4000-8000-000000000302",
  replayAttempt: "10000000-0000-4000-8000-000000000303",
  retrievalAttempt: "10000000-0000-4000-8000-000000000304",
  evidence: [
    "10000000-0000-4000-8000-000000000401", "10000000-0000-4000-8000-000000000402", "10000000-0000-4000-8000-000000000403",
    "10000000-0000-4000-8000-000000000404", "10000000-0000-4000-8000-000000000405", "10000000-0000-4000-8000-000000000406",
  ],
} as const;

const SNAPSHOT_ID = "a10f1e2d3c4b5a697887766554433221a10f1e2d3c4b5a697887766554433221";
const APPROVED_AT = "2026-07-01T14:00:00.000Z";
const VALIDATED_AT = "2026-07-01T14:15:00.000Z";
const targets = FIXTURE_IDS.targets;

const validReport: ValidationReport = { schemaVersion: "1.0", valid: true, deterministicValid: true, semanticValid: true, issues: [], validatorVersion: "fixture-recovery-1", validatedAt: VALIDATED_AT };
const failedReport: ValidationReport = { schemaVersion: "1.0", valid: false, deterministicValid: false, semanticValid: null, issues: [{ code: "FIXTURE_SLOT_MISMATCH", severity: "error", path: "$.targetIds", message: "Synthetic slot-binding failure used only to exercise the parent recovery path.", targetId: null }], validatorVersion: "fixture-recovery-1", validatedAt: VALIDATED_AT };

const weekDays = [
  { day: 1, title: "Hello", objective: "Recognize hello.", targetIds: [targets.hello], reviewTargetIds: [], durationMinutes: 15, lessonKind: "daily_lesson" as const, parentRationale: "Begin with one useful greeting." },
  { day: 2, title: "Yes", objective: "Recognize yes.", targetIds: [targets.yes], reviewTargetIds: [targets.hello], durationMinutes: 15, lessonKind: "daily_lesson" as const, parentRationale: "Add one concrete response." },
  { day: 3, title: "No", objective: "Recognize no.", targetIds: [targets.no], reviewTargetIds: [targets.hello, targets.yes], durationMinutes: 15, lessonKind: "daily_lesson" as const, parentRationale: "Contrast two familiar responses." },
  { day: 4, title: "Listen and respond", objective: "Respond to a familiar greeting.", targetIds: [targets.listen, targets.frame], reviewTargetIds: [targets.hello], durationMinutes: 15, lessonKind: "review_lesson" as const, parentRationale: "Practice a short guided exchange." },
  { day: 5, title: "Say hello", objective: "Use hello independently in context.", targetIds: [targets.hello, targets.frame], reviewTargetIds: [targets.yes, targets.no], durationMinutes: 15, lessonKind: "daily_lesson" as const, parentRationale: "Collect independent retrieval evidence." },
];

const slots = weekDays.map((day, index) => ({
  id: FIXTURE_IDS.slots[index], weeklyPlanId: FIXTURE_IDS.week, dayNumber: day.day, objective: day.objective, lessonKind: day.lessonKind,
  targetIds: day.targetIds, reviewTargetIds: day.reviewTargetIds, contractHash: `recovery-1-slot-${day.day}-a10f1e2d3c4b5a69`,
  immutable: true as const, fixtureOnly: true as const, hostedPublication: false as const,
}));

function lesson(day: number, title: string, objective: string, lessonTargetIds: string[]): DailyLessonDraft {
  const primaryTargetId = lessonTargetIds[0];
  return {
    schemaVersion: "1.0", curriculumSnapshotId: SNAPSHOT_ID, weeklyPlanId: FIXTURE_IDS.week, day, title, objective, durationMinutes: 15,
    targetIds: lessonTargetIds,
    blocks: [
      { id: `day-${day}-model`, type: "model_audio", targetIds: [primaryTargetId], estimatedSeconds: 60, instruction: "Listen to the model.", modelText: day === 2 ? "Yes." : day === 3 ? "No." : "Hello, Alonso!", replayAllowed: true },
      { id: `day-${day}-listen`, type: "listen_select", targetIds: [primaryTargetId], estimatedSeconds: 120, instruction: "Listen and choose.", promptText: "Which answer did you hear?", options: ["Hello", "Goodbye"], correctIndex: 0 },
      { id: `day-${day}-picture`, type: "picture_action_select", targetIds: [primaryTargetId], estimatedSeconds: 120, instruction: "Choose the matching action.", promptText: "Show me hello.", optionLabels: ["Wave", "Sit"], correctIndex: 0 },
      { id: `day-${day}-move`, type: "movement_break", targetIds: [], estimatedSeconds: 60, instruction: "Stand, stretch, and breathe.", movement: "Reach up, touch your shoulders, and sit down slowly.", scored: false },
      { id: `day-${day}-exit`, type: "exit_check", targetIds: lessonTargetIds, estimatedSeconds: 120, instruction: "Answer the character by yourself.", promptText: "The character waves. What can you say?", evidenceType: "independent_use", acceptableResponses: ["hello", "hi"] },
    ],
    remediation: { triggerAfterIncorrectAttempts: 2, scaffoldInstruction: "Replay the model, then choose between two familiar answers.", reducedChoiceCount: 2 },
    parentRationale: "Synthetic fixture content only. Approval is private and never implies hosted publication.",
  };
}

function lessonRecord(dayIndex: number, id: string, version: number) {
  const day = weekDays[dayIndex]; const slot = slots[dayIndex]; const content = lesson(day.day, day.title, day.objective, day.targetIds);
  return { id, slotId: slot.id, slotContractHash: slot.contractHash, day: day.day, kind: day.lessonKind, status: "approved" as const, publicationState: "approved_private" as const, fixtureState: "approved_private" as const, version, content, validationReport: validReport, bindingValid: true as const, fixtureOnly: true as const, hostedPublication: false as const };
}

function blockStates(content: DailyLessonDraft, mode: "not_started" | "paused" | "completed"): FixtureBlockState[] {
  return content.blocks.map((block, ordinal) => {
    if (mode === "completed") {
      const retried = block.type === "picture_action_select";
      return { blockId: block.id, ordinal, status: "completed" as const, responseCount: block.type === "model_audio" || block.type === "movement_break" ? 0 : retried ? 2 : 1, incorrectCount: retried ? 1 : 0, replayCount: 0, supportLevel: retried ? "prompted" as const : "independent" as const, stateVersion: retried ? 3 : 2 };
    }
    if (mode === "paused") {
      if (ordinal === 0) return { blockId: block.id, ordinal, status: "completed" as const, responseCount: 0, incorrectCount: 0, replayCount: 1, supportLevel: "replay" as const, stateVersion: 2 };
      if (ordinal === 1) return { blockId: block.id, ordinal, status: "passed" as const, responseCount: 2, incorrectCount: 1, replayCount: 1, supportLevel: "prompted" as const, stateVersion: 3 };
      if (ordinal === 2) return { blockId: block.id, ordinal, status: "awaiting_response" as const, responseCount: 0, incorrectCount: 0, replayCount: 0, supportLevel: "independent" as const, stateVersion: 1 };
    }
    return { blockId: block.id, ordinal, status: "not_started" as const, responseCount: 0, incorrectCount: 0, replayCount: 0, supportLevel: "independent" as const, stateVersion: 1 };
  });
}

const approvedScope = {
  snapshotId: SNAPSHOT_ID, phaseCode: "A", unitId: FIXTURE_IDS.unit, unitCode: "A-U1", unitVersion: 1, approvedAt: APPROVED_AT,
  approvedTargetIds: Object.values(targets), bannedTargetIds: [],
  targets: [
    { id: targets.hello, text: "hello", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.yes, text: "yes", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.no, text: "no", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.listen, text: "listen", kind: "vocabulary" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.frame, text: "Hello, ___.", kind: "sentence_frame" as const, oralReady: true, readingReady: false, writingReady: false },
    { id: targets.phonics, text: "/h/ / h", kind: "phonics" as const, oralReady: true, readingReady: false, writingReady: false },
  ],
  constraints: { fixtureOnly: true, hostedPublication: false, maxNovelOralWords: 2, readingDemand: "none", writingDemand: "none" }, masteryContext: [], reviewContext: [],
  safetyRules: ["Fixture approval never represents hosted publication.", "Do not require reading or writing in Phase A.", "Keep support, replay, and first-attempt evidence distinct."],
};

const lessons = [lessonRecord(0, FIXTURE_IDS.lessons[0], 1), lessonRecord(0, FIXTURE_IDS.dayOneReplacementLesson, 2), ...weekDays.slice(1).map((_, index) => lessonRecord(index + 1, FIXTURE_IDS.lessons[index + 1], 1))];
const dayFourLesson = lessons.find((item) => item.id === FIXTURE_IDS.lessons[3])!;
const dayFiveLesson = lessons.find((item) => item.id === FIXTURE_IDS.lessons[4])!;
const dayThreeLesson = lessons.find((item) => item.id === FIXTURE_IDS.lessons[2])!;

const baseCatalog = fixtureCatalogSchema.parse({
  curriculum: { id: FIXTURE_IDS.unit, code: "A-U1", title: "Hello, Listen, and Respond", description: "Synthetic oral-first Unit 1 boundary for isolated development fixtures.", version: 1, status: "approved", scope: approvedScope },
  weeklyPlan: { id: FIXTURE_IDS.week, status: "approved", version: 1, content: { schemaVersion: "1.0", curriculumSnapshotId: SNAPSHOT_ID, title: "A friendly first week", weekObjective: "Understand and use a small set of greetings and classroom responses through listening and supported speech.", days: weekDays, parentNotes: ["Fixture week only; no hosted approval or publication is implied."] }, validationReport: validReport },
  slots,
  lessons,
  assignments: [
    { id: FIXTURE_IDS.assignments.dayOneReplaced, childId: FIXTURE_IDS.child, slotId: slots[0].id, lessonArtifactId: FIXTURE_IDS.lessons[0], status: "replaced", scheduledFor: "2026-07-07T14:00:00.000Z", publishedAt: null, completedAt: null, withdrawnAt: null, replacedAt: "2026-07-06T12:00:00.000Z", replacesAssignmentId: null, replacedByAssignmentId: FIXTURE_IDS.assignments.dayOneScheduled, lockVersion: 2, fixtureOnly: true, hostedPublication: false },
    { id: FIXTURE_IDS.assignments.dayOneScheduled, childId: FIXTURE_IDS.child, slotId: slots[0].id, lessonArtifactId: FIXTURE_IDS.dayOneReplacementLesson, status: "scheduled", scheduledFor: "2026-07-13T14:00:00.000Z", publishedAt: null, completedAt: null, withdrawnAt: null, replacedAt: null, replacesAssignmentId: FIXTURE_IDS.assignments.dayOneReplaced, replacedByAssignmentId: null, lockVersion: 1, fixtureOnly: true, hostedPublication: false },
    { id: FIXTURE_IDS.assignments.dayTwoWithdrawn, childId: FIXTURE_IDS.child, slotId: slots[1].id, lessonArtifactId: FIXTURE_IDS.lessons[1], status: "withdrawn", scheduledFor: "2026-07-08T14:00:00.000Z", publishedAt: null, completedAt: null, withdrawnAt: "2026-07-08T13:00:00.000Z", replacedAt: null, replacesAssignmentId: null, replacedByAssignmentId: null, lockVersion: 2, fixtureOnly: true, hostedPublication: false },
    { id: FIXTURE_IDS.assignments.dayThreeScheduled, childId: FIXTURE_IDS.child, slotId: slots[2].id, lessonArtifactId: FIXTURE_IDS.lessons[2], status: "scheduled", scheduledFor: "2026-07-15T14:00:00.000Z", publishedAt: null, completedAt: null, withdrawnAt: null, replacedAt: null, replacesAssignmentId: null, replacedByAssignmentId: null, lockVersion: 1, fixtureOnly: true, hostedPublication: false },
    { id: FIXTURE_IDS.assignments.dayFourPublished, childId: FIXTURE_IDS.child, slotId: slots[3].id, lessonArtifactId: FIXTURE_IDS.lessons[3], status: "published", scheduledFor: "2026-07-12T14:00:00.000Z", publishedAt: "2026-07-12T13:45:00.000Z", completedAt: null, withdrawnAt: null, replacedAt: null, replacesAssignmentId: null, replacedByAssignmentId: null, lockVersion: 1, fixtureOnly: true, hostedPublication: false },
    { id: FIXTURE_IDS.assignments.dayFiveCompleted, childId: FIXTURE_IDS.child, slotId: slots[4].id, lessonArtifactId: FIXTURE_IDS.lessons[4], status: "completed", scheduledFor: "2026-07-11T14:00:00.000Z", publishedAt: "2026-07-11T13:45:00.000Z", completedAt: "2026-07-11T14:15:00.000Z", withdrawnAt: null, replacedAt: null, replacesAssignmentId: null, replacedByAssignmentId: null, lockVersion: 2, fixtureOnly: true, hostedPublication: false },
  ],
  attempts: [
    { id: FIXTURE_IDS.pausedAttempt, assignmentId: FIXTURE_IDS.assignments.dayFourPublished, lessonArtifactId: dayFourLesson.id, mode: "learning", attemptNumber: 1, status: "paused", stateVersion: 5, currentBlockId: "day-4-picture", currentBlockIndex: 2, viewMode: "activity", breakCount: 1, blockStates: blockStates(dayFourLesson.content, "paused"), playerState: { fixtureOnly: true }, startedAt: "2026-07-12T14:00:00.000Z", completedAt: null },
    { id: FIXTURE_IDS.completedAttempt, assignmentId: FIXTURE_IDS.assignments.dayFiveCompleted, lessonArtifactId: dayFiveLesson.id, mode: "learning", attemptNumber: 1, status: "completed", stateVersion: 12, currentBlockId: null, currentBlockIndex: dayFiveLesson.content.blocks.length, viewMode: "complete", breakCount: 1, blockStates: blockStates(dayFiveLesson.content, "completed"), playerState: { fixtureOnly: true }, startedAt: "2026-07-11T14:00:00.000Z", completedAt: "2026-07-11T14:14:00.000Z" },
    { id: FIXTURE_IDS.replayAttempt, assignmentId: FIXTURE_IDS.assignments.dayFiveCompleted, lessonArtifactId: dayFiveLesson.id, mode: "replay", attemptNumber: 1, status: "not_started", stateVersion: 1, currentBlockId: "day-5-model", currentBlockIndex: 0, viewMode: "activity", breakCount: 0, blockStates: blockStates(dayFiveLesson.content, "not_started"), playerState: { fixtureOnly: true }, startedAt: "2026-07-12T16:00:00.000Z", completedAt: null },
    { id: FIXTURE_IDS.retrievalAttempt, assignmentId: FIXTURE_IDS.assignments.dayThreeScheduled, lessonArtifactId: dayThreeLesson.id, mode: "scheduled_retrieval", attemptNumber: 1, status: "not_started", stateVersion: 1, currentBlockId: "day-3-model", currentBlockIndex: 0, viewMode: "activity", breakCount: 0, blockStates: blockStates(dayThreeLesson.content, "not_started"), playerState: { fixtureOnly: true }, startedAt: "2026-07-15T14:00:00.000Z", completedAt: null },
  ],
  evidence: [
    { id: FIXTURE_IDS.evidence[0], attemptId: FIXTURE_IDS.pausedAttempt, blockId: "day-4-listen", responseOrdinal: 1, targetId: targets.listen, evidenceType: "selection", firstAttempt: true, supportLevel: "independent", correct: false, responseLatencyMs: 4200, retryCount: 0, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedLabel: "Goodbye" } },
    { id: FIXTURE_IDS.evidence[1], attemptId: FIXTURE_IDS.pausedAttempt, blockId: "day-4-listen", responseOrdinal: 2, targetId: targets.listen, evidenceType: "selection", firstAttempt: false, supportLevel: "prompted", correct: true, responseLatencyMs: 3100, retryCount: 1, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedLabel: "Hello" } },
    { id: FIXTURE_IDS.evidence[2], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-picture", responseOrdinal: 1, targetId: targets.hello, evidenceType: "selection", firstAttempt: true, supportLevel: "independent", correct: false, responseLatencyMs: 6100, retryCount: 0, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedLabel: "Sit" } },
    { id: FIXTURE_IDS.evidence[3], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-picture", responseOrdinal: 2, targetId: targets.hello, evidenceType: "selection", firstAttempt: false, supportLevel: "prompted", correct: true, responseLatencyMs: 5100, retryCount: 1, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedLabel: "Wave" } },
    { id: FIXTURE_IDS.evidence[4], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-exit", responseOrdinal: 1, targetId: targets.hello, evidenceType: "independent_use", firstAttempt: true, supportLevel: "independent", correct: true, responseLatencyMs: 2600, retryCount: 0, transcript: "hello", providerConfidence: 0.89, metadata: { fixtureOnly: true, rawAudioStored: false, outcome: "matched" } },
    { id: FIXTURE_IDS.evidence[5], attemptId: FIXTURE_IDS.completedAttempt, blockId: "day-5-listen", responseOrdinal: 1, targetId: targets.hello, evidenceType: "selection", firstAttempt: true, supportLevel: "independent", correct: true, responseLatencyMs: 2900, retryCount: 0, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedLabel: "Hello" } },
  ],
  providerFailures: [
    { id: "10000000-0000-4000-8000-000000000501", provider: "openai", operation: "generate.weekly_plan", category: "authentication", safeMessage: "OpenAI authorization failed. Synthetic approved-private content is unchanged.", occurredAt: "2026-07-04T12:00:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000502", provider: "openai", operation: "generate.daily_lesson", category: "rate_limit", safeMessage: "Generation is temporarily rate-limited.", occurredAt: "2026-07-04T12:01:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000503", provider: "openai", operation: "generate.daily_lesson", category: "malformed_output", safeMessage: "The provider response did not match the required schema.", occurredAt: "2026-07-04T12:02:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000504", provider: "openai", operation: "generate.daily_lesson", category: "unavailable", safeMessage: "OpenAI is temporarily unavailable. Existing synthetic content is unchanged.", occurredAt: "2026-07-04T12:03:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000505", provider: "elevenlabs", operation: "tts", category: "unavailable", safeMessage: "Audio is not available right now.", occurredAt: "2026-07-04T12:04:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000506", provider: "elevenlabs", operation: "stt", category: "silence", safeMessage: "No speech was detected. Nothing was marked incorrect.", occurredAt: "2026-07-04T12:05:00.000Z" },
    { id: "10000000-0000-4000-8000-000000000507", provider: "elevenlabs", operation: "stt", category: "unavailable", safeMessage: "Speaking practice is unavailable. A non-voice fallback remains available.", occurredAt: "2026-07-04T12:06:00.000Z" },
  ],
});

function removeAttemptsForMissingAssignments(catalog: typeof baseCatalog) {
  const assignmentIds = new Set(catalog.assignments.map((assignment) => assignment.id));
  catalog.attempts = catalog.attempts.filter((attempt) => assignmentIds.has(attempt.assignmentId));
  const attemptIds = new Set(catalog.attempts.map((attempt) => attempt.id));
  catalog.evidence = catalog.evidence.filter((evidence) => attemptIds.has(evidence.attemptId));
}

export function createDevelopmentFixtureState(sessionId: string, scenario: FixtureScenarioKey): DevelopmentFixtureState {
  const definition = getFixtureScenario(scenario); const now = new Date().toISOString(); const catalog = structuredClone(baseCatalog);
  const providers: FixtureProviderBehavior = { openai: "success", tts: "success", stt: "success" }; let activeAttemptId: string | null = null;
  if (scenario === "curriculum-blocked") {
    catalog.curriculum.status = "draft"; catalog.curriculum.scope = null; catalog.weeklyPlan = null; catalog.slots = []; catalog.lessons = []; catalog.assignments = []; catalog.attempts = []; catalog.evidence = [];
  }
  if (scenario === "approved-week") { catalog.assignments = []; catalog.attempts = []; catalog.evidence = []; }
  if (scenario === "review-queue") {
    const failed = catalog.lessons.find((item) => item.day === 2)!; failed.status = "validation_failed"; failed.publicationState = "unapproved"; failed.fixtureState = "validation_failed"; failed.validationReport = failedReport;
    const validated = catalog.lessons.find((item) => item.day === 3)!; validated.status = "validated"; validated.publicationState = "unapproved"; validated.fixtureState = "awaiting_parent_review";
    const reviewIds = new Set([failed.id, validated.id]); catalog.assignments = catalog.assignments.filter((assignment) => !reviewIds.has(assignment.lessonArtifactId)); removeAttemptsForMissingAssignments(catalog);
  }
  if (["alonso-available", "tts-unavailable", "stt-silence", "stt-unavailable"].includes(scenario)) {
    catalog.attempts = catalog.attempts.filter((attempt) => attempt.id !== FIXTURE_IDS.pausedAttempt); catalog.evidence = catalog.evidence.filter((evidence) => evidence.attemptId !== FIXTURE_IDS.pausedAttempt);
  }
  if (scenario === "alonso-paused") activeAttemptId = FIXTURE_IDS.pausedAttempt;
  if (scenario === "alonso-completed") {
    const assignment = catalog.assignments.find((item) => item.id === FIXTURE_IDS.assignments.dayFourPublished)!; assignment.status = "completed"; assignment.completedAt = now; assignment.publishedAt = null;
    catalog.attempts = catalog.attempts.filter((attempt) => attempt.id !== FIXTURE_IDS.pausedAttempt); catalog.evidence = catalog.evidence.filter((evidence) => evidence.attemptId !== FIXTURE_IDS.pausedAttempt);
  }
  if (scenario === "openai-unavailable") providers.openai = "unavailable";
  if (scenario === "tts-unavailable") providers.tts = "unavailable";
  if (scenario === "stt-silence") providers.stt = "silence";
  if (scenario === "stt-unavailable") providers.stt = "unavailable";
  return developmentFixtureStateSchema.parse({ schemaVersion: "2.0", sessionId, scenario, role: definition.role, createdAt: now, updatedAt: now, activeAttemptId, providers, catalog, fixtureOnly: true, hostedPublication: false });
}

export function getBaseFixtureCatalog() { return structuredClone(baseCatalog); }
