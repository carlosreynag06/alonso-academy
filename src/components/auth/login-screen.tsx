import { redirect } from "next/navigation";
import { BookIcon, LockIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { AcademyMark } from "@/components/ui/academy-mark";
import { getSignedInDestination } from "@/lib/auth/child";
import { getParentAccessState } from "@/lib/auth/parent";
import { signInWithPassword } from "@/app/login/actions";
import styles from "@/app/login/login.module.css";

export async function LoginScreen({ error }: { error?: string }) {
  const parent = await getParentAccessState();
  if (parent.status === "ready") redirect("/parent");
  const destination = await getSignedInDestination();
  if (destination) redirect(destination);

  const message = error === "configuration"
    ? "Login is not fully configured. Ask the administrator to check the local account settings."
    : error
      ? "That username or password was not accepted. Check both fields and try again."
      : null;

  return <main className={styles.page} id="main-content">
    <section className={styles.brandPanel} aria-label="Alonso Academy introduction">
      <div className={styles.brand}><AcademyMark /><div><strong>Alonso Academy</strong><span>Private learning application</span></div></div>
      <div className={styles.brandCopy}><p className={styles.eyebrow}>One family · one learning path</p><h1>Welcome back to<br /><em>your academy.</em></h1><p>A focused space where every lesson follows an approved curriculum and every next step stays intentional.</p></div>
      <div className={styles.promise}><ShieldIcon size={22} /><span><strong>Private by design</strong><small>Only the two approved family accounts can enter.</small></span></div>
      <div className={styles.constellation} aria-hidden="true"><span><SparkIcon size={23} /></span><i /><i /><i /></div>
    </section>

    <section className={styles.loginPanel} aria-labelledby="login-title">
      <div className={styles.loginCard}>
        <span className={styles.lockMark}><LockIcon size={23} /></span>
        <p className={styles.eyebrow}>Secure sign in</p>
        <h2 id="login-title">Enter the academy</h2>
        <p className={styles.intro}>Parents and students use the same private entrance.</p>
        {message && <p className={styles.error} role="alert">{message}</p>}
        <form action={signInWithPassword} className={styles.form}>
          <label htmlFor="identifier">Email or username</label>
          <input id="identifier" name="identifier" type="text" autoComplete="username" required autoFocus placeholder="Your email or username" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={6} required placeholder="Your password" />
          <button type="submit">Sign in <span aria-hidden="true">→</span></button>
        </form>
        <div className={styles.roleHints}><span><ShieldIcon size={16} />Parent workspace</span><span><BookIcon size={16} />Alonso&apos;s lessons</span></div>
      </div>
      <p className={styles.help}>This application does not offer public registration or password recovery.</p>
    </section>
  </main>;
}
