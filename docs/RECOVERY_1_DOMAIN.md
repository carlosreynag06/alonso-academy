# Recovery 1 Authoritative Domain

## Status and authority

**Implementation status (2026-07-12): `implemented`.** Recovery 1 is implemented in the repository by migration `20260712120000_recovery_1_authoritative_domain.sql`, typed application contracts, parent publication actions, assignment-bound child queries, and server-authoritative attempt commands.

`implemented` does not mean `verified` or `pilot-ready`. This record does not assert that the migration has been applied to the hosted Supabase project. No formal tests, screenshots, child-usability observation, live-provider exercise, or end-to-end pilot acceptance is recorded for Recovery 1.

This document describes the exact Recovery 1 contract. `PHASE_PLAN.md` remains authoritative for sequencing, and `docs/PILOT_ACCEPTANCE_CONTRACT.md` remains authoritative for final acceptance.

## Implemented boundary

Recovery 1 separates these concepts:

1. A generated weekly plan can be validated and approved privately.
2. An approved weekly plan can instantiate one `learning_weeks` record with exactly five immutable `week_day_slots`.
3. A generated lesson can be approved privately only after exact day binding and v1 runtime preparation pass.
4. An approved lesson can be assigned or scheduled to its exact day without becoming child-visible.
5. Only an explicit `published` assignment can become the child’s current mission.
6. A published assignment can be withdrawn or transactionally replaced without deleting history.
7. A child attempt belongs to an assignment and mode. Ordered progression, scoring, first-attempt state, support, retries, and completion are derived by server functions.

No migration backfill creates a normal assignment or publishes a lesson. Artifact approval alone is never a child-delivery query condition.

## Migration and schema contract

The committed migration version is `20260712120000_recovery_1_authoritative_domain.sql`. Existing migrations remain immutable history.

### Enums

| Enum | Values |
| --- | --- |
| `learning_week_status` | `planned`, `active`, `completed`, `archived` |
| `lesson_assignment_status` | `assigned`, `scheduled`, `published`, `completed`, `withdrawn`, `replaced`, `archived`, `quarantined` |
| `lesson_attempt_mode` | `learning`, `replay`, `scheduled_retrieval` |
| `attempt_block_status` | `pending`, `active`, `completed` |
| `evidence_authority_status` | `legacy_client_asserted`, `server_derived`, `provider_derived` |

### New tables

| Table | Implemented responsibility |
| --- | --- |
| `learning_weeks` | Instantiates one approved weekly-plan artifact for one child and curriculum unit. It records `planned`/`active`/`completed`/`archived`, optional start date, timezone, creator, and audited archive fields. `weekly_plan_artifact_id` is unique. |
| `week_day_slots` | Stores days 1–5 with exact plan ID, title, objective, duration, lesson kind, new/review target IDs, and a target-set hash. A week/day is unique and every slot has at least one target. |
| `week_day_targets` | Resolves every slot target to an approved curriculum target type and records whether it is `new` or `review`. |
| `lesson_assignments` | Separates assignment, scheduling, publication, completion, withdrawal, replacement, archival, and quarantine. It binds one child, exact day slot, and exact lesson artifact; carries availability, replay, publication, completion, supersession, archive, and state-version fields. |
| `lesson_attempt_block_states` | Stores one ordered state row per attempt/runtime block, including response/listen/replay counts, server-derived support, presentation and completion times, and safe state. |
| `lesson_response_events` | Stores idempotent semantic response events with ordinal, derived correctness/outcome, first-attempt flag, support, retries, latency, optional transcript/provider fields, and authority. |
| `lesson_attempt_events` | Stores idempotent attempt commands, state versions before/after, safe payload, and the resulting authoritative snapshot. |
| `private.lesson_runtime_blocks` | Stores server-only child presentation plus hidden answer rules, target IDs, required/scored/exit flags, order, and retry limits for each runtime-ready lesson. `anon` and `authenticated` have no table access. |

### Extended tables

