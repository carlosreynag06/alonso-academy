import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookIcon, CheckIcon, SoundIcon, SparkIcon } from "@/components/icons";
import { ParentShell } from "@/components/shells/parent-shell";
import { getParentAccessState } from "@/lib/auth/parent";
import { getCurriculumUnit } from "@/lib/curriculum/repository";
import { approveCurriculumUnit } from "../actions";
import styles from "../curriculum.module.css";

export const metadata: Metadata = { title: "Curriculum Unit Review | Alonso Academy" };

export default async function CurriculumUnitPage({ params, searchParams }: { params: Promise<{ unitId: string }>; searchParams: Promise<{ approved?: string; error?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  const [{ unitId }, query] = await Promise.all([params, searchParams]);
  const data = await getCurriculumUnit(unitId).catch(() => notFound());

  return <ParentShell identity={access.email}><main className={styles.page} id="main-content">
    <Link className={styles.back} href="/parent/curriculum">← Curriculum map</Link>
    <header className={styles.unitHeader}><div className={styles.unitMonogram}>A<span>U1</span></div><div><p className={styles.kicker}>Parent curriculum review</p><h1>{data.unit.title}</h1><p>{data.unit.description}</p></div><span className={data.unit.status === "approved" ? styles.approvedStatus : styles.draftStatus}>{data.unit.status}</span></header>
    {query.approved && <p className={styles.success}><CheckIcon size={17} />The pilot scope is approved and recorded.</p>}{query.error && <p className={styles.failure}>Approval was not recorded. Confirm the reason and current draft state.</p>}

    <section className={styles.scopeIntro}><p className={styles.kicker}>Instructional boundary</p><h2>Exactly what this unit may teach</h2><p>Review the complete scope below. Approval activates these targets together; nothing outside them becomes available to generation.</p></section>
    <div className={styles.targetMatrix}>
      <section className={`${styles.targetGroup} ${styles.targetMint}`}><header><span><SparkIcon size={18} /></span><div><p>01</p><h2>Oral vocabulary</h2></div><b>{data.vocabulary.length}</b></header><ul>{data.vocabulary.map((item) => <li key={item.id}><strong>{item.canonical_text}</strong><span>{item.communication_function}</span></li>)}</ul></section>
      <section className={`${styles.targetGroup} ${styles.targetCoral}`}><header><span><BookIcon size={18} /></span><div><p>02</p><h2>Sentence frames</h2></div><b>{data.frames.length}</b></header><ul>{data.frames.map((item) => <li key={item.id}><strong>{item.frame}</strong><span>{item.communication_function}</span></li>)}</ul></section>
      <section className={`${styles.targetGroup} ${styles.targetGold}`}><header><span><SoundIcon size={18} /></span><div><p>03</p><h2>Sound anchors</h2></div><b>{data.phonics.length}</b></header><ul>{data.phonics.map((item) => <li key={item.id}><strong>{item.phoneme} → {item.grapheme}</strong><span>Recognition only</span></li>)}</ul></section>
      <section className={`${styles.targetGroup} ${styles.targetBlue}`}><header><span><CheckIcon size={18} /></span><div><p>04</p><h2>Writing demand</h2></div><b>{data.writing.length}</b></header><ul>{data.writing.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.demand}</span></li>)}</ul></section>
    </div>

    <section className={styles.approval}><div><p className={styles.kicker}>Parent decision</p><h2>{data.unit.status === "draft" ? "Make this Alonso’s active boundary?" : "This boundary is approved."}</h2><p>{data.unit.status === "draft" ? "Your reason becomes part of the permanent decision record. Approval unlocks weekly planning, not automatic publication." : "Generation may use these targets. Every plan and lesson still needs its own review."}</p></div>{data.unit.status === "draft" ? <form action={approveCurriculumUnit}><input type="hidden" name="unitId" value={data.unit.id} /><label htmlFor="reason">Decision note</label><textarea id="reason" name="reason" minLength={10} required placeholder="Why is this scope appropriate for Alonso?" /><button type="submit">Approve Unit 1 <span>→</span></button></form> : <div className={styles.approvedSeal}><CheckIcon size={24} /><strong>Approved</strong></div>}<div className={styles.approvalRings} aria-hidden="true"><i /><i /></div></section>
  </main></ParentShell>;
}
