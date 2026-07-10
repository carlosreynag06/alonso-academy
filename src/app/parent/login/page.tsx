import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AcademyMark } from "@/components/ui/academy-mark";
import { StatusBadge } from "@/components/ui/status-badge";
import { getParentAccessState } from "@/lib/auth/parent";
import { requestMagicLink } from "./actions";
import styles from "../parent.module.css";

export const metadata: Metadata = { title: "Parent Sign In | Alonso Academy" };

export default async function ParentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const [state, query] = await Promise.all([getParentAccessState(), searchParams]);
  if (state.status === "ready") redirect("/parent");

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.authPanel} aria-labelledby="login-title">
        <AcademyMark />
        <div className={styles.badgeSpace}><StatusBadge status="locked">Private parent access</StatusBadge></div>
        <p className={styles.eyebrow}>Parent access</p>
        <h1 id="login-title">Sign in securely</h1>
        <p className={styles.lede}>Enter the single approved parent email. Supabase will send a one-time sign-in link.</p>

        {query.sent === "1" && <p className={styles.notice}>If that address is approved, check its inbox for a sign-in link.</p>}
        {query.error && <p className={styles.error}>The sign-in link could not be sent. Check Supabase Auth setup and try again.</p>}
        {state.status === "configuration_required" && <p className={styles.error}>Parent access is waiting for the local allowlist email.</p>}

        <form action={requestMagicLink} className={styles.form}>
          <label htmlFor="email">Parent email</label>
          <input id="email" name="email" type="email" autoComplete="email" required disabled={state.status === "configuration_required"} />
          <button type="submit" disabled={state.status === "configuration_required"}>Send secure link</button>
        </form>
        <Link className={styles.textLink} href="/">Return to academy home</Link>
      </section>
    </main>
  );
}
