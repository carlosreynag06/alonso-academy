import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, HomeIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { AcademyMark } from "@/components/ui/academy-mark";
import styles from "./shells.module.css";

export function ParentShell({ children, identity }: { children: ReactNode; identity?: string }) {
  return <div className={styles.parentShell}><header className={styles.parentBar}><Link aria-label="Alonso Academy overview" className={styles.brandLink} href="/parent"><AcademyMark compact /></Link><nav aria-label="Parent navigation"><Link aria-label="Overview" data-label="Overview" href="/parent"><HomeIcon size={20} /></Link><Link aria-label="Curriculum" data-label="Curriculum" href="/parent/curriculum"><BookIcon size={20} /></Link><Link aria-label="Generation studio" data-label="Generation" href="/parent/generation"><SparkIcon size={20} /></Link></nav><div className={styles.railFooter}><span className={styles.privateDot} title="Private family application" /><div className={styles.identity} title={identity ?? "Protected parent"}><ShieldIcon size={17} /></div></div></header>{children}</div>;
}
