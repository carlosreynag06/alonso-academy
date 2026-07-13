# Recovery 0 Baseline

## Purpose and authority

This document records the truthful product baseline at the start of the Alonso Academy recovery. It is an inventory, not a claim that the application is ready to teach Alonso. `PHASE_PLAN.md` remains authoritative for recovery scope and sequencing. `docs/PILOT_ACCEPTANCE_CONTRACT.md` is the single acceptance contract for private-pilot readiness.

Recovery 0 permits truth reset, isolated fixtures, inventories, and acceptance documentation only. Product redesign, schema-v2 behavior, provider activation, publication-model changes, and mastery logic belong to later recovery phases.

**Recovery 1 handoff (2026-07-12):** this file remains the historical pre-Recovery-1 baseline and capability-language authority. The repository now contains the implemented Recovery 1 domain/publication/attempt contract documented in `docs/RECOVERY_1_DOMAIN.md`; its migration is not claimed as applied to hosted Supabase and its behavior is not verified. Where this baseline says publication or evidence authority is `blocked`, read that as the condition Recovery 1 was implemented to supersede, not as a new verification result.

**Recovery 2 handoff (2026-07-13):** the repository also contains the implemented-but-unapproved Recovery 2 design candidate documented by the `RECOVERY_2_*` files and `/parent/recovery-2`. It defines direction only; hosted product mutations and child delivery are locked, and no concept, image, production screen, provider, or usability outcome is verified.

## Capability language

These labels describe product capability, not effort or file count.

| Label | Exact meaning |
| --- | --- |
| `scaffolded` | Code, types, tables, adapters, or UI surfaces exist, but the stated product outcome is incomplete, unsafe to rely on, or not objectively verified. |
| `blocked` | A required dependency, decision, provider configuration, approved asset, hosted record, or prerequisite product capability is absent, so the outcome cannot currently operate. |
| `implemented` | The authorized scope is built and documented in the repository, but it has not yet accumulated all objective verification evidence required by its completion gate. |
| `verified` | The phase completion gate has objective evidence showing that the implemented behavior satisfies the defined requirements within its authorized scope. |
| `pilot-ready` | The complete five-lesson private pilot has passed the authoritative end-to-end acceptance contract and the parent has explicitly accepted it for private use. |

`implemented` does not mean `verified`. A route responding, a build compiling, a table existing, or a provider adapter being present does not make a learning workflow `pilot-ready`.

## Current truthful baseline

| Area | Current state | Evidence | Next recovery owner |
| --- | --- | --- | --- |
| Repository and runtime | `verified` foundation | Next.js, TypeScript, npm lockfile, local server scripts, Git history, and environment isolation exist. | Recovery 8 re-verifies the final integrated runtime. |
| Supabase and password authentication | `implemented` connected foundation | Parent allowlist, two provisioned password identities, profile RPCs, RLS, migrations, and session refresh code exist. Sensitive parent tables still allow broad CRUD. | Recovery 1 hardens authorization and mutation boundaries. |
| Curriculum | `scaffolded` | Phase metadata, one A-U1 seed, targets, constraints, and one whole-unit approval RPC exist. Curriculum revision and target-level decisions do not. | Recovery 1 and Recovery 4. |
| Structured generation | `scaffolded` | OpenAI structured generation, immutable lineage, job records, deterministic validation, semantic validation, and approval records exist. Day binding, asset validation, instructional-sequence validation, and stuck-job recovery are incomplete. | Recovery 3. |
| Parent product | `scaffolded` and rejected | Current routes expose curriculum, generation, artifact review, and approval actions, but the information architecture and workflow are incomplete and misleading. | Recovery 4. |
| Child product | `scaffolded` and rejected | Alonso Home, an activity renderer, attempt persistence calls, and evidence calls exist, but the flow is text-dependent, not character-led, and not assignment-authoritative. | Recovery 2, Recovery 3, and Recovery 5. |
| Audio and speech | `scaffolded` and `blocked` | Server-only ElevenLabs TTS/STT adapters and a local cache exist. No persisted parent-approved voice, pre-publication audio readiness, or verified recovery flow exists. | Recovery 6. |
| Publication and assignment | `blocked` | Artifact approval currently makes a supported lesson child-visible. There are no explicit week/day assignments, publication, replacement, withdrawal, or one-active-version guarantees. | Recovery 1. |
| Evidence authority | `blocked` | Evidence tables and RPCs exist, but the browser can declare correctness, first-attempt status, support, retries, and progress. | Recovery 1. |
| Mastery, review, stories, and summaries | `scaffolded` at schema level; product not implemented | Mastery and review tables/types exist without transition logic, recommendations, progress routes, or a child story renderer. | Recovery 7. |
| Private pilot | `blocked` | No complete, accepted, five-lesson oral-first week exists. | Recovery 8. |

