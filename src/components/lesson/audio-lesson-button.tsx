"use client";

import { useRef, useState } from "react";
import { SoundIcon } from "@/components/icons";
import styles from "./lesson-player.module.css";

export function AudioLessonButton({ attemptId, blockId, large = false, onReplay }: { attemptId: string; blockId: string; large?: boolean; onReplay?: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"ready" | "loading" | "playing" | "unavailable">("ready");

  async function play() {
    setState("loading");
    onReplay?.();
    const element = audio.current ?? new Audio(`/api/child/attempts/${attemptId}/audio/${encodeURIComponent(blockId)}`);
    audio.current = element;
    element.onended = () => setState("ready");
    element.onerror = () => setState("unavailable");
    try { await element.play(); setState("playing"); } catch { setState("unavailable"); }
  }

  return <button className={large ? styles.soundButton : styles.inlineAudio} onClick={play} type="button" aria-label={state === "playing" ? "Audio is playing" : "Play the lesson audio"} disabled={state === "loading"}>
    <SoundIcon size={large ? 35 : 23} /><span>{state === "loading" ? "Loading…" : state === "playing" ? "Listening…" : state === "unavailable" ? "Read with me" : large ? "Listen" : "Hear it"}</span>
  </button>;
}
