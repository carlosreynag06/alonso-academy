# Alonso Academy Product Recovery and Pilot Plan

## Purpose

Alonso Academy is a private application for one parent and one six-year-old child. Its purpose is to help Alonso understand and speak American English through short, character-led, oral-first lessons that are controlled by an approved curriculum and supervised by his parent.

The required learning loop is:

**approved curriculum -> parent-approved week -> complete lesson preview -> explicit publication -> character-led child lesson -> trustworthy evidence -> mastery and review -> evidence-grounded parent summary**

The first pilot is one approved Phase A Unit 1 week with five unique lessons. Phases B-F remain structural only until the pilot is proven.

## Recovery decision

The July 2026 code review found that the repository contains useful technical foundations but not a usable learning product. Earlier phase labels described implemented scaffolding as completed outcomes. Those labels are superseded by this document.

The existing parent UI, child UI, lesson contract, lesson player, publication logic, deterministic validator, and CSS composition must not receive incremental cosmetic patches. They require a coherent product rebuild.

No work may continue to the former Phase 8 implementation. The recovery phases below are now authoritative.

## Current truthful status

| Previous phase | Current assessment |
| --- | --- |
| Repository foundation | **Verified foundation.** Next.js, TypeScript, npm, GitHub, environment isolation, and local server operation exist. |
| Data and authentication | **Recovery 1 domain implemented in the repository.** Two password accounts, Supabase foundations, narrow mutation RPCs, parent-only table reads, assignment-bound child functions, and audit concepts exist. Hosted migration application and identity-policy behavior are not verified. |
| Visual system | **Rejected.** The parent experience is not an effective adult application and the child experience has no coherent character-led product identity. |
| Generation core | **Scaffolded.** Structured generation exists, but deterministic validation does not enforce the full curriculum, media, weekly-plan, answer, duration, or instructional-sequence rules. |
| Parent command center | **Incomplete and rejected.** Recovery 1 adds transitional audited publication, scheduling, replay, replacement, withdrawal, revocation, and archival controls, but the adult information architecture, complete preview, progress, settings, and history workflows remain missing or rejected. |
| Child lesson player | **Authoritative runtime implemented; product experience rejected.** Assignment-bound delivery, resume snapshots, ordered commands, evidence derivation, and completion gates now exist in the repository. The v1 renderer remains text-dependent, has no real picture activities or characters, and has not passed child usability. |
| Audio and speech | **Scaffolded and blocked.** Server adapters exist, but no approved voice or active ElevenLabs configuration is present, no child audio flow is verified, and several fallbacks are nonfunctional. |
| Mastery, review, stories, and progress | **Not implemented.** Tables and types do not constitute the adaptive loop. |
| Pilot readiness | **Not started.** No complete five-lesson pilot has passed functional, instructional, responsive, accessibility, privacy, or child-usability acceptance. |

## Non-negotiable product principles

- Alonso Academy is an application, not a marketing website or a collection of technical status pages.
- Phase A is oral-first. Alonso must be able to understand and complete lessons without reading English.
- Alonso is guided by an original character and coherent illustrated world. Characters teach, demonstrate, respond, and create context; they are not background decoration.
- The child experience uses one obvious action, short spoken instructions, real imagery, gesture/action modeling, stable controls, and predictable recovery.
- The parent experience is a dense, polished adult workspace with clear navigation, compact operational information, truthful state, and explicit consequences.
- Curriculum approval, content approval, assignment, publication, active use, completion, and archival are separate states.
- Exactly one published lesson version may occupy a child/week/day assignment.
- The server derives authorization, correct answers, first-attempt status, support level, block order, completion, and lifecycle transitions. The browser cannot declare authoritative learning facts.
- AI cannot publish content, change mastery, schedule advancement, invent measurements, or substitute an unapproved model.
- Every generated media/content reference must resolve through an approved asset registry.
- Raw child audio is never stored. Derived transcript/confidence evidence remains minimal and parent-readable.
- Motivation may celebrate effort, communication, discovery, and world progress without coins, streak pressure, leaderboards, comparisons, or manipulative reward loops.
- npm is the only package manager.
- Development remains local-first and private. Public deployment is excluded until separately approved.

