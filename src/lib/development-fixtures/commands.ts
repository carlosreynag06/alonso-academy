import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { LessonBlock } from "@/lib/generation/contracts";
import {
  attemptMutationResponseSchema,
  type AttemptMode,
  type AttemptOutcome,
  type AttemptProgressCommand,
  type AttemptResponse,
  type ChildAttemptRuntimePayload,
} from "@/lib/lesson/runtime-contracts";
import { getFixtureAttemptSnapshot, getFixtureChildLessonAttempt } from "./adapters";
import {
  developmentFixtureStateSchema,
  type DevelopmentFixtureState,
  type FixtureBlockState,
  type FixtureEvidence,
} from "./contracts";
import { requireDevelopmentFixtureSource } from "./source";
import { writeDevelopmentFixtureState } from "./store";

const uuidSchema = z.string().uuid();
type FixtureAttempt = DevelopmentFixtureState["catalog"]["attempts"][number];
type FixtureLesson = DevelopmentFixtureState["catalog"]["lessons"][number];

export class FixtureCommandError extends Error {
  constructor(public readonly code: string, public readonly status: 400 | 403 | 404 | 409 | 422, message: string) {
    super(message); this.name = "FixtureCommandError";
  }
}

export type FixtureAttemptCommandResult = {
  id: string; assignment_id: string; lesson_artifact_id: string; attempt_mode: string; status: string;
  state_version: number; current_block_id: string | null; current_block_index: number; view_mode: string;
  started_at: string; completed_at: string | null; break_count: number; player_state: Record<string, unknown>;
  block_states: FixtureBlockState[]; last_activity_at: string; fixture_only: true; hosted_publication: false;
};

