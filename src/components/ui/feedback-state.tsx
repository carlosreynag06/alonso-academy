import { BookIcon, LockIcon, SparkIcon } from "@/components/icons";
import { ActionLink } from "./action-link";
import styles from "./ui.module.css";

const icons = { empty: BookIcon, error: LockIcon, calm: SparkIcon };

export function FeedbackState({ eyebrow, title, description, tone = "empty", action }: { eyebrow: string; title: string; description: string; tone?: keyof typeof icons; action?: { href: string; label: string } }) {
  const Icon = icons[tone];
  return (
    <section className={styles.feedback} aria-labelledby="feedback-title">
      <span className={styles.feedbackIcon}><Icon size={28} /></span>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="feedback-title">{title}</h1>
      <p>{description}</p>
      {action && <ActionLink href={action.href}>{action.label}</ActionLink>}
    </section>
  );
}
