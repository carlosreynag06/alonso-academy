# Phase 5: Parent Command Center and Approval Workflow

> **Historical scaffold — superseded by Recovery 0:** This document preserves the intended parent workflow and implemented route history. It does not establish that the parent can inspect every instructional detail, publish five valid unique lessons, or complete the workflow without dead ends. Recovery 0 prohibits hosted approval/artifact mutations unless explicitly released; UX fixtures must be local-only, visibly labeled, and never child-visible.

## Outcome

Phase 5 turns the generation core into a parent-controlled application workflow. The allowlisted parent can sign in with the provisioned password account, approve the Phase A pilot boundary, request a weekly plan, inspect its structured content and validation report, approve or reject the exact version, regenerate a new version, and then request individual daily, review, or listening-story lessons.

The workflow is progressive rather than presenting unavailable actions:

1. Draft curriculum routes to curriculum review.
2. Approved curriculum unlocks weekly-plan generation.
3. A validated week enters the approval queue.
4. Only an approved week unlocks individual lesson generation.
5. Every lesson version must validate and receive its own parent decision.

No artifact is exposed to Alonso in this phase.

## Parent experience

- `/parent` reports the live curriculum state, review count, approved-week state, and secure child boundary.
- `/parent/generation` provides the generation studio, immutable version history, safe provider status, and clear prerequisite guidance.
- `/parent/artifacts/[artifactId]` renders weekly days, lesson blocks, or controlled story lines in parent-readable form alongside deterministic and semantic validation results.
- Approval, rejection, and regeneration forms require meaningful notes or direction. Rejection archives the version instead of deleting evidence of the decision.

## Generation orchestration

`generateValidatedArtifact` authorizes the parent, rate-limits recent requests, builds the current approved curriculum snapshot, enforces the approved-week prerequisite, creates or reuses an idempotent job, calls the fixed OpenAI model through the server-only adapter, stores a new immutable version, runs deterministic validation, and then runs semantic validation.

Provider errors produce safe job messages. A semantic validation outage leaves the generated artifact in `validation_failed`; it never silently bypasses validation. Model substitution remains disabled.

## Database enforcement

Migration `20260710240000_phase_5_parent_command_center.sql` adds lineage, parent-plan, and lesson-day fields. It replaces the coarse artifact-version uniqueness rule with lineage-specific versioning and adds two parent-only RPCs:

- `approve_generated_artifact` requires a validated artifact, an unchanged approved curriculum snapshot, and—for lessons—an approved parent weekly plan.
- `reject_generated_artifact` archives a reviewable version and stores the parent note in approval and audit history.

The UI is not an authorization mechanism. Parent RLS, authenticated identity checks, snapshot checks, and state transitions remain server/database enforced.

## Identity note

The parent identity is configured and allowlisted. By later explicit parent direction, Alonso also uses his provisioned Supabase password account. That Auth user is linked to the singleton child profile, while parent-only tables remain protected by the parent allowlist and RLS.

## Deferred

Phase 6 will implement the child lesson player and evidence collection against approved lesson versions. Phase 5 does not add child playback, voice, automated scheduling, bulk approval, or phase advancement.

No test command or screenshot capture was run during this phase.
