# Phase 4: Structured Generation and Validation Core

> **Historical scaffold — superseded by Recovery 0:** This document records generation contracts and adapters that were added to the repository. Their presence or successful compilation does not prove curriculum compliance, retry safety, provider availability, or a usable generation workflow. Hosted curriculum, approvals, artifacts, evidence, mastery/review data, and provider administration remain mutation-locked; any fixtures must be local-only and unreachable by child-facing production queries.

## Outcome

Phase 4 establishes the server pipeline for parent-requested drafts without exposing a generation action prematurely. The OpenAI project key is stored only in ignored local configuration. Instructional generation and semantic validation are pinned to `gpt-5.5` with high reasoning; `gpt-5.4-mini` is reserved for evidence-bound summaries. There is no fallback model.

The current readiness state is intentionally **locked** because Phase A / Unit 1 is still a draft. Provider requests must not run until the parent identity is provisioned and the curriculum is explicitly approved.

## Contracts

`src/lib/generation/contracts.ts` defines strict, versioned Zod contracts for:

- curriculum snapshots and approved target capabilities;
- five-day weekly plans;
- daily/review lessons and a discriminated lesson-block registry;
- controlled listening stories;
- evidence-bound parent summaries;
- validation reports and shared approval/evidence/mastery/review/provider interfaces.

Unknown fields and unsupported lesson blocks are rejected. Required values are explicit so the same contracts can drive OpenAI Structured Outputs and local parsing.

## Request boundary

Prompt assembly includes the phase and unit, immutable snapshot ID, approved and banned targets, literacy capabilities, mastery and due-review context, duration, parent request, safety constraints, and output policy. Hidden reasoning is neither requested nor stored.

The provider adapter:

- imports `server-only` and reads the key only when a request executes;
- uses the Responses API and Zod structured parsing;
- sends `store: false`;
- classifies authorization, quota, rate-limit, service, refusal, and malformed-output failures into safe parent-readable categories;
- never logs secrets, raw prompts, child-sensitive data, or hidden reasoning.

## Validation order

1. The selected artifact schema parses successfully.
2. Its curriculum snapshot matches the active approved snapshot.
3. Every target reference exists in the approved set and none is banned.
4. Deterministic kind-specific rules run, including the five-day sequence and story novelty limit.
5. Only then may `gpt-5.5` perform semantic compliance validation.
6. An artifact can become `validated` only when both layers pass. Validation does not approve or publish it.

Deterministic checks are authoritative. Semantic validation can add failures but cannot erase code-level violations.

## Jobs and data

Migration `20260710230000_phase_4_generation_core.sql` adds parent-only `generation_jobs`, request hashes, bounded attempts, safe failure fields, model reasoning metadata, and immutable snapshot references. A reused idempotency key must have the same request hash. Failed and regenerated artifacts remain separate versions, and approval never carries forward.

## Deferred to Phase 5

The parent command center will connect request buttons, version inspection, rejection/regeneration, and explicit artifact approval. Phase 4 exposes only a readiness and safeguard view; it does not perform automatic generation, approval, publication, phase advancement, or child delivery.

No tests or screenshots were run during this phase, in accordance with the project protocol.
