import type { ReactNode } from "react";
import { BookIcon, SoundIcon } from "@/components/icons";
import styles from "./ui.module.css";

export function StoryFrame({ type, title, children, visual }: { type: "listening" | "decodable"; title: string; children: ReactNode; visual: ReactNode }) {
  const Icon = type === "listening" ? SoundIcon : BookIcon;
  return <section className={styles.storyFrame} aria-label={`${type === "listening" ? "Listening story" : "Read it yourself"}: ${title}`}><div className={styles.storyVisual}>{visual}</div><div className={styles.storyCopy}><span className={styles.storyType}><Icon size={17} />{type === "listening" ? "Listening story" : "Read it yourself"}</span><h2>{title}</h2><div>{children}</div></div></section>;
}
