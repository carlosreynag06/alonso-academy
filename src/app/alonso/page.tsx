import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookIcon, CheckIcon, ClockIcon, SoundIcon, SparkIcon } from "@/components/icons";
import { ChildShell } from "@/components/shells/child-shell";
import { getChildAccessState } from "@/lib/auth/child";
import { getChildLessonHome } from "@/lib/lesson/repository";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { startLesson } from "./actions";
import styles from "./alonso.module.css";

export const metadata: Metadata = { title: "My Lessons | Alonso Academy" };

export default async function AlonsoHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") redirect("/login");
  const [home, query] = await Promise.all([getChildLessonHome(), searchParams]);
  const currentLesson = home.currentAttempt ? home.lessons.find((lesson) => lesson.id === home.currentAttempt?.lessonId) : null;
  const nextLesson = ACTIVE_RECOVERY.childDeliveryLocked && !access.fixture ? null : currentLesson ?? home.lessons[0] ?? null;
  const isResume = Boolean(home.currentAttempt && currentLesson);

  return <ChildShell fixture={access.fixture}><main className={styles.page} id="main-content">
    <section className={styles.sky} aria-labelledby="alonso-title">
      <div className={styles.greeting}><p className={styles.eyebrow}>Alonso’s learning space</p><h1 id="alonso-title">Hi, Alonso!</h1><p>{nextLesson ? "Your English lesson is ready." : "There is no lesson to start right now."}</p></div>
      <div className={styles.world} aria-hidden="true"><span className={styles.sun}><SparkIcon size={28} /></span><span className={styles.cloudOne} /><span className={styles.cloudTwo} /><div className={styles.hillBack} /><div className={styles.hillFront} /><div className={styles.wordPath}><i>hello</i><i>listen</i><i>look</i></div><div className={styles.littleBook}><b>A</b><span /><b>a</b></div></div>
    </section>

    {query.error && <p className={styles.error}>{query.error === "recovery_lock" ? "Lessons are paused while a grown-up prepares the new learning experience." : "That lesson could not open. Nothing was lost—please try once more."}</p>}

    {nextLesson ? <section className={styles.lessonLaunch} aria-labelledby="lesson-title"><div className={styles.lessonNumber}><span>DAY</span><strong>{nextLesson.dayNumber ?? 1}</strong></div><div className={styles.lessonInfo}><p className={styles.eyebrow}>{isResume ? "Continue where you stopped" : "Today’s lesson"}</p><h2 id="lesson-title">{nextLesson.lesson.title}</h2><p>{nextLesson.lesson.objective}</p><div className={styles.lessonMeta}><span><ClockIcon size={17} />{nextLesson.lesson.durationMinutes} minutes</span><span><BookIcon size={17} />{nextLesson.lesson.blocks.length} little steps</span></div></div><form action={startLesson}><input type="hidden" name="lessonId" value={nextLesson.id} /><button type="submit">{isResume ? "Keep going" : "Start lesson"}<span>→</span></button></form><div className={styles.launchPattern} aria-hidden="true"><i /><i /><i /></div></section> : <section className={styles.waiting} aria-labelledby="waiting-title"><div className={styles.waitingArt} aria-hidden="true"><div className={styles.orbit}><span><SoundIcon size={22} /></span><i /><i /></div><div className={styles.closedBook}><b>A</b><span /></div></div><div><p className={styles.eyebrow}>Lesson closed</p><h2 id="waiting-title">A grown-up is preparing your new lesson.</h2><p>There is nothing you need to do. Please come back later.</p></div></section>}

    <section className={styles.promise} aria-label="Lesson routine"><div><span className={styles.promiseIcon}><SoundIcon size={20} /></span><strong>Listen</strong><small>Hear it first</small></div><i /><div><span className={styles.promiseIcon}><SparkIcon size={20} /></span><strong>Try</strong><small>Take your time</small></div><i /><div><span className={styles.promiseIcon}><CheckIcon size={20} /></span><strong>Finish</strong><small>One step at a time</small></div></section>
    <footer className={styles.footer}><Link href="/login">Back to sign in</Link></footer>
  </main></ChildShell>;
}
