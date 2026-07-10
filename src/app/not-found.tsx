import { FeedbackState } from "@/components/ui/feedback-state";
import styles from "@/components/ui/ui.module.css";

export default function NotFound() {
  return <main className={styles.loadingPage} id="main-content"><FeedbackState eyebrow="Page not found" title="That path is not part of the academy" description="Return to the private academy entrance and choose Alonso or Parent." action={{ href: "/", label: "Return home" }} /></main>;
}
