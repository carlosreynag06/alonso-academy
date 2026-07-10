import Link from "next/link";
import styles from "../status.module.css";

export default function ParentSetupPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="parent-title">
        <p className={styles.label}>Parent area · setup status</p>
        <h1 id="parent-title">Command center</h1>
        <p>
          Parent authentication and curriculum review begin in Phase 2. This
          route is intentionally inactive, and no private learning data exists yet.
        </p>
        <Link href="/">Return to academy home</Link>
      </section>
    </main>
  );
}
