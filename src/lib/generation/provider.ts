import "server-only";

import OpenAI, { APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { requireServerEnvironment } from "@/lib/env/server";
import { isDevelopmentFixtureRequest } from "@/lib/development-fixtures/source";
import type { ProviderResult, ValidationReport } from "./contracts";
import { validationIssueSchema } from "./contracts";
import { INSTRUCTIONAL_MODEL, INSTRUCTIONAL_REASONING_EFFORT, SUMMARY_MODEL, VALIDATOR_VERSION, assertApprovedModel } from "./models";

async function getClient() {
  if (await isDevelopmentFixtureRequest()) throw new Error("OpenAI access is forbidden while a development fixture session is active.");
  const { OPENAI_API_KEY } = requireServerEnvironment(["OPENAI_API_KEY"]);
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

function safeProviderFailure(error: unknown): ProviderResult<never> {
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) return { ok: false, category: "authentication", retryable: false, safeMessage: "OpenAI authorization failed. Check the project key." };
    if (error.status === 429) {
      const quota = error.code === "insufficient_quota";
      return { ok: false, category: quota ? "quota" : "rate_limit", retryable: !quota, safeMessage: quota ? "The OpenAI project has no available quota." : "Generation is temporarily rate-limited." };
    }
    if ((error.status ?? 0) >= 500) return { ok: false, category: "unavailable", retryable: true, safeMessage: "OpenAI is temporarily unavailable. The existing approved content is unchanged." };
  }
  if (error instanceof z.ZodError) return { ok: false, category: "malformed_output", retryable: true, safeMessage: "The provider response did not match the required schema." };
  return { ok: false, category: "unknown", retryable: false, safeMessage: "Generation failed safely. No draft was published." };
}

export async function requestStructuredArtifact<T>(input: {
  schema: z.ZodType<T>;
  schemaName: string;
  system: string;
  user: string;
  model?: typeof INSTRUCTIONAL_MODEL | typeof SUMMARY_MODEL;
}): Promise<ProviderResult<T>> {
  const model = input.model ?? INSTRUCTIONAL_MODEL;
  assertApprovedModel(model, model === SUMMARY_MODEL ? "summary" : "instructional");

  try {
    const client = await getClient();
    const response = await client.responses.parse({
      model,
      store: false,
      input: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      ...(model === INSTRUCTIONAL_MODEL ? { reasoning: { effort: INSTRUCTIONAL_REASONING_EFFORT } } : {}),
      text: { format: zodTextFormat(input.schema, input.schemaName) },
    });

    if (!response.output_parsed) {
      const refused = response.output.some((entry) => entry.type === "message" && entry.content.some((content) => content.type === "refusal"));
      return { ok: false, category: refused ? "refusal" : "malformed_output", retryable: !refused, safeMessage: refused ? "The provider declined this request. No artifact was created." : "The provider returned no valid structured artifact." };
    }
    return { ok: true, value: response.output_parsed as T, responseId: response.id, model };
  } catch (error) {
    return safeProviderFailure(error);
  }
}

const semanticAssessmentSchema = z.object({
  valid: z.boolean(),
  issues: z.array(validationIssueSchema),
}).strict();

export async function validateSemantics(input: { artifact: unknown; curriculumSnapshot: unknown }): Promise<ProviderResult<ValidationReport>> {
  const result = await requestStructuredArtifact({
    schema: semanticAssessmentSchema,
    schemaName: "semantic_validation",
    system: "You are a strict curriculum compliance validator. Report only concrete conflicts with the supplied approved snapshot. Do not rewrite the artifact.",
    user: JSON.stringify({ artifact: input.artifact, curriculumSnapshot: input.curriculumSnapshot }),
  });
  if (!result.ok) return result;
  return {
    ...result,
    value: {
      schemaVersion: "1.0",
      valid: result.value.valid,
      deterministicValid: true,
      semanticValid: result.value.valid,
      issues: result.value.issues,
      validatorVersion: VALIDATOR_VERSION,
      validatedAt: new Date().toISOString(),
    },
  };
}
