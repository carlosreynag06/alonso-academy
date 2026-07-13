"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { FixtureBanner } from "@/components/development/fixture-banner";
import {
  attemptMutationResponseSchema,
  type AttemptProgressCommand,
  type AttemptResponse,
  type AuthoritativeAttemptSnapshot,
  type ChildLessonOption,
  type ChildSafeLesson,
  type ChildSafeLessonBlock,
} from "@/lib/lesson/runtime-contracts";
import { AudioLessonButton } from "./audio-lesson-button";
import { SpeechControl } from "./speech-control";
import styles from "./lesson-player.module.css";

function blockOptions(block: ChildSafeLessonBlock): ChildLessonOption[] {
  if (block.type === "listen_select" || block.type === "picture_action_select" || block.type === "letter_work") return block.options;
  if (block.type === "phonemic_awareness" || block.type === "exit_check") return block.responseOptions;
  return [];
}

function successfulOutcome(outcome: AuthoritativeAttemptSnapshot["outcome"]) {
  return outcome === "correct" || outcome === "matched" || outcome === "acknowledged" || outcome === "completed";
}

export function LessonPlayer({
  attemptId,
  lesson,
  initialSnapshot,
  fixture = false,
}: {
  attemptId: string;
  lesson: ChildSafeLesson;
  initialSnapshot: AuthoritativeAttemptSnapshot;
  fixture?: boolean;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [transportError, setTransportError] = useState(false);
  const [speechFallbackVisible, setSpeechFallbackVisible] = useState(initialSnapshot.fallbackAvailable);
  const startedAt = useRef(Date.now());
  const fixtureBanner = fixture ? <FixtureBanner /> : null;
  const block = lesson.blocks.find((candidate) => candidate.id === snapshot.currentBlockId)
    ?? lesson.blocks[snapshot.currentBlockIndex]
    ?? null;
  const progress = Math.round((snapshot.progress.completed / Math.max(snapshot.progress.total, 1)) * 100);
  const allOptions = block ? blockOptions(block) : [];
  const visibleOptions = snapshot.visibleOptionKeys
    ? allOptions.filter((option) => snapshot.visibleOptionKeys?.includes(option.key))
    : allOptions;
  const speechEnabled = block?.type === "exit_check" || (block?.type === "phonemic_awareness" && block.responseMode === "say");
  const showSpeechFallback = speechFallbackVisible || snapshot.fallbackAvailable || snapshot.retryCount > 0;

  useEffect(() => {
    startedAt.current = Date.now();
    setSpeechFallbackVisible(snapshot.fallbackAvailable);
  }, [snapshot.currentBlockId, snapshot.fallbackAvailable]);

  async function postMutation(path: "progress" | "evidence" | "complete", body: unknown) {
    const response = await fetch(`/api/child/attempts/${attemptId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await response.json().catch(() => null);
    const parsed = attemptMutationResponseSchema.safeParse(payload);
    if (!response.ok || !parsed.success) throw new Error(path);
    setSnapshot(parsed.data.snapshot);
    setTransportError(false);
    return parsed.data;
  }

  async function sendProgress(command: AttemptProgressCommand) {
    if (!block) return null;
    return postMutation("progress", {
      clientEventId: crypto.randomUUID(),
      expectedStateVersion: snapshot.stateVersion,
      blockId: block.id,
      command,
    });
  }

  async function submitResponse(response: AttemptResponse) {
    if (!block) return;
    try {
      await postMutation("evidence", {
        clientEventId: crypto.randomUUID(),
        expectedStateVersion: snapshot.stateVersion,
        blockId: block.id,
        response,
        responseLatencyMs: Date.now() - startedAt.current,
      });
    } catch {
      setTransportError(true);
    }
  }

  async function finishLesson() {
    if (!block) return;
    try {
      await postMutation("complete", {
        clientEventId: crypto.randomUUID(),
        expectedStateVersion: snapshot.stateVersion,
        blockId: block.id,
      });
    } catch {
      setTransportError(true);
    }
  }

  async function advance() {
    if (!block) return;
    if (snapshot.currentBlockIndex >= lesson.blocks.length - 1) {
      await finishLesson();
      return;
    }
    try {
      await sendProgress("advance");
    } catch {
      setTransportError(true);
    }
  }

  async function retry() {
    try {
      await sendProgress("retry");
    } catch {
      setTransportError(true);
    }
  }

  async function pauseLesson() {
    try {
      await sendProgress("pause");
      router.push("/alonso");
      router.refresh();
    } catch {
      setTransportError(true);
    }
  }

  async function takeBreak() {
    try {
      await sendProgress("start_break");
    } catch {
      setTransportError(true);
    }
  }

  async function endBreak() {
    try {
      await sendProgress("end_break");
    } catch {
      setTransportError(true);
    }
  }

  async function recordPlayback() {
    try {
      await sendProgress("record_listen");
    } catch {
      setTransportError(true);
    }
  }

  async function revealSpeechFallback() {
    setSpeechFallbackVisible(true);
    try {
      await sendProgress("request_hint");
    } catch {
      // The local choice fallback still prevents a dead end. A later response
      // remains subject to the server's current authoritative state.
    }
  }

  if (snapshot.status === "completed" || snapshot.viewMode === "complete") return <>{fixtureBanner}<main className={styles.complete} id="main-content"><div className={styles.completeSky}><span><SparkIcon size={32} /></span><i /><i /><i /></div><p>You finished today’s lesson</p><h1>Beautiful work,<br />Alonso.</h1><p className={styles.completeCopy}>You listened, tried, and kept going one step at a time.</p><button onClick={() => { router.push("/alonso"); router.refresh(); }}>Back to my home <span>→</span></button></main></>;
  if (transportError || snapshot.status === "abandoned" || !block) return <>{fixtureBanner}<main className={styles.errorState} id="main-content"><span><BookIcon size={28} /></span><h1>Let’s pause here.</h1><p>Your place is safe. Go home and open the lesson again.</p><button onClick={() => router.push("/alonso")}>Back to my home</button></main></>;
  if (snapshot.viewMode === "break") return <>{fixtureBanner}<main className={styles.breakScreen} id="main-content"><div className={styles.breathe} aria-hidden="true"><span /></div><p>Little break</p><h1>Stretch up high.<br />Take one slow breath.</h1><button onClick={endBreak}>I’m ready <span>→</span></button></main></>;

  const selectedSucceeded = successfulOutcome(snapshot.outcome);
  const feedback = snapshot.feedback ?? (selectedSucceeded
    ? { tone: "success" as const, title: "Yes—that’s it.", message: "You can move to the next step." }
    : { tone: "retry" as const, title: "Almost. Let’s make it simpler.", message: lesson.remediation.scaffoldInstruction });

  return <>{fixtureBanner}<main className={styles.player} id="main-content">
    <header className={styles.playerHeader}><button onClick={pauseLesson}>Pause</button><div className={styles.progress}><div><span style={{ width: `${progress}%` }} /></div><p>Step {snapshot.currentBlockIndex + 1} of {snapshot.progress.total}</p></div><button onClick={takeBreak}>Take a break</button></header>
    <section className={`${styles.stage} ${styles[`stage_${block.type}`]}`} aria-labelledby="activity-title">
      <div className={styles.stageDecoration} aria-hidden="true"><i /><i /><i /></div>
      <p className={styles.activityType}>{block.type.replaceAll("_", " ")}</p>
      <h1 id="activity-title">{block.instruction}</h1>

      {block.type === "model_audio" && <div className={styles.modelActivity}><AudioLessonButton attemptId={attemptId} blockId={block.id} large onPlayback={recordPlayback} /><strong>{block.modelText}</strong><p>Listen once. Replay if you want.</p></div>}
      {(block.type === "listen_select" || block.type === "picture_action_select") && <div className={styles.prompt}><AudioLessonButton attemptId={attemptId} blockId={block.id} onPlayback={recordPlayback} /><p>{block.promptText}</p></div>}
      {block.type === "phonemic_awareness" && <div className={styles.prompt}><AudioLessonButton attemptId={attemptId} blockId={block.id} onPlayback={recordPlayback} /><p>{block.promptText}</p></div>}
      {block.type === "letter_work" && <div className={styles.letterModel}><span>{block.grapheme}</span><p>{block.modelText}</p></div>}
      {block.type === "movement_break" && <div className={styles.movement}><span aria-hidden="true">↟</span><p>{block.movement}</p></div>}
      {block.type === "exit_check" && <div className={styles.prompt}><AudioLessonButton attemptId={attemptId} blockId={block.id} onPlayback={recordPlayback} /><p>{block.promptText}</p></div>}

      {speechEnabled && snapshot.viewMode !== "feedback" && <SpeechControl attemptId={attemptId} blockId={block.id} expectedStateVersion={snapshot.stateVersion} onSnapshot={(next) => { setSnapshot(next); setTransportError(false); }} onUnavailable={() => { void revealSpeechFallback(); }} />}

      {visibleOptions.length > 0 && (!speechEnabled || showSpeechFallback) && <><p className={styles.choiceAlternative}>{speechEnabled ? "Or choose what you wanted to say" : "Choose your answer"}</p><div className={styles.choices}>{visibleOptions.map((option, choiceIndex) => {
        const selected = snapshot.selectedOptionKey === option.key;
        const selectedClass = selected ? selectedSucceeded ? styles.choiceCorrect : snapshot.outcome ? styles.choiceWrong : "" : "";
        return <button className={selectedClass} disabled={snapshot.viewMode === "feedback"} key={option.key} onClick={() => submitResponse({ type: "choice", optionKey: option.key })}><span>{block.type === "letter_work" ? option.label : String.fromCharCode(65 + choiceIndex)}</span><strong>{block.type === "letter_work" ? "" : option.label}</strong></button>;
      })}</div></>}
      {snapshot.supportLevel === "reduced_choices" && snapshot.viewMode !== "feedback" && <p className={styles.hint}>{lesson.remediation.scaffoldInstruction}</p>}

      {snapshot.viewMode === "feedback" && <div className={feedback.tone === "success" ? styles.goodFeedback : styles.tryFeedback} role="status"><span>{feedback.tone === "success" ? <CheckIcon size={24} /> : <SparkIcon size={24} />}</span><div><strong>{feedback.title}</strong><p>{feedback.message}</p></div><button onClick={snapshot.canAdvance ? advance : retry}>{snapshot.canAdvance ? snapshot.currentBlockIndex >= lesson.blocks.length - 1 ? "Finish" : "Next" : "Try again"}<span>→</span></button></div>}
      {snapshot.viewMode !== "feedback" && block.type === "model_audio" && <div className={styles.bottomActions}><button onClick={advance}>Next <span>→</span></button></div>}
      {snapshot.viewMode !== "feedback" && block.type === "movement_break" && <div className={styles.bottomActions}><button onClick={advance}>I did it <span>→</span></button></div>}
    </section>
  </main></>;
}
