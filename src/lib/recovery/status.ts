import "server-only";

import { getElevenLabsConfiguration } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { getFixtureRecoveryBaseline } from "@/lib/development-fixtures/adapters";

export const ACTIVE_RECOVERY = {
  phase: "Recovery 0",
  title: "Truth reset, fixtures, and acceptance contract",
  status: "implemented" as const,
  productMutationsLocked: true,
  childDeliveryLocked: true,
  nextBlocker: "Complete the authoritative publication and evidence model in Recovery 1.",
};

export const RECOVERY_STATUS_DEFINITIONS = [
  { status: "scaffolded", meaning: "Code or contracts exist, but the product outcome is incomplete or unverified." },
  { status: "blocked", meaning: "A required dependency, approval, provider, or product capability is absent." },
  { status: "implemented", meaning: "The authorized scope is built and documented, but final acceptance evidence is not yet complete." },
  { status: "verified", meaning: "The phase completion gate has objective verification evidence." },
  { status: "pilot-ready", meaning: "The complete private pilot passed end-to-end acceptance and was explicitly accepted by the parent." },
] as const;

export function recoveryLockMessage() {
  return "Product mutations are paused during Recovery 0 so incomplete scaffolding cannot create new pilot decisions.";
}

export async function getRecoveryBaseline() {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureRecoveryBaseline(fixture.state);
  const supabase = await createClient();
  const [unit, artifacts, attempts, evidence, mastery, reviews, providerEvents] = await Promise.all([
    supabase.from("curriculum_units").select("id, code, status, approved_at").eq("code", "A-U1").maybeSingle(),
    supabase.from("generated_artifacts").select("kind, status, day_number"),
    supabase.from("lesson_attempts").select("id, status"),
    supabase.from("activity_evidence").select("id", { count: "exact", head: true }),
    supabase.from("mastery_records").select("id", { count: "exact", head: true }),
    supabase.from("review_schedules").select("id", { count: "exact", head: true }),
    supabase.from("provider_metadata").select("provider, status"),
  ]);
  const firstError = unit.error ?? artifacts.error ?? attempts.error ?? evidence.error ?? mastery.error ?? reviews.error ?? providerEvents.error;
  if (firstError) throw firstError;

  const artifactCounts = (artifacts.data ?? []).reduce<Record<string, number>>((counts, artifact) => {
    const key = `${artifact.kind}:${artifact.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const elevenLabs = getElevenLabsConfiguration();
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return {
    curriculum: unit.data ?? null,
    artifactCounts,
    attempts: attempts.data ?? [],
    evidenceCount: evidence.count ?? 0,
    masteryCount: mastery.count ?? 0,
    reviewCount: reviews.count ?? 0,
    providerEvents: providerEvents.data ?? [],
    providers: {
      supabase: true,
      openAi: openAiConfigured,
      elevenLabsKey: Boolean(elevenLabs.apiKey),
      approvedVoice: Boolean(elevenLabs.voiceId),
      audioReady: elevenLabs.ready,
    },
  };
}
