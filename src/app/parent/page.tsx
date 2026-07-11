import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookIcon, CheckIcon, ClockIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { AcademyMark } from "@/components/ui/academy-mark";
import { ActionLink } from "@/components/ui/action-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { getProviderReadiness } from "@/lib/generation/readiness";
import { getGenerationCommandCenter } from "@/lib/generation/repository";
import { signOut } from "../login/actions";
import styles from "./parent.module.css";

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

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Parent command center</p><h1>Good to see you, {access.displayName}.</h1><p className={styles.headerCopy}>Review the learning boundary before creating anything new.</p></div>
          <form action={signOut}><button className={styles.secondaryButton}>Sign out</button></form>
        </header>

        <section className={styles.heroCard}>
          <div><StatusBadge status={commandCenter.unit.status === "approved" ? "ready" : "waiting"}>{commandCenter.unit.status === "approved" ? "Curriculum approved" : "Parent review required"}</StatusBadge><p className={styles.cardLabel}>Current curriculum position</p><h2>Phase A / Unit 1</h2><p>{commandCenter.unit.status === "approved" ? "The approved pilot boundary is ready for parent-requested planning. Every generated version remains private until you review it." : "Hello, Listen, and Respond is waiting for your review. Nothing is available to Alonso until you approve it."}</p></div>
          <ActionLink href={commandCenter.unit.status === "approved" ? "/parent/generation" : `/parent/curriculum/${commandCenter.unit.id}`} tone="light">{commandCenter.unit.status === "approved" ? "Open generation studio" : "Review curriculum"}</ActionLink>
        </section>

        <section className={styles.grid} aria-label="Foundation status">
          <article className={styles.infoCard}><span className={styles.cardIcon}><ClockIcon size={22} /></span><p className={styles.cardLabel}>Approval queue</p><h2>{pending.length === 0 ? "Nothing waiting" : `${pending.length} version${pending.length === 1 ? "" : "s"} to review`}</h2><p>{pending.length === 0 ? "Generated plans and lessons will appear here after validation." : "Inspect validation details, rationale, and lesson structure before deciding."}</p><ActionLink href="/parent/generation" tone="quiet">Open queue</ActionLink></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><ShieldIcon size={22} /></span><p className={styles.cardLabel}>Alonso mode</p><h2>Restricted by design</h2><p>Child sessions use short-lived opaque tokens and cannot query parent data directly.</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><BookIcon size={22} /></span><p className={styles.cardLabel}>Weekly plan</p><h2>{approvedWeek ? "Approved and ready" : "Not approved yet"}</h2><p>{approvedWeek ? "Individual lessons may now be generated against this exact weekly plan." : "Lesson generation stays locked until a validated five-day plan is approved."}</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><LockIcon size={22} /></span><p className={styles.cardLabel}>Approval rule</p><h2>Drafts stay private</h2><p>Regeneration creates a new immutable version. Approval never carries forward automatically.</p></article>
        </section>
      </main>
    </ParentShell>
  );
}
