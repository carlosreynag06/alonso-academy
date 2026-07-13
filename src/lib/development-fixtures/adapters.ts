import "server-only";

import type { DailyLessonDraft } from "@/lib/generation/contracts";
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
      previous_version_id: null,
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
export type FixtureGenerationCommandCenter = { unit: UnitRow; artifacts: ArtifactRow[]; jobs: JobRow[] };
export type FixtureArtifactReview = { artifact: ArtifactRow; approvals: ApprovalRow[]; children: ArtifactRow[] };

export function getFixtureCurriculumOverview(state: DevelopmentFixtureState): FixtureCurriculumOverview {
  return { phases: phaseRows(state), units: [unitRow(state)] };
}

export function getFixtureCurriculumUnit(state: DevelopmentFixtureState, unitId: string): FixtureCurriculumUnit {
  if (unitId !== state.catalog.curriculum.id) throw new Error("Fixture curriculum unit not found.");
  return { unit: unitRow(state), ...targetRows(state) };
}

export function getFixtureGenerationCommandCenter(state: DevelopmentFixtureState): FixtureGenerationCommandCenter {
  return { unit: unitRow(state), artifacts: artifactRows(state), jobs: generationJobRows(state) };
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
  };
}

export function getFixtureLatestApprovedWeeklyPlan(state: DevelopmentFixtureState, unitId: string): ArtifactRow | null {
  if (unitId !== state.catalog.curriculum.id) return null;
  const weeklyPlan = weeklyArtifactRow(state);
  return weeklyPlan?.status === "approved" ? weeklyPlan : null;
}

export type FixtureChildLessonRecord = {
  id: string;
  kind: string;
  version: number;
  dayNumber: number | null;
  content: DailyLessonDraft;
  lesson: DailyLessonDraft;
};

export type FixtureChildLessonHome = {
  child: { id: string; preferredName: string };
  currentAttempt: { id: string; lessonId: string; status: string; currentBlockIndex: number; breakCount: number } | null;
  lessons: FixtureChildLessonRecord[];
};

function childLessonRecords(state: DevelopmentFixtureState): FixtureChildLessonRecord[] {
  const completedLessonIds = new Set(state.catalog.attempts
    .filter((attempt) => attempt.status === "completed")
    .map((attempt) => attempt.lessonArtifactId));
  return lessonArtifactRows(state)
    .filter((artifact) => artifact.status === "approved" && !completedLessonIds.has(artifact.id))
    .map((artifact) => {
      const lesson = state.catalog.lessons.find((candidate) => candidate.id === artifact.id)!;
      return {
        id: artifact.id,
        kind: artifact.kind,
        version: artifact.version,
        dayNumber: artifact.day_number,
        content: lesson.content,
        lesson: lesson.content,
      };
    });
}

export function getFixtureChildLessonHome(state: DevelopmentFixtureState): FixtureChildLessonHome {
  const lessons = childLessonRecords(state);
  const activeAttempt = state.activeAttemptId
    ? state.catalog.attempts.find((attempt) => attempt.id === state.activeAttemptId) ?? null
    : null;
  const currentAttempt = activeAttempt && lessons.some((lesson) => lesson.id === activeAttempt.lessonArtifactId)
    ? {
      id: activeAttempt.id,
      lessonId: activeAttempt.lessonArtifactId,
      status: activeAttempt.status,
      currentBlockIndex: activeAttempt.currentBlockIndex,
      breakCount: activeAttempt.breakCount,
    }
    : null;
  return {
    child: { id: FIXTURE_IDS.child, preferredName: "Alonso" },
    currentAttempt,
    lessons,
  };
}

export type FixtureChildLessonAttempt = {
  attempt: { id: string; status: string; currentBlockIndex: number; breakCount: number; playerState: unknown };
  lesson: { id: string; kind: string; version: number; dayNumber: number | null; content: DailyLessonDraft };
};

export function getFixtureChildLessonAttempt(state: DevelopmentFixtureState, attemptId: string): FixtureChildLessonAttempt {
  const attempt = state.catalog.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt) throw new Error("Fixture lesson attempt not found.");
  const artifact = lessonArtifactRows(state).find((candidate) => candidate.id === attempt.lessonArtifactId);
  const lesson = state.catalog.lessons.find((candidate) => candidate.id === attempt.lessonArtifactId);
  if (!artifact || !lesson || artifact.status !== "approved") throw new Error("Fixture approved lesson not found.");
  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      currentBlockIndex: attempt.currentBlockIndex,
      breakCount: attempt.breakCount,
      playerState: attempt.playerState,
    },
    lesson: {
      id: artifact.id,
      kind: artifact.kind,
      version: artifact.version,
      dayNumber: artifact.day_number,
      content: lesson.content,
    },
  };
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
};

export function getFixtureRecoveryBaseline(state: DevelopmentFixtureState): FixtureRecoveryBaseline {
  const artifacts = artifactRows(state);
  const artifactCounts = artifacts.reduce<Record<string, number>>((counts, artifact) => {
    const key = `${artifact.kind}:${artifact.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const simulatedAudioReady = state.providers.tts === "success";
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
  };
}
