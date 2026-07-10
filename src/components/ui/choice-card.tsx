import { CheckIcon } from "@/components/icons";
import styles from "./ui.module.css";

export function ChoiceCard({ label, supportingText, state = "idle", disabled = false }: { label: string; supportingText?: string; state?: "idle" | "selected" | "correct" | "incorrect"; disabled?: boolean }) {
  const stateLabel = state === "correct" ? "Correct" : state === "incorrect" ? "Try another" : state === "selected" ? "Selected" : null;
  return <button className={`${styles.choiceCard} ${styles[`choice_${state}`]}`} type="button" disabled={disabled} aria-pressed={state === "selected"}><span className={styles.choiceMarker}>{state === "correct" ? <CheckIcon size={18} /> : null}</span><span><strong>{label}</strong>{supportingText && <small>{supportingText}</small>}</span>{stateLabel && <em>{stateLabel}</em>}</button>;
}