## Implementation protocol

Before every recovery phase, Codex must:

1. Reopen this file and all applicable documentation.
2. Restate the exact authorized scope and completion gate.
3. Inspect the current worktree and preserve unrelated user changes.
4. Implement only the authorized phase.
5. Update documentation to match reality.
6. Commit and push the completed phase.
7. Start or restart the local server and verify the requested port responds.
8. Report completed work, remaining blockers, and anything not verified.
9. Stop before beginning the next recovery phase.

A phase is not complete because files exist or the project compiles. It is complete only when its stated product outcome and acceptance gate are satisfied.

Test execution, formal browser screenshots, usability observation, provider substitution, public deployment, and work in the next phase require explicit permission where specified. Test files may be authored during their relevant phase.

## Recovery 0 - Truth reset, fixtures, and acceptance contract

**Implementation status (2026-07-12): `implemented`.** The authorized baseline, mutation lock, isolated local fixture harness, route/state inventory, and pilot acceptance contract exist. This does not mean `verified` or `pilot-ready`; no formal tests, screenshots, usability observation, provider activation, or pilot acceptance were performed in Recovery 0.

**Objective:** Establish an honest, safely testable baseline before rebuilding product behavior.

### Scope

- Replace misleading completion/readiness language in product documentation and status surfaces.
- Inventory all routes, mutations, RPCs, lifecycle states, provider dependencies, and real hosted-data prerequisites.
- Define separate `scaffolded`, `blocked`, `implemented`, `verified`, and `pilot-ready` meanings.
- Create isolated development fixtures for one curriculum, one approved week, five lesson states, attempts, evidence, and provider failures without altering real parent approvals.
- Define one authoritative pilot acceptance checklist and route/state matrix.
- Document which existing components, migrations, and styles will be retained, replaced, or removed.

### User-visible outcome

The parent can see the actual readiness state and exact next blocker. Alonso never sees a misleading “ready” state based on incomplete scaffolding.

### Completion gate

- Every current route and state has an owner and disposition.
- Development fixtures can exercise the whole application without touching real pilot decisions.
- Status language matches actual capabilities.
- No later recovery work depends on fabricated approvals or provider availability.

### Excluded

Product redesign, schema-v2 implementation, provider activation, and mastery logic.

## Recovery 1 - Authoritative domain, publication, and evidence model

**Implementation status (2026-07-12): `implemented`.** The repository now contains the Recovery 1 migration, typed domain/runtime contracts, audited parent publication controls, assignment-bound child queries, server-authoritative attempt commands, legacy quarantine, and isolated fixture equivalents. This is not `verified` or `pilot-ready`: hosted migration application, formal tests, screenshots, live speech, child usability, and end-to-end acceptance have not been established.

**Objective:** Correct the lifecycle and data model before rebuilding interfaces on top of it.

### Scope

- Separate curriculum approval, weekly-plan approval, lesson approval, assignment, scheduling, publication, active attempt, completion, withdrawal, replacement, and archival.
- Add five explicit week/day slots and one active lesson assignment per child/week/day.
- Add parent-only RPCs for publish, schedule, replace, withdraw, revoke, and archive.
- Transactionally retire superseded active versions.
- Bind every lesson to the exact approved weekly-plan day, objective, lesson kind, and target set.
- Make lesson attempts and block progression server-authoritative.
- Derive first attempt, retry count, support state, correctness, and target evidence from server-held state and answer keys.
- Restore complete attempt state after pause, reload, navigation, or provider failure.
- Support distinct learning, replay, and scheduled-retrieval attempts.
- Restrict sensitive table mutations to narrow RPCs rather than broad authenticated CRUD.

### User-visible outcome

The parent approves content without accidentally publishing it, can publish exactly one lesson, and can withdraw or replace it safely. Alonso sees only the assigned active lesson.

### Completion gate

