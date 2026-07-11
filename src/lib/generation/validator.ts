import type { ArtifactKind, CurriculumScope, ValidationReport } from "./contracts";
import { artifactSchemas, validationIssueSchema } from "./contracts";
import { VALIDATOR_VERSION } from "./models";

type Issue = ValidationReport["issues"][number];

function issue(code: string, path: string, message: string, targetId: string | null = null): Issue {
  return validationIssueSchema.parse({ code, severity: "error", path, message, targetId });
}

function collectTargetReferences(value: unknown, path = "$", result: Array<{ id: string; path: string }> = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectTargetReferences(entry, `${path}[${index}]`, result));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const nextPath = `${path}.${key}`;
      if ((key === "targetIds" || key === "reviewTargetIds") && Array.isArray(entry)) {
        entry.forEach((id, index) => typeof id === "string" && result.push({ id, path: `${nextPath}[${index}]` }));
      } else {
        collectTargetReferences(entry, nextPath, result);
      }
    }
  }
  return result;
}

export function validateArtifactDeterministically(kind: ArtifactKind, artifact: unknown, scope: CurriculumScope): ValidationReport {
  const issues: Issue[] = [];
  const parsed = artifactSchemas[kind].safeParse(artifact);

  if (!parsed.success) {
    for (const problem of parsed.error.issues) {
      issues.push(issue("SCHEMA_INVALID", `$.${problem.path.join(".")}`, problem.message));
    }
  } else {
    const record = parsed.data as { curriculumSnapshotId: string; durationMinutes?: number; days?: Array<{ day: number }>; novelOralWords?: string[] };
    if (record.curriculumSnapshotId !== scope.snapshotId) {
      issues.push(issue("STALE_CURRICULUM_SNAPSHOT", "$.curriculumSnapshotId", "The artifact does not use the current approved curriculum snapshot."));
    }

    const approved = new Set(scope.approvedTargetIds);
    const banned = new Set(scope.bannedTargetIds);
    for (const reference of collectTargetReferences(parsed.data)) {
      if (!approved.has(reference.id)) issues.push(issue("TARGET_NOT_APPROVED", reference.path, "The referenced target is not approved in this snapshot.", reference.id));
      if (banned.has(reference.id)) issues.push(issue("TARGET_BANNED", reference.path, "The referenced target is explicitly banned.", reference.id));
    }

    if (kind === "weekly_plan" && record.days?.map(({ day }) => day).join(",") !== "1,2,3,4,5") {
      issues.push(issue("WEEK_SEQUENCE_INVALID", "$.days", "A weekly plan must contain days 1 through 5 in order."));
    }
    if (kind === "story_lesson" && (record.novelOralWords?.length ?? 0) > 3) {
      issues.push(issue("NOVELTY_LIMIT_EXCEEDED", "$.novelOralWords", "The story exceeds the Phase A oral novelty limit."));
    }
  }

  return {
    schemaVersion: "1.0",
    valid: issues.length === 0,
    deterministicValid: issues.length === 0,
    semanticValid: null,
    issues,
    validatorVersion: VALIDATOR_VERSION,
    validatedAt: new Date().toISOString(),
  };
}

export function mergeSemanticValidation(deterministic: ValidationReport, semantic: ValidationReport): ValidationReport {
  const issues = [...deterministic.issues, ...semantic.issues];
  return {
    ...deterministic,
    valid: deterministic.deterministicValid && semantic.semanticValid === true && issues.every((entry) => entry.severity !== "error"),
    semanticValid: semantic.semanticValid,
    issues,
    validatedAt: new Date().toISOString(),
  };
}
