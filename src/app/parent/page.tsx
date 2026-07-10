import type { Metadata } from "next";
import { BookIcon, CheckIcon, ClockIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { AcademyMark } from "@/components/ui/academy-mark";
import { ActionLink } from "@/components/ui/action-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { signOutParent } from "./login/actions";
import styles from "./parent.module.css";

export const metadata: Metadata = { title: "Parent Command Center | Alonso Academy" };

export default async function ParentPage() {
  const access = await getParentAccessState();

  if (access.status === "configuration_required") {
    return (
      <main className={styles.gatePage} id="main-content">
        <section className={styles.gatePanel} aria-labelledby="setup-title">
          <div className={styles.gateBrand}><AcademyMark /><div><p>Alonso Academy</p><span>Private parent workspace</span></div></div>
          <StatusBadge status="waiting">One setup step remains</StatusBadge>
          <p className={styles.eyebrow}>Parent identity gate</p>
          <h1 id="setup-title">Secure by default,<br />ready when you are.</h1>
          <p className={styles.lede}>The data foundation is connected. Parent access stays locked until the single approved email is added locally and to the database allowlist.</p>
          <div className={styles.setupProgress} aria-label="Parent setup progress">
            <p><span className={styles.completeIcon}><CheckIcon size={17} /></span><span><strong>Supabase connected</strong><small>Private project and publishable client configured</small></span></p>
            <p><span className={styles.completeIcon}><CheckIcon size={17} /></span><span><strong>Database protected</strong><small>19 tables secured with row-level policies</small></span></p>
            <p><span className={styles.completeIcon}><CheckIcon size={17} /></span><span><strong>Curriculum drafted</strong><small>Six phases and one inactive pilot unit</small></span></p>
            <p className={styles.pendingStep}><span><ClockIcon size={17} /></span><span><strong>Parent identity</strong><small>Waiting for the approved email</small></span></p>
          </div>
          <div className={styles.gateActions}><ActionLink href="/parent/login">Open sign-in setup</ActionLink><ActionLink href="/" tone="quiet">Return home</ActionLink></div>
        </section>
        <aside className={styles.gateAside} aria-label="Privacy principles">
          <div className={styles.gateSymbol}><ShieldIcon size={42} /></div>
          <blockquote>“Nothing reaches Alonso until the curriculum allows it and a parent approves it.”</blockquote>
          <p>Curriculum before AI. Review before novelty. Mastery before progression.</p>
        </aside>
      </main>
    );
  }

  if (access.status !== "ready") {
    return (
      <main className={styles.page} id="main-content">
        <section className={styles.authPanel} aria-labelledby="locked-title">
          <span className={styles.lockIcon}><LockIcon size={26} /></span>
          <p className={styles.eyebrow}>Parent command center</p>
          <h1 id="locked-title">Parent access is locked</h1>
          <p className={styles.lede}>Use the approved parent email to receive a one-time sign-in link.</p>
          <ActionLink href="/parent/login">Sign in with email</ActionLink>
          <ActionLink href="/" tone="quiet">Return home</ActionLink>
        </section>
      </main>
    );
  }

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Parent command center</p><h1>Good to see you, {access.displayName}.</h1><p className={styles.headerCopy}>Review the learning boundary before creating anything new.</p></div>
          <form action={signOutParent}><button className={styles.secondaryButton}>Sign out</button></form>
        </header>

        <section className={styles.heroCard}>
          <div><StatusBadge status="waiting">Parent review required</StatusBadge><p className={styles.cardLabel}>Current curriculum position</p><h2>Phase A / Unit 1 draft</h2><p>Hello, Listen, and Respond is waiting for your review. Nothing is available to Alonso until you approve it.</p></div>
          <ActionLink href="/parent/curriculum" tone="light">Review curriculum</ActionLink>
        </section>

        <section className={styles.grid} aria-label="Foundation status">
          <article className={styles.infoCard}><span className={styles.cardIcon}><LockIcon size={22} /></span><p className={styles.cardLabel}>Approval rule</p><h2>Drafts stay private</h2><p>Curriculum targets require an explicit reasoned approval before later generation can use them.</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><ShieldIcon size={22} /></span><p className={styles.cardLabel}>Alonso mode</p><h2>Restricted by design</h2><p>Child sessions use short-lived opaque tokens and cannot query parent data directly.</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><BookIcon size={22} /></span><p className={styles.cardLabel}>Learning data</p><h2>No activity yet</h2><p>Evidence, mastery, and review remain empty until approved lessons exist.</p></article>
        </section>
      </main>
    </ParentShell>
  );
}
