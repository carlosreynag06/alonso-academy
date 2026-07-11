import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArtifactContent } from "@/components/artifacts/artifact-content";
import { CheckIcon, ClockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { validationReportSchema, type ArtifactKind } from "@/lib/generation/contracts";
import { getArtifactReview } from "@/lib/generation/repository";
import { approveArtifact, rejectArtifact, requestGeneration } from "../../generation/actions";
import styles from "../../parent.module.css";

export const metadata: Metadata = { title: "Artifact Review | Alonso Academy" };

const labels: Record<string, string> = { weekly_plan: "Weekly plan", daily_lesson: "Daily lesson", review_lesson: "Review lesson", story_lesson: "Listening story", parent_summary: "Parent summary" };

export default async function ArtifactReviewPage({ params, searchParams }: { params: Promise<{ artifactId: string }>; searchParams: Promise<{ generated?: string; reused?: string; approved?: string; rejected?: string; error?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  const [{ artifactId }, query] = await Promise.all([params, searchParams]);
  const data = await getArtifactReview(artifactId).catch(() => notFound());
  const report = validationReportSchema.safeParse(data.artifact.validation_report).success ? validationReportSchema.parse(data.artifact.validation_report) : null;
  const canApprove = data.artifact.status === "validated";
  const canReject = ["draft", "validation_failed", "validated"].includes(data.artifact.status);
  const canRegenerate = data.artifact.kind !== "parent_summary";

  return <ParentShell identity={access.email}><main className={styles.dashboard} id="main-content">
    <header className={styles.reviewHeader}><div><Link className={styles.textLink} href="/parent/generation">← Generation studio</Link><p className={styles.eyebrow}>{labels[data.artifact.kind]} · Version {data.artifact.version}</p><h1>Review every detail.</h1><p>Validation can enforce boundaries. Only you can decide whether this version is right for Alonso.</p></div><StatusBadge status={data.artifact.status === "approved" ? "ready" : data.artifact.status === "validated" ? "waiting" : "locked"}>{data.artifact.status.replaceAll("_", " ")}</StatusBadge></header>

    {query.generated && <p className={styles.notice}>A new immutable version was generated and validated. {query.reused ? "This was the existing result for the repeated request." : "It remains private until you approve it."}</p>}
    {query.approved && <p className={styles.notice}>This exact version is approved. The decision is recorded in the audit history.</p>}
    {query.rejected && <p className={styles.notice}>This version was archived with your rejection note. You may regenerate a new version.</p>}
    {query.error && <p className={styles.error}>The decision was not recorded. The version may have changed state, the note may be too short, or its curriculum snapshot may be stale.</p>}

    <section className={styles.reviewLayout}><article className={styles.contentReview}><ArtifactContent kind={data.artifact.kind} content={data.artifact.content} /></article><aside className={styles.validationRail}><div className={styles.railHeading}><span className={styles.cardIcon}>{report?.valid ? <CheckIcon size={21} /> : <ClockIcon size={21} />}</span><p className={styles.cardLabel}>Validation report</p><h2>{report?.valid ? "All boundaries passed" : "Review required"}</h2></div><dl><div><dt>Schema and targets</dt><dd>{report?.deterministicValid ? "Passed" : "Failed"}</dd></div><div><dt>Semantic review</dt><dd>{report?.semanticValid === true ? "Passed" : report?.semanticValid === false ? "Failed" : "Not run"}</dd></div><div><dt>Model</dt><dd>{data.artifact.model_id ?? "Not recorded"}</dd></div><div><dt>Snapshot</dt><dd>{typeof data.artifact.curriculum_snapshot === "object" && data.artifact.curriculum_snapshot && !Array.isArray(data.artifact.curriculum_snapshot) && typeof data.artifact.curriculum_snapshot.snapshotId === "string" ? data.artifact.curriculum_snapshot.snapshotId.slice(0, 10) : "Unavailable"}</dd></div></dl>{report?.issues.length ? <div className={styles.issueList}><h3>Reported issues</h3>{report.issues.map((issue, index) => <article key={`${issue.code}-${index}`}><strong>{issue.code.replaceAll("_", " ")}</strong><p>{issue.message}</p><small>{issue.path}</small></article>)}</div> : <p className={styles.railSuccess}><ShieldIcon size={18} /> No validation violations recorded.</p>}</aside></section>

    {data.children.length > 0 && <section className={styles.childVersions}><p className={styles.cardLabel}>Lessons created from this week</p><div>{data.children.map((child) => <Link href={`/parent/artifacts/${child.id}`} key={child.id}><span>Day {child.day_number}</span><strong>{labels[child.kind]} · v{child.version}</strong><small>{child.status.replaceAll("_", " ")}</small></Link>)}</div></section>}

    <section className={styles.decisionSection} aria-labelledby="decision-title"><div><p className={styles.eyebrow}>Parent decision</p><h2 id="decision-title">{data.artifact.status === "approved" ? "Approved for the next step" : "What should happen to this version?"}</h2><p>Every decision applies only to version {data.artifact.version}. Regeneration creates a separate, unapproved version.</p></div>{data.artifact.status === "approved" ? <div className={styles.approvedPlate}><CheckIcon size={24} /><strong>Approved</strong><span>{data.approvals[0]?.note ?? "Decision recorded"}</span></div> : <div className={styles.decisionForms}>{canApprove && <form action={approveArtifact} className={styles.decisionForm}><input type="hidden" name="artifactId" value={data.artifact.id} /><label htmlFor="approval-note">Approval note</label><textarea id="approval-note" name="note" minLength={5} required placeholder="Why is this version appropriate for Alonso?" /><button type="submit"><CheckIcon size={18} />Approve this version</button></form>}{canReject && <form action={rejectArtifact} className={`${styles.decisionForm} ${styles.rejectForm}`}><input type="hidden" name="artifactId" value={data.artifact.id} /><label htmlFor="rejection-note">Rejection note</label><textarea id="rejection-note" name="note" minLength={5} required placeholder="What should change in the next version?" /><button type="submit">Reject and archive</button></form>}{canRegenerate && <form action={requestGeneration} className={`${styles.decisionForm} ${styles.regenerateForm}`}><input type="hidden" name="kind" value={data.artifact.kind as ArtifactKind} /><input type="hidden" name="unitId" value={data.artifact.curriculum_unit_id} /><input type="hidden" name="day" value={data.artifact.day_number ?? ""} /><input type="hidden" name="previousArtifactId" value={data.artifact.id} /><input type="hidden" name="idempotencyKey" value={randomUUID()} /><label htmlFor="regeneration-request">Direction for a new version</label><textarea id="regeneration-request" name="parentRequest" minLength={8} required placeholder="Describe the precise change you want while preserving the curriculum boundary." /><button type="submit"><SparkIcon size={18} />Regenerate as version {data.artifact.version + 1}</button></form>}</div>}</section>
  </main></ParentShell>;
}