- Approval never makes content child-visible by itself.
- Duplicate or superseded lesson versions cannot appear to Alonso.
- Reloading any lesson step is lossless and cannot create a second first attempt.
- Browser-supplied correctness/support flags cannot determine authoritative evidence.
- Completion requires the defined scored activities and valid exit evidence.

### Excluded

Final parent/child visual redesign, new character assets, live ElevenLabs activation, and mastery transitions.

### Implementation record (2026-07-12)

- Added committed migration `20260712120000_recovery_1_authoritative_domain.sql` with five-slot learning weeks, exact lesson/day binding, assignment/publication states, attempt modes, block/response/event state, authority provenance, narrow RLS/RPC mutations, and fail-closed legacy quarantine.
- Replaced approval-as-delivery with private approval plus explicit schedule, publish, replay, replace, withdraw, revoke, and archive decisions. One active assignment per child/day slot and one published mission per child are database invariants.
- Routed child home, start/resume, progress, semantic responses, and completion through assignment-bound RPCs with idempotent client events and optimistic state versions. Correctness, first attempt, support, retries, order, and completion are derived by the server.
- Added typed repositories, runtime payload parsing, transitional parent publication controls, and local fixture equivalents. Existing generation, curriculum decisions, and live speech remain locked.
- Documented the exact contract and limits in `docs/RECOVERY_1_DOMAIN.md`. The committed migration is not claimed as applied to hosted Supabase, and no formal verification evidence was collected.

## Recovery 2 - Instructional design, character world, and art direction

**Implementation status (2026-07-13): `implemented`, awaiting explicit parent approval.** The repository now contains the Recovery 2 instructional blueprint, original Luma Landing cast/world and art bible, seven visual/audio interaction storyboards, separate adult-interface direction, immutable asset-contract proposal, four generated concept assets, and an authenticated read-only review gallery at `/parent/recovery-2`. This does not satisfy the phase completion gate: no direction or generated asset is approved until the parent explicitly records a decision, and Recovery 3 remains closed.

**Objective:** Define the learning experience and visual identity before production UI is rebuilt.

### Scope

- Define the Phase A oral-learning arc: character greeting/context -> model -> meaning through image/action -> guided imitation -> listening discrimination -> contextual spoken turn -> spaced retrieval -> independent exit.
- Define lesson duration, pacing, target count, gesture support, Spanish rescue rules, remediation, and evidence semantics for a six-year-old beginner.
- Develop an original guide character and two or three supporting characters with roles in teaching and stories.
- Define the illustrated English world and a coherent art bible covering shape language, palette, line/texture, expressions, poses, environments, object imagery, motion, and accessibility.
- Create reviewed visual concepts for Alonso Home, listen-and-find, character conversation, speaking/recording, story/retell, completion, and learned-word collection.
- Create separate adult-interface direction for the parent workspace: restrained surfaces, compact density, labeled navigation, readable type, minimal radius, and operational hierarchy.
- Define an asset registry contract for characters, poses, scenes, objects, gestures, audio, alt text, and approval state.

### User-visible outcome

The product has a memorable, original learning guide and world for Alonso plus a professional adult workspace direction for the parent.

### Completion gate

- Parent explicitly approves the character/world direction and adult-interface direction.
- Every required Phase A interaction has an approved visual/audio concept.
- The designs demonstrate that Alonso can understand the task without reading English.
- No production screen is rebuilt by extending the rejected CSS systems.

### Approval decisions

Character, world, parent-interface direction, and any generated image assets require parent review before Recovery 3 proceeds.

### Implementation record (2026-07-13)

- Defined a 12–15 minute Phase A oral-learning choreography with one to two default new oral targets, English-first gesture/model support, bounded Spanish rescue, remediation, retrieval, and server-authoritative evidence semantics.
- Created the original Luma Landing direction with Miko as guide and Pippa, Moss, and Nia in distinct instructional roles across Welcome Dock, Action Grove, Sound Workshop, Story Camp, and Word Gallery.
- Created a tactile gouache/cut-paper child art bible and four immutable `in_review` concept images: cast anchor, world scene, Miko teaching poses, and interaction story art.
- Specified visual and audio behavior, one-action comprehension, fallback, and evidence consequences for Alonso Home, listen-and-find, character conversation, speaking/recording, story/retell, completion, and learned-word collection.
- Defined a separate flat, compact adult workspace direction with persistent labels, minimal radius, no gradients, operational tables/split views, and explicit lifecycle consequences.
- Defined the design-level immutable asset contract and parent approval record. No database/storage registry, schema-v2 lesson contract, production UI rebuild, provider activation, mastery logic, tests, screenshots, or usability observation was performed.

