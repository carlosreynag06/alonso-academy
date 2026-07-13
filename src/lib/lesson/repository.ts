import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { getFixtureChildLessonAttempt, getFixtureChildLessonHome } from "@/lib/development-fixtures/adapters";
import { childAttemptRuntimePayloadSchema, childLessonHomeSchema } from "./runtime-contracts";

export async function getChildLessonHome() {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureChildLessonHome(fixture.state);
  const supabase = await createClient();
  const result = await supabase.rpc("get_child_lesson_home");
  if (result.error) throw result.error;
  return childLessonHomeSchema.parse(result.data);
}

export async function getChildLessonAttempt(attemptId: string) {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureChildLessonAttempt(fixture.state, attemptId);
  const supabase = await createClient();
  const result = await supabase.rpc("get_child_lesson_attempt", { p_attempt_id: attemptId });
  if (result.error) throw result.error;
  return childAttemptRuntimePayloadSchema.parse(result.data);
}
