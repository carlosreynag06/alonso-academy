import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { LessonBlock } from "@/lib/generation/contracts";
import {
  developmentFixtureStateSchema,
  type DevelopmentFixtureState,
} from "./contracts";
import { requireDevelopmentFixtureSource } from "./source";
import { writeDevelopmentFixtureState } from "./store";

const uuidSchema = z.string().uuid();
const supportLevels = ["independent", "replay", "prompted", "reduced_choices", "modeled"] as const;
type SupportLevel = (typeof supportLevels)[number];

export class FixtureCommandError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: 400 | 403 | 404 | 409 | 422,
    message: string,
  ) {
    super(message);
    this.name = "FixtureCommandError";
  }
}

type FixtureAttempt = DevelopmentFixtureState["catalog"]["attempts"][number];
type FixtureLesson = DevelopmentFixtureState["catalog"]["lessons"][number];
type FixtureEvidence = DevelopmentFixtureState["catalog"]["evidence"][number];

export type FixtureAttemptCommandResult = {
  id: string;
  lesson_artifact_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  current_block_index: number;
  break_count: number;
  player_state: Record<string, unknown>;
  last_activity_at: string;
};

function attemptResult(attempt: FixtureAttempt, updatedAt: string): FixtureAttemptCommandResult {
  return {
    id: attempt.id,
    lesson_artifact_id: attempt.lessonArtifactId,
    status: attempt.status,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt,
    current_block_index: attempt.currentBlockIndex,
    break_count: attempt.breakCount,
    player_state: attempt.playerState,
    last_activity_at: updatedAt,
  };
}

async function mutableChildState() {
  const source = await requireDevelopmentFixtureSource("child");
  return developmentFixtureStateSchema.parse(structuredClone(source.state));
}

async function persist(state: DevelopmentFixtureState) {
  state.updatedAt = new Date().toISOString();
  return writeDevelopmentFixtureState(state);
}

function approvedLesson(state: DevelopmentFixtureState, lessonId: string) {
  const lesson = state.catalog.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson || lesson.status !== "approved") {
    throw new FixtureCommandError("lesson_not_available", 404, "The fixture lesson is not approved and available.");
  }
  return lesson;
}

function attemptContext(state: DevelopmentFixtureState, attemptId: string, requireInProgress = false) {
  const attempt = state.catalog.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt) throw new FixtureCommandError("attempt_not_found", 404, "The fixture lesson attempt is not available.");
  if (attempt.status === "completed" && requireInProgress) {
    throw new FixtureCommandError("attempt_completed", 409, "The fixture lesson attempt is already complete.");
  }
  if (requireInProgress && attempt.status !== "in_progress") {
    throw new FixtureCommandError("attempt_not_active", 409, "Resume the fixture attempt before recording activity.");
  }
  return { attempt, lesson: approvedLesson(state, attempt.lessonArtifactId) };
}

function currentBlock(attempt: FixtureAttempt, lesson: FixtureLesson, blockId: string) {
  const blockIndex = lesson.content.blocks.findIndex((candidate) => candidate.id === blockId);
  if (blockIndex < 0) throw new FixtureCommandError("block_not_found", 404, "The activity is not part of this fixture lesson.");
  if (blockIndex !== attempt.currentBlockIndex) {
    throw new FixtureCommandError("block_out_of_order", 409, "The fixture activity is not the attempt's current step.");
  }
  return { block: lesson.content.blocks[blockIndex], blockIndex };
}

function priorEvidence(state: DevelopmentFixtureState, attemptId: string, blockId: string) {
  return state.catalog.evidence.filter((evidence) => evidence.attemptId === attemptId && evidence.blockId === blockId);
}

function derivedSupport(lesson: FixtureLesson, evidence: FixtureEvidence[]): SupportLevel {
  if (evidence.length === 0) return "independent";
  const incorrectCount = evidence.filter((item) => item.correct === false).length;
  if (incorrectCount >= lesson.content.remediation.triggerAfterIncorrectAttempts) return "reduced_choices";
  return "prompted";
}

function derivedEvidenceType(block: LessonBlock) {
  if (block.type === "listen_select" || block.type === "picture_action_select") return "selection";
  if (block.type === "phonemic_awareness") return "phonemic_awareness";
  if (block.type === "letter_work") return "letter_work";
  if (block.type === "exit_check") return block.evidenceType;
  return "recognition";
}

