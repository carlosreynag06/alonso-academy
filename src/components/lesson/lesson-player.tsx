"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookIcon, CheckIcon, ClockIcon, MicIcon, SoundIcon, SparkIcon } from "@/components/icons";
import type { DailyLessonDraft, LessonBlock } from "@/lib/generation/contracts";
import styles from "./lesson-player.module.css";

type Mode = "activity" | "feedback" | "break" | "complete" | "error";

function blockOptions(block: LessonBlock) {
  if (block.type === "listen_select") return block.options.map((label, index) => ({ label, correct: index === block.correctIndex }));
  if (block.type === "picture_action_select") return block.optionLabels.map((label, index) => ({ label, correct: index === block.correctIndex }));
  if (block.type === "letter_work") return Array.from(new Set([block.grapheme, "m", "s"])).slice(0, 3).map((label) => ({ label, correct: label === block.grapheme }));
  if (block.type === "phonemic_awareness") return block.acceptableResponses.map((label) => ({ label, correct: true }));
  if (block.type === "exit_check") return block.acceptableResponses.map((label) => ({ label, correct: true }));
  return [];
}

function evidenceType(block: LessonBlock) {
  if (block.type === "listen_select" || block.type === "picture_action_select") return "selection";
  if (block.type === "phonemic_awareness") return "phonemic_awareness";
  if (block.type === "letter_work") return "letter_work";
  if (block.type === "exit_check") return block.evidenceType;
  return "recognition";
}

