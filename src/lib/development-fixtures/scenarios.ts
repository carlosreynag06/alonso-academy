import "server-only";

import type { FixtureRole, FixtureScenarioKey } from "./contracts";

export type FixtureScenarioDefinition = {
  key: FixtureScenarioKey;
  label: string;
  description: string;
  role: FixtureRole;
  destination: "/parent" | "/parent/generation" | "/alonso";
};

export const fixtureScenarios = [
  {
    key: "parent-baseline",
    label: "Parent baseline",
    description: "Approved synthetic curriculum and week with all five lesson lifecycle examples.",
    role: "parent",
    destination: "/parent",
  },
  {
    key: "curriculum-blocked",
    label: "Curriculum blocked",
    description: "Draft curriculum with weekly planning unavailable and no fabricated approval.",
    role: "parent",
    destination: "/parent",
  },
  {
    key: "approved-week",
    label: "Approved week",
    description: "Approved synthetic curriculum and five-day plan, ready for lesson production states.",
    role: "parent",
    destination: "/parent/generation",
  },
  {
    key: "review-queue",
    label: "Review queue",
    description: "A validation failure and a validated lesson waiting for parent judgment.",
    role: "parent",
    destination: "/parent/generation",
  },
  {
    key: "alonso-available",
    label: "Alonso: lesson available",
    description: "One approved synthetic lesson is available with no attempt started.",
    role: "child",
    destination: "/alonso",
  },
  {
    key: "alonso-paused",
    label: "Alonso: paused lesson",
    description: "A lesson resumes from a saved block with partial evidence and one break.",
    role: "child",
    destination: "/alonso",
  },
  {
    key: "alonso-completed",
    label: "Alonso: completed lesson",
    description: "A completed attempt with mixed independent and supported evidence.",
    role: "child",
    destination: "/alonso",
  },
  {
    key: "openai-unavailable",
    label: "OpenAI unavailable",
    description: "Parent-safe provider failure without making a network request or changing approvals.",
    role: "parent",
    destination: "/parent/generation",
  },
  {
    key: "tts-unavailable",
    label: "TTS unavailable",
    description: "The lesson audio provider fails safely and the learning state remains intact.",
    role: "child",
    destination: "/alonso",
  },
  {
    key: "stt-silence",
    label: "STT silence",
    description: "Speech processing returns silence rather than treating it as an incorrect answer.",
    role: "child",
    destination: "/alonso",
  },
  {
    key: "stt-unavailable",
    label: "STT unavailable",
    description: "Speech processing fails safely with a non-voice fallback available.",
    role: "child",
    destination: "/alonso",
  },
] as const satisfies readonly FixtureScenarioDefinition[];

export function getFixtureScenario(key: FixtureScenarioKey) {
  return fixtureScenarios.find((scenario) => scenario.key === key)!;
}