function scoredBlock(block: LessonBlock) {
  return block.type !== "model_audio" && block.type !== "movement_break" && block.type !== "controlled_story";
}

function selectedLabel(input: Record<string, unknown> | undefined) {
  const value = input?.selectedLabel;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function correctnessForSelection(block: LessonBlock, label: string) {
  if (block.type === "listen_select") {
    const correct = block.options[block.correctIndex];
    if (!correct) throw new FixtureCommandError("fixture_contract_invalid", 422, "The fixture listen activity has no valid correct option.");
    if (!block.options.includes(label)) throw new FixtureCommandError("invalid_selection", 400, "The selected answer is not part of this activity.");
    return label === correct;
  }
  if (block.type === "picture_action_select") {
    const correct = block.optionLabels[block.correctIndex];
    if (!correct) throw new FixtureCommandError("fixture_contract_invalid", 422, "The fixture picture activity has no valid correct option.");
    if (!block.optionLabels.includes(label)) throw new FixtureCommandError("invalid_selection", 400, "The selected answer is not part of this activity.");
    return label === correct;
  }
  if (block.type === "letter_work") return label === block.grapheme;
  if (block.type === "phonemic_awareness" || block.type === "exit_check") {
    const normalized = label.toLocaleLowerCase("en-US");
    return block.acceptableResponses.some((answer) => answer.toLocaleLowerCase("en-US") === normalized);
  }
  throw new FixtureCommandError("activity_not_scored", 422, "This fixture activity does not accept selection evidence.");
}

function safeLatency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(120_000, Math.round(value)));
}

export async function startFixtureLesson(lessonId: string): Promise<FixtureAttemptCommandResult> {
  const state = await mutableChildState();
  const lesson = approvedLesson(state, uuidSchema.parse(lessonId));
  const currentlyActive = state.activeAttemptId
    ? state.catalog.attempts.find((attempt) => attempt.id === state.activeAttemptId) ?? null
    : null;
  if (currentlyActive && currentlyActive.lessonArtifactId !== lesson.id && currentlyActive.status !== "completed") {
    throw new FixtureCommandError("another_attempt_active", 409, "Pause or complete the active fixture lesson first.");
  }

  let attempt = currentlyActive?.lessonArtifactId === lesson.id ? currentlyActive : null;
  if (!attempt && state.scenario === "alonso-paused") {
    attempt = state.catalog.attempts.find((candidate) => candidate.lessonArtifactId === lesson.id && candidate.status === "paused") ?? null;
  }
  if (attempt?.status === "completed") {
    throw new FixtureCommandError("lesson_already_completed", 409, "This fixture lesson is already complete.");
  }
  const now = new Date().toISOString();
  if (!attempt) {
    attempt = {
      id: randomUUID(),
      lessonArtifactId: lesson.id,
      status: "in_progress",
      currentBlockIndex: 0,
      breakCount: 0,
      playerState: { supportLevel: "independent", retries: 0, fixtureOnly: true },
      startedAt: now,
      completedAt: null,
    };
    state.catalog.attempts.push(attempt);
  } else {
    attempt.status = "in_progress";
  }
  state.activeAttemptId = attempt.id;
  const saved = await persist(state);
  const savedAttempt = saved.catalog.attempts.find((candidate) => candidate.id === attempt!.id)!;
  return attemptResult(savedAttempt, saved.updatedAt);
}

export type SaveFixtureProgressInput = {
  blockIndex: number;
  status: "in_progress" | "paused";
  breakCount: number;
  playerState?: Record<string, unknown>;
};

