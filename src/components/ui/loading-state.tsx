import { AcademyMark } from "./academy-mark";
import styles from "./ui.module.css";

export function LoadingState({ label = "Preparing your view" }: { label?: string }) {
  return <main className={styles.loadingPage} id="main-content" aria-busy="true" aria-live="polite"><div className={styles.loadingCard}><AcademyMark /><p>{label}</p><div className={styles.loadingLine}><span /><span /><span /></div></div></main>;
}