## Recovery 3 - Lesson contract v2, asset registry, and deterministic validation

**Objective:** Replace the generic text-card format with a contract that can express real oral-language teaching.

### Scope

- Introduce immutable lesson schema v2 and migrate only approved pilot content through explicit parent review.
- Add blocks for character modeling/dialogue, illustrated listening scenes, picture/action selection, option audio, gesture/TPR, echo speech, guided dialogue turns, minimal-pair listening, mouth/sound cues, letter match/trace, micro-story/retell, and independent exit checks.
- Give every option an immutable semantic ID; keep answer keys and scoring rules server-side.
- Separate spoken prompt, optional caption, child-visible text, parent-visible rationale, visual asset, audio asset, character/pose, hint ladder, evidence rubric, and fallback.
- Implement a curated asset registry with existence, version, locale, approval, and accessibility metadata.
- Enforce deterministically:
  - exact weekly-plan/day relationship;
  - approved target subset and target-text alignment;
  - unique block and option IDs;
  - valid answer keys and plausible distractors;
  - teaching before assessment;
  - oral/reading/writing readiness;
  - novelty, duration, and phonics limits;
  - required modeled listening, guided practice, movement, speech turns, remediation, and independent exit;
  - asset existence and approval;
  - no Phase A reading dependency.
- Make semantic validation additive only; it cannot override deterministic failures.

### User-visible outcome

Parents can review complete, media-aware lessons and the system cannot validate structurally incomplete or off-plan content.

### Completion gate

- Malformed, text-dependent, overlong, off-plan, asset-missing, or curriculum-invalid lessons cannot reach `validated`.
- Every supported activity has a renderer contract, fallback, evidence rubric, and parent preview contract.
- The five pilot lessons parse and validate through schema v2 without hidden assumptions.

## Recovery 4 - Parent application rebuild

**Objective:** Replace the current parent pages with a polished adult command center that supports the real workflow.

### Information architecture

- Overview
- Week
- Review queue
- Curriculum
- Alonso
- Progress
- History
- Settings

### Scope

- Create a labeled, responsive adult sidebar with active-route state, identity, sign out, and provider blockers.
- Rebuild Overview around today's assignment, current attempt, next decision, five-day readiness, due reviews, provider/voice health, and recent evidence.
- Rebuild Curriculum as a versioned workbench showing every target, constraint, acceptable response, recast, gesture, imageability, literacy limit, mastery requirement, exit requirement, override, and decision history.
- Add target-level include/exclude/edit/request-change and immutable revision workflows.
- Replace Generation Studio with a five-day production board showing planned objectives/targets, format, latest version, validation, approval, publication, and action for every day.
- Create a separate filtered review queue rather than calling all artifact history an approval queue.
- Rebuild artifact review to show exact prompts, model text, choices, answers, acceptable speech, target names, remediation, assets, audio preview, child-screen preview, validation mapped to blocks, audit history, and version comparison.
- Add state-appropriate Approve, Request changes, Regenerate, Publish, Replace, Withdraw, and Archive controls.
- Add Alonso operations, evidence/history, provider/voice, and privacy/retention settings.

### User-visible outcome

The parent can understand the current state, review everything Alonso will experience, publish intentionally, and recover from mistakes without database intervention.

### Completion gate

- The parent never approves hidden instructional content.
- Five-day readiness requires five unique playable day assignments.
- Every operational state has one clear primary action and safe recovery.
- Provider claims reflect real readiness checks rather than hardcoded copy.
- Desktop and mobile workflows remain compact, readable, and free of horizontal scrolling.