- `generated_artifacts` adds `week_day_slot_id`, binding status/report/time, and runtime-ready status/report. A lesson artifact’s slot, plan, day, and kind are constrained together. Artifact identity, content, curriculum snapshot, parent plan, day, kind, and slot become immutable after insertion.
- `lesson_attempts` adds assignment, mode, attempt sequence, current block, state version, pause/abandon fields, and legacy quarantine fields. Learning, replay, and scheduled-retrieval histories remain distinct.
- `activity_evidence` adds response-event provenance, attempt mode, authority, rule version, and `qualifies_for_completion`. Legacy browser-authored evidence is retained as `legacy_client_asserted` and cannot qualify for Recovery 1 completion.

### Database invariants

- Deferred constraint triggers require exactly five distinct day slots for every learning week.
- Slot targets must resolve to approved targets in the same curriculum unit.
- Lesson binding checks exact weekly-plan artifact, day, lesson kind, objective, and the complete sorted target set.
- Only exactly bound daily or review lessons supported by the v1 block registry can become `runtime_ready`.
- Only one `assigned`, `scheduled`, or `published` assignment can exist for a child/day slot.
- Only one `published` mission can exist for the child across all slots at a time.
- Assignment state check constraints require the timestamps, actors, reasons, and supersession fields appropriate to each status.
- A non-replay primary attempt is unique per assignment, an attempt mode/sequence is unique, and only one open attempt per assignment/mode is allowed.
- Client event IDs make response and attempt commands idempotent. Expected state versions reject stale commands.
- Completion requires every required runtime block to be complete and at least one qualifying server- or provider-derived exit evidence row.

## RPC contract

All parent mutation RPCs are `security definer`, call `private.require_parent()`, enforce state guards, require a decision note or reason of at least five trimmed characters, and write a safe audit event.

| RPC | Access | Exact transition or result |
| --- | --- | --- |
| `create_learning_week_from_plan(plan, child, starts_on, timezone, note)` | Authenticated parent | Requires an approved five-day plan and creates one planned week, five slots, and resolved new/review targets. It creates no assignment. |
| `schedule_lesson_assignment(slot, lesson, from, until, note)` | Authenticated parent | Requires an approved current curriculum/plan, a planned or active week, a valid window, and an approved, exactly bound, runtime-ready lesson for that slot. Creates `scheduled`; review lessons use `scheduled_retrieval`, others use `learning`. |
| `publish_lesson_assignment(assignment, note)` | Authenticated parent | Changes only `assigned` or `scheduled` to `published` after rechecking curriculum, plan, binding, runtime, week, and window. It activates a planned week. |
| `set_lesson_assignment_replay(assignment, allowed, note)` | Authenticated parent | Changes replay permission for assigned, scheduled, published, or completed records. Enabling replay requires an approved, valid, runtime-ready lesson. |
| `replace_lesson_assignment(assignment, replacement, activation_mode, from, until, note)` | Authenticated parent | Atomically marks the active old assignment `replaced` and creates a same-slot replacement as `assigned`, `scheduled`, or `published`. The replacement must pass the complete publication contract. |
| `withdraw_lesson_assignment(assignment, reason)` | Authenticated parent | Changes only `assigned`, `scheduled`, or `published` to `withdrawn`; preserves history and removes child visibility. |
| `archive_lesson_assignment(assignment, reason)` | Authenticated parent | Archives only `withdrawn`, `replaced`, or `completed` assignment records. |
| `revoke_generated_artifact_approval(artifact, reason)` | Authenticated parent | Changes `approved` back to `validated` only after active assignments and relevant week/replay dependencies are removed. It records a separate `revoked` approval decision. |
| `archive_generated_artifact(artifact, reason)` | Authenticated parent | Archives only `draft`, `validation_failed`, or `validated`. Approved artifacts must be revoked first. |
| `archive_learning_week(week, reason)` | Authenticated parent | Archives a planned, active, or completed week only after every active assignment is retired. |
| `approve_generated_artifact(artifact, note)` | Authenticated parent | Approves only a current validated artifact. Lesson-like artifacts additionally require the exact approved parent plan, binding validation, and runtime preparation. The audit event explicitly records `published: false`. |
| `get_child_lesson_home()` | Authenticated child | Returns the child, at most one currently available published mission, completed assignments explicitly enabled for replay, and an empty scheduled-retrieval collection in Recovery 1. |
| `get_child_attempt_snapshot(attempt)` / `get_child_lesson_attempt(attempt)` | Authenticated child | Returns only an assignment-authorized, approved, valid, runtime-ready child-safe lesson plus its authoritative snapshot. |
| `start_child_assignment(assignment, mode, client_event_id)` | Authenticated child | Starts or resumes the authorized published primary attempt, or an explicitly allowed completed replay. It initializes ordered block states and is idempotent by client event. |
| `command_child_attempt(attempt, client_event_id, expected_version, block, command, payload)` | Authenticated child | Owns pause/resume, breaks, listening/replay counts, hints, retry, acknowledgement, advance, semantic response scoring, evidence creation, and completion. It rejects stale, out-of-order, unsupported, oversized, or unavailable commands. |
| `record_child_speech_provider_result_v2(...)` | Service role only | Accepts only `transcribed` or `silence` results for the current authoritative speech-capable block, stores no raw audio, derives provider evidence, and rejects provider-unavailable mutations. Browser/authenticated execution is revoked. |

