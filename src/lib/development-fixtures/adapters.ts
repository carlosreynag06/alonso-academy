import "server-only";

import type { LessonBlock } from "@/lib/generation/contracts";
import {
  authoritativeAttemptSnapshotSchema,
  childAttemptRuntimePayloadSchema,
  childLessonHomeSchema,
  childSafeLessonBlockSchema,
  childSafeLessonSchema,
  type AuthoritativeAttemptSnapshot,
  type ChildAttemptRuntimePayload,
  type ChildSafeLesson,
} from "@/lib/lesson/runtime-contracts";
import type { Database, Json } from "@/types/database";
import { FIXTURE_IDS } from "./catalog";
import type { DevelopmentFixtureState } from "./contracts";

type PhaseRow = Database["public"]["Tables"]["curriculum_phases"]["Row"];
type UnitRow = Database["public"]["Tables"]["curriculum_units"]["Row"];
type VocabularyRow = Database["public"]["Tables"]["vocabulary_items"]["Row"];
type FrameRow = Database["public"]["Tables"]["sentence_frames"]["Row"];
type PhonicsRow = Database["public"]["Tables"]["phonics_targets"]["Row"];
type WritingRow = Database["public"]["Tables"]["writing_targets"]["Row"];
type ArtifactRow = Database["public"]["Tables"]["generated_artifacts"]["Row"];
type JobRow = Database["public"]["Tables"]["generation_jobs"]["Row"];
type ApprovalRow = Database["public"]["Tables"]["approval_records"]["Row"];

const CREATED_AT = "2026-07-01T14:00:00.000Z";
const UPDATED_AT = "2026-07-01T14:20:00.000Z";
const SNAPSHOT_FALLBACK = "fixture-curriculum-blocked";

const phaseMetadata = [
  { code: "A", sequence: 1, name: "Sound, Meaning, and Confidence", purpose: "Establish English sound recognition, connect words with pictures and actions, teach first routines, and introduce letter-sound anchors." },
  { code: "B", sequence: 2, name: "Core Oral Vocabulary and Survival Phrases", purpose: "Build useful vocabulary for wants, needs, objects, actions, feelings, questions, and locations." },
  { code: "C", sequence: 3, name: "Sentence Frames and Guided Interaction", purpose: "Move from isolated words into productive short sentences and controlled dialogues." },
  { code: "D", sequence: 4, name: "Phonemic Awareness, Phonics, and Early Decoding", purpose: "Teach systematic sound-symbol relationships, blending, segmenting, and controlled decoding." },
  { code: "E", sequence: 5, name: "Connected Reading and Sentence Writing", purpose: "Develop short connected reading, comprehension, dictation, sequencing, and sentence writing." },
  { code: "F", sequence: 6, name: "Narration, Explanation, Conversation, and School Language", purpose: "Develop longer oral turns, retelling, explanation, clarification, opinion, and classroom language." },
] as const;

function asJson(value: unknown): Json {
  return value as Json;
}

function unitRow(state: DevelopmentFixtureState): UnitRow {
  const curriculum = state.catalog.curriculum;
  return {
    id: curriculum.id,
    phase_code: "A",
    code: curriculum.code,
    title: curriculum.title,
    description: curriculum.description,
    version: curriculum.version,
    status: curriculum.status,
    constraints: asJson(curriculum.scope?.constraints ?? {
      fixtureOnly: true,
      blocked: true,
      readingDemand: "none",
      writingDemand: "none",
    }),
    mastery_requirements: {
      minimum_independent_retrievals: 2,
      minimum_contexts: 2,
      completion_does_not_equal_mastery: true,
      fixtureOnly: true,
    },
    approved_at: curriculum.scope?.approvedAt ?? null,
    approved_by: curriculum.status === "approved" ? FIXTURE_IDS.actor : null,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  };
}