## Mutation inventory

### Server actions

| Mutation | Current owner | Current behavior | Disposition | Recovery owner |
| --- | --- | --- | --- | --- |
| `signInWithPassword` | Authentication | Maps the two approved identifiers to emails, signs in with Supabase password auth, and redirects by email. | Keep the direct-password contract; replace UI/error/session-destination handling as needed. | Recovery 4 and Recovery 5. |
| `signOut` | Authentication | Signs out the current Supabase session and redirects to `/login`. | Keep and expose appropriately in both role flows. | Recovery 4 and Recovery 5. |
| `approveCurriculumUnit` | Parent curriculum | Approves the whole draft unit and all draft targets with one note. | Replace with immutable curriculum versions and explicit target decisions. | Recovery 1 and Recovery 4. |
| `requestGeneration` | Parent generation | Starts weekly-plan or lesson generation using the approved snapshot and optional lineage. | Keep the parent-requested concept; replace its v1 lesson/day/asset contract. | Recovery 3 and Recovery 4. |
| `approveArtifact` | Parent review | Changes a validated artifact to `approved`. An approved supported lesson is currently child-visible. | Replace with content approval that remains private and is separate from publication. | Recovery 1. |
| `rejectArtifact` | Parent review | Archives a draft, failed, or validated artifact and records a note. | Keep the decision concept; replace with the complete request-change/reject/archive lifecycle. | Recovery 1 and Recovery 4. |
| `startLesson` | Child lesson entry | Starts or resumes any approved supported daily/review lesson. | Replace with assignment-aware start/resume for exactly one published lesson. | Recovery 1. |

### API mutations

| Mutation | Current owner | Current behavior | Disposition | Recovery owner |
| --- | --- | --- | --- | --- |
| Progress POST | Child player | Browser sends block index, status, break count, and arbitrary player-state JSON. | Replace with ordered server-authoritative transition commands. | Recovery 1. |
| Evidence POST | Child player | Browser sends target, evidence type, first-attempt flag, support, correctness, retries, and metadata. | Replace; the server must derive authoritative learning facts from the assigned lesson, answer key, and stored attempt state. | Recovery 1. |
| Speech POST | Child speech | Receives ephemeral audio, invokes ElevenLabs STT, scores transcript, and writes derived evidence. | Keep the ephemeral-provider boundary; replace attempt authority, fallback, rate limits, and target-aware evidence rules. | Recovery 1 and Recovery 6. |
| Complete POST | Child player | Completes an attempt when each exit block has any evidence row. | Replace with required-block, validity, and exit-evidence rules. | Recovery 1. |

### Direct database mutations

The generation pipeline directly inserts and updates `generation_jobs`, `generated_artifacts`, `provider_metadata`, and `audit_events`. The parent role also has broad authenticated CRUD policies on most foundation tables. Preserve job, lineage, provider-metadata, and audit concepts, but move sensitive lifecycle transitions behind narrow RPCs and explicit state guards.

## Supabase function inventory

