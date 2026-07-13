"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getParentAccessState } from "@/lib/auth/parent";
import { ACTIVE_RECOVERY } from "@/lib/recovery/status";
import { createClient } from "@/lib/supabase/server";

export async function approveCurriculumUnit(formData: FormData) {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");
  if (ACTIVE_RECOVERY.curriculumDecisionsLocked) redirect("/parent/recovery?blocked=curriculum_decision");

  const unitId = formData.get("unitId")?.toString();
  const reason = formData.get("reason")?.toString().trim();
  if (!unitId || !reason || reason.length < 10) redirect(`/parent/curriculum/${unitId ?? ""}?error=reason`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_curriculum_unit", {
    p_unit_id: unitId,
    p_reason: reason,
  });
  if (error) redirect(`/parent/curriculum/${unitId}?error=approval`);

  revalidatePath("/parent/curriculum");
  revalidatePath(`/parent/curriculum/${unitId}`);
  redirect(`/parent/curriculum/${unitId}?approved=1`);
}