export function LessonPlayer({ attemptId, lesson, initialIndex, initialBreakCount }: { attemptId: string; lesson: DailyLessonDraft; initialIndex: number; initialBreakCount: number }) {
  const router = useRouter();
  const [index, setIndex] = useState(Math.min(initialIndex, lesson.blocks.length - 1));
  const [breakCount, setBreakCount] = useState(initialBreakCount);
  const [mode, setMode] = useState<Mode>("activity");
  const [selected, setSelected] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [retries, setRetries] = useState(0);
  const [support, setSupport] = useState<"independent" | "replay" | "prompted" | "reduced_choices" | "modeled">("independent");
  const startedAt = useRef(Date.now());
  const block = lesson.blocks[index];
  const progress = Math.round(((index + (mode === "feedback" ? 1 : 0)) / lesson.blocks.length) * 100);
  const options = blockOptions(block);
  const reducedOptions = support === "reduced_choices" && options.length > 2
    ? [options.find((option) => option.correct)!, options.find((option) => !option.correct)!]
    : options;

  async function post(path: string, body?: unknown) {
    const response = await fetch(`/api/child/attempts/${attemptId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(path);
  }

  async function saveProgress(nextIndex: number, status: "in_progress" | "paused", nextBreakCount = breakCount) {
    await post("progress", { blockIndex: nextIndex, status, breakCount: nextBreakCount, playerState: { support, retries } });
  }

  async function finishLesson() {
    try { await post("complete"); setMode("complete"); } catch { setMode("error"); }
  }

  async function advance() {
    const next = index + 1;
    if (next >= lesson.blocks.length) { await finishLesson(); return; }
    try {
      await saveProgress(next, "in_progress");
      setIndex(next); setMode("activity"); setSelected(null); setWasCorrect(false); setRetries(0); setSupport("independent"); startedAt.current = Date.now();
    } catch { setMode("error"); }
  }

  async function choose(label: string, correct: boolean) {
    if (mode !== "activity") return;
    const nextRetries = correct ? retries : retries + 1;
    try {
      await post("evidence", {
        clientEventId: crypto.randomUUID(), blockId: block.id, targetId: block.targetIds[0] ?? null,
        evidenceType: evidenceType(block), firstAttempt: retries === 0, supportLevel: support,
        correct, responseLatencyMs: Date.now() - startedAt.current, retryCount: retries, metadata: { selectedLabel: label },
      });
      setSelected(label); setWasCorrect(correct);
      if (correct) setMode("feedback");
      else {
        setRetries(nextRetries);
        if (nextRetries >= lesson.remediation.triggerAfterIncorrectAttempts) setSupport("reduced_choices");
        setMode("feedback");
      }
    } catch { setMode("error"); }
  }

  async function tryAgain() { setMode("activity"); setSelected(null); startedAt.current = Date.now(); }
  async function pauseLesson() { try { await saveProgress(index, "paused"); router.push("/alonso"); router.refresh(); } catch { setMode("error"); } }
  async function takeBreak() { const next = breakCount + 1; try { await saveProgress(index, "paused", next); setBreakCount(next); setMode("break"); } catch { setMode("error"); } }
  async function endBreak() { try { await saveProgress(index, "in_progress"); setMode("activity"); startedAt.current = Date.now(); } catch { setMode("error"); } }

  if (mode === "complete") return <main className={styles.complete} id="main-content"><div className={styles.completeSky}><span><SparkIcon size={32} /></span><i /><i /><i /></div><p>You finished today’s lesson</p><h1>Beautiful work,<br />Alonso.</h1><p className={styles.completeCopy}>You listened, tried, and kept going one step at a time.</p><button onClick={() => { router.push("/alonso"); router.refresh(); }}>Back to my home <span>→</span></button></main>;
  if (mode === "error") return <main className={styles.errorState} id="main-content"><span><BookIcon size={28} /></span><h1>Let’s pause here.</h1><p>Your place is safe. Go home and open the lesson again.</p><button onClick={() => router.push("/alonso")}>Back to my home</button></main>;
  if (mode === "break") return <main className={styles.breakScreen} id="main-content"><div className={styles.breathe} aria-hidden="true"><span /></div><p>Little break</p><h1>Stretch up high.<br />Take one slow breath.</h1><button onClick={endBreak}>I’m ready <span>→</span></button></main>;

  return <main className={styles.player} id="main-content">
    <header className={styles.playerHeader}><button onClick={pauseLesson}>Pause</button><div className={styles.progress}><div><span style={{ width: `${progress}%` }} /></div><p>Step {index + 1} of {lesson.blocks.length}</p></div><button onClick={takeBreak}>Take a break</button></header>
    <section className={`${styles.stage} ${styles[`stage_${block.type}`]}`} aria-labelledby="activity-title">
      <div className={styles.stageDecoration} aria-hidden="true"><i /><i /><i /></div>
      <p className={styles.activityType}>{block.type.replaceAll("_", " ")}</p>
      <h1 id="activity-title">{block.instruction}</h1>

      {block.type === "model_audio" && <div className={styles.modelActivity}><button className={styles.soundButton} onClick={() => setSupport("modeled")} aria-label="Listen to the model"><SoundIcon size={35} /><span>Listen</span></button><strong>{block.modelText}</strong><p>Listen once. Replay if you want.</p></div>}
      {(block.type === "listen_select" || block.type === "picture_action_select") && <div className={styles.prompt}><span><SoundIcon size={23} /></span><p>{block.promptText}</p></div>}
      {block.type === "phonemic_awareness" && <div className={styles.prompt}><span><MicIcon size={23} /></span><p>{block.promptText}</p></div>}
      {block.type === "letter_work" && <div className={styles.letterModel}><span>{block.grapheme}</span><p>{block.modelText}</p></div>}
      {block.type === "movement_break" && <div className={styles.movement}><span aria-hidden="true">↟</span><p>{block.movement}</p></div>}
      {block.type === "exit_check" && <div className={styles.prompt}><span><CheckIcon size={23} /></span><p>{block.promptText}</p></div>}

      {reducedOptions.length > 0 && <div className={styles.choices}>{reducedOptions.map((option, choiceIndex) => <button className={selected === option.label ? option.correct ? styles.choiceCorrect : styles.choiceWrong : ""} disabled={mode === "feedback"} key={`${option.label}-${choiceIndex}`} onClick={() => choose(option.label, option.correct)}><span>{block.type === "letter_work" ? option.label : String.fromCharCode(65 + choiceIndex)}</span><strong>{block.type === "letter_work" ? "" : option.label}</strong></button>)}</div>}
      {support === "reduced_choices" && mode === "activity" && <p className={styles.hint}>{lesson.remediation.scaffoldInstruction}</p>}

      {mode === "feedback" && <div className={wasCorrect ? styles.goodFeedback : styles.tryFeedback} role="status"><span>{wasCorrect ? <CheckIcon size={24} /> : <SparkIcon size={24} />}</span><div><strong>{wasCorrect ? "Yes—that’s it." : "Almost. Let’s make it simpler."}</strong><p>{wasCorrect ? "You can move to the next step." : lesson.remediation.scaffoldInstruction}</p></div><button onClick={wasCorrect ? advance : tryAgain}>{wasCorrect ? "Next" : "Try again"}<span>→</span></button></div>}
      {mode === "activity" && block.type === "model_audio" && <div className={styles.bottomActions}><button onClick={() => setSupport("replay")}>Replay</button><button onClick={advance}>Next <span>→</span></button></div>}
      {mode === "activity" && block.type === "movement_break" && <div className={styles.bottomActions}><button onClick={advance}>I did it <span>→</span></button></div>}
    </section>
  </main>;
}