function attemptResult(attempt: FixtureAttempt, updatedAt: string): FixtureAttemptCommandResult {
  return {
    id: attempt.id, assignment_id: attempt.assignmentId, lesson_artifact_id: attempt.lessonArtifactId, attempt_mode: attempt.mode,
    status: attempt.status, state_version: attempt.stateVersion, current_block_id: attempt.currentBlockId,
    current_block_index: attempt.currentBlockIndex, view_mode: attempt.viewMode, started_at: attempt.startedAt,
    completed_at: attempt.completedAt, break_count: attempt.breakCount, player_state: attempt.playerState,
    block_states: structuredClone(attempt.blockStates), last_activity_at: updatedAt, fixture_only: true, hosted_publication: false,
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

function lessonForAssignment(state: DevelopmentFixtureState, assignmentId: string) {
  const assignment = state.catalog.assignments.find((candidate) => candidate.id === assignmentId);
  if (!assignment) throw new FixtureCommandError("assignment_not_found", 404, "The synthetic assignment is not available.");
  const lesson = state.catalog.lessons.find((candidate) => candidate.id === assignment.lessonArtifactId);
  if (!lesson || lesson.status !== "approved" || lesson.publicationState !== "approved_private" || !lesson.bindingValid) {
    throw new FixtureCommandError("lesson_not_available", 404, "The assignment does not reference a valid approved-private fixture lesson.");
  }
  return { assignment, lesson };
}

function attemptContext(state: DevelopmentFixtureState, attemptId: string, requireActive = false) {
  const attempt = state.catalog.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt) throw new FixtureCommandError("attempt_not_found", 404, "The synthetic lesson attempt is not available.");
  if (requireActive && attempt.status !== "in_progress") throw new FixtureCommandError("attempt_not_active", 409, "Resume the synthetic attempt before recording activity.");
  const { assignment, lesson } = lessonForAssignment(state, attempt.assignmentId);
  if (attempt.lessonArtifactId !== lesson.id) throw new FixtureCommandError("attempt_ownership_invalid", 409, "Attempt and assignment lesson ownership do not match.");
  if (attempt.mode === "learning" && assignment.status !== "published" && attempt.status !== "completed") throw new FixtureCommandError("assignment_not_published", 409, "The synthetic learning assignment is no longer current.");
  return { attempt, assignment, lesson };
}

function initializeBlocks(lesson: FixtureLesson): FixtureBlockState[] {
  return lesson.content.blocks.map((block, ordinal) => ({
    blockId: block.id, ordinal, status: "not_started", responseCount: 0, incorrectCount: 0, replayCount: 0,
    supportLevel: "independent", stateVersion: 1,
  }));
}

function currentContext(attempt: FixtureAttempt, lesson: FixtureLesson, blockId?: string) {
  const effectiveId = blockId ?? attempt.currentBlockId;
  if (!effectiveId) throw new FixtureCommandError("attempt_has_no_current_block", 409, "The attempt has no current block.");
  const index = lesson.content.blocks.findIndex((block) => block.id === effectiveId);
  if (index < 0) throw new FixtureCommandError("block_not_found", 404, "The activity is not part of this synthetic lesson.");
  if (attempt.currentBlockId !== effectiveId || attempt.currentBlockIndex !== index) throw new FixtureCommandError("block_out_of_order", 409, "The activity is not the server-held current block.");
  const blockState = attempt.blockStates.find((state) => state.blockId === effectiveId);
  if (!blockState) throw new FixtureCommandError("block_state_missing", 409, "The authoritative block state is missing.");
  return { block: lesson.content.blocks[index], blockState, index };
}

function scored(block: LessonBlock) { return !["model_audio", "movement_break", "controlled_story"].includes(block.type); }
function evidenceType(block: LessonBlock) {
  if (block.type === "listen_select" || block.type === "picture_action_select") return "selection";
  if (block.type === "phonemic_awareness") return "phonemic_awareness";
  if (block.type === "letter_work") return "letter_work";
  if (block.type === "exit_check") return block.evidenceType;
  return "recognition";
}

function selectionLabel(metadata?: Record<string, unknown>) {
  return typeof metadata?.selectedLabel === "string" && metadata.selectedLabel.trim() ? metadata.selectedLabel.trim() : null;
}

function deriveCorrectness(block: LessonBlock, label: string) {
  if (block.type === "listen_select") {
    if (!block.options.includes(label)) throw new FixtureCommandError("invalid_selection", 400, "The selected option is not part of this activity.");
    return label === block.options[block.correctIndex];
  }
  if (block.type === "picture_action_select") {
    if (!block.optionLabels.includes(label)) throw new FixtureCommandError("invalid_selection", 400, "The selected option is not part of this activity.");
    return label === block.optionLabels[block.correctIndex];
  }
  if (block.type === "letter_work") return label === block.grapheme;
  if (block.type === "phonemic_awareness" || block.type === "exit_check") return block.acceptableResponses.some((answer) => answer.toLocaleLowerCase("en-US") === label.toLocaleLowerCase("en-US"));
  throw new FixtureCommandError("activity_not_scored", 422, "This activity does not accept answer evidence.");
}

function safeLatency(value?: number | null) {
  return value === null || value === undefined || !Number.isFinite(value) ? null : Math.max(0, Math.min(120_000, Math.round(value)));
}

function markResponse(blockState: FixtureBlockState, correct: boolean | null, remediationThreshold: number) {
  const responseOrdinal = blockState.responseCount + 1;
  const supportLevel = blockState.supportLevel;
  blockState.responseCount = responseOrdinal;
  if (correct === false || correct === null) blockState.incorrectCount += 1;
  if (correct === true) blockState.status = "passed";
  else blockState.status = "remediating";
  if (blockState.incorrectCount >= remediationThreshold) blockState.supportLevel = "reduced_choices";
  else if (blockState.incorrectCount > 0 && blockState.supportLevel === "independent") blockState.supportLevel = "prompted";
  blockState.stateVersion += 1;
  return { responseOrdinal, supportLevel };
}

export async function startFixtureLesson(assignmentId: string, mode: AttemptMode): Promise<ChildAttemptRuntimePayload> {
  const state = await mutableChildState(); const parsedAssignmentId = uuidSchema.parse(assignmentId);
  const assignment = state.catalog.assignments.find((item) => item.id === parsedAssignmentId) ?? null;
  if (!assignment) throw new FixtureCommandError("assignment_not_available", 404, "The synthetic assignment is not available.");
  const validMode = mode === "learning" && assignment.status === "published"
    || mode === "replay" && assignment.status === "completed"
    || mode === "scheduled_retrieval" && assignment.status === "scheduled" && Boolean(assignment.scheduledFor && new Date(assignment.scheduledFor).getTime() <= Date.now());
  if (!validMode) throw new FixtureCommandError("assignment_mode_not_available", 409, "This attempt mode is not available for the synthetic assignment.");
  const { lesson } = lessonForAssignment(state, assignment.id);
  const activeOther = state.activeAttemptId ? state.catalog.attempts.find((attempt) => attempt.id === state.activeAttemptId) : null;
  if (activeOther && activeOther.assignmentId !== assignment.id && activeOther.status !== "completed") throw new FixtureCommandError("another_attempt_active", 409, "Pause or complete the active synthetic attempt first.");
  let attempt = state.catalog.attempts.find((candidate) => candidate.assignmentId === assignment.id && candidate.mode === mode && candidate.status !== "completed") ?? null;
  if (!attempt) {
    const number = 1 + Math.max(0, ...state.catalog.attempts.filter((candidate) => candidate.assignmentId === assignment.id && candidate.mode === mode).map((candidate) => candidate.attemptNumber));
    attempt = { id: randomUUID(), assignmentId: assignment.id, lessonArtifactId: lesson.id, mode, attemptNumber: number, status: "in_progress", stateVersion: 1, currentBlockId: lesson.content.blocks[0].id, currentBlockIndex: 0, viewMode: "activity", breakCount: 0, blockStates: initializeBlocks(lesson), playerState: { fixtureOnly: true }, startedAt: new Date().toISOString(), completedAt: null };
    state.catalog.attempts.push(attempt);
  } else {
    attempt.status = "in_progress"; attempt.viewMode = "activity"; attempt.stateVersion += 1;
  }
  state.activeAttemptId = attempt.id; const saved = await persist(state);
  return getFixtureChildLessonAttempt(saved, attempt.id);
}

export type SaveFixtureProgressInput = { blockIndex: number; status: "in_progress" | "paused"; breakCount: number; playerState?: Record<string, unknown>; expectedStateVersion?: number };

export async function saveFixtureLessonProgress(attemptId: string, input: SaveFixtureProgressInput): Promise<FixtureAttemptCommandResult> {
  const state = await mutableChildState(); const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId));
  if (attempt.status === "completed") throw new FixtureCommandError("attempt_completed", 409, "The synthetic attempt is already complete.");
  if (input.expectedStateVersion !== undefined && input.expectedStateVersion !== attempt.stateVersion) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic attempt changed in another request.");
  if (!Number.isInteger(input.blockIndex) || input.blockIndex < attempt.currentBlockIndex || input.blockIndex > attempt.currentBlockIndex + 1 || input.blockIndex >= lesson.content.blocks.length) throw new FixtureCommandError("invalid_block_order", 409, "Progress may advance by one immutable block only.");
  if (!Number.isInteger(input.breakCount) || input.breakCount < attempt.breakCount || input.breakCount > attempt.breakCount + 1) throw new FixtureCommandError("invalid_break_count", 400, "The break count is invalid.");
  const current = currentContext(attempt, lesson);
  if (input.blockIndex === attempt.currentBlockIndex + 1) {
    if (scored(current.block) && current.blockState.status !== "passed") throw new FixtureCommandError("successful_evidence_required", 409, "A successful server-derived response is required before advancing.");
    current.blockState.status = "completed"; current.blockState.stateVersion += 1;
    const nextState = attempt.blockStates.find((block) => block.ordinal === input.blockIndex)!;
    nextState.status = scored(lesson.content.blocks[input.blockIndex]) ? "awaiting_response" : "presented"; nextState.stateVersion += 1;
    attempt.currentBlockIndex = input.blockIndex; attempt.currentBlockId = nextState.blockId;
  }
  const breakStarted = input.breakCount === attempt.breakCount + 1;
  attempt.breakCount = input.breakCount; attempt.status = input.status; attempt.viewMode = breakStarted ? "break" : "activity";
  attempt.stateVersion += 1; attempt.playerState = { fixtureOnly: true, stateVersion: attempt.stateVersion, currentBlockId: attempt.currentBlockId, viewMode: attempt.viewMode };
  state.activeAttemptId = attempt.id; const saved = await persist(state);
  return attemptResult(saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, saved.updatedAt);
}