function phaseRows(state: DevelopmentFixtureState): PhaseRow[] {
  return phaseMetadata.map((phase) => ({
    ...phase,
    status: phase.code === "A" ? state.catalog.curriculum.status : "inactive",
    created_at: CREATED_AT,
  }));
}

function targetRows(state: DevelopmentFixtureState) {
  const targets = state.catalog.curriculum.scope?.targets ?? [];
  const vocabulary: VocabularyRow[] = targets
    .filter((target) => target.kind === "vocabulary")
    .map((target, index) => ({
      id: target.id,
      unit_id: state.catalog.curriculum.id,
      canonical_text: target.text,
      item_kind: "word",
      part_of_speech: target.text === "listen" ? "verb" : "expression",
      theme: target.text === "listen" ? "classroom routine" : "first responses",
      communication_function: target.text === "listen" ? "follow direction" : "social response",
      priority: index + 1,
      imageable: true,
      gesture_support: target.text === "hello" ? "wave" : target.text === "listen" ? "cup hand to ear" : "nod or shake head",
      oral_ready: target.oralReady,
      reading_ready: target.readingReady,
      writing_ready: target.writingReady,
      status: "approved",
      metadata: { fixtureOnly: true },
      created_at: CREATED_AT,
    }));

  const frames: FrameRow[] = targets
    .filter((target) => target.kind === "sentence_frame")
    .map((target) => ({
      id: target.id,
      unit_id: state.catalog.curriculum.id,
      frame: target.text,
      communication_function: "greeting",
      mode: "oral_only",
      acceptable_responses: ["Hello", "Hi"],
      recast_guidance: "Model once, accept an intelligible greeting, and avoid requiring accent-perfect production.",
      status: "approved",
      created_at: CREATED_AT,
    }));

  const phonics: PhonicsRow[] = targets
    .filter((target) => target.kind === "phonics")
    .map((target) => ({
      id: target.id,
      unit_id: state.catalog.curriculum.id,
      phoneme: "/h/",
      grapheme: "h",
      target_type: "sound_anchor",
      reading_allowed: target.readingReady,
      status: "approved",
      metadata: { fixtureOnly: true, anchorWord: "hello" },
      created_at: CREATED_AT,
    }));

  const writing: WritingRow[] = targets
    .filter((target) => target.kind === "writing")
    .map((target) => ({
      id: target.id,
      unit_id: state.catalog.curriculum.id,
      title: target.text,
      demand: "letter selection only",
      activity_type: "select",
      status: "approved",
      metadata: { fixtureOnly: true },
      created_at: CREATED_AT,
    }));

  return { vocabulary, frames, phonics, writing };
}

function weeklyArtifactRow(state: DevelopmentFixtureState): ArtifactRow | null {
  const weeklyPlan = state.catalog.weeklyPlan;
  if (!weeklyPlan) return null;
  const snapshot = state.catalog.curriculum.scope;
  return {
    id: weeklyPlan.id,
    kind: "weekly_plan",
    status: weeklyPlan.status,
    version: weeklyPlan.version,
    previous_version_id: null,
    curriculum_unit_id: state.catalog.curriculum.id,
    curriculum_snapshot: asJson(snapshot ?? { snapshotId: SNAPSHOT_FALLBACK, fixtureOnly: true, blocked: true }),
    content: asJson(weeklyPlan.content),
    validation_report: weeklyPlan.validationReport ? asJson(weeklyPlan.validationReport) : null,
    model_id: "fixture-only",
    prompt_version: "recovery-0-fixture-v1",
    request_hash: "f100000000000000000000000000000000000000000000000000000000000001",
    reasoning_effort: "not_called",
    semantic_validator_model_id: "fixture-only",
    lineage_key: "fixture:weekly",
    parent_artifact_id: null,
    day_number: null,
    week_day_slot_id: null,
    binding_status: "not_applicable",
    binding_report: null,
    binding_validated_at: null,
    runtime_ready: false,
    runtime_report: null,
    created_by: FIXTURE_IDS.actor,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  };
}

