export const INSTRUCTIONAL_MODEL = "gpt-5.5" as const;
export const SUMMARY_MODEL = "gpt-5.4-mini" as const;
export const INSTRUCTIONAL_REASONING_EFFORT = "high" as const;
export const PROMPT_VERSION = "phase4.1" as const;
export const VALIDATOR_VERSION = "phase4.1" as const;

export function assertApprovedModel(model: string, kind: "instructional" | "summary") {
  const expected = kind === "instructional" ? INSTRUCTIONAL_MODEL : SUMMARY_MODEL;
  if (model !== expected) {
    throw new Error(`Model substitution is disabled. Expected ${expected}.`);
  }
}
