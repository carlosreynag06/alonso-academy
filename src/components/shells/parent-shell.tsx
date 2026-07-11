import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, HomeIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { AcademyMark } from "@/components/ui/academy-mark";
import styles from "./shells.module.css";

export function ParentShell({ children, identity }: { children: ReactNode; identity?: string }) {
  return <div className={styles.parentShell}><header className={styles.parentBar}><Link className={styles.brandLink} href="/parent"><AcademyMark compact /><span><strong>Alonso Academy</strong><small>Parent workspace</small></span></Link><p className={styles.navLabel}>Workspace</p><nav aria-label="Parent navigation"><Link href="/parent"><HomeIcon size={18} /><span>Overview</span></Link><Link href="/parent/curriculum"><BookIcon size={18} /><span>Curriculum</span></Link><Link href="/parent/generation"><SparkIcon size={18} /><span>Generation studio</span></Link></nav><div className={styles.railFooter}><p><i />Private family app</p><div className={styles.identity}><ShieldIcon size={17} /><span>{identity ?? "Protected"}</span></div></div></header>{children}</div>;
}