function lessonArtifactRows(state: DevelopmentFixtureState): ArtifactRow[] {
  const weeklyPlan = state.catalog.weeklyPlan;
  if (!weeklyPlan) return [];
  return state.catalog.lessons.map((lesson) => {
    const plannedDay = weeklyPlan.content.days.find((day) => day.day === lesson.day);
    return {
      id: lesson.id,
      kind: plannedDay?.lessonKind ?? "daily_lesson",
      status: lesson.status,
      version: lesson.version,
      previous_version_id: lesson.version > 1
        ? state.catalog.lessons.find((candidate) => candidate.slotId === lesson.slotId && candidate.version === lesson.version - 1)?.id ?? null
        : null,
      curriculum_unit_id: state.catalog.curriculum.id,
      curriculum_snapshot: asJson(state.catalog.curriculum.scope ?? { snapshotId: SNAPSHOT_FALLBACK, fixtureOnly: true }),
      content: asJson(lesson.content),
      validation_report: lesson.validationReport ? asJson(lesson.validationReport) : null,
      model_id: lesson.status === "draft" ? null : "fixture-only",
      prompt_version: "recovery-0-fixture-v1",
      request_hash: `f20000000000000000000000000000000000000000000000000000000000000${lesson.day}`,
      reasoning_effort: lesson.status === "draft" ? null : "not_called",
      semantic_validator_model_id: lesson.status === "draft" ? null : "fixture-only",
      lineage_key: `fixture:${weeklyPlan.id}:day-${lesson.day}:${plannedDay?.lessonKind ?? "daily_lesson"}`,
      parent_artifact_id: weeklyPlan.id,
      day_number: lesson.day,
      week_day_slot_id: lesson.slotId,
      binding_status: "valid",
      binding_report: { fixtureOnly: true, exactSlot: true },
      binding_validated_at: UPDATED_AT,
      runtime_ready: lesson.status === "validated" || lesson.status === "approved",
      runtime_report: { fixtureOnly: true, childSafe: true },
      created_by: FIXTURE_IDS.actor,
      created_at: `2026-07-0${lesson.day + 1}T14:00:00.000Z`,
      updated_at: `2026-07-0${lesson.day + 1}T14:20:00.000Z`,
    } satisfies ArtifactRow;
  });
}

function artifactRows(state: DevelopmentFixtureState) {
  const weeklyPlan = weeklyArtifactRow(state);
  if (!weeklyPlan) return [];
  if (state.scenario === "approved-week") return [weeklyPlan];
  return [weeklyPlan, ...lessonArtifactRows(state)];
}

function generationJobRows(state: DevelopmentFixtureState): JobRow[] {
  if (state.scenario !== "openai-unavailable") return [];
  const failure = state.catalog.providerFailures.find((event) => event.provider === "openai" && event.category === "unavailable");
  return [{
    id: "10000000-0000-4000-8000-000000000601",
    idempotency_key: "fixture-openai-unavailable",
    artifact_kind: "daily_lesson",
    curriculum_unit_id: state.catalog.curriculum.id,
    curriculum_snapshot_id: state.catalog.curriculum.scope?.snapshotId ?? SNAPSHOT_FALLBACK,
    request_hash: "f300000000000000000000000000000000000000000000000000000000000001",
    status: "failed",
    attempts: 1,
    artifact_id: null,
    requested_by: FIXTURE_IDS.actor,
    safe_error_code: "unavailable",
    safe_error_message: failure?.safeMessage ?? "The synthetic provider is unavailable. No hosted data was changed.",
    started_at: "2026-07-04T12:03:00.000Z",
    completed_at: "2026-07-04T12:03:01.000Z",
    created_at: "2026-07-04T12:03:00.000Z",
    updated_at: "2026-07-04T12:03:01.000Z",
  }];
}

