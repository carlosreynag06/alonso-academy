import { MicIcon, SoundIcon } from "@/components/icons";
import styles from "./ui.module.css";

export function AudioControl({ state = "ready", label = "Listen" }: { state?: "ready" | "playing" | "unavailable"; label?: string }) {
  const text = state === "playing" ? "Playing" : state === "unavailable" ? "Audio unavailable" : label;
  return <button className={styles.learningControl} type="button" disabled={state !== "ready"} aria-label={text}><span className={styles.controlIcon}><SoundIcon size={22} /></span><span><strong>{text}</strong><small>{state === "unavailable" ? "Try again later" : "Clear American English"}</small></span>{state === "playing" && <span className={styles.equalizer} aria-hidden="true"><i /><i /><i /></span>}</button>;
}

export function MicrophoneControl({ state = "idle" }: { state?: "idle" | "recording" | "denied" | "unavailable" }) {
  const copy = {
    idle: ["Speak", "Tap when you are ready"],
    recording: ["Listening", "Speak clearly"],
    denied: ["Microphone blocked", "Ask a parent for help"],
    unavailable: ["Speaking comes later", "Ready in the voice phase"],
  } as const;
  return <button className={`${styles.learningControl} ${state === "recording" ? styles.recording : ""}`} type="button" disabled={state !== "idle"} aria-label={copy[state][0]}><span className={styles.controlIcon}><MicIcon size={22} /></span><span><strong>{copy[state][0]}</strong><small>{copy[state][1]}</small></span></button>;
}