export type RecordFixtureActivityInput = {
  clientEventId: string; blockId: string; targetId?: string | null; evidenceType?: string; firstAttempt?: boolean;
  supportLevel?: string; correct?: boolean | null; responseLatencyMs?: number | null; retryCount?: number; metadata?: Record<string, unknown>;
  expectedStateVersion?: number;
};

export async function recordFixtureActivityEvidence(attemptId: string, input: RecordFixtureActivityInput): Promise<FixtureEvidence> {
  const state = await mutableChildState(); const id = uuidSchema.parse(input.clientEventId);
  const duplicate = state.catalog.evidence.find((evidence) => evidence.id === id); if (duplicate) return duplicate;
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  if (input.expectedStateVersion !== undefined && input.expectedStateVersion !== attempt.stateVersion) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic attempt changed in another request.");
  const { block, blockState } = currentContext(attempt, lesson, input.blockId); const label = selectionLabel(input.metadata);
  if (!label) throw new FixtureCommandError("selection_required", 400, "A selected option identifier is required.");
  const correct = deriveCorrectness(block, label); const derived = markResponse(blockState, correct, lesson.content.remediation.triggerAfterIncorrectAttempts);
  const authoritative: FixtureEvidence = {
    id, attemptId: attempt.id, blockId: block.id, responseOrdinal: derived.responseOrdinal, targetId: block.targetIds[0] ?? null,
    evidenceType: evidenceType(block), firstAttempt: derived.responseOrdinal === 1, supportLevel: derived.supportLevel, correct,
    responseLatencyMs: safeLatency(input.responseLatencyMs), retryCount: derived.responseOrdinal - 1, transcript: null, providerConfidence: null,
    metadata: { fixtureOnly: true, selectedLabel: label, browserScoringIgnored: true, rawAudioStored: false, recordedAt: new Date().toISOString() },
  };
  state.catalog.evidence.push(authoritative); attempt.viewMode = "feedback"; attempt.stateVersion += 1;
  attempt.playerState = { fixtureOnly: true, stateVersion: attempt.stateVersion, currentBlockId: attempt.currentBlockId, viewMode: attempt.viewMode };
  await persist(state); return authoritative;
}