The legacy browser-authoritative functions `start_child_lesson`, `save_child_lesson_progress`, `record_child_activity_evidence`, `record_child_speech_evidence`, and `complete_child_lesson` have execute permission revoked.

## Runtime and child payload contract

Application payloads are parsed by `src/lib/lesson/runtime-contracts.ts` before rendering.

### Child-safe lesson

The payload contains artifact ID, day 1–5, title, objective, duration, remediation instruction, and ordered presentation-only blocks. The supported Recovery 1 block types are:

- `model_audio`
- `listen_select`
- `picture_action_select`
- `phonemic_awareness`
- `letter_work`
- `movement_break`
- `exit_check`

Choice and response options expose immutable opaque keys and labels. Correct keys, accepted-response rules, scoring flags, target rules, and exit rules remain in `private.lesson_runtime_blocks` and are never returned to the browser.

### Authoritative attempt snapshot

The snapshot exposes assignment and attempt IDs, attempt mode/status, state version, current block ID/index, view mode, retry count, support level, selected/visible option keys, outcome/feedback, fallback and advance flags, break count, and completed/total progress. Reload reads this snapshot; it does not reconstruct authority from local component state.

The browser may submit only:

- a fresh UUID `clientEventId`;
- the last observed nonnegative `expectedStateVersion`;
- the current `blockId`;
- one supported progress command, or a semantic choice/acknowledgement response plus bounded latency.

The server ignores browser claims about correctness, first attempt, support, retry count, evidence qualification, progression, and completion. Incorrect scored answers cannot advance. Required model audio must be recorded as heard before acknowledgement/advance. Hints and repeated listening affect stored support. Completion requires required blocks plus qualifying exit evidence.

### Attempt modes

- `learning`: the primary attempt for a normal published lesson.
- `scheduled_retrieval`: the primary attempt mode assigned to a published review lesson.
- `replay`: a new or resumed attempt only for a completed assignment with audited `replay_allowed = true`.

The Recovery 1 child-home RPC returns no separate retrieval recommendations; deterministic review scheduling remains Recovery 7 work.

## Application wiring

- `/parent/generation` is a transitional Recovery 1 surface: generation stays locked, while the page reads the authoritative current week and shows all five day-slot publication states.
- `/parent/artifacts/[artifactId]` keeps private approval separate and exposes only currently valid create-week, schedule, publish, replay-permission, replace, withdraw, revoke, and archive operations, with prerequisite explanations when a transition is unavailable.
- Parent publication mutations live in `src/app/parent/publication/actions.ts`, recheck the authenticated allowlisted parent, call only typed RPCs, sanitize failures, and revalidate affected parent and child routes.
- `/alonso` reads `get_child_lesson_home()` and exposes only the current published mission. The child start action submits an assignment ID and server-selected attempt mode.
- `/alonso/lesson/[attemptId]` reads the child-safe lesson and complete authoritative snapshot for the assignment-bound attempt.
- The existing progress, evidence, and completion POST routes are compatibility HTTP boundaries over `command_child_attempt`; they no longer accept browser-authored learning facts.
- The live speech POST route is deliberately locked and returns a recoverable `503`. Fixture speech can simulate the state contract; provider activation remains excluded.