function approvalForArtifact(artifact: ArtifactRow): ApprovalRow[] {
  if (artifact.status !== "approved") return [];
  const suffix = artifact.kind === "weekly_plan" ? "610" : String(620 + (artifact.day_number ?? 0));
  return [{
    id: `10000000-0000-4000-8000-${suffix.padStart(12, "0")}`,
    entity_type: "generated_artifact",
    entity_id: artifact.id,
    action: "approved",
    note: "Synthetic fixture decision only. No hosted approval exists.",
    actor_id: FIXTURE_IDS.actor,
    created_at: artifact.updated_at,
  }];
}

export type FixtureCurriculumOverview = { phases: PhaseRow[]; units: UnitRow[] };
export type FixtureCurriculumUnit = ReturnType<typeof targetRows> & { unit: UnitRow };
export type FixtureGenerationCommandCenter = { unit: UnitRow; artifacts: ArtifactRow[]; jobs: JobRow[]; slots: DevelopmentFixtureState["catalog"]["slots"]; assignments: DevelopmentFixtureState["catalog"]["assignments"] };
export type FixtureArtifactReview = { artifact: ArtifactRow; approvals: ApprovalRow[]; children: ArtifactRow[]; slot: DevelopmentFixtureState["catalog"]["slots"][number] | null; assignments: DevelopmentFixtureState["catalog"]["assignments"] };

export function getFixtureCurriculumOverview(state: DevelopmentFixtureState): FixtureCurriculumOverview {
  return { phases: phaseRows(state), units: [unitRow(state)] };
}

export function getFixtureCurriculumUnit(state: DevelopmentFixtureState, unitId: string): FixtureCurriculumUnit {
  if (unitId !== state.catalog.curriculum.id) throw new Error("Fixture curriculum unit not found.");
  return { unit: unitRow(state), ...targetRows(state) };
}

export function getFixtureGenerationCommandCenter(state: DevelopmentFixtureState): FixtureGenerationCommandCenter {
  return { unit: unitRow(state), artifacts: artifactRows(state), jobs: generationJobRows(state), slots: structuredClone(state.catalog.slots), assignments: structuredClone(state.catalog.assignments) };
}

export function getFixtureArtifactReview(state: DevelopmentFixtureState, artifactId: string): FixtureArtifactReview {
  const artifacts = artifactRows(state);
  const artifact = artifacts.find((candidate) => candidate.id === artifactId);
  if (!artifact) throw new Error("Fixture artifact not found.");
  return {
    artifact,
    approvals: approvalForArtifact(artifact),
    children: artifact.kind === "weekly_plan"
      ? artifacts.filter((candidate) => candidate.parent_artifact_id === artifact.id).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      : [],
    slot: state.catalog.lessons.find((lesson) => lesson.id === artifact.id)
      ? state.catalog.slots.find((slot) => slot.id === state.catalog.lessons.find((lesson) => lesson.id === artifact.id)!.slotId) ?? null
      : null,
    assignments: structuredClone(state.catalog.assignments.filter((assignment) => assignment.lessonArtifactId === artifact.id || artifact.kind === "weekly_plan")),
  };
}

export function getFixtureLatestApprovedWeeklyPlan(state: DevelopmentFixtureState, unitId: string): ArtifactRow | null {
  if (unitId !== state.catalog.curriculum.id) return null;
  const weeklyPlan = weeklyArtifactRow(state);
  return weeklyPlan?.status === "approved" ? weeklyPlan : null;
}

function options(labels: string[], blockId: string) { return labels.map((label, index) => ({ key: `${blockId}-option-${index + 1}`, label })); }