## Recovery 5 - Alonso application and character-led lesson player

**Objective:** Deliver a beautiful, engaging, oral-first application that a six-year-old can use independently.

### Scope

- Replace the shared adult-style entrance with a parent-controlled child-entry flow and protected parent exit.
- Rebuild Alonso Home as an illustrated five-stop journey with the guide character, one obvious Today's Mission, current location, review stop, story replay, and learned-word picture shelf.
- Remove technical taxonomy and abstract setup language from child-visible screens.
- Narrate every instruction and use short child-safe captions only when appropriate.
- Implement schema-v2 activities with real scenes, pictures, character reactions, gestures, object/action choices, option audio, guided dialogue, movement, sound cues, trace/match, stories, and retell.
- Use a stable lesson choreography: listen -> watch/understand -> try -> speak/use -> retrieve -> finish.
- Implement immediate help, repeat, Spanish rescue, pause, break, and provider-failure recovery without changing evidence incorrectly.
- Hydrate all saved player state and make every activity resumable.
- Allow parent-controlled replay and scheduled retrieval after completion.
- Celebrate effort and communicative success through world/character progress without manipulative gamification.

### User-visible outcome

Alonso enters a coherent learning world, is guided by a character, understands what to do without reading English, speaks during every lesson, and can recover without adult technical help.

### Completion gate

- A six-year-old can start, complete, pause, resume, and recover with one obvious action per state.
- Every Phase A activity is understandable through voice, image, gesture, and demonstration.
- No activity depends on English reading unless the curriculum explicitly permits it.
- Wrong answers produce a meaningful hint ladder, not manufactured success or a dead end.
- The complete five-lesson child journey is visually and behaviorally coherent on desktop and mobile.

## Recovery 6 - Production audio, speech, and provider readiness

**Objective:** Make voice modeling and spoken response reliable enough for actual daily use.

### Scope

- Add parent voice discovery, preview, audited approval, and safe provider status.
- Pre-generate and cache every approved lesson prompt, option, character response, feedback line, and story before publication.
- Distinguish required first listening from replay in evidence.
- Add hold-to-talk or automatic short recording with countdown, waveform/listening pose, silence detection, maximum duration, unmount/navigation cleanup, retry limit, and permission recovery.
- Make microphone denial, silence, provider timeout, missing audio, unsupported browser, and quota failure immediately recoverable.
- Add child/provider rate limits and sanitized health telemetry.
- Treat transcription as support evidence, not pronunciation truth.
- Use target-aware conservative feedback with one modeled sound/word issue at a time; minor accent variation never blocks progress.
- Prove raw recordings are absent from application storage and logs.

### User-visible outcome

Alonso hears warm American-English models immediately, can speak through clear child-safe controls, and is never stranded by microphone or provider failure.

### Completion gate

- Parent has approved the active voice and retention policy.
- All published lesson audio is ready before Alonso starts.
- Audio begins within the agreed local performance threshold.
- Silence is distinct from incorrect/unintelligible speech.
- Every provider failure preserves lesson state and exposes a working fallback.
- Raw audio cleanup and secret isolation are verified.

## Recovery 7 - Mastery, review, stories, and parent progress

**Objective:** Close the controlled-learning loop with deterministic evidence-based adaptation.

### Scope

- Implement target-specific mastery and regression using evidence type, correctness, first attempt, independence, context transfer, and retrieval history—not lesson completion.
- Implement spaced review for weak, unstable, developing, and stable targets.
- Generate review recommendations from deterministic evidence and schedule parent-controlled review assignments.
- Deliver approved listening stories with character scenes and Phase A retell evidence.
- Add parent progress, history, assistance, break/support patterns, transcripts, evidence drill-down, and next actions.
- Generate `gpt-5.4-mini` summaries only from supplied evidence IDs and deterministically verify every claim boundary.
- Report `insufficient evidence` rather than false certainty.
- Keep phase/unit advancement an explicit audited parent decision.

### User-visible outcome

