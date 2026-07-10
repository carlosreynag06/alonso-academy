import type { ReactNode } from "react";
import { CheckIcon, ClockIcon, LockIcon } from "@/components/icons";
import styles from "./ui.module.css";

const icons = { ready: CheckIcon, waiting: ClockIcon, locked: LockIcon };

export function StatusBadge({ status, children }: { status: keyof typeof icons; children: ReactNode }) {
  const Icon = icons[status];
  return <span className={`${styles.badge} ${styles[`badge_${status}`]}`}><Icon size={15} />{children}</span>;
}