| Function | Scope | Disposition | Recovery owner |
| --- | --- | --- | --- |
| `private.is_parent` | Parent authorization predicate | Retain and audit. | Recovery 1. |
| `private.is_child` | Child authorization predicate | Retain and audit. | Recovery 1. |
| `private.current_child_id` | Resolves the authenticated child profile | Retain and audit. | Recovery 1. |
| `private.set_updated_at` | Timestamp trigger | Retain. | Foundation. |
| `ensure_parent_profile` | Creates/updates the allowlisted parent profile | Retain and narrow if necessary. | Recovery 1. |
| `get_current_child_profile` | Returns the bound child profile | Retain and narrow if necessary. | Recovery 1. |
| `approve_curriculum_unit` | Bulk draft-to-approved transition | Replace with versioned curriculum decisions. | Recovery 1. |
| `approve_generated_artifact` | Validated-to-approved transition | Replace so approval remains private and stale/superseded versions cannot publish. | Recovery 1. |
| `reject_generated_artifact` | Archives a reviewable version | Replace with the complete review lifecycle and explicit consequences. | Recovery 1. |
| `get_child_lesson_home` | Returns all uncompleted approved daily/review artifacts | Replace with one explicit published assignment plus safe replay/review entries. | Recovery 1. |
| `start_child_lesson` | Starts/resumes an approved artifact | Replace with assignment-aware attempt creation. | Recovery 1. |
| `get_child_lesson_attempt` | Returns approved artifact content and attempt state | Replace with published-version and complete resume enforcement. | Recovery 1. |
| `save_child_lesson_progress` | Accepts browser-authored progress | Replace with server-owned block transitions. | Recovery 1. |
| `record_child_activity_evidence` | Validates block/target membership but trusts browser learning facts | Replace with server-derived scoring and support state. | Recovery 1. |
| `record_child_speech_evidence` | Stores derived speech evidence and provider metadata | Replace its state/scoring authority while retaining the no-raw-audio boundary. | Recovery 1 and Recovery 6. |
| `complete_child_lesson` | Requires presence, not validity, of exit evidence | Replace with authoritative completion requirements. | Recovery 1. |

## Provider and hosted-data prerequisites

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must identify the intended private project.
- All committed migrations through the Phase 7 speech-evidence migration must exist in hosted migration history before relying on current code.
- Exactly the administratively provisioned parent and child password identities must exist; public signup remains disabled.
- `PARENT_ALLOWLIST_EMAIL` and `CHILD_LOGIN_EMAIL` must match those hosted identities.
- The parent email must exist in `parent_allowlist`; the child profile must be linked to the child auth user through `auth_user_id`.
- The A-U1 curriculum and target rows must exist. Their real approval state must never be fabricated by a fixture.
- Child delivery currently additionally requires an approved, v1-supported daily or review artifact. This is a defect, not the target publication contract.
- No Supabase Storage bucket is currently part of the running lesson-media path.

### OpenAI

- `OPENAI_API_KEY`, outbound network access, quota, and project access to exactly `gpt-5.5` are required for instructional generation and semantic validation.
- Instructional calls use high reasoning and strict structured output. No fallback model is authorized.
- A real approved curriculum snapshot is required for all generation; a real approved weekly plan is additionally required for lesson generation.
- `gpt-5.4-mini` is declared for summaries, but no parent-summary product workflow is implemented.

### ElevenLabs and browser media

- `ELEVENLABS_API_KEY` is required for STT; TTS also requires `ELEVENLABS_VOICE_ID`.
- The current defaults are `eleven_multilingual_v2` for TTS and `scribe_v2` for STT.
- The voice ID is an environment value, not a persisted, audited parent approval. Therefore audio readiness is blocked.
- On-demand TTS requires outbound network access and a writable `.local-data/lesson-audio` directory.
- Speech capture requires a supported browser media API and microphone permission.
- Raw recordings are intended to remain request-memory-only; this has not yet received final privacy verification.

### Local runtime

- Node.js 20.9 or newer and npm 11 with the committed lockfile are required.
- npm is the only package manager.
- The application requires writable local cache space and valid Supabase session cookies.

## Isolated fixture contract

Recovery fixtures exist only to exercise truthful routes and failure states while the authoritative domain is rebuilt.

- Runtime source: `src/lib/development-fixtures/`; the compact status catalog in `src/lib/recovery/fixtures.ts` is display-only.
- Activation: `NODE_ENV=development`, `ALONSO_ENABLE_DEV_FIXTURES=true`, and a loopback request are all mandatory. `/dev/fixtures` returns 404 otherwise.
- Session: an opaque UUID in an HTTP-only, `SameSite=Strict` cookie. The cookie contains no role, approval, evidence, or password data.
- Storage: Zod-validated JSON under ignored `.local-data/dev-fixtures/`, written atomically and deleted on exit. It is locally durable only so pause/resume survives refresh and Next.js worker restarts.
- Identity: fixture roles are separate from both family passwords and use unmistakable `@fixture.invalid` identities and a persistent `FIXTURE DATA · LOCAL ONLY · NOT SAVED TO SUPABASE` banner.
- Hosted/provider isolation: every repository dispatches through one request source. While a valid fixture is active, the Supabase client and OpenAI/ElevenLabs adapters refuse to instantiate. Fixture actions and APIs write only the local session file.
- Decision separation: synthetic `approved`, `validated`, and completed records never satisfy real acceptance and never create hosted approval, attempt, evidence, or provider metadata.
- Reset behavior: reset reconstructs the deterministic catalog; exit removes the session file and cookie.

