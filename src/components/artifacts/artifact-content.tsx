import type { Json } from "@/types/database";
import styles from "@/app/parent/parent.module.css";

type RecordValue = Record<string, Json | undefined>;

function record(value: Json): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function text(value: Json | undefined, fallback = "Not provided") {
  return typeof value === "string" ? value : fallback;
}

function strings(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export function ArtifactContent({ kind, content }: { kind: string; content: Json }) {
  const data = record(content);
  if (!data) return <p className={styles.lede}>This version does not contain a reviewable structured object.</p>;

  if (kind === "weekly_plan") {
    const days = Array.isArray(data.days) ? data.days.map(record).filter((day): day is RecordValue => Boolean(day)) : [];
    return <div className={styles.artifactBody}><section className={styles.reviewLead}><p className={styles.cardLabel}>Week objective</p><h2>{text(data.title)}</h2><p>{text(data.weekObjective)}</p></section><div className={styles.dayStack}>{days.map((day) => <article className={styles.dayRow} key={String(day.day)}><span className={styles.dayNumber}>Day {String(day.day)}</span><div><h3>{text(day.title)}</h3><p>{text(day.objective)}</p><small>{String(day.durationMinutes)} minutes · {text(day.lessonKind).replaceAll("_", " ")}</small><details><summary>Why this day?</summary><p>{text(day.parentRationale)}</p></details></div></article>)}</div>{strings(data.parentNotes).length > 0 && <section className={styles.parentNotes}><h3>Notes for the parent</h3><ul>{strings(data.parentNotes).map((note) => <li key={note}>{note}</li>)}</ul></section>}</div>;
  }

  if (kind === "story_lesson") {
    return <div className={styles.artifactBody}><section className={styles.reviewLead}><p className={styles.cardLabel}>Controlled listening story</p><h2>{text(data.title)}</h2></section><ol className={styles.storyLines}>{strings(data.lines).map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ol><section className={styles.parentNotes}><h3>Retell prompts</h3><ul>{strings(data.retellPrompts).map((prompt) => <li key={prompt}>{prompt}</li>)}</ul><p>{text(data.parentRationale)}</p></section></div>;
  }

  const blocks = Array.isArray(data.blocks) ? data.blocks.map(record).filter((block): block is RecordValue => Boolean(block)) : [];
  return <div className={styles.artifactBody}><section className={styles.reviewLead}><p className={styles.cardLabel}>Day {String(data.day)} · {String(data.durationMinutes)} minutes</p><h2>{text(data.title)}</h2><p>{text(data.objective)}</p></section><div className={styles.blockStack}>{blocks.map((block, index) => <article className={styles.blockRow} key={text(block.id, String(index))}><span>{index + 1}</span><div><p className={styles.blockType}>{text(block.type).replaceAll("_", " ")}</p><h3>{text(block.instruction)}</h3><small>{String(block.estimatedSeconds)} seconds</small></div></article>)}</div><section className={styles.parentNotes}><h3>Instructional rationale</h3><p>{text(data.parentRationale)}</p></section></div>;
}