export async function completeFixtureLesson(attemptId: string): Promise<FixtureAttemptCommandResult> {
  const state = await mutableChildState(); const { attempt, assignment, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  if (attempt.currentBlockIndex !== lesson.content.blocks.length - 1) throw new FixtureCommandError("lesson_not_at_exit", 409, "The synthetic attempt has not reached its final block.");
  if (attempt.blockStates.some((blockState) => {
    const block = lesson.content.blocks[blockState.ordinal]; return scored(block) && blockState.status !== "passed" && blockState.status !== "completed";
  })) throw new FixtureCommandError("required_blocks_incomplete", 409, "Every required scored block needs successful authoritative evidence.");
  const exitIds = new Set(lesson.content.blocks.filter((block) => block.type === "exit_check").map((block) => block.id));
  if (!state.catalog.evidence.some((evidence) => evidence.attemptId === attempt.id && exitIds.has(evidence.blockId) && evidence.correct === true)) throw new FixtureCommandError("successful_exit_evidence_required", 409, "A successful non-silence exit response is required.");
  const current = currentContext(attempt, lesson); current.blockState.status = "completed"; current.blockState.stateVersion += 1;
  const now = new Date().toISOString(); attempt.status = "completed"; attempt.completedAt = now; attempt.currentBlockId = null; attempt.currentBlockIndex = lesson.content.blocks.length; attempt.viewMode = "complete"; attempt.stateVersion += 1;
  if (attempt.mode === "learning") { assignment.status = "completed"; assignment.completedAt = now; assignment.publishedAt = null; assignment.lockVersion += 1; }
  state.activeAttemptId = null; lesson.fixtureState = "attempted"; const saved = await persist(state);
  return attemptResult(saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, saved.updatedAt);
}

export type FixtureProgressPayload = { clientEventId: string; expectedStateVersion: number; blockId: string; command: AttemptProgressCommand };
export type FixtureEvidencePayload = { clientEventId: string; expectedStateVersion: number; blockId: string; response: AttemptResponse; responseLatencyMs: number | null };
export type FixtureCompletePayload = { clientEventId: string; expectedStateVersion: number; blockId: string };

function optionPairs(block: LessonBlock) {
  const labels = block.type === "listen_select" ? block.options
    : block.type === "picture_action_select" ? block.optionLabels
      : block.type === "letter_work" ? Array.from(new Set([block.grapheme, "m", "s"])).slice(0, 3)
        : block.type === "phonemic_awareness" || block.type === "exit_check" ? block.acceptableResponses : [];
  return labels.map((label, index) => ({ key: `${block.id}-option-${index + 1}`, label }));
}

function reducedOptionKeys(block: LessonBlock) {
  const pairs = optionPairs(block);
  const correct = pairs.find((option) => deriveCorrectness(block, option.label));
  if (!correct) throw new FixtureCommandError("fixture_answer_missing", 422, "The synthetic activity has no server-derived correct option.");
  const distractor = pairs.find((option) => option.key !== correct.key && !deriveCorrectness(block, option.label));
  return distractor ? [correct.key, distractor.key] : [correct.key];
}

function playerState(input: { selectedOptionKey?: string | null; outcome?: AttemptOutcome | null; feedback?: Record<string, string> | null; fallbackAvailable?: boolean; canAdvance?: boolean; visibleOptionKeys?: string[] | null }) {
  return { fixtureOnly: true, selectedOptionKey: input.selectedOptionKey ?? null, outcome: input.outcome ?? null, feedback: input.feedback ?? null, fallbackAvailable: input.fallbackAvailable ?? false, canAdvance: input.canAdvance ?? false, visibleOptionKeys: input.visibleOptionKeys ?? null };
}

function mutation(state: DevelopmentFixtureState, attempt: FixtureAttempt, outcome?: AttemptOutcome) {
  return attemptMutationResponseSchema.parse({ snapshot: getFixtureAttemptSnapshot(attempt), ...(outcome ? { outcome } : {}) });
}

export async function applyFixtureProgressCommand(attemptId: string, payload: FixtureProgressPayload) {
  uuidSchema.parse(payload.clientEventId); const state = await mutableChildState(); const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId));
  if (attempt.playerState.lastClientEventId === payload.clientEventId) return mutation(state, attempt);
  if (payload.expectedStateVersion !== attempt.stateVersion) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic attempt changed in another request.");
  const { block, blockState, index } = currentContext(attempt, lesson, payload.blockId);
  let outcome: AttemptOutcome | undefined;
  if (payload.command === "pause") attempt.status = "paused";
  else if (payload.command === "resume") attempt.status = "in_progress";
  else if (payload.command === "start_break") { attempt.status = "paused"; attempt.viewMode = "break"; attempt.breakCount += 1; }
  else if (payload.command === "end_break") { attempt.status = "in_progress"; attempt.viewMode = "activity"; }
  else if (payload.command === "record_listen") {
    if (blockState.status === "not_started") blockState.status = scored(block) ? "awaiting_response" : "presented";
    else { blockState.replayCount += 1; if (blockState.supportLevel === "independent") blockState.supportLevel = "replay"; }
    blockState.stateVersion += 1; outcome = "acknowledged";
    attempt.playerState = playerState({ outcome, canAdvance: !scored(block) });
  } else if (payload.command === "request_hint") {
    blockState.supportLevel = blockState.incorrectCount > 0 ? "reduced_choices" : "prompted"; blockState.stateVersion += 1;
    attempt.playerState = playerState({ visibleOptionKeys: reducedOptionKeys(block), fallbackAvailable: true });
  } else if (payload.command === "acknowledge") {
    if (scored(block)) throw new FixtureCommandError("response_required", 409, "A scored activity requires a response.");
    blockState.status = "passed"; blockState.stateVersion += 1; outcome = "acknowledged";
    attempt.playerState = playerState({ outcome, canAdvance: true, feedback: { tone: "success", title: "Ready.", message: "You can move to the next step." } });
    attempt.viewMode = "feedback";
  } else if (payload.command === "retry") {
    attempt.viewMode = "activity"; attempt.playerState = playerState({ fallbackAvailable: blockState.incorrectCount > 0 });
  } else if (payload.command === "advance") {
    if (scored(block) && blockState.status !== "passed") throw new FixtureCommandError("successful_evidence_required", 409, "A successful authoritative response is required before advancing.");
    blockState.status = "completed"; blockState.stateVersion += 1;
    if (index >= lesson.content.blocks.length - 1) throw new FixtureCommandError("complete_command_required", 409, "Use the complete command at the final block.");
    const next = attempt.blockStates.find((candidate) => candidate.ordinal === index + 1)!;
    next.status = scored(lesson.content.blocks[index + 1]) ? "awaiting_response" : "presented"; next.stateVersion += 1;
    attempt.currentBlockIndex = index + 1; attempt.currentBlockId = next.blockId; attempt.viewMode = "activity"; attempt.playerState = playerState({});
  }
  attempt.playerState = { ...attempt.playerState, lastClientEventId: payload.clientEventId };
  attempt.stateVersion += 1; const saved = await persist(state); const savedAttempt = saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!;
  return mutation(saved, savedAttempt, outcome);
}

