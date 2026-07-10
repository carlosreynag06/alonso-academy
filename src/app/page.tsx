import type { Metadata } from "next";
import { BookIcon, LockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { AcademyMark } from "@/components/ui/academy-mark";
import { ActionLink } from "@/components/ui/action-link";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Welcome | Alonso Academy" };

export default function Home() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.topbar}>
        <div className={styles.wordmark}><AcademyMark compact /><span>Alonso Academy</span></div>
        <StatusBadge status="ready">Visual system ready</StatusBadge>
      </header>

      <section className={styles.hero} aria-labelledby="academy-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>A private English academy for one learner</p>
          <h1 id="academy-title">Learn with clarity.<br /><em>Grow with confidence.</em></h1>
          <p className={styles.lede}>Every lesson follows an approved curriculum, every new step waits for a parent, and every activity is designed around Alonso.</p>
          <div className={styles.trustLine}><ShieldIcon size={21} /><span><strong>Calm by design.</strong> No points, streaks, public profiles, or open-ended AI chat.</span></div>
        </div>

        <div className={styles.composition} role="img" aria-label="A calm preview of a listening lesson saying hello to Alonso">
          <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.previewCard}>
            <span className={styles.previewIcon}><SparkIcon size={25} /></span>
            <p>Listen first</p>
            <strong>Hello, Alonso.</strong>
            <div className={styles.soundLine} aria-hidden="true">{[32, 58, 40, 74, 46, 63, 30, 52].map((height, index) => <i key={index} style={{ height }} />)}</div>
            <small>Clear American English</small>
          </div>
          <span className={styles.noteA}>small steps</span>
          <span className={styles.noteB}>parent approved</span>
        </div>
      </section>

      <section className={styles.destinations} aria-label="Choose an academy area">
        <article className={`${styles.destination} ${styles.childDestination}`}>
          <span className={styles.destinationIcon}><BookIcon size={25} /></span>
          <div><p className={styles.cardLabel}>For Alonso</p><h2>My learning space</h2><p>A simple, warm place where only approved lessons appear.</p></div>
          <ActionLink href="/alonso" tone="light">Visit Alonso Home</ActionLink>
        </article>

        <article className={`${styles.destination} ${styles.parentDestination}`}>
          <span className={styles.destinationIcon}><LockIcon size={24} /></span>
          <div><p className={styles.cardLabel}>For parent</p><h2>Command center</h2><p>Review curriculum, control generation, and understand progress.</p></div>
          <ActionLink href="/parent" tone="light">Open parent area</ActionLink>
        </article>
      </section>
    </main>
  );
}
