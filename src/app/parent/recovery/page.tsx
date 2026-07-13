import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckIcon, ClockIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { getParentAccessState } from "@/lib/auth/parent";
import { RECOVERY_FIXTURE_CATALOG } from "@/lib/recovery/fixtures";
import { ACTIVE_RECOVERY, RECOVERY_STATUS_DEFINITIONS, getRecoveryBaseline } from "@/lib/recovery/status";
import styles from "./recovery.module.css";

export const metadata: Metadata = { title: "Recovery Baseline | Alonso Academy" };

export default async function RecoveryPage() {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  const baseline = await getRecoveryBaseline();
  const fixture = RECOVERY_FIXTURE_CATALOG;
  const approvedWeeks = baseline.artifactCounts["weekly_plan:approved"] ?? 0;
  const approvedLessons = (baseline.artifactCounts["daily_lesson:approved"] ?? 0) + (baseline.artifactCounts["review_lesson:approved"] ?? 0);
  const blockers = [
    "Approval and publication are not separated in the current domain model.",
    "The parent and child production interfaces are rejected and awaiting coherent redesign.",
    "Lesson schema v1 cannot express character-led, picture-based, oral-first instruction.",
    !baseline.providers.audioReady ? "ElevenLabs and an approved American-English voice are not configured." : null,
    "Mastery, review scheduling, progress, and evidence-grounded summaries are not implemented.",
  ].filter((blocker): blocker is string => Boolean(blocker));

  return <ParentShell identity={access.email}><main className={styles.page} id="main-content">
    <header className={styles.header}><div><p>Authoritative recovery baseline</p><h1>{ACTIVE_RECOVERY.phase}</h1><span>{ACTIVE_RECOVERY.title}</span></div><div className={styles.locked}><LockIcon size={18} /><strong>Product mutations paused</strong><small>Real approvals and lesson records are protected during the truth reset.</small></div></header>

    <section className={styles.next}><div><ShieldIcon size={22} /></div><div><p>Exact next blocker</p><h2>{ACTIVE_RECOVERY.nextBlocker}</h2><span>Recovery 1 must establish assignment, publication, replacement, withdrawal, and server-authoritative evidence before interface rebuilding continues.</span></div></section>

    <section className={styles.section} aria-labelledby="real-state-title"><header><div><p>{access.fixture ? "Development fixture" : "Hosted project"}</p><h2 id="real-state-title">{access.fixture ? "Synthetic local state" : "Real data and provider state"}</h2></div><span className={styles.realBadge}>{access.fixture ? "No hosted reads or writes" : "No fixture values"}</span></header><div className={styles.metrics}>
      <article><small>Curriculum</small><strong>{baseline.curriculum?.status ?? "missing"}</strong><span>{baseline.curriculum?.code ?? "A-U1 unavailable"}</span></article>
      <article><small>Approved weeks</small><strong>{approvedWeeks}</strong><span>Artifact approval only</span></article>
      <article><small>Approved lessons</small><strong>{approvedLessons}</strong><span>Not a publication count</span></article>
      <article><small>Attempts / evidence</small><strong>{baseline.attempts.length} / {baseline.evidenceCount}</strong><span>Learning history</span></article>
      <article><small>Mastery / reviews</small><strong>{baseline.masteryCount} / {baseline.reviewCount}</strong><span>Adaptive loop</span></article>
      <article><small>Audio ready</small><strong>{baseline.providers.audioReady ? "Yes" : "No"}</strong><span>{baseline.providers.approvedVoice ? "Voice selected" : "Voice approval missing"}</span></article>
    </div></section>

    <section className={styles.section} aria-labelledby="blockers-title"><header><div><p>Product truth</p><h2 id="blockers-title">Current blockers</h2></div><span>{blockers.length} open</span></header><ul className={styles.blockers}>{blockers.map((blocker) => <li key={blocker}><ClockIcon size={17} /><span>{blocker}</span></li>)}</ul></section>

    <section className={styles.section} aria-labelledby="status-title"><header><div><p>Status vocabulary</p><h2 id="status-title">What each label means</h2></div></header><div className={styles.definitions}>{RECOVERY_STATUS_DEFINITIONS.map((definition) => <article key={definition.status}><strong>{definition.status}</strong><p>{definition.meaning}</p></article>)}</div></section>

    <section className={styles.section} aria-labelledby="fixture-title"><header><div><p>Development-only scenario lab</p><h2 id="fixture-title">Synthetic fixtures, isolated from Supabase</h2></div><span className={styles.fixtureBadge}>Writes to Supabase: no</span></header><p className={styles.intro}>{fixture.metadata.purpose}</p><div className={styles.weekTable}><div><b>Day</b><b>Fixture lesson</b><b>State</b><b>Next owner</b></div>{fixture.week.days.map((day) => <div key={day.day}><strong>{day.day}</strong><span>{day.title}</span><code>{day.state}</code><span>{day.owner}</span></div>)}</div></section>

    <div className={styles.columns}>
      <section className={styles.section} aria-labelledby="evidence-title"><header><div><p>Evidence scenarios</p><h2 id="evidence-title">Independence and support</h2></div></header><div className={styles.rows}>{fixture.evidence.map((item) => <article key={item.id}><div><strong>{item.target}</strong><span>{item.context}</span></div><div><b>{item.result}</b><small>{item.firstAttempt ? "first attempt" : "later attempt"} · {item.support}</small></div></article>)}</div></section>
      <section className={styles.section} aria-labelledby="failure-title"><header><div><p>Failure scenarios</p><h2 id="failure-title">Required safe recovery</h2></div></header><div className={styles.failures}>{fixture.providerFailures.map((failure) => <article key={failure.id}><strong>{failure.provider}: {failure.id.replaceAll("_", " ")}</strong><p>{failure.expectedBehavior}</p></article>)}</div></section>
    </div>

    <footer className={styles.footer}><CheckIcon size={16} />Fixtures are synthetic, file-backed under ignored local data, visibly labeled, and blocked from Supabase and live providers.</footer>
  </main></ParentShell>;
}
