import { randomUUID } from "node:crypto";
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
import { requestGeneration } from "./actions";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Generation Studio | Alonso Academy" };

const kindLabel: Record<string, string> = { weekly_plan: "Weekly plan", daily_lesson: "Daily lesson", review_lesson: "Review lesson", story_lesson: "Listening story", parent_summary: "Parent summary" };

export default async function GenerationPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent");
  const [data, query] = await Promise.all([getGenerationCommandCenter(), searchParams]);
  const readiness = getProviderReadiness(data.unit.status === "approved");
  const approvedWeek = data.artifacts.find((artifact) => artifact.kind === "weekly_plan" && artifact.status === "approved");
  const reviewQueue = data.artifacts.filter((artifact) => artifact.status === "validated" || artifact.status === "validation_failed");
  const latestFailure = data.jobs.find((job) => job.status === "failed");

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}><div><p className={styles.eyebrow}>Parent generation studio</p><h1>Plan with clarity.<br />Publish with intention.</h1><p className={styles.headerCopy}>Request one bounded draft at a time, inspect every choice, then decide what Alonso may use.</p></div><StatusBadge status={readiness.ready ? "ready" : "waiting"}>{readiness.ready ? "Generation ready" : "Curriculum gate"}</StatusBadge></header>

        {query.error && <section className={styles.error} role="alert"><strong>Generation did not continue.</strong> {query.message ?? "Review the request and current prerequisites, then try again."}</section>}

        <section className={styles.commandMetrics} aria-label="Command center status">
          <article><span><ShieldIcon size={19} /></span><div><small>Curriculum</small><strong>{data.unit.status === "approved" ? "Approved" : "Review required"}</strong></div></article>
          <article><span><SparkIcon size={19} /></span><div><small>Instructional model</small><strong>{readiness.model}</strong></div></article>
          <article><span><ClockIcon size={19} /></span><div><small>Review queue</small><strong>{reviewQueue.length} version{reviewQueue.length === 1 ? "" : "s"}</strong></div></article>
        </section>

        {data.unit.status !== "approved" ? <section className={styles.commandGate}><div className={styles.gateGlow}><LockIcon size={28} /></div><p className={styles.cardLabel}>Required before generation</p><h2>Approve the learning boundary first.</h2><p>Unit 1 is still a parent-review draft. Inspect its vocabulary, sentence frames, sound anchors, novelty limits, and literacy demands before allowing any AI request.</p><ActionLink href={`/parent/curriculum/${data.unit.id}`}>Review Unit 1</ActionLink></section> : !approvedWeek ? <section className={styles.generatorPanel}><div className={styles.generatorIntro}><StatusBadge status="ready">Curriculum snapshot ready</StatusBadge><h2>Create the five-day plan</h2><p>Describe the emphasis you want. The request will still be restricted to approved Unit 1 targets and validation rules.</p></div><form action={requestGeneration} className={styles.commandForm}><input type="hidden" name="kind" value="weekly_plan" /><input type="hidden" name="unitId" value={data.unit.id} /><input type="hidden" name="idempotencyKey" value={randomUUID()} /><label htmlFor="week-request">Parent direction</label><textarea id="week-request" name="parentRequest" minLength={8} required defaultValue="Create a balanced five-day introductory week with gentle review, short movement breaks, and clear exit evidence." /><button type="submit"><SparkIcon size={18} />Generate weekly plan</button><small>Usually takes under a few minutes. The result stays private until you approve it.</small></form></section> : <section className={styles.generatorPanel}><div className={styles.generatorIntro}><StatusBadge status="ready">Approved week available</StatusBadge><h2>Create one lesson</h2><p>Choose the planned day and lesson format. Each version receives its own validation report and approval decision.</p><ActionLink href={`/parent/artifacts/${approvedWeek.id}`} tone="quiet">Review approved week</ActionLink></div><form action={requestGeneration} className={styles.commandForm}><input type="hidden" name="unitId" value={data.unit.id} /><input type="hidden" name="idempotencyKey" value={randomUUID()} /><div className={styles.formPair}><label>Day<select name="day" required defaultValue="1"><option value="1">Day 1</option><option value="2">Day 2</option><option value="3">Day 3</option><option value="4">Day 4</option><option value="5">Day 5</option></select></label><label>Format<select name="kind" required defaultValue="daily_lesson"><option value="daily_lesson">Daily lesson</option><option value="review_lesson">Review lesson</option><option value="story_lesson">Listening story</option></select></label></div><label htmlFor="lesson-request">Parent direction</label><textarea id="lesson-request" name="parentRequest" minLength={8} required defaultValue="Keep the lesson warm, concrete, and varied. Include a movement break and an independent exit check." /><button type="submit"><SparkIcon size={18} />Generate lesson draft</button></form></section>}

        <section className={styles.queueSection} aria-labelledby="queue-title"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Immutable version history</p><h2 id="queue-title">Approval queue</h2></div><span className={styles.queueCount}>{data.artifacts.length} total</span></div>{data.artifacts.length === 0 ? <div className={styles.emptyQueue}><SparkIcon size={27} /><h3>No generated versions yet</h3><p>Your first validated weekly plan will appear here.</p></div> : <div className={styles.artifactList}>{data.artifacts.map((artifact) => <Link className={styles.artifactRow} href={`/parent/artifacts/${artifact.id}`} key={artifact.id}><span className={`${styles.artifactState} ${styles[`artifactState_${artifact.status}`]}`} aria-hidden="true" /><div><small>{kindLabel[artifact.kind]} · Version {artifact.version}{artifact.day_number ? ` · Day ${artifact.day_number}` : ""}</small><strong>{artifact.status === "validation_failed" ? "Needs regeneration" : artifact.status.replaceAll("_", " ")}</strong><p>{new Date(artifact.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className={styles.reviewArrow}>Review →</span></Link>)}</div>}</section>

        <section className={styles.integrationStrip}><div><span className={styles.cardIcon}><CheckIcon size={21} /></span><div><p className={styles.cardLabel}>Integration status</p><h2>OpenAI and Supabase connected</h2><p>{latestFailure ? `Latest safe provider message: ${latestFailure.safe_error_message}` : "No provider failure is currently recorded. Keys remain server-only."}</p></div></div><small>{readiness.model} · high reasoning · no fallback</small></section>
      </main>
    </ParentShell>
  );
}
