import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ParentShell } from "@/components/shells/parent-shell";
import { getParentAccessState } from "@/lib/auth/parent";
import { getCurriculumOverview } from "@/lib/curriculum/repository";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Curriculum | Alonso Academy" };

export default async function CurriculumPage() {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent/login");
  const { phases, units } = await getCurriculumOverview();

  return (
    <ParentShell identity={access.email}>
    <main className={styles.dashboard} id="main-content">
      <header className={styles.sectionHeader}>
        <div><p className={styles.eyebrow}>Approved curriculum boundary</p><h1>Curriculum</h1></div>
        <Link className={styles.textLink} href="/parent">Back to command center</Link>
      </header>
      <div className={styles.phaseList}>
        {phases.map((phase) => <article className={styles.phaseRow} key={phase.code}><div className={styles.phaseCode}>{phase.code}</div><div><h2>{phase.name}</h2><p>{phase.purpose}</p></div></article>)}
      </div>
      {units.map((unit) => <article className={styles.unitCard} key={unit.id}><p className={styles.cardLabel}>Pilot unit · {unit.status === "approved" ? "approved boundary" : "parent review required"}</p><h2>{unit.code}: {unit.title}</h2><p>{unit.description}</p><div className={styles.unitMeta}><span className={styles.pill}>{unit.status}</span><span className={styles.pill}>Version {unit.version}</span></div><Link className={styles.primaryLink} href={`/parent/curriculum/${unit.id}`}>{unit.status === "approved" ? "Inspect approved targets" : "Inspect draft targets"}</Link></article>)}
    </main>
    </ParentShell>
  );
}
