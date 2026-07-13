import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { getFixtureCurriculumOverview, getFixtureCurriculumUnit } from "@/lib/development-fixtures/adapters";

export async function getCurriculumOverview() {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureCurriculumOverview(fixture.state);
  const supabase = await createClient();
  const [phasesResult, unitsResult] = await Promise.all([
    supabase.from("curriculum_phases").select("*").order("sequence"),
    supabase.from("curriculum_units").select("*").order("code"),
  ]);

  if (phasesResult.error) throw phasesResult.error;
  if (unitsResult.error) throw unitsResult.error;
  return { phases: phasesResult.data, units: unitsResult.data };
}

export async function getCurriculumUnit(unitId: string) {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureCurriculumUnit(fixture.state, unitId);
  const supabase = await createClient();
  const [unit, vocabulary, frames, phonics, writing] = await Promise.all([
    supabase.from("curriculum_units").select("*").eq("id", unitId).single(),
    supabase.from("vocabulary_items").select("*").eq("unit_id", unitId).order("priority").order("canonical_text"),
    supabase.from("sentence_frames").select("*").eq("unit_id", unitId).order("frame"),
    supabase.from("phonics_targets").select("*").eq("unit_id", unitId).order("grapheme"),
    supabase.from("writing_targets").select("*").eq("unit_id", unitId).order("title"),
  ]);

  if (unit.error) throw unit.error;
  if (!unit.data) throw new Error("Curriculum unit not found.");
  for (const result of [vocabulary, frames, phonics, writing]) {
    if (result.error) throw result.error;
  }

  return {
    unit: unit.data,
    vocabulary: vocabulary.data ?? [],
    frames: frames.data ?? [],
    phonics: phonics.data ?? [],
    writing: writing.data ?? [],
  };
}
