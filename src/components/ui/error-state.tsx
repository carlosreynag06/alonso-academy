"use client";

import { LockIcon } from "@/components/icons";
import styles from "./ui.module.css";

export function ErrorState({ reset, title = "This view needs another try", description = "Your existing information is safe. Try loading this page again." }: { reset: () => void; title?: string; description?: string }) {
  return <main className={styles.loadingPage} id="main-content"><section className={styles.feedback} role="alert" aria-labelledby="error-title"><span className={styles.feedbackIcon}><LockIcon size={28} /></span><p className={styles.eyebrow}>Something interrupted the page</p><h1 id="error-title">{title}</h1><p>{description}</p><button className={styles.retryButton} type="button" onClick={reset}>Try again</button></section></main>;
}
