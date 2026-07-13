# Route and State Matrix

## Scope

This matrix inventories every current application page, API route, and global route surface in the repository. “Owner” identifies the present product actor or system boundary. “Disposition” states whether the current path or concept is retained, replaced, or removed. “Recovery owner” identifies the phase responsible for the target behavior.

No row in this document is evidence that the corresponding product outcome is ready.

## Application routes

| Route or surface | Current owner | Current behavior and material states | Disposition | Recovery owner |
| --- | --- | --- | --- | --- |
| `/` | Public authentication | Renders the same `LoginScreen` as `/login`; it does not redirect an existing session. | Remove the duplicate surface and redirect to canonical `/login`. | Recovery 4 and Recovery 5. |
| `/login` | Public authentication | Direct password form for the two configured identities. Error query states: `configuration`, `invalid`, `service`, `forbidden`. Successful identity redirects to `/parent` or `/alonso`. | Keep the path and direct-password policy; replace the presentation and make signed-in destination handling authoritative. | Recovery 4 and Recovery 5. |
| `/parent/login` | Legacy authentication | Redirects to `/login`. | Remove after a compatibility redirect period. | Recovery 4. |
| `/auth/confirm` | Legacy authentication | Redirects to `/login`; no token exchange occurs. | Remove. Magic-link authentication is excluded. | Recovery 4. |
| `/dev/fixtures` | Recovery infrastructure | Local-only scenario controller backed by an opaque cookie and ignored JSON state. It returns 404 unless development, an explicit fixture flag, and loopback host checks all pass. | Retain through recovery; remove or disable permanently before any production deployment. | Recovery 0 through Recovery 8. |
| `/parent` | Parent | Derives the next action from one unit, the latest approved weekly plan, number of approved lesson-like artifacts, and validated/failed artifacts. It can claim “Ready” from any five approved lessons, including duplicates. | Keep the path; replace the view, query model, and readiness calculation. | Recovery 1 and Recovery 4. |
| `/parent/recovery` | Parent recovery | Authenticated truth baseline showing hosted counts and configuration only, or explicitly labeled local fixture state when a fixture role is active. Product mutations remain locked. | Retain as an operational recovery surface until final pilot acceptance; reassess in Recovery 8. | Recovery 0 and Recovery 8. |
| `/parent/curriculum` | Parent | Displays six phase records and all units, with Phase A described as active regardless of a complete pilot. | Keep the path; replace with a versioned adult curriculum workbench. | Recovery 4. |
| `/parent/curriculum/[unitId]` | Parent | Displays current vocabulary, frames, phonics, and writing rows. A draft unit has one approve-everything form. Query states: `approved`, `error`. | Keep the path; replace the whole-unit mutation with immutable revisions and target-level decisions. | Recovery 1 and Recovery 4. |
| `/parent/generation` | Parent | Generates a week before lessons, then generates a chosen day/kind. Displays all artifact history as an “approval queue.” Error query states carry generation code/message. | Replace with a five-day `/parent/week` production board and a separate `/parent/review` queue; keep a compatibility redirect if useful. | Recovery 3 and Recovery 4. |
| `/parent/artifacts/[artifactId]` | Parent | Displays a partial artifact representation, validation rail, child versions, and approve/reject/regenerate forms. Query states: `generated`, `reused`, `approved`, `rejected`, `error`. | Keep the stable artifact URL; replace the review renderer and lifecycle actions. | Recovery 1, Recovery 3, and Recovery 4. |
| `/alonso` | Child | Returns every uncompleted approved daily/review artifact and one latest active attempt. Displays a CSS decorative world, next lesson, resume state, or preparation state. Query state: lesson-open error. | Keep the path; replace with one explicit published mission, character world, reviews, replay, and picture collection. | Recovery 1, Recovery 2, and Recovery 5. |
| `/alonso/lesson/[attemptId]` | Child | Returns an attempt only while its artifact remains approved, renders the v1 lesson registry, and redirects completed attempts home. | Keep the path; replace with assignment-bound schema-v2 playback and full resume. | Recovery 1, Recovery 3, and Recovery 5. |
| `/favicon.ico` | Global shell | Static application icon supplied by the app directory. | Keep path; replace artwork only after the approved identity direction. | Recovery 2 and Recovery 5. |

## API routes

