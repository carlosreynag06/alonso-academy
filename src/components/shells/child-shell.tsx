import type { ReactNode } from "react";
import { AcademyMark } from "@/components/ui/academy-mark";
import { signOut } from "@/app/login/actions";
import styles from "./shells.module.css";

export function ChildShell({ children }: { children: ReactNode }) {
  return <div className={styles.childShell}><header className={styles.childBar}><div className={styles.brandLink}><AcademyMark compact /><span><strong>Alonso Academy</strong><small>My learning space</small></span></div><div className={styles.childIdentity}><span className={styles.childName}>Alonso</span><form action={signOut}><button type="submit">Sign out</button></form></div></header>{children}</div>;
}
