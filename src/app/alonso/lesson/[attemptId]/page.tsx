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
  const data = await getChildLessonAttempt(attemptId).catch(() => notFound());
  if (data.attempt.status === "completed") redirect("/alonso");
  return <LessonPlayer attemptId={data.attempt.id} lesson={data.lesson.content} initialIndex={data.attempt.currentBlockIndex} initialBreakCount={data.attempt.breakCount} fixture={access.fixture} />;
}
