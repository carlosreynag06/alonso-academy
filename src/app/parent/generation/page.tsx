import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckIcon, ClockIcon, LockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { ActionLink } from "@/components/ui/action-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { getGenerationCommandCenter } from "@/lib/generation/repository";
import { getProviderReadiness } from "@/lib/generation/readiness";
import { getElevenLabsConfiguration } from "@/lib/env/server";
import { getPublicationBoard } from "@/lib/publication/repository";
import { ACTIVE_RECOVERY, recoveryLockMessage } from "@/lib/recovery/status";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Generation Studio | Alonso Academy" };

const kindLabel: Record<string, string> = { weekly_plan: "Weekly plan", daily_lesson: "Daily lesson", review_lesson: "Review lesson", story_lesson: "Listening story", parent_summary: "Parent summary" };

export default async function GenerationPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent");
  const [data, publication, query] = await Promise.all([getGenerationCommandCenter(), getPublicationBoard(), searchParams]);
  const readiness = getProviderReadiness(data.unit.status === "approved");
  const reviewQueue = data.artifacts.filter((artifact) => artifact.status === "validated" || artifact.status === "validation_failed");
  const latestFailure = data.jobs.find((job) => job.status === "failed");
  const audio = getElevenLabsConfiguration();

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}><div><p className={styles.eyebrow}>Artifact and publication workspace</p><h1>Generation is paused. Publication is controlled.</h1><p className={styles.headerCopy}>Existing versions remain available for inspection. Approval stays private until you separately schedule and publish an exact lesson version.</p></div><StatusBadge status="locked">{ACTIVE_RECOVERY.phase}</StatusBadge></header>

        {query.error && <section className={styles.error} role="alert"><strong>Generation did not continue.</strong> {query.message ?? "Review the request and current prerequisites, then try again."}</section>}

        <section className={styles.commandMetrics} aria-label="Command center status">
          <article><span><ShieldIcon size={19} /></span><div><small>Curriculum</small><strong>{data.unit.status === "approved" ? "Approved" : "Review required"}</strong></div></article>
          <article><span><SparkIcon size={19} /></span><div><small>Instructional model</small><strong>{readiness.model}</strong></div></article>
          <article><span><ClockIcon size={19} /></span><div><small>Review queue</small><strong>{reviewQueue.length} version{reviewQueue.length === 1 ? "" : "s"}</strong></div></article>
        </section>

        <section className={styles.commandGate}><div className={styles.gateGlow}><LockIcon size={28} /></div><p className={styles.cardLabel}>Generation safeguard</p><h2>No new AI content is generated.</h2><p>{recoveryLockMessage()} Existing approved lessons can still move through the explicit publication controls below.</p><ActionLink href="/parent/recovery">See the exact recovery state</ActionLink></section>

        <section className={styles.queueSection} aria-labelledby="publication-title">
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Authoritative child visibility</p><h2 id="publication-title">Five-day publication state</h2></div><span className={styles.queueCount}>{publication.available && publication.currentWeek ? publication.currentWeek.status : "not ready"}</span></div>
          {!publication.available ? <div className={styles.emptyQueue}><LockIcon size={27} /><h3>Publication controls are unavailable</h3><p>{publication.reason}</p></div> : !publication.currentWeek ? <div className={styles.emptyQueue}><ClockIcon size={27} /><h3>No learning week exists</h3><p>Approve a weekly plan privately, then open that plan and create its five exact day slots.</p></div> : <div className={styles.artifactList}>{[1, 2, 3, 4, 5].map((day) => {
            const slot = publication.slots.find((candidate) => candidate.day_number === day);
            if (!slot) return <article className={styles.artifactRow} key={day}><span className={`${styles.artifactState} ${styles.artifactState_validation_failed}`} aria-hidden="true" /><div><small>Day {day}</small><strong>Slot record missing</strong><p>The week is incomplete. Publication is blocked until the database slot exists.</p></div><span className={styles.reviewArrow}>Blocked</span></article>;
            const assignments = publication.assignments.filter((assignment) => assignment.week_day_slot_id === slot.id);
            const currentAssignment = assignments.find((assignment) => ["published", "scheduled", "assigned"].includes(assignment.status)) ?? assignments[0];
            const artifact = currentAssignment ? data.artifacts.find((candidate) => candidate.id === currentAssignment.lesson_artifact_id) : data.artifacts.find((candidate) => candidate.week_day_slot_id === slot.id);
            const state = currentAssignment?.status ?? (artifact ? `${artifact.status} · private` : "no lesson version");
            const content = <><span className={`${styles.artifactState} ${styles[`artifactState_${artifact?.status ?? "draft"}`]}`} aria-hidden="true" /><div><small>Day {day} · {slot.lesson_kind.replaceAll("_", " ")}</small><strong>{slot.title}</strong><p>{state}{currentAssignment?.available_from ? ` · ${new Date(currentAssignment.available_from).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}</p></div><span className={styles.reviewArrow}>{artifact ? "Inspect →" : "Prerequisite"}</span></>;
            return artifact ? <Link className={styles.artifactRow} href={`/parent/artifacts/${artifact.id}`} key={slot.id}>{content}</Link> : <article className={styles.artifactRow} key={slot.id}>{content}</article>;
          })}</div>}
        </section>

        <section className={styles.queueSection} aria-labelledby="queue-title"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Immutable version history</p><h2 id="queue-title">Existing artifacts</h2></div><span className={styles.queueCount}>{data.artifacts.length} total</span></div>{data.artifacts.length === 0 ? <div className={styles.emptyQueue}><SparkIcon size={27} /><h3>No generated versions exist</h3><p>Generation remains paused during {ACTIVE_RECOVERY.phase}.</p></div> : <div className={styles.artifactList}>{data.artifacts.map((artifact) => <Link className={styles.artifactRow} href={`/parent/artifacts/${artifact.id}`} key={artifact.id}><span className={`${styles.artifactState} ${styles[`artifactState_${artifact.status}`]}`} aria-hidden="true" /><div><small>{kindLabel[artifact.kind]} · Version {artifact.version}{artifact.day_number ? ` · Day ${artifact.day_number}` : ""}</small><strong>{artifact.status.replaceAll("_", " ")} record</strong><p>{new Date(artifact.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className={styles.reviewArrow}>Inspect →</span></Link>)}</div>}</section>

        <section className={styles.integrationStrip}><div><span className={styles.cardIcon}><CheckIcon size={21} /></span><div><p className={styles.cardLabel}>Configuration, not health</p><h2>Provider setup is not pilot verification</h2><p>{latestFailure ? `Latest recorded provider message: ${latestFailure.safe_error_message}` : `No recorded failure is not proof of availability. ${ACTIVE_RECOVERY.phase} performs no live provider request.`}</p></div></div><small>Supabase configured · OpenAI {readiness.providerConfigured ? "key present" : "key missing"} · ElevenLabs {audio.ready ? "configured" : "incomplete"}</small></section>
      </main>
    </ParentShell>
  );
}
