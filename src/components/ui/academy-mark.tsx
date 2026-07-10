import styles from "./ui.module.css";

export function AcademyMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? styles.markCompact : styles.mark} aria-hidden="true">
      <span>A</span>
      <i />
      <span>A</span>
    </span>
  );
}
