import Link from "next/link";
import styles from "../status.module.css";

export default function AlonsoSetupPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="alonso-title">
        <p className={styles.label}>Alonso area · setup status</p>
        <h1 id="alonso-title">My lessons</h1>
        <p>
          Alonso will see only parent-approved lessons here. A restricted child
          session foundation now protects this area, but the lesson player begins
          in Phase 6, so there is nothing to start yet.
        </p>
        <Link href="/">Return to academy home</Link>
      </section>
    </main>
  );
}
