import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, HomeIcon, ShieldIcon } from "@/components/icons";
import { AcademyMark } from "@/components/ui/academy-mark";
import styles from "./shells.module.css";

export function ParentShell({ children, identity }: { children: ReactNode; identity?: string }) {
  return <div className={styles.parentShell}><header className={styles.parentBar}><Link className={styles.brandLink} href="/"><AcademyMark compact /><span><strong>Alonso Academy</strong><small>Parent workspace</small></span></Link><nav aria-label="Parent navigation"><Link href="/parent"><HomeIcon size={18} />Overview</Link><Link href="/parent/curriculum"><BookIcon size={18} />Curriculum</Link></nav><div className={styles.identity}><ShieldIcon size={17} /><span>{identity ?? "Protected"}</span></div></header>{children}</div>;
}