export async function saveFixtureLessonProgress(attemptId: string, input: SaveFixtureProgressInput): Promise<FixtureAttemptCommandResult> {
  const state = await mutableChildState();
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId));
  if (attempt.status === "completed") throw new FixtureCommandError("attempt_completed", 409, "The fixture attempt is already complete.");
  if (!Number.isInteger(input.blockIndex) || input.blockIndex < attempt.currentBlockIndex || input.blockIndex > attempt.currentBlockIndex + 1 || input.blockIndex >= lesson.content.blocks.length) {
    throw new FixtureCommandError("invalid_block_order", 409, "Fixture progress may advance by only one ordered activity.");
  }
  if (!Number.isInteger(input.breakCount) || input.breakCount < attempt.breakCount || input.breakCount > attempt.breakCount + 1) {
    throw new FixtureCommandError("invalid_break_count", 400, "The fixture break count is not valid.");
  }

  if (input.blockIndex === attempt.currentBlockIndex + 1) {
    const leavingBlock = lesson.content.blocks[attempt.currentBlockIndex];
    const evidence = priorEvidence(state, attempt.id, leavingBlock.id);
    if (scoredBlock(leavingBlock) && !evidence.some((item) => item.correct === true)) {
      throw new FixtureCommandError("successful_evidence_required", 409, "A successful response is required before advancing this fixture activity.");
    }
  }

  const nextBlock = lesson.content.blocks[input.blockIndex];
  const evidence = priorEvidence(state, attempt.id, nextBlock.id);
  attempt.currentBlockIndex = input.blockIndex;
  attempt.status = input.status;
  attempt.breakCount = input.breakCount;
  attempt.playerState = {
    supportLevel: derivedSupport(lesson, evidence),
    retries: evidence.filter((item) => item.correct === false).length,
    fixtureOnly: true,
  };
  state.activeAttemptId = attempt.id;
  const saved = await persist(state);
  return attemptResult(saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, saved.updatedAt);
}

export type RecordFixtureActivityInput = {
  clientEventId: string;
  blockId: string;
  targetId?: string | null;
  evidenceType?: string;
  firstAttempt?: boolean;
  supportLevel?: string;
  correct?: boolean | null;
  responseLatencyMs?: number | null;
  retryCount?: number;
  metadata?: Record<string, unknown>;
};

export async function recordFixtureActivityEvidence(attemptId: string, input: RecordFixtureActivityInput) {
  const state = await mutableChildState();
  const id = uuidSchema.parse(input.clientEventId);
  const duplicate = state.catalog.evidence.find((evidence) => evidence.id === id);
  if (duplicate) return duplicate;
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  const { block } = currentBlock(attempt, lesson, input.blockId);
  const label = selectedLabel(input.metadata);
  if (!label) throw new FixtureCommandError("selection_required", 400, "A fixture selection label is required.");
  const evidence = priorEvidence(state, attempt.id, block.id);
  const correct = correctnessForSelection(block, label);
  const authoritative: FixtureEvidence = {
    id,
    attemptId: attempt.id,
    blockId: block.id,
    targetId: block.targetIds[0] ?? null,
    evidenceType: derivedEvidenceType(block),
    firstAttempt: evidence.length === 0,
    supportLevel: derivedSupport(lesson, evidence),
    correct,
    responseLatencyMs: safeLatency(input.responseLatencyMs),
    retryCount: evidence.filter((item) => item.correct === false).length,
    transcript: null,
    providerConfidence: null,
    metadata: {
      fixtureOnly: true,
      selectedLabel: label,
      browserCorrectnessIgnored: true,
      recordedAt: new Date().toISOString(),
    },
  };
  state.catalog.evidence.push(authoritative);
  await persist(state);
  return authoritative;
}

export async function completeFixtureLesson(attemptId: string): Promise<FixtureAttemptCommandResult> {
  const state = await mutableChildState();
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  if (attempt.currentBlockIndex !== lesson.content.blocks.length - 1) {
    throw new FixtureCommandError("lesson_not_at_exit", 409, "The fixture attempt has not reached its final activity.");
  }
  const exitBlocks = lesson.content.blocks.filter((block) => block.type === "exit_check");
  for (const block of exitBlocks) {
    const exitEvidence = priorEvidence(state, attempt.id, block.id);
    if (!exitEvidence.some((evidence) => evidence.correct === true)) {
      throw new FixtureCommandError("successful_exit_evidence_required", 409, "A successful non-silence exit response is required before completion.");
    }
  }
  const now = new Date().toISOString();
  attempt.status = "completed";
  attempt.completedAt = now;
  attempt.currentBlockIndex = lesson.content.blocks.length;
  attempt.playerState = { ...attempt.playerState, completed: true, completedAt: now, fixtureOnly: true };
  state.activeAttemptId = null;
  lesson.fixtureState = "attempted";
  const saved = await persist(state);
  return attemptResult(saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, saved.updatedAt);
}

function spokenText(block: LessonBlock) {
  if (block.type === "model_audio" || block.type === "letter_work") return block.modelText;
  if (block.type === "listen_select" || block.type === "picture_action_select" || block.type === "phonemic_awareness" || block.type === "exit_check") return block.promptText;
  return null;
}

