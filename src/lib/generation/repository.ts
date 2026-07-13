import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { getFixtureArtifactReview, getFixtureGenerationCommandCenter, getFixtureLatestApprovedWeeklyPlan } from "@/lib/development-fixtures/adapters";

export async function getGenerationCommandCenter() {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureGenerationCommandCenter(fixture.state);
  const supabase = await createClient();
  const [unitResult, artifactsResult, jobsResult] = await Promise.all([
    supabase.from("curriculum_units").select("*").eq("code", "A-U1").single(),
    supabase.from("generated_artifacts").select("*").order("created_at", { ascending: false }),
    supabase.from("generation_jobs").select("*").order("created_at", { ascending: false }).limit(12),
  ]);
  if (unitResult.error) throw unitResult.error;
  if (artifactsResult.error) throw artifactsResult.error;
  if (jobsResult.error) throw jobsResult.error;
  return { unit: unitResult.data, artifacts: artifactsResult.data, jobs: jobsResult.data };
}

export async function getArtifactReview(artifactId: string) {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureArtifactReview(fixture.state, artifactId);
  const supabase = await createClient();
  const artifactResult = await supabase.from("generated_artifacts").select("*").eq("id", artifactId).single();
  if (artifactResult.error) throw artifactResult.error;
  const [approvalsResult, childrenResult] = await Promise.all([
    supabase.from("approval_records").select("*").eq("entity_type", "generated_artifact").eq("entity_id", artifactId).order("created_at", { ascending: false }),
    supabase.from("generated_artifacts").select("*").eq("parent_artifact_id", artifactId).order("day_number"),
  ]);
  if (approvalsResult.error) throw approvalsResult.error;
  if (childrenResult.error) throw childrenResult.error;
  return { artifact: artifactResult.data, approvals: approvalsResult.data, children: childrenResult.data };
}

export async function getLatestApprovedWeeklyPlan(unitId: string) {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureLatestApprovedWeeklyPlan(fixture.state, unitId);
  const supabase = await createClient();
  const result = await supabase.from("generated_artifacts").select("*")
    .eq("curriculum_unit_id", unitId).eq("kind", "weekly_plan").eq("status", "approved")
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}
