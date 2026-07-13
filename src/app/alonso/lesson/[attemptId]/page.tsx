import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { getChildAccessState } from "@/lib/auth/child";
import { getChildLessonAttempt } from "@/lib/lesson/repository";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";

export const metadata: Metadata = { title: "Today’s Lesson | Alonso Academy" };

export default async function LessonPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const access = await getChildAccessState();
  if (access.status !== "ready") redirect("/login");
  if (ACTIVE_RECOVERY.childDeliveryLocked && !access.fixture) redirect("/alonso?error=recovery_lock");
  const { attemptId } = await params;
  const payload = await getChildLessonAttempt(attemptId).catch(() => notFound());
  return <LessonPlayer
    attemptId={payload.snapshot.attemptId}
    lesson={payload.lesson}
    initialSnapshot={payload.snapshot}
    fixture={access.fixture}
  />;
}