| Route | Method | Current owner | Current behavior and material states | Disposition | Recovery owner |
| --- | --- | --- | --- | --- | --- |
| `/api/child/attempts/[attemptId]/audio/[blockId]` | GET | Child audio | Authorizes the child, finds a supported block, derives text from approved lesson JSON, then returns cached/on-demand ElevenLabs MP3. Returns `401`, `404`, or `503` failure states. | Replace with an approved asset registry and audio pre-generated before publication. Retain server-only delivery and approved-text enforcement. | Recovery 3 and Recovery 6. |
| `/api/child/attempts/[attemptId]/speech/[blockId]` | POST | Child speech | Accepts a bounded in-memory recording, invokes STT, scores acceptable responses, and records derived evidence. Returns invalid, unavailable, or saved outcomes. | Keep the ephemeral server-provider boundary; replace authority, rate limits, feedback, cleanup proof, and fallback behavior. | Recovery 1 and Recovery 6. |
| `/api/child/attempts/[attemptId]/evidence` | POST | Child evidence | Browser declares block, target, evidence type, first attempt, support, correctness, latency, retry count, and metadata. | Replace completely with semantic response submission and server-derived facts. | Recovery 1. |
| `/api/child/attempts/[attemptId]/progress` | POST | Child attempt state | Browser declares current block index, `in_progress`/`paused`, break count, and arbitrary player state. | Replace with ordered server-authoritative commands and idempotent state transitions. | Recovery 1. |
| `/api/child/attempts/[attemptId]/complete` | POST | Child completion | Completes the attempt if each exit block has any evidence record. | Replace with required scored-block and valid independent-exit requirements. | Recovery 1. |

## Global route boundaries

| Surface | Current owner | Current behavior | Disposition | Recovery owner |
| --- | --- | --- | --- | --- |
| Root `layout.tsx` | Global shell | Defines application metadata, fonts, body, and shared global CSS. | Keep the boundary; replace identity and visual tokens after art-direction approval. | Recovery 2, Recovery 4, and Recovery 5. |
| Root `loading.tsx` | Global shell | Generic academy loading state. | Keep the boundary; replace its visual/copy treatment. | Recovery 4 and Recovery 5. |
| Root `error.tsx` | Global shell | Generic retry surface. | Keep the retry boundary; replace presentation and ensure errors do not imply successful mutations. | Recovery 4 and Recovery 5. |
| Root `not-found.tsx` | Global shell | Generic return-home state. | Keep behavior; replace presentation and role-safe destination. | Recovery 4 and Recovery 5. |
| Parent `loading.tsx` | Parent shell | Wraps a generic loading component in the parent shell. | Keep boundary; replace the rejected shell and loading composition. | Recovery 4. |
| Parent `error.tsx` | Parent shell | Retry state claiming no curriculum or approval changed. | Keep boundary; replace shell and use evidence-based mutation messaging. | Recovery 4. |
| Alonso `loading.tsx` | Child shell | Generic child loading state. | Keep boundary; replace with character-led, audio-safe loading. | Recovery 5. |
| Alonso `error.tsx` | Child shell | Child retry state with ask-a-parent fallback. | Keep boundary; replace with character-led recovery and a protected parent exit. | Recovery 5. |
| `proxy.ts` | Authentication infrastructure | Refreshes Supabase sessions for root, login, parent, child, and auth paths. | Keep and audit matcher/session behavior. | Recovery 1. |

## Material state ownership