function fixtureToneWav() {
  const sampleRate = 8_000;
  const sampleCount = 1_200;
  const dataLength = sampleCount * 2;
  const bytes = new Uint8Array(44 + dataLength);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => Array.from(value).forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + dataLength, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, dataLength, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = 1 - index / sampleCount;
    const sample = Math.sin(2 * Math.PI * 440 * index / sampleRate) * 0.12 * envelope;
    view.setInt16(44 + index * 2, Math.round(sample * 32_767), true);
  }
  return bytes;
}

export type FixtureAudioOutcome =
  | { ok: true; status: 200; bytes: Uint8Array; contentType: "audio/wav"; text: string; fixture: true }
  | { ok: false; status: 503; error: "audio_unavailable"; message: string; fixture: true };

export async function getFixtureAudioOutcome(attemptId: string, blockId: string): Promise<FixtureAudioOutcome> {
  const state = await mutableChildState();
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  const { block } = currentBlock(attempt, lesson, blockId);
  const text = spokenText(block);
  if (!text) throw new FixtureCommandError("audio_not_available", 404, "This fixture activity has no spoken model.");
  if (state.providers.tts === "unavailable") {
    return { ok: false, status: 503, error: "audio_unavailable", message: "Fixture TTS is unavailable. The lesson state is unchanged.", fixture: true };
  }
  return { ok: true, status: 200, bytes: fixtureToneWav(), contentType: "audio/wav", text, fixture: true };
}

export type RecordFixtureSpeechInput = {
  clientEventId: string;
  responseLatencyMs?: number | null;
  firstAttempt?: boolean;
  supportLevel?: string;
  retryCount?: number;
};

export type FixtureSpeechOutcome =
  | { ok: true; status: 200; outcome: "matched" | "silence"; transcript: string; confidence: number | null; feedback: string; fixture: true }
  | { ok: false; status: 503; error: "speech_unavailable"; message: string; fixture: true };

export async function recordFixtureSpeechOutcome(attemptId: string, blockId: string, input: RecordFixtureSpeechInput): Promise<FixtureSpeechOutcome> {
  const state = await mutableChildState();
  const id = uuidSchema.parse(input.clientEventId);
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  const { block } = currentBlock(attempt, lesson, blockId);
  const speechBlock = block.type === "phonemic_awareness" && block.responseMode === "say" || block.type === "exit_check" ? block : null;
  if (!speechBlock) throw new FixtureCommandError("speech_not_available", 404, "This fixture activity does not accept speech evidence.");
  if (state.providers.stt === "unavailable") {
    return { ok: false, status: 503, error: "speech_unavailable", message: "Fixture speech processing is unavailable. Use the choices instead.", fixture: true };
  }

  const existing = state.catalog.evidence.find((evidence) => evidence.id === id);
  if (existing) {
    const outcome = existing.metadata.outcome === "silence" ? "silence" : "matched";
    return {
      ok: true,
      status: 200,
      outcome,
      transcript: existing.transcript ?? "",
      confidence: existing.providerConfidence,
      feedback: outcome === "silence" ? "I didn't hear words yet. Take your time and try once more." : "I heard you. That works!",
      fixture: true,
    };
  }

  const evidence = priorEvidence(state, attempt.id, block.id);
  const silence = state.providers.stt === "silence";
  const transcript = silence ? null : speechBlock.acceptableResponses[0] ?? null;
  const authoritative: FixtureEvidence = {
    id,
    attemptId: attempt.id,
    blockId: block.id,
    targetId: block.targetIds[0] ?? null,
    evidenceType: derivedEvidenceType(block),
    firstAttempt: evidence.length === 0,
    supportLevel: derivedSupport(lesson, evidence),
    correct: silence ? null : true,
    responseLatencyMs: safeLatency(input.responseLatencyMs),
    retryCount: evidence.filter((item) => item.correct === false || item.correct === null).length,
    transcript,
    providerConfidence: silence ? null : 0.98,
    metadata: {
      fixtureOnly: true,
      outcome: silence ? "silence" : "matched",
      rawAudioStored: false,
      browserScoringIgnored: true,
      recordedAt: new Date().toISOString(),
    },
  };
  state.catalog.evidence.push(authoritative);
  await persist(state);
  return silence
    ? { ok: true, status: 200, outcome: "silence", transcript: "", confidence: null, feedback: "I didn't hear words yet. Take your time and try once more.", fixture: true }
    : { ok: true, status: 200, outcome: "matched", transcript: transcript ?? "", confidence: 0.98, feedback: "I heard you. That works!", fixture: true };
}
