import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookIcon, CheckIcon, ClockIcon, LockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { AcademyMark } from "@/components/ui/academy-mark";
import { ActionLink } from "@/components/ui/action-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { getProviderReadiness } from "@/lib/generation/readiness";
import { getGenerationCommandCenter } from "@/lib/generation/repository";
import { signOut } from "../login/actions";
import styles from "./parent.module.css";
import overview from "./overview.module.css";

export const metadata: Metadata = { title: "Parent Command Center | Alonso Academy" };

export default async function ParentPage() {
  const access = await getParentAccessState();
  const generation = getProviderReadiness(false);

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
            <p><span className={styles.completeIcon}><CheckIcon size={17} /></span><span><strong>Generation core secured</strong><small>{generation.model} / {generation.reasoningEffort} reasoning / strict output</small></span></p>
            <p className={styles.pendingStep}><span><ClockIcon size={17} /></span><span><strong>Parent identity</strong><small>Waiting for the approved email</small></span></p>
          </div>
          <div className={styles.gateActions}><ActionLink href="/login">Open sign in</ActionLink></div>
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
    redirect("/login");
  }

  const commandCenter = await getGenerationCommandCenter();
  const pending = commandCenter.artifacts.filter((artifact) => artifact.status === "validated" || artifact.status === "validation_failed");
  const approvedWeek = commandCenter.artifacts.find((artifact) => artifact.kind === "weekly_plan" && artifact.status === "approved");
  const approvedLessons = commandCenter.artifacts.filter((artifact) => artifact.kind !== "weekly_plan" && artifact.status === "approved");
  const currentStep = commandCenter.unit.status !== "approved" ? 1 : !approvedWeek ? 2 : approvedLessons.length < 5 ? 3 : 4;
  const nextAction = currentStep === 1
    ? { eyebrow: "Curriculum decision", title: "Review the Unit 1 boundary", copy: "Confirm the vocabulary, sentence frames, sound anchors, and literacy limits before planning begins.", href: `/parent/curriculum/${commandCenter.unit.id}`, label: "Review curriculum" }
    : currentStep === 2
      ? { eyebrow: "Weekly planning", title: "Create Alonso’s first five-day plan", copy: "The curriculum is approved. Request a balanced week, inspect the rationale, and decide whether the plan is ready.", href: "/parent/generation", label: "Open planning studio" }
      : { eyebrow: "Lesson production", title: `${approvedLessons.length} of 5 lessons approved`, copy: "Continue creating and reviewing one lesson at a time. Each version remains private until your decision.", href: "/parent/generation", label: "Continue lesson review" };
  const kindLabels: Record<string, string> = { weekly_plan: "Weekly plan", daily_lesson: "Daily lesson", review_lesson: "Review lesson", story_lesson: "Listening story" };

  return (
    <ParentShell identity={access.email}>
      <main className={overview.page} id="main-content">
        <header className={overview.header}>
          <div><p className={overview.kicker}>Parent workspace</p><h1>Good evening, {access.displayName}.</h1><p>Alonso’s current learning position, decisions, and next step.</p></div>
          <div className={overview.headerTools}><span><i />Private</span><form action={signOut}><button>Sign out</button></form></div>
        </header>

        <section className={overview.focus} aria-labelledby="next-action-title">
          <div className={overview.focusCopy}><p className={overview.kicker}>{nextAction.eyebrow}</p><h2 id="next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p><ActionLink href={nextAction.href}>{nextAction.label}</ActionLink><div className={overview.focusMarks} aria-hidden="true"><i /><i /><i /></div></div>
          <div className={overview.position} aria-label="Current curriculum: Phase A, Unit 1"><div className={overview.phaseGlyph}>A<span>01</span></div><div className={overview.positionCopy}><p>Current position</p><strong>Phase A · Unit 1</strong><small>Hello, Listen, and Respond</small></div><StatusBadge status={commandCenter.unit.status === "approved" ? "ready" : "waiting"}>{commandCenter.unit.status}</StatusBadge></div>
        </section>

        <section className={overview.journey} aria-labelledby="path-title"><div className={overview.journeyTitle}><p className={overview.kicker}>Learning sequence</p><h2 id="path-title">Curriculum → Alonso</h2></div><ol className={overview.steps}>
          {[{ n: 1, label: "Curriculum", detail: commandCenter.unit.status === "approved" ? "Approved" : "Needs review" }, { n: 2, label: "Weekly plan", detail: approvedWeek ? "Approved" : "Not started" }, { n: 3, label: "Lessons", detail: `${approvedLessons.length} of 5` }, { n: 4, label: "Ready", detail: approvedLessons.length >= 5 ? "Available" : "Locked" }].map((step) => <li className={step.n < currentStep ? overview.done : step.n === currentStep ? overview.now : overview.later} key={step.n}><span>{step.n < currentStep ? <CheckIcon size={14} /> : step.n}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></li>)}
        </ol></section>

        <div className={overview.lower}>
          <section className={overview.decisions} aria-labelledby="desk-title"><header><div><p className={overview.kicker}>Decision desk</p><h2 id="desk-title">{pending.length ? `${pending.length} item${pending.length === 1 ? "" : "s"} need your judgment` : "Queue clear"}</h2></div><Link href="/parent/generation">All versions →</Link></header>{pending.length ? <div className={overview.decisionList}>{pending.slice(0, 3).map((artifact) => <Link href={`/parent/artifacts/${artifact.id}`} key={artifact.id}><span>{artifact.status === "validated" ? <CheckIcon size={16} /> : <ClockIcon size={16} />}</span><div><strong>{kindLabels[artifact.kind] ?? artifact.kind}</strong><small>Version {artifact.version} · {artifact.status.replaceAll("_", " ")}</small></div><b>Review</b></Link>)}</div> : <div className={overview.empty}><span><SparkIcon size={20} /></span><div><strong>No decisions waiting.</strong><p>Validated plans and lessons will appear here.</p></div></div>}</section>

          <aside className={overview.boundary} aria-labelledby="unit-brief-title"><header><span><BookIcon size={18} /></span><div><p className={overview.kicker}>Unit boundary</p><h2 id="unit-brief-title">A–U1</h2></div></header><dl><div><dt>Vocabulary</dt><dd>10</dd></div><div><dt>Frames</dt><dd>4</dd></div><div><dt>Sounds</dt><dd>2</dd></div><div><dt>Minutes</dt><dd>15</dd></div></dl><Link href={`/parent/curriculum/${commandCenter.unit.id}`}>Inspect curriculum →</Link><div className={overview.boundaryAccent} aria-hidden="true" /></aside>
        </div>

        <footer className={overview.footer}><span><ShieldIcon size={16} />Parent-controlled publication</span><i /><span><LockIcon size={15} />Drafts never reach Alonso</span></footer>
      </main>
    </ParentShell>
  );
}
