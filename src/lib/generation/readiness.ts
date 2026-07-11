import "server-only";

import { INSTRUCTIONAL_MODEL, INSTRUCTIONAL_REASONING_EFFORT } from "./models";

export type GenerationReadiness = {
  providerConfigured: boolean;
  curriculumApproved: boolean;
  ready: boolean;
  model: typeof INSTRUCTIONAL_MODEL;
  reasoningEffort: typeof INSTRUCTIONAL_REASONING_EFFORT;
  blockers: string[];
};

export function getProviderReadiness(curriculumApproved = false): GenerationReadiness {
  const providerConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const blockers = [
    ...(!providerConfigured ? ["OpenAI project key is not configured."] : []),
    ...(!curriculumApproved ? ["Phase A / Unit 1 still requires parent curriculum approval."] : []),
  ];
  return {
    providerConfigured,
    curriculumApproved,
    ready: blockers.length === 0,
    model: INSTRUCTIONAL_MODEL,
    reasoningEffort: INSTRUCTIONAL_REASONING_EFFORT,
    blockers,
  };
}
