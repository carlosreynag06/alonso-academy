import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckIcon, LockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { getProviderReadiness } from "@/lib/generation/readiness";
import { createClient } from "@/lib/supabase/server";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Generation Readiness | Alonso Academy" };

export default async function GenerationReadinessPage() {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent");

  const supabase = await createClient();
  const { data: pilot } = await supabase.from("curriculum_units").select("status").eq("code", "A-U1").maybeSingle();
  const readiness = getProviderReadiness(pilot?.status === "approved");

  return (
    <ParentShell identity={access.email}>
      <main className={styles.dashboard} id="main-content">
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Structured generation core</p><h1>Creative by request.<br />Bounded by design.</h1><p className={styles.headerCopy}>The model can draft; curriculum and parent judgment remain in control.</p></div>
        </header>

        <section className={styles.readinessHero} aria-labelledby="readiness-title">
          <div>
            <StatusBadge status={readiness.ready ? "ready" : "waiting"}>{readiness.ready ? "Ready for parent requests" : "Safely locked"}</StatusBadge>
            <h2 id="readiness-title">No AI draft can publish itself.</h2>
            <p>Every request receives an immutable curriculum snapshot, a strict output contract, deterministic checks, semantic review, and a fresh parent approval requirement.</p>
          </div>
          <div className={styles.modelPlate}><small>Instructional model</small><strong>{readiness.model}</strong><span>{readiness.reasoningEffort} reasoning · strict structured output · no fallback</span></div>
        </section>

        <section className={styles.pipelineGrid} aria-label="Validation pipeline">
          <article className={styles.pipelineCard}><span className={styles.pipelineNumber}>1</span><h3>Curriculum snapshot</h3><p>Only approved vocabulary, frames, sound anchors, literacy demands, and review context enter the request.</p></article>
          <article className={styles.pipelineCard}><span className={styles.pipelineNumber}>2</span><h3>Two validation layers</h3><p>Code checks schemas and targets first. Semantic review runs only after deterministic validation passes.</p></article>
          <article className={styles.pipelineCard}><span className={styles.pipelineNumber}>3</span><h3>Parent publication</h3><p>Validated still means private. Approval never carries to a regenerated version.</p></article>
        </section>

        {!readiness.ready && <section className={styles.blockerPanel} aria-labelledby="blocker-title"><span className={styles.cardIcon}><LockIcon size={21} /></span><h2 id="blocker-title">One instructional gate remains</h2><p>{readiness.blockers.join(" ")} Existing approved data is unchanged, and no provider request will run while this gate is closed.</p></section>}

        <section className={styles.grid} aria-label="Generation safeguards">
          <article className={styles.infoCard}><span className={styles.cardIcon}><ShieldIcon size={22} /></span><p className={styles.cardLabel}>Privacy</p><h2>Server-only provider</h2><p>The key never reaches the browser. Requests are not stored by the OpenAI API, and logs retain only safe metadata.</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><SparkIcon size={22} /></span><p className={styles.cardLabel}>Artifacts</p><h2>Four strict contracts</h2><p>Weekly plans, daily lessons, controlled stories, and evidence-bound summaries each use versioned schemas.</p></article>
          <article className={styles.infoCard}><span className={styles.cardIcon}><CheckIcon size={22} /></span><p className={styles.cardLabel}>Retries</p><h2>Idempotent jobs</h2><p>A repeated request key cannot create duplicate versions or silently change its original request.</p></article>
        </section>
      </main>
    </ParentShell>
  );
}
