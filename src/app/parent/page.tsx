import Link from "next/link";
import { getParentAccessState } from "@/lib/auth/parent";
import { signOutParent } from "./login/actions";
import styles from "./parent.module.css";

export default async function ParentPage() {
  const access = await getParentAccessState();

  if (access.status === "configuration_required") {
    return (
      <main className={styles.page}>
        <section className={styles.setupPanel} aria-labelledby="setup-title">
          <p className={styles.eyebrow}>Phase 2 · identity gate</p>
          <h1 id="setup-title">One detail remains private</h1>
          <p className={styles.lede}>The Supabase project is connected and the curriculum foundation is prepared. Parent sign-in remains locked until the one approved email is added locally and to the database allowlist.</p>
          <div className={styles.checklist}>
            <p><span aria-hidden="true">✓</span> Supabase project connection</p>
            <p><span aria-hidden="true">✓</span> Database and RLS migration</p>
            <p><span aria-hidden="true">✓</span> Six curriculum phase definitions</p>
            <p className={styles.pending}><span aria-hidden="true">○</span> Parent allowlist identity</p>
          </div>
          <Link className={styles.primaryLink} href="/parent/login">Open sign-in setup</Link>
          <Link className={styles.textLink} href="/">Return to academy home</Link>
        </section>
      </main>
    );
  }

  if (access.status !== "ready") {
    return (
      <main className={styles.page}>
        <section className={styles.authPanel} aria-labelledby="locked-title">
          <p className={styles.eyebrow}>Parent command center</p>
          <h1 id="locked-title">Parent access is locked</h1>
          <p className={styles.lede}>Use the approved parent email to receive a one-time sign-in link.</p>
          <Link className={styles.primaryLink} href="/parent/login">Sign in with email</Link>
          <Link className={styles.textLink} href="/">Return home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Parent command center</p>
          <h1>Welcome, {access.displayName}</h1>
        </div>
        <form action={signOutParent}><button className={styles.secondaryButton}>Sign out</button></form>
      </header>

      <section className={styles.heroCard}>
        <div>
          <p className={styles.cardLabel}>Current curriculum position</p>
          <h2>Phase A · Unit 1 draft</h2>
          <p>Hello, Listen, and Respond is waiting for your review. Nothing is available to Alonso until you approve it.</p>
        </div>
        <Link className={styles.primaryLink} href="/parent/curriculum">Review curriculum</Link>
      </section>

      <section className={styles.grid} aria-label="Phase 2 status">
        <article className={styles.infoCard}><p className={styles.cardLabel}>Approval rule</p><h2>Drafts stay private</h2><p>Curriculum targets require an explicit reasoned approval before later generation can use them.</p></article>
        <article className={styles.infoCard}><p className={styles.cardLabel}>Alonso mode</p><h2>Restricted by design</h2><p>Child sessions use short-lived opaque tokens and cannot query parent data directly.</p></article>
        <article className={styles.infoCard}><p className={styles.cardLabel}>Learning data</p><h2>No activity yet</h2><p>Evidence, mastery, and review tables are ready but remain empty until approved lessons exist.</p></article>
      </section>
    </main>
  );
}
