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
import { ACTIVE_RECOVERY, recoveryLockMessage } from "@/lib/recovery/status";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Generation Studio | Alonso Academy" };

const kindLabel: Record<string, string> = { weekly_plan: "Weekly plan", daily_lesson: "Daily lesson", review_lesson: "Review lesson", story_lesson: "Listening story", parent_summary: "Parent summary" };

export default async function GenerationPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent");
  const [data, query] = await Promise.all([getGenerationCommandCenter(), searchParams]);
  const readiness = getProviderReadiness(data.unit.status === "approved");
  const reviewQueue = data.artifacts.filter((artifact) => artifact.status === "validated" || artifact.status === "validation_failed");
  const latestFailure = data.jobs.find((job) => job.status === "failed");
  const audio = getElevenLabsConfiguration();

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}><div><p className={styles.eyebrow}>Historical artifact workspace</p><h1>Generation is paused.</h1><p className={styles.headerCopy}>Existing versions remain available for inspection. Recovery 0 prevents new generation and product decisions from altering the pilot record.</p></div><StatusBadge status="locked">{ACTIVE_RECOVERY.phase} lock</StatusBadge></header>

        {query.error && <section className={styles.error} role="alert"><strong>Generation did not continue.</strong> {query.message ?? "Review the request and current prerequisites, then try again."}</section>}

        <section className={styles.commandMetrics} aria-label="Command center status">
          <article><span><ShieldIcon size={19} /></span><div><small>Curriculum</small><strong>{data.unit.status === "approved" ? "Approved" : "Review required"}</strong></div></article>
          <article><span><SparkIcon size={19} /></span><div><small>Instructional model</small><strong>{readiness.model}</strong></div></article>
          <article><span><ClockIcon size={19} /></span><div><small>Review queue</small><strong>{reviewQueue.length} version{reviewQueue.length === 1 ? "" : "s"}</strong></div></article>
        </section>

        <section className={styles.commandGate}><div className={styles.gateGlow}><LockIcon size={28} /></div><p className={styles.cardLabel}>Recovery safeguard</p><h2>No new pilot decisions are accepted.</h2><p>{recoveryLockMessage()}</p><ActionLink href="/parent/recovery">See the exact blockers</ActionLink></section>

        <section className={styles.queueSection} aria-labelledby="queue-title"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Immutable version history</p><h2 id="queue-title">Existing artifacts</h2></div><span className={styles.queueCount}>{data.artifacts.length} total</span></div>{data.artifacts.length === 0 ? <div className={styles.emptyQueue}><SparkIcon size={27} /><h3>No generated versions exist</h3><p>Generation remains paused during Recovery 0.</p></div> : <div className={styles.artifactList}>{data.artifacts.map((artifact) => <Link className={styles.artifactRow} href={`/parent/artifacts/${artifact.id}`} key={artifact.id}><span className={`${styles.artifactState} ${styles[`artifactState_${artifact.status}`]}`} aria-hidden="true" /><div><small>{kindLabel[artifact.kind]} · Version {artifact.version}{artifact.day_number ? ` · Day ${artifact.day_number}` : ""}</small><strong>{artifact.status.replaceAll("_", " ")} record</strong><p>{new Date(artifact.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className={styles.reviewArrow}>Inspect →</span></Link>)}</div>}</section>

        <section className={styles.integrationStrip}><div><span className={styles.cardIcon}><CheckIcon size={21} /></span><div><p className={styles.cardLabel}>Configuration, not health</p><h2>Provider setup is not pilot verification</h2><p>{latestFailure ? `Latest recorded provider message: ${latestFailure.safe_error_message}` : "No recorded failure is not proof of availability. Recovery 0 performs no live provider request."}</p></div></div><small>Supabase configured · OpenAI {readiness.providerConfigured ? "key present" : "key missing"} · ElevenLabs {audio.ready ? "configured" : "incomplete"}</small></section>
      </main>
    </ParentShell>
  );
}
