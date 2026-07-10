import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import styles from "./ui.module.css";

export function ActionLink({ href, children, tone = "primary" }: { href: string; children: ReactNode; tone?: "primary" | "light" | "quiet" }) {
  return <Link className={`${styles.actionLink} ${styles[tone]}`} href={href}>{children}{tone !== "quiet" && <ArrowRightIcon size={18} />}</Link>;
}