function safeBlock(block: LessonBlock) {
  const base = { id: block.id, estimatedSeconds: block.estimatedSeconds, instruction: block.instruction };
  if (block.type === "model_audio") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, modelText: block.modelText, replayAllowed: block.replayAllowed });
  if (block.type === "listen_select") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, promptText: block.promptText, options: options(block.options, block.id) });
  if (block.type === "picture_action_select") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, promptText: block.promptText, options: options(block.optionLabels, block.id) });
  if (block.type === "phonemic_awareness") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, promptText: block.promptText, responseMode: block.responseMode, responseOptions: options(block.acceptableResponses, block.id) });
  if (block.type === "letter_work") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, grapheme: block.grapheme, demand: block.demand, modelText: block.modelText, options: options(Array.from(new Set([block.grapheme, "m", "s"])).slice(0, 3), block.id) });
  if (block.type === "movement_break") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, movement: block.movement });
  if (block.type === "exit_check") return childSafeLessonBlockSchema.parse({ ...base, type: block.type, promptText: block.promptText, responseOptions: options(block.acceptableResponses, block.id) });
  return null;
}

export function getFixtureChildSafeLesson(state: DevelopmentFixtureState, assignmentId: string): ChildSafeLesson {
  const assignment = state.catalog.assignments.find((candidate) => candidate.id === assignmentId);
  if (!assignment) throw new Error("Fixture assignment not found.");
  const lesson = state.catalog.lessons.find((candidate) => candidate.id === assignment.lessonArtifactId);
  if (!lesson || lesson.status !== "approved" || lesson.publicationState !== "approved_private") throw new Error("Fixture approved-private lesson not found.");
  return childSafeLessonSchema.parse({
    artifactId: lesson.id, day: lesson.day, title: lesson.content.title, objective: lesson.content.objective, durationMinutes: lesson.content.durationMinutes,
    blocks: lesson.content.blocks.flatMap((block) => { const safe = safeBlock(block); return safe ? [safe] : []; }),
    remediation: { scaffoldInstruction: lesson.content.remediation.scaffoldInstruction },
  });
}

function feedback(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.tone === "string" && typeof candidate.title === "string" && typeof candidate.message === "string" ? candidate : null;
}

export function getFixtureAttemptSnapshot(attempt: DevelopmentFixtureState["catalog"]["attempts"][number]): AuthoritativeAttemptSnapshot {
  const blockState = attempt.currentBlockId ? attempt.blockStates.find((block) => block.blockId === attempt.currentBlockId) ?? null : null;
  const selectedOptionKey = typeof attempt.playerState.selectedOptionKey === "string" ? attempt.playerState.selectedOptionKey : null;
  const visibleOptionKeys = Array.isArray(attempt.playerState.visibleOptionKeys) && attempt.playerState.visibleOptionKeys.every((key) => typeof key === "string") ? attempt.playerState.visibleOptionKeys : null;
  const outcome = typeof attempt.playerState.outcome === "string" ? attempt.playerState.outcome : null;
  const completed = attempt.blockStates.filter((block) => block.status === "completed" || block.status === "passed").length;
  return authoritativeAttemptSnapshotSchema.parse({
    attemptId: attempt.id, assignmentId: attempt.assignmentId, attemptMode: attempt.mode,
    status: attempt.status === "not_started" ? "in_progress" : attempt.status,
    stateVersion: attempt.stateVersion, currentBlockId: attempt.currentBlockId, currentBlockIndex: attempt.currentBlockIndex,
    viewMode: attempt.viewMode,
    retryCount: blockState?.incorrectCount ?? 0, supportLevel: blockState?.supportLevel ?? "independent", selectedOptionKey,
    visibleOptionKeys, outcome, feedback: feedback(attempt.playerState.feedback),
    fallbackAvailable: attempt.playerState.fallbackAvailable === true, canAdvance: attempt.playerState.canAdvance === true,
    breakCount: attempt.breakCount, progress: { completed, total: attempt.blockStates.length },
  });
}

