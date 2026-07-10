import type { ReactNode } from "react";
import { AcademyMark } from "@/components/ui/academy-mark";
import styles from "./shells.module.css";

export function ChildShell({ children }: { children: ReactNode }) {
  return <div className={styles.childShell}><header className={styles.childBar}><div className={styles.brandLink}><AcademyMark compact /><span><strong>Alonso Academy</strong><small>My learning space</small></span></div><span className={styles.childName}>Alonso</span></header>{children}</div>;
}