The parent sees what Alonso understands, what remains unstable, how much support he used, which reviews are due, and the evidence behind each recommendation.

### Completion gate

- One success cannot create mastery.
- Repeated difficulty can regress a target.
- Weak targets return promptly; stable targets receive maintenance review.
- Every summary claim traces to stored evidence.
- Completing a lesson updates recommendations but never automatically advances Alonso.

## Recovery 8 - Pilot verification and private-use readiness

**Objective:** Prove one complete five-lesson week is reliable, understandable, beautiful, and ready for regular private use.

### Scope

- Complete missing schema, authorization, lesson, audio, mastery, provider-failure, accessibility, responsive, privacy, and end-to-end tests.
- Verify RLS and RPC-only mutation boundaries.
- Verify idempotency, interruption recovery, stale-data protection, unpublish/replace recovery, raw-audio cleanup, and audit completeness.
- Review all parent and child screens at representative desktop and mobile sizes.
- Conduct an explicitly authorized six-year-old usability observation using the pilot week.
- Complete the operational runbook, curriculum guide, asset guide, privacy/retention notes, provider troubleshooting, and backup/recovery guidance.

### Final pilot acceptance

1. Parent reviews and revises the complete curriculum boundary.
2. Parent approves one five-day weekly plan.
3. Parent creates, completely previews, validates, and approves five unique lessons.
4. Parent explicitly publishes one assigned lesson and can withdraw it immediately.
5. Alonso sees only that lesson and completes it without needing to read English.
6. The guide character and audio make every task understandable.
7. Pause, reload, microphone denial, silence, and provider failure never lose state or strand Alonso.
8. Evidence distinguishes first attempt, independence, replay, prompt, and scaffolded success.
9. Mastery and review recommendations update deterministically.
10. Parent receives an evidence-grounded summary and retains control of advancement.

### Completion gate

- All applicable success criteria have recorded evidence.
- No draft, merely approved, stale, superseded, or unsupported lesson can reach Alonso.
- No required workflow contains a dead end or misleading state.
- Documentation matches the running application.
- The parent explicitly accepts the pilot for private use.

### Approval decisions

Test execution, formal screenshots, usability observation, and deployment each require separate explicit permission.

## Required test and acceptance coverage

Test artifacts may be created in their authorized recovery phase, but commands run only with explicit permission.

- Curriculum: target decisions, versioning, constraints, novelty, literacy, mastery requirements, overrides, and stale snapshots.
- Generation: exact weekly-plan/day alignment, target coverage, duration, sequence, assets, answer integrity, retries, and stuck-job recovery.
- Publication: approval is private; only explicit current assignments are child-visible; replace/withdraw is atomic.
- Authorization: anonymous and child accounts cannot access parent data; browser input cannot bypass state machines or scoring.
- Lesson state: ordered progression, bounds, full resume, first-attempt idempotency, remediation, breaks, completion, replay, and review attempts.
- Audio: pre-generation, cache, first listen versus replay, microphone denial, silence, timeout, quota, missing audio, cleanup, and fallback.
- Evidence: authoritative correctness/support, all target references, context transfer, and derived speech metadata.
- Mastery: one success cannot master; independent retrieval can advance; difficulty can regress; reviews prioritize unstable targets.
- Accessibility: keyboard, focus, labels, contrast, reduced motion, touch targets, captions, alt text, and no color-only feedback.
- Responsive: complete parent and child workflows on representative mobile and desktop sizes without horizontal scrolling.
- Privacy: no raw child audio, no external analytics, no secret leakage, and complete audited parent decisions.

## Defaults and exclusions

- One parent, one child, one Phase A pilot unit, and one five-lesson week.
- Direct password authentication for the two administratively provisioned users; no public signup.
- Immediate deletion of raw child audio.
- Local-first private development; no public deployment.
- npm only with a committed lockfile.
- No commercial systems, public sharing, advertising, analytics, multiple learners, unrestricted chat, emotional diagnosis, or automatic phase advancement.
- Phases B-F remain structural until the Phase A pilot is explicitly accepted.
- No recovery phase starts automatically.
