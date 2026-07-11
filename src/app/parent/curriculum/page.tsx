import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookIcon, CheckIcon, MicIcon, SoundIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { getParentAccessState } from "@/lib/auth/parent";
import { getCurriculumOverview } from "@/lib/curriculum/repository";
import styles from "./curriculum.module.css";

export const metadata: Metadata = { title: "Curriculum | Alonso Academy" };

const phaseIcons = [SoundIcon, SparkIcon, MicIcon, BookIcon, CheckIcon, BookIcon];
const phaseColors = ["mint", "coral", "gold", "blue", "violet", "rose"] as const;

export default async function CurriculumPage() {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  const { phases, units } = await getCurriculumOverview();

  return <ParentShell identity={access.email}><main className={styles.page} id="main-content">
    <header className={styles.header}><div><p className={styles.kicker}>Learning architecture</p><h1>Six phases.<br /><em>One deliberate path.</em></h1><p>The sequence stays visible so every new skill has a reason, a prerequisite, and a clear place in Alonso’s journey.</p></div><div className={styles.compass} aria-hidden="true"><span>A</span><i>B</i><i>C</i><i>D</i><i>E</i><i>F</i></div></header>

    <section className={styles.phaseMap} aria-label="Curriculum phases">
      {phases.map((phase, index) => { const Icon = phaseIcons[index]; return <article className={`${styles.phase} ${styles[phaseColors[index]]} ${phase.code === "A" ? styles.active : ""}`} key={phase.code}><div className={styles.phaseMarker}><Icon size={19} /><b>{phase.code}</b></div><div className={styles.phaseCopy}><span>Phase {phase.code} · {String(index + 1).padStart(2, "0")}</span><h2>{phase.name}</h2><p>{phase.purpose}</p></div><div className={styles.phaseState}>{phase.code === "A" ? <><i />Pilot active</> : "Sequenced"}</div></article>; })}
    </section>

    {units.map((unit) => <section className={styles.pilot} key={unit.id}><div className={styles.pilotCode}><span>A</span><strong>U1</strong></div><div className={styles.pilotCopy}><p className={styles.kicker}>Current pilot unit</p><h2>{unit.title}</h2><p>{unit.description}</p><div><span>{unit.status}</span><span>Version {unit.version}</span></div></div><Link href={`/parent/curriculum/${unit.id}`}>{unit.status === "approved" ? "Inspect approved scope" : "Review scope"}<b>→</b></Link><div className={styles.pilotDecoration} aria-hidden="true"><i /><i /><i /></div></section>)}
  </main></ParentShell>;
}
