"use server";

import { redirect } from "next/navigation";
import { getChildAccessState } from "@/lib/auth/child";
import { createClient } from "@/lib/supabase/server";

export async function startLesson(formData: FormData) {
  const access = await getChildAccessState();
  if (access.status !== "ready") redirect("/login");
  const lessonId = formData.get("lessonId")?.toString();
  if (!lessonId) redirect("/alonso?error=lesson");
  const supabase = await createClient();
  const result = await supabase.rpc("start_child_lesson", { p_lesson_id: lessonId });
  if (result.error || !result.data) redirect("/alonso?error=lesson");
  redirect(`/alonso/lesson/${result.data.id}`);
}