export async function applyFixtureEvidenceCommand(attemptId: string, payload: FixtureEvidencePayload) {
  const id = uuidSchema.parse(payload.clientEventId); const state = await mutableChildState();
  const duplicate = state.catalog.evidence.find((evidence) => evidence.id === id);
  const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  if (duplicate) return mutation(state, attempt, duplicate.correct === true ? "correct" : duplicate.correct === false ? "incorrect" : "silence");
  if (payload.expectedStateVersion !== attempt.stateVersion) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic attempt changed in another request.");
  const { block, blockState } = currentContext(attempt, lesson, payload.blockId);
  let correct: boolean; let selectedOptionKey: string | null = null;
  if (payload.response.type === "acknowledgement") {
    if (scored(block)) throw new FixtureCommandError("choice_required", 400, "This scored activity requires a choice.");
    correct = true;
  } else {
    const optionKey = payload.response.optionKey;
    const pair = optionPairs(block).find((option) => option.key === optionKey);
    if (!pair) throw new FixtureCommandError("invalid_option", 400, "The option key is not part of the current synthetic block.");
    selectedOptionKey = pair.key; correct = deriveCorrectness(block, pair.label);
  }
  const derived = markResponse(blockState, correct, lesson.content.remediation.triggerAfterIncorrectAttempts); const outcome: AttemptOutcome = correct ? "correct" : "incorrect";
  const evidence: FixtureEvidence = { id, attemptId: attempt.id, blockId: block.id, responseOrdinal: derived.responseOrdinal, targetId: block.targetIds[0] ?? null, evidenceType: evidenceType(block), firstAttempt: derived.responseOrdinal === 1, supportLevel: derived.supportLevel, correct, responseLatencyMs: safeLatency(payload.responseLatencyMs), retryCount: derived.responseOrdinal - 1, transcript: null, providerConfidence: null, metadata: { fixtureOnly: true, selectedOptionKey, browserScoringIgnored: true, rawAudioStored: false, recordedAt: new Date().toISOString() } };
  state.catalog.evidence.push(evidence); attempt.viewMode = "feedback";
  const visibleOptionKeys = blockState.supportLevel === "reduced_choices" ? reducedOptionKeys(block) : null;
  attempt.playerState = playerState({ selectedOptionKey, outcome, visibleOptionKeys, fallbackAvailable: !correct, canAdvance: correct, feedback: correct ? { tone: "success", title: "Yes—that's it.", message: "You can move to the next step." } : { tone: "retry", title: "Almost. Let's make it simpler.", message: lesson.content.remediation.scaffoldInstruction } });
  attempt.stateVersion += 1; const saved = await persist(state); return mutation(saved, saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, outcome);
}