| State family | Current states | Current transition owner | Current defect | Disposition | Recovery owner |
| --- | --- | --- | --- | --- | --- |
| Parent/child access | `configuration_required`, `signed_out`, `forbidden`, `ready` | Server auth helpers plus Supabase claims/profile RPCs | Parent and child destinations are partly duplicated in form actions; no protected child-to-parent exit design. | Retain the server authorization boundary; harden and expose role-safe recovery. | Recovery 1, Recovery 4, Recovery 5. |
| Generation readiness | provider configured/unconfigured; curriculum approved/unapproved; ready/blocked | Server environment plus unit state | UI sometimes reduces readiness to a hardcoded provider/configuration claim rather than an operational health check. | Replace with truthful blocker/readiness projection. | Recovery 0 and Recovery 4. |
| Curriculum status | `draft`, `approved`, `inactive`, `archived` | `approve_curriculum_unit` owns only `draft -> approved` | Inactive/archive/revision/revoke transitions have no owner; all targets approve in bulk. | Replace lifecycle with immutable revisions and explicit decisions. | Recovery 1. |
| Artifact status | `draft`, `validating`, `validation_failed`, `validated`, `approved`, `active`, `completed`, `archived` | Generation pipeline, approval RPC, rejection RPC | `draft`, `active`, and `completed` are unused. `approved` currently controls child visibility, conflating approval and publication. | Replace lifecycle and add assignment/publication states. | Recovery 1. |
| Artifact lineage | version, `previous_version_id`, `lineage_key`, `parent_artifact_id`, day 1–5 | Generation pipeline | A day/kind lineage can have several approved versions; no active-assignment uniqueness. | Retain immutable lineage; add exact week/day binding and supersession. | Recovery 1 and Recovery 3. |
| Generation job | `queued`, `running`, `succeeded`, `failed` | Server generation job helpers | No owner for stale `running` recovery; success can mean a validation-failed artifact was stored. | Retain job concept; add explicit terminal outcome semantics and recovery. | Recovery 3. |
| Parent approval action | `approved`, `rejected`, `revoked` | Curriculum/artifact RPCs own approved/rejected only | Revocation has no mutation; approval consequence is misleading. | Retain audited decisions; implement revoke/request-change and separate publish. | Recovery 1 and Recovery 4. |
| Lesson attempt | `in_progress`, `paused`, `completed`, `abandoned` | Child RPCs own start/resume/pause/complete | Abandoned has no owner; unique child+artifact prevents replay/retrieval attempts; saved player state is not fully hydrated. | Replace attempt modes and transition authority. | Recovery 1. |
| Player progression | block index, break count, arbitrary JSON | Browser POST plus progress RPC | Browser can skip/reorder blocks and declare state. | Replace with server-owned ordered state. | Recovery 1. |
| Activity evidence | evidence type, first-attempt flag, support, correctness, latency, retry count, transcript, confidence | Browser for non-speech; route/scorer for speech; RPC stores | Browser declares authoritative facts, and a first-attempt uniqueness index does not itself derive first attempt. | Replace write contract and answer-key authority. | Recovery 1 and Recovery 3. |
| Support level | `independent`, `replay`, `prompted`, `reduced_choices`, `modeled` | Browser payload | Support is not derived from stored hint/replay history. | Retain vocabulary; derive on server. | Recovery 1. |
| Speech outcome | `matched`, `try_again`, `silence` | Server transcript scorer | Scoring is narrow and provider failure fallback can strand the activity. | Retain distinct silence; replace target-aware feedback and recovery. | Recovery 6. |
| Mastery stage | `introduced`, `assisted_success`, `recognized`, `understood_in_context`, `used_with_prompt`, `used_independently`, `used_across_contexts`, `stable_mastery` | No transition owner | Table/type existence is the only implementation. | Keep as a provisional concept; replace with deterministic evidence rules. | Recovery 7. |
| Review schedule | due time, priority 1–5, reason | No transition owner | No scheduler, assignment, route, or parent action exists. | Implement from deterministic mastery evidence. | Recovery 7. |
| Child-session token | active/revoked/expired represented by timestamps | No current application owner | Table and token helper are unused because the child signs in directly. | Remove or explicitly repurpose; do not treat it as current security. | Recovery 1 and Recovery 5. |
| Provider metadata | provider, operation, unconstrained status, safe metadata | OpenAI pipeline and speech RPC | Status vocabulary is inconsistent and not an operational health model. | Retain audit data; add constrained health/readiness projection. | Recovery 4 and Recovery 6. |
| Recovery capability | `scaffolded`, `blocked`, `implemented`, `verified`, `pilot-ready` | Recovery documentation and server status projection | Must not be inferred from a file, migration, build, or provider key alone. | Retain exactly as defined in `RECOVERY_0_BASELINE.md`. | All recoveries; final authority Recovery 8. |

## Target route ownership after recovery

The recovery plan adds parent routes that do not yet exist: Week, Review queue, Alonso operations, Progress, History, and Settings. Their absence is intentional evidence of incompleteness, not a reason to overload current routes with misleading labels. Recovery 4 owns their information architecture. Recovery 7 owns the actual progress/history/mastery data they consume.

The child route contract after Recovery 1 is one published assignment for one child/week/day. Artifact approval alone must never satisfy that query.
