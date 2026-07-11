import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookIcon, LockIcon, SparkIcon } from "@/components/icons";
import { ChildShell } from "@/components/shells/child-shell";
import { ActionLink } from "@/components/ui/action-link";
import { AudioControl, MicrophoneControl } from "@/components/ui/learning-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { getChildAccessState } from "@/lib/auth/child";
import styles from "./alonso.module.css";

export const metadata: Metadata = { title: "My Lessons | Alonso Academy" };

export default async function AlonsoSetupPage() {
  const access = await getChildAccessState();
  if (access.status !== "ready") redirect("/login");

  return (
    <ChildShell>
      <main className={styles.page} id="main-content">
        <section className={styles.welcome} aria-labelledby="alonso-title">
          <div className={styles.welcomeCopy}>
            <StatusBadge status="waiting">Waiting for an approved lesson</StatusBadge>
            <p className={styles.hello}>Hello, Alonso</p>
            <h1 id="alonso-title">Your learning space is getting ready.</h1>
            <p>When a parent approves your first lesson, it will appear right here. There is nothing you need to do yet.</p>
          </div>
          <div className={styles.learningScene} aria-hidden="true">
            <span className={styles.sun}><SparkIcon size={28} /></span>
            <div className={styles.book}><span>A</span><i /><span>a</span></div>
            <span className={styles.wordOne}>hello</span>
            <span className={styles.wordTwo}>listen</span>
          </div>
        </section>

        <section className={styles.lessonCard} aria-labelledby="lesson-status-title">
          <div className={styles.lessonIcon}><BookIcon size={28} /></div>
          <div className={styles.lessonCopy}>
            <p className={styles.eyebrow}>Today&apos;s lesson</p>
            <h2 id="lesson-status-title">No lesson yet</h2>
            <p>A lesson can appear only after it follows the curriculum and a parent says it is ready.</p>
          </div>
          <span className={styles.lock}><LockIcon size={18} />Protected</span>
        </section>

        <section className={styles.readiness} aria-labelledby="controls-title">
          <div><p className={styles.eyebrow}>Familiar controls</p><h2 id="controls-title">Simple from the first day</h2><p>These controls will stay large, clear, and in the same place during lessons.</p></div>
          <div className={styles.controls}><AudioControl state="unavailable" /><MicrophoneControl state="unavailable" /></div>
        </section>

        <footer className={styles.footer}><ActionLink href="/login" tone="quiet">Return to sign in</ActionLink></footer>
      </main>
    </ChildShell>
  );
}
