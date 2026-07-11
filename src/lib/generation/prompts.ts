import "server-only";

import type { ArtifactKind, CurriculumScope } from "./contracts";
import { PROMPT_VERSION } from "./models";

const SYSTEM_RULES = [
  "You create bounded instructional material for one six-year-old learner.",
  "The approved curriculum snapshot is authoritative. Never introduce an unapproved target.",
  "Do not infer mastery, publish content, advance phases, or address the child outside the requested artifact.",
  "Use warm, concrete American English without shame, competition, rewards, or open-ended chat.",
  "Return only the required structured object. Do not include hidden reasoning.",
];

export function buildGenerationPrompt(input: {
  kind: ArtifactKind;
  scope: CurriculumScope;
  durationMinutes: number;
  request: string;
  approvedWeeklyPlan?: unknown;
  evidence?: unknown;
}) {
  return {
    version: PROMPT_VERSION,
    system: SYSTEM_RULES.join("\n"),
    user: JSON.stringify({
      task: input.kind,
      curriculum: input.scope,
      durationMinutes: input.durationMinutes,
      parentRequest: input.request,
      approvedWeeklyPlan: input.approvedWeeklyPlan ?? null,
      evidence: input.evidence ?? null,
      outputPolicy: {
        approvedTargetIdsOnly: true,
        bannedTargetIds: input.scope.bannedTargetIds,
        preserveSupportContext: true,
        parentApprovalStillRequired: true,
      },
    }),
  };
}