export async function applyFixtureCompleteCommand(attemptId: string, payload: FixtureCompletePayload) {
  uuidSchema.parse(payload.clientEventId); const state = await mutableChildState(); const parsedAttemptId = uuidSchema.parse(attemptId);
  const prior = state.catalog.attempts.find((candidate) => candidate.id === parsedAttemptId);
  if (prior?.status === "completed" && prior.playerState.lastClientEventId === payload.clientEventId) return mutation(state, prior, "completed");
  const { attempt } = attemptContext(state, parsedAttemptId, true);
  if (payload.expectedStateVersion !== attempt.stateVersion || payload.blockId !== attempt.currentBlockId) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic completion request is stale.");
  await completeFixtureLesson(attemptId); const source = await requireDevelopmentFixtureSource("child"); const next = developmentFixtureStateSchema.parse(structuredClone(source.state));
  const completed = next.catalog.attempts.find((candidate) => candidate.id === attemptId)!; completed.playerState = { ...completed.playerState, lastClientEventId: payload.clientEventId };
  const saved = await persist(next); return mutation(saved, saved.catalog.attempts.find((candidate) => candidate.id === attemptId)!, "completed");
}

export type FixtureLessonCommand =
  | { type: "progress"; attemptId: string; payload: FixtureProgressPayload }
  | { type: "evidence"; attemptId: string; payload: FixtureEvidencePayload }
  | { type: "complete"; attemptId: string; payload: FixtureCompletePayload };