The catalog covers one curriculum, one approved five-day week, five lesson lifecycle states, paused and completed attempts, independent/replayed/prompted/scaffolded evidence, and safe OpenAI/TTS/STT failure scenarios. Scenario controls exercise the existing parent and Alonso routes without fabricating provider availability or real pilot decisions.

## Retain, replace, and remove inventory

### Retain as foundations

- Next.js App Router, React, TypeScript, npm, lockfile, environment isolation, and server-only provider boundaries.
- Supabase password authentication, session refresh, parent allowlist, parent/child profile concepts, and RLS as a foundation.
- Curriculum phase concept and the parent-approved-curriculum principle.
- Immutable artifact versions, lineage, provider metadata, audit events, and idempotent generation-job concepts.
- Raw-audio minimization and derived-evidence-only intent.
- Generic error/loading boundaries as route infrastructure, subject to later visual replacement.

### Replace or extend

- Curriculum units, targets, approvals, and overrides with immutable revision and explicit decision workflows.
- Artifact states with separate approval, assignment, scheduling, publication, withdrawal, replacement, and archival.
- Lesson attempts and activity evidence with server-authoritative progression, scoring, first-attempt state, support, replay, and retrieval.
- Generation contracts, validators, prompts, renderers, and artifact review after the instructional/art direction is approved.
- Parent navigation, overview, curriculum, generation, review, Alonso operations, progress, history, and settings.
- Alonso Home, the entire lesson player, audio controls, speech controls, and completion experience.
- On-demand TTS caching as the publication mechanism with approved asset registration and pre-generation.
- Mastery and review placeholders with actual deterministic transitions in Recovery 7.

### Remove or retire

- The duplicate `/` login surface; `/login` is canonical.
- Legacy `/parent/login` and `/auth/confirm` behavior after compatibility redirects are no longer needed.
- The unused `child_sessions` table and `src/lib/auth/child-session.ts`, unless Recovery 5 explicitly repurposes them through a new approved design.
- Current rejected parent and child CSS compositions rather than extending them incrementally.
- Current marketing-style status surfaces, decorative child world, and technical child-visible taxonomy.
- Claims that approval equals publication, five approved artifacts equal a ready week, or provider adapters equal operational audio.

## Migration disposition

Existing migrations remain immutable history and must not be edited retroactively.

| Migration | Retained value | Recovery disposition |
| --- | --- | --- |
| Phase 2 foundation | Auth-linked profiles, curriculum/audit/provider concepts, RLS starting point | Retain history; supersede broad CRUD and insufficient lifecycle rules with new Recovery 1 migrations. |
| Phase 4 generation core | Job/idempotency fields and model metadata | Retain history; harden transition ownership and recovery through later migrations/code. |
| Phase 5 command center | Artifact lineage/day fields and approval/rejection RPCs | Retain history; supersede approval-as-delivery and add explicit assignments/publication in Recovery 1. |
| Password login roles | Child auth binding and access predicate | Retain and audit. |
| Phase 6 lesson player | Attempt/evidence columns and initial child RPC boundary | Retain history; replace child queries and browser-authoritative mutations in Recovery 1. |
| Phase 7 speech evidence | Derived speech fields and no-raw-audio intent | Retain history; harden scoring/state/provider behavior in Recovery 1 and Recovery 6. |

## Recovery 0 completion evidence

- The complete route and state ownership matrix is in `docs/ROUTE_STATE_MATRIX.md`.
- The isolated fixture catalog is documented above and contains no hosted writes.
- Capability language is defined in this document and must be used by product status surfaces.
- Existing foundations and rejected/replaced systems have explicit dispositions.
- The only authoritative pilot acceptance checklist is `docs/PILOT_ACCEPTANCE_CONTRACT.md`.

Recovery 0 does not verify the recovered product. It establishes the contract by which subsequent work will be judged.

Recovery 1 inherits the same proof standard: committed schema, RPC, route, and fixture code can earn `implemented`, but only objective authorized evidence against the intended running system can earn `verified`. Synthetic fixtures and documentation cannot satisfy the pilot acceptance contract.
