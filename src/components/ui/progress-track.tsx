import styles from "./ui.module.css";

export function ProgressTrack({ current, total, label }: { current: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return <div className={styles.progressGroup}><div className={styles.progressCopy}><span>{label}</span><span>{current} of {total}</span></div><div className={styles.progressTrack} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}><span style={{ width: `${percent}%` }} /></div></div>;
}