export async function applyFixtureLessonCommand(command: FixtureLessonCommand) {
  if (command.type === "progress") return applyFixtureProgressCommand(command.attemptId, command.payload);
  if (command.type === "evidence") return applyFixtureEvidenceCommand(command.attemptId, command.payload);
  return applyFixtureCompleteCommand(command.attemptId, command.payload);
}

function spokenText(block: LessonBlock) {
  if (block.type === "model_audio" || block.type === "letter_work") return block.modelText;
  if (["listen_select", "picture_action_select", "phonemic_awareness", "exit_check"].includes(block.type)) return "promptText" in block ? block.promptText : null;
  return null;
}

function fixtureToneWav() {
  const sampleRate = 8_000; const sampleCount = 1_200; const dataLength = sampleCount * 2; const bytes = new Uint8Array(44 + dataLength); const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => Array.from(value).forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + dataLength, true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, dataLength, true);
  for (let index = 0; index < sampleCount; index += 1) { const envelope = 1 - index / sampleCount; view.setInt16(44 + index * 2, Math.round(Math.sin(2 * Math.PI * 440 * index / sampleRate) * 0.12 * envelope * 32_767), true); }
  return bytes;
}

export type FixtureAudioOutcome = { ok: true; status: 200; bytes: Uint8Array; contentType: "audio/wav"; text: string; fixture: true; hostedPublication: false } | { ok: false; status: 503; error: "audio_unavailable"; message: string; fixture: true; hostedPublication: false };

