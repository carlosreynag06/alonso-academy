import "server-only";

import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ArtifactRow = Database["public"]["Tables"]["generated_artifacts"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["lesson_assignments"]["Row"];
type ChildRow = Database["public"]["Tables"]["child_profiles"]["Row"];
type SlotRow = Database["public"]["Tables"]["week_day_slots"]["Row"];
type WeekRow = Database["public"]["Tables"]["learning_weeks"]["Row"];

const FIXTURE_REASON = "Publication controls require hosted Recovery 1 records. Development fixtures remain read-only and never publish a lesson.";
const STORAGE_REASON = "Publication records are unavailable. Apply the Recovery 1 database migration before using these controls.";

export type PublicationBoard =
  | { available: false; reason: string }
  | {
      available: true;
      child: ChildRow | null;
      weeks: WeekRow[];
      currentWeek: WeekRow | null;
      slots: SlotRow[];
      assignments: AssignmentRow[];
    };

export type ArtifactPublicationState =
  | { available: false; reason: string }
  | {
      available: true;
      artifact: ArtifactRow;
      child: ChildRow | null;
      curriculumApproved: boolean;
      learningWeek: WeekRow | null;
      weeklyPlan: ArtifactRow | null;
      slots: SlotRow[];
      slot: SlotRow | null;
      assignments: AssignmentRow[];
      artifactAssignments: AssignmentRow[];
      activeSlotAssignment: AssignmentRow | null;
      replacementCandidates: ArtifactRow[];
    };

const activeAssignmentStatuses = new Set<AssignmentRow["status"]>(["assigned", "scheduled", "published"]);

export async function getPublicationBoard(): Promise<PublicationBoard> {
  if (await getDevelopmentFixtureSource()) return { available: false, reason: FIXTURE_REASON };

  const supabase = await createClient();
  const [weeksResult, slotsResult, assignmentsResult, childResult] = await Promise.all([
    supabase.from("learning_weeks").select("*").order("created_at", { ascending: false }),
    supabase.from("week_day_slots").select("*").order("day_number", { ascending: true }),
    supabase.from("lesson_assignments").select("*").order("created_at", { ascending: false }),
    supabase.from("child_profiles").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  if (weeksResult.error || slotsResult.error || assignmentsResult.error || childResult.error) {
    return { available: false, reason: STORAGE_REASON };
  }

  const currentWeek =
    weeksResult.data.find((week) => week.status === "active") ??
    weeksResult.data.find((week) => week.status === "planned") ??
    weeksResult.data.find((week) => week.status !== "archived") ??
    null;
  const slots = currentWeek ? slotsResult.data.filter((slot) => slot.learning_week_id === currentWeek.id) : [];
  const slotIds = new Set(slots.map((slot) => slot.id));

  return {
    available: true,
    child: childResult.data,
    weeks: weeksResult.data,
    currentWeek,
    slots,
    assignments: assignmentsResult.data.filter((assignment) => slotIds.has(assignment.week_day_slot_id)),
  };
}

export async function getArtifactPublicationState(artifactId: string): Promise<ArtifactPublicationState> {
  if (await getDevelopmentFixtureSource()) return { available: false, reason: FIXTURE_REASON };

  const supabase = await createClient();
  const [artifactResult, childResult] = await Promise.all([
    supabase.from("generated_artifacts").select("*").eq("id", artifactId).single(),
    supabase.from("child_profiles").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  if (artifactResult.error || childResult.error) return { available: false, reason: STORAGE_REASON };
  const artifact = artifactResult.data;
  const unitResult = await supabase.from("curriculum_units").select("status").eq("id", artifact.curriculum_unit_id).maybeSingle();
  if (unitResult.error) return { available: false, reason: STORAGE_REASON };

  let learningWeek: WeekRow | null = null;
  let weeklyPlan: ArtifactRow | null = artifact.kind === "weekly_plan" ? artifact : null;
  let slots: SlotRow[] = [];
  let slot: SlotRow | null = null;

  if (artifact.kind === "weekly_plan") {
    const weekResult = await supabase
      .from("learning_weeks")
      .select("*")
      .eq("weekly_plan_artifact_id", artifact.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (weekResult.error) return { available: false, reason: STORAGE_REASON };
    learningWeek = weekResult.data;

    if (learningWeek) {
      const slotsResult = await supabase
        .from("week_day_slots")
        .select("*")
        .eq("learning_week_id", learningWeek.id)
        .order("day_number", { ascending: true });
      if (slotsResult.error) return { available: false, reason: STORAGE_REASON };
      slots = slotsResult.data;
    }
  } else if (artifact.week_day_slot_id) {
    const slotResult = await supabase.from("week_day_slots").select("*").eq("id", artifact.week_day_slot_id).maybeSingle();
    if (slotResult.error) return { available: false, reason: STORAGE_REASON };
    slot = slotResult.data;

    if (slot) {
      const [weekResult, slotsResult] = await Promise.all([
        supabase.from("learning_weeks").select("*").eq("id", slot.learning_week_id).maybeSingle(),
        supabase.from("week_day_slots").select("*").eq("learning_week_id", slot.learning_week_id).order("day_number", { ascending: true }),
      ]);
      if (weekResult.error || slotsResult.error) return { available: false, reason: STORAGE_REASON };
      learningWeek = weekResult.data;
      slots = slotsResult.data;
    }
  }

  if (learningWeek && !weeklyPlan) {
    const planResult = await supabase.from("generated_artifacts").select("*").eq("id", learningWeek.weekly_plan_artifact_id).maybeSingle();
    if (planResult.error) return { available: false, reason: STORAGE_REASON };
    weeklyPlan = planResult.data;
  }

  const slotIds = slots.map((candidate) => candidate.id);
  let assignments: AssignmentRow[] = [];
  if (slotIds.length > 0) {
    const assignmentsResult = await supabase
      .from("lesson_assignments")
      .select("*")
      .in("week_day_slot_id", slotIds)
      .order("created_at", { ascending: false });
    if (assignmentsResult.error) return { available: false, reason: STORAGE_REASON };
    assignments = assignmentsResult.data;
  }

  let replacementCandidates: ArtifactRow[] = [];
  if (slot) {
    const candidatesResult = await supabase
      .from("generated_artifacts")
      .select("*")
      .eq("week_day_slot_id", slot.id)
      .eq("status", "approved")
      .eq("binding_status", "valid")
      .eq("runtime_ready", true)
      .neq("id", artifact.id)
      .order("version", { ascending: false });
    if (candidatesResult.error) return { available: false, reason: STORAGE_REASON };
    replacementCandidates = candidatesResult.data;
  }

  const artifactAssignments = assignments.filter((assignment) => assignment.lesson_artifact_id === artifact.id);
  const activeSlotAssignment = slot
    ? assignments.find((assignment) => assignment.week_day_slot_id === slot.id && activeAssignmentStatuses.has(assignment.status)) ?? null
    : null;

  return {
    available: true,
    artifact,
    child: childResult.data,
    curriculumApproved: unitResult.data?.status === "approved",
    learningWeek,
    weeklyPlan,
    slots,
    slot,
    assignments,
    artifactAssignments,
    activeSlotAssignment,
    replacementCandidates,
  };
}