These are functional recovery surfaces, not the final parent or child interface. Recovery 2 owns instructional/art direction, Recovery 4 owns the adult interface rebuild, and Recovery 5 owns the character-led child application.

## Backfill and legacy handling

The migration is deliberately fail closed:

- It aborts if any already-approved weekly plan cannot prove exactly days 1–5.
- It can backfill approved plans into `planned` learning weeks with five slots and resolved targets, but never creates a normal assignment.
- It binds legacy lesson artifacts only when parent plan, day, and lesson kind match an exact slot. Unmatched lessons become `binding_status = invalid`.
- It prepares runtime rows only after binding validation. Unsupported or malformed lessons remain `runtime_ready = false`.
- It preserves legacy attempts by marking them `legacy_quarantined`, attaches only `quarantined` assignment records where an exact slot exists, and never makes them child-visible.
- It marks all pre-Recovery-1 evidence `legacy_client_asserted`, `rule_version = legacy-v1`, and `qualifies_for_completion = false`.
- It aborts if backfilled targets cannot resolve, if any published assignment exists, or if it accidentally creates any non-quarantined assignment.

## Authorization boundary

Recovery 1 removes broad authenticated insert/update/delete policies from the sensitive public tables listed in the migration. Authenticated table access is parent-only read access under RLS. Mutations pass through the narrow audited RPCs above. Child access to lessons and attempts is through child-authorized security-definer query/command functions, not table CRUD.

This is an implemented repository contract, not evidence that hosted RLS grants or migration history currently match it.

## Fixture behavior

Recovery 0 fixture isolation remains authoritative:

- fixtures require development mode, the explicit fixture flag, and a loopback request;
- fixture state stays under ignored `.local-data`, uses `@fixture.invalid` identities, and never instantiates Supabase, OpenAI, or ElevenLabs clients;
- local fixture adapters model five slots, assignment states, child-home payloads, attempt snapshots, stale-version rejection, idempotent command events, server-derived support/evidence, completion gates, replay, and safe provider failures;
- hosted parent publication actions remain unavailable in fixture sessions; fixtures cannot create a real approval, assignment, publication, attempt, or evidence row;
- fixture results are never acceptable final-pilot evidence.

## Fail-closed exclusions and remaining work

Recovery 1 intentionally does not implement or prove:

- the rejected parent-interface redesign or missing adult information architecture;
- the character world, approved image/gesture/scene asset registry, or child-interface rebuild;
- lesson schema v2 and the complete oral-first instructional validator;
- story-lesson runtime playback in the v1 runtime registry;
- live browser speech persistence, provider rate limits, approved voice, audio readiness, or privacy verification;
- deterministic mastery/regression, spaced review recommendations, progress/history, summaries, or advancement;
- automatic generation, curriculum editing, automatic assignment, automatic publication, or automatic phase/unit advancement;
- public deployment or multiple learners.

Live speech remains locked, generation remains locked, curriculum decisions remain locked, and scheduled-retrieval recommendations remain empty. Audio can still use the older on-demand adapter; its presence is not provider readiness and is not a published-audio guarantee.

## Verification limits and next handoff

Recovery 1 is recorded as `implemented` because the authorized repository scope and documentation exist. It is not `verified` because no authorized objective evidence demonstrates the full completion gate against the intended hosted project and running private application. In particular, this record does not establish:

- that the migration is present in hosted migration history;
- that every RLS/RPC grant behaves correctly under the two real identities;
- that publication uniqueness, replacement, withdrawal, stale-command rejection, resume, evidence derivation, and completion have passed formal checks;
- that any current lesson is instructionally suitable, visually acceptable, audio-ready, or usable by Alonso.

Recovery 2 now has an implemented candidate direction in the repository, pending explicit parent approval. Its review route and documents do not reinterpret Recovery 1 implementation as approval of the current UI, v1 lesson experience, hosted migration state, or child delivery. Hosted product mutations and child delivery remain locked while that decision is pending.