export async function getFixtureAudioOutcome(attemptId: string, blockId: string): Promise<FixtureAudioOutcome> {
  const state = await mutableChildState(); const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true); const { block, blockState } = currentContext(attempt, lesson, blockId); const text = spokenText(block);
  if (!text) throw new FixtureCommandError("audio_not_available", 404, "This activity has no spoken model.");
  if (state.providers.tts === "unavailable") return { ok: false, status: 503, error: "audio_unavailable", message: "Synthetic TTS is unavailable. Attempt state is unchanged.", fixture: true, hostedPublication: false };
  return { ok: true, status: 200, bytes: fixtureToneWav(), contentType: "audio/wav", text, fixture: true, hostedPublication: false };
}

export type RecordFixtureSpeechInput = { clientEventId: string; responseLatencyMs?: number | null; firstAttempt?: boolean; supportLevel?: string; retryCount?: number; expectedStateVersion?: number };
export type FixtureSpeechOutcome = ReturnType<typeof attemptMutationResponseSchema.parse> | { error: "speech_unavailable"; message: string; fixture: true; hostedPublication: false };

export async function recordFixtureSpeechOutcome(attemptId: string, blockId: string, input: RecordFixtureSpeechInput): Promise<FixtureSpeechOutcome> {
  const state = await mutableChildState(); const id = uuidSchema.parse(input.clientEventId); const { attempt, lesson } = attemptContext(state, uuidSchema.parse(attemptId), true);
  const existing = state.catalog.evidence.find((evidence) => evidence.id === id);
  if (existing) { const silence = existing.metadata.outcome === "silence"; return mutation(state, attempt, silence ? "silence" : "matched"); }
  if (input.expectedStateVersion !== undefined && input.expectedStateVersion !== attempt.stateVersion) throw new FixtureCommandError("stale_attempt_state", 409, "The synthetic attempt changed in another request.");
  const { block, blockState } = currentContext(attempt, lesson, blockId); const speechBlock = block.type === "phonemic_awareness" && block.responseMode === "say" || block.type === "exit_check" ? block : null;
  if (!speechBlock) throw new FixtureCommandError("speech_not_available", 404, "This activity does not accept speech evidence.");
  if (state.providers.stt === "unavailable") {
    if (blockState.supportLevel === "independent") blockState.supportLevel = "prompted";
    blockState.stateVersion += 1;
    attempt.viewMode = "provider_recovery";
    attempt.playerState = playerState({ fallbackAvailable: true, outcome: "unavailable", feedback: { tone: "neutral", title: "Use the choices.", message: "Synthetic speech processing is unavailable." } });
    attempt.stateVersion += 1; const saved = await persist(state);
    return mutation(saved, saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, "unavailable");
  }
  const silence = state.providers.stt === "silence"; const transcript = silence ? null : speechBlock.acceptableResponses[0] ?? null;
  const derived = markResponse(blockState, silence ? null : true, lesson.content.remediation.triggerAfterIncorrectAttempts);
  const evidence: FixtureEvidence = { id, attemptId: attempt.id, blockId: block.id, responseOrdinal: derived.responseOrdinal, targetId: block.targetIds[0] ?? null, evidenceType: evidenceType(block), firstAttempt: derived.responseOrdinal === 1, supportLevel: derived.supportLevel, correct: silence ? null : true, responseLatencyMs: safeLatency(input.responseLatencyMs), retryCount: derived.responseOrdinal - 1, transcript, providerConfidence: silence ? null : 0.98, metadata: { fixtureOnly: true, outcome: silence ? "silence" : "matched", rawAudioStored: false, browserScoringIgnored: true, recordedAt: new Date().toISOString() } };
  state.catalog.evidence.push(evidence); const outcome: AttemptOutcome = silence ? "silence" : "matched";
  attempt.viewMode = silence ? "activity" : "feedback";
  attempt.playerState = playerState({ outcome, fallbackAvailable: silence, canAdvance: !silence, feedback: silence ? { tone: "neutral", title: "Take your time.", message: "I didn't hear words yet. Try once more or use the choices." } : { tone: "success", title: "I heard you.", message: "That works!" } });
  attempt.stateVersion += 1; const saved = await persist(state); return mutation(saved, saved.catalog.attempts.find((candidate) => candidate.id === attempt.id)!, outcome);
}
