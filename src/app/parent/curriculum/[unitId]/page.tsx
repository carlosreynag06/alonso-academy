import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getParentAccessState } from "@/lib/auth/parent";
import { getCurriculumUnit } from "@/lib/curriculum/repository";
import { approveCurriculumUnit } from "../actions";
import styles from "../../parent.module.css";

export default async function CurriculumUnitPage({ params, searchParams }: { params: Promise<{ unitId: string }>; searchParams: Promise<{ approved?: string; error?: string }> }) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/parent/login");
  const [{ unitId }, query] = await Promise.all([params, searchParams]);
  let data;
  try { data = await getCurriculumUnit(unitId); } catch { notFound(); }

  return (
    <main className={styles.dashboard}>
      <header className={styles.sectionHeader}><div><p className={styles.eyebrow}>Parent curriculum review</p><h1>{data.unit.title}</h1></div><Link className={styles.textLink} href="/parent/curriculum">All phases</Link></header>
      {query.approved && <p className={styles.notice}>The pilot unit is approved and recorded in the audit history.</p>}
      {query.error && <p className={styles.error}>Approval was not recorded. Confirm the reason and current draft state.</p>}
      <div className={styles.detailGrid}>
        <section className={styles.detailCard}><h2>Oral vocabulary ({data.vocabulary.length})</h2><ul>{data.vocabulary.map((item) => <li key={item.id}><strong>{item.canonical_text}</strong> — {item.communication_function}</li>)}</ul></section>
        <section className={styles.detailCard}><h2>Sentence frames ({data.frames.length})</h2><ul>{data.frames.map((item) => <li key={item.id}>{item.frame}</li>)}</ul></section>
        <section className={styles.detailCard}><h2>Sound anchors ({data.phonics.length})</h2><ul>{data.phonics.map((item) => <li key={item.id}>{item.phoneme} → {item.grapheme}; recognition only</li>)}</ul></section>
        <section className={styles.detailCard}><h2>Writing demand ({data.writing.length})</h2><ul>{data.writing.map((item) => <li key={item.id}>{item.demand}</li>)}</ul></section>
      </div>
      <section className={styles.approvalPanel}><p className={styles.cardLabel}>High-impact action</p><h2>{data.unit.status === "draft" ? "Approve this pilot curriculum" : "Curriculum approved"}</h2>{data.unit.status === "draft" ? <form action={approveCurriculumUnit} className={styles.form}><input type="hidden" name="unitId" value={data.unit.id} /><label htmlFor="reason">Why is this scope appropriate for Alonso?</label><textarea id="reason" name="reason" minLength={10} required placeholder="Record the parent decision and any relevant boundary." /><button type="submit">Approve Unit 1</button></form> : <p className={styles.lede}>Approved targets can be used by later generation phases. Advancement still remains manual.</p>}</section>
    </main>
  );
}
