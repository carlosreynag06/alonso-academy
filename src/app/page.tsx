import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="academy-title">
        <div className={styles.brand} aria-hidden="true">AA</div>
        <p className={styles.eyebrow}>Private learning space</p>
        <h1 id="academy-title">Alonso Academy</h1>
        <p className={styles.lede}>
          A calm, curriculum-controlled place for Alonso to learn American
          English with a parent guiding every step.
        </p>

        <div className={styles.status} role="status">
          <span className={styles.statusDot} aria-hidden="true" />
          Phase 2 in progress - curriculum and parent access foundation
        </div>

        <div className={styles.destinations} aria-label="Academy destinations">
          <section className={styles.destination} aria-labelledby="alonso-title">
            <p className={styles.cardLabel}>For Alonso</p>
            <h2 id="alonso-title">My lessons</h2>
            <p>Approved lessons will appear here after the child experience is built.</p>
            <Link href="/alonso">View setup status</Link>
          </section>

          <section className={styles.destination} aria-labelledby="parent-title">
            <p className={styles.cardLabel}>For parent</p>
            <h2 id="parent-title">Command center</h2>
            <p>Curriculum, generation, approvals, and progress will live here.</p>
            <Link href="/parent">Open parent area</Link>
          </section>
        </div>
      </main>
    </main>
  );
}