function childAssignment(state: DevelopmentFixtureState, assignment: DevelopmentFixtureState["catalog"]["assignments"][number], mode: "learning" | "replay" | "scheduled_retrieval") {
  const slot = state.catalog.slots.find((candidate) => candidate.id === assignment.slotId)!;
  const lesson = state.catalog.lessons.find((candidate) => candidate.id === assignment.lessonArtifactId)!;
  const attempt = state.catalog.attempts.find((candidate) => candidate.assignmentId === assignment.id && candidate.mode === mode && ["in_progress", "paused"].includes(candidate.status)) ?? null;
  return { id: assignment.id, lessonArtifactId: lesson.id, mode, state: assignment.status === "published" ? "published" : assignment.status === "completed" ? "completed" : "scheduled", day: slot.dayNumber, title: lesson.content.title, objective: lesson.content.objective, durationMinutes: lesson.content.durationMinutes, activeAttemptId: attempt?.id ?? null };
}

export function getFixtureChildLessonHome(state: DevelopmentFixtureState) {
  const published = state.catalog.assignments.find((assignment) => assignment.status === "published") ?? null;
  return childLessonHomeSchema.parse({
    child: { id: FIXTURE_IDS.child, preferredName: "Alonso" },
    todayAssignment: published ? childAssignment(state, published, "learning") : null,
    replayAssignments: state.catalog.assignments.filter((assignment) => assignment.status === "completed").map((assignment) => childAssignment(state, assignment, "replay")),
    retrievalAssignments: state.catalog.assignments.filter((assignment) => assignment.status === "scheduled").map((assignment) => childAssignment(state, assignment, "scheduled_retrieval")),
  });
}

export function getFixtureChildLessonAttempt(state: DevelopmentFixtureState, attemptId: string): ChildAttemptRuntimePayload {
  const attempt = state.catalog.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt) throw new Error("Fixture lesson attempt not found.");
  return childAttemptRuntimePayloadSchema.parse({ lesson: getFixtureChildSafeLesson(state, attempt.assignmentId), snapshot: getFixtureAttemptSnapshot(attempt) });
}

export type FixtureRecoveryBaseline = {
  curriculum: { id: string; code: string; status: string; approved_at: string | null } | null;
  artifactCounts: Record<string, number>;
  attempts: Array<{ id: string; status: string }>;
  evidenceCount: number;
  masteryCount: number;
  reviewCount: number;
  providerEvents: Array<{ provider: string; status: string }>;
  providers: { supabase: boolean; openAi: boolean; elevenLabsKey: boolean; approvedVoice: boolean; audioReady: boolean };
  slotCount: number;
  assignmentCounts: Record<string, number>;
  hostedPublication: false;
};

export function getFixtureRecoveryBaseline(state: DevelopmentFixtureState): FixtureRecoveryBaseline {
  const artifacts = artifactRows(state);
  const artifactCounts = artifacts.reduce<Record<string, number>>((counts, artifact) => {
    const key = `${artifact.kind}:${artifact.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const simulatedAudioReady = state.providers.tts === "success";
  const assignmentCounts = state.catalog.assignments.reduce<Record<string, number>>((counts, assignment) => { counts[assignment.status] = (counts[assignment.status] ?? 0) + 1; return counts; }, {});
  return {
    curriculum: {
      id: state.catalog.curriculum.id,
      code: state.catalog.curriculum.code,
      status: state.catalog.curriculum.status,
      approved_at: state.catalog.curriculum.scope?.approvedAt ?? null,
    },
    artifactCounts,
    attempts: state.catalog.attempts.map((attempt) => ({ id: attempt.id, status: attempt.status })),
    evidenceCount: state.catalog.evidence.length,
    masteryCount: 0,
    reviewCount: 0,
    providerEvents: state.catalog.providerFailures.map((event) => ({ provider: event.provider, status: event.category })),
    providers: {
      supabase: false,
      openAi: state.providers.openai === "success",
      elevenLabsKey: simulatedAudioReady,
      approvedVoice: simulatedAudioReady,
      audioReady: simulatedAudioReady,
    },
    slotCount: state.catalog.slots.length,
    assignmentCounts,
    hostedPublication: false,
  };
}
