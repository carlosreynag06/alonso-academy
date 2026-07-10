# Alonso Academy Phased Implementation Plan

## Purpose and implementation protocol

Alonso Academy will prove one controlled learning loop for one parent and one child:

**approved curriculum -> parent-requested generation -> validation -> parent approval -> child lesson -> evidence -> mastery and review -> parent summary**

The first usable scope is one parent-approved Phase A Unit 1 and a five-lesson week. Phases B-F are represented structurally but contain no invented curriculum.

## Phase status

- Phase 1 completed and pushed on 2026-07-10.
- Phase 2 implemented and connected on 2026-07-10. Parent authentication activation and curriculum approval remain intentionally pending the parent allowlist email.
- Phase 3 completed on 2026-07-10 with shared parent/child shells, design tokens, accessible primitives, and standard experience states.
- Phases 4-9 are not authorized.

Before starting any phase, Codex must reopen this file, restate the exact authorized scope, complete only that scope, report the result, and stop. Tests, screenshots, deployment, provider substitutions, plan changes, and work in the next phase require explicit permission where noted.

## Fixed architecture and public contracts

- Next.js 16.2 App Router (latest secure 16.2 patch), React, strict TypeScript, npm, Server Components by default, CSS Modules, and accessible responsive UI.
- Existing Supabase project for PostgreSQL, migrations, Row Level Security, Storage where needed, and one allowlisted parent authenticated by email magic link.
- OpenAI Responses API model `gpt-5.5` with high reasoning and strict structured output for weekly plans, lessons, stories, and semantic validation. No fallback is permitted without approval.
- `gpt-5.4-mini` only for evidence-bound summaries and low-risk classifications. Deterministic code remains authoritative for access, curriculum constraints, decodability, mastery, and review scheduling.
- Server-only provider adapters for OpenAI and ElevenLabs. ElevenLabs MCP handles reusable generation and batch operations; server-authorized streaming handles interactive speech where MCP is not a browser transport.
- Versioned shared contracts: `CurriculumScope`, `WeeklyPlanDraft`, `DailyLessonDraft`, discriminated `LessonBlock`, `ValidationReport`, `ApprovalRecord`, `ActivityEvidence`, `MasteryRecord`, `ReviewRecommendation`, and `ProviderResult`.
- Immutable artifact lifecycle: `draft -> validating -> validation_failed | validated -> approved -> active -> completed -> archived`. Regeneration creates a new version and never inherits approval.
- A restricted child-session token exposes only the active approved lesson and evidence submission. Parent routes require Supabase authentication; leaving child mode requires parent reauthentication.
- Raw microphone recordings are deleted immediately after processing. Only transcripts, provider confidence, timing, scoring evidence, support level, and non-sensitive failure metadata may persist.

## Phase 1 - Repository and application foundation

**Objective:** Establish a secure, reproducible application without connecting product integrations.

- **Scope:** Initialize Git and `main`; connect `carlosreynag06/alonso-academy`; scaffold Next.js with TypeScript and npm; add lint, typecheck, and test configuration; create environment templates, architecture documentation, and the setup-state entry experience.
- **Prerequisites:** Explicit Phase 1 authorization and GitHub authentication for the final push.
- **Files/systems:** Git metadata, `package.json`, `package-lock.json`, App Router source, `.gitignore`, `.env.example`, `README.md`, `docs/`, and test-runner configuration.
- **Integrations:** GitHub remote only. Supabase, OpenAI, and ElevenLabs remain unconfigured placeholders.
- **User-visible outcome:** A responsive Alonso Academy entry page with clearly inactive Parent and Alonso destinations.
- **Technical outcome:** Pinned npm foundation, strict TypeScript, documented server/client boundaries, conservative response headers, safe environment contract, and no database schema.
- **Data implications:** None.
- **Security implications:** Secret files are ignored; environment examples contain names only; privileged modules must import `server-only`; no secret is printed or committed.
- **Dependencies:** Node 20.9 or newer, npm 11, Git, and access to the target GitHub repository.
- **Excluded:** Authentication, database work, API keys, curriculum, generation, lessons, provider connections, production deployment, and final UI workflows.
- **Completion criteria:** The scaffold is reproducible using npm, documentation is present, environment access fails with a sanitized missing-variable message, Git uses `main`, and the initial commit is pushed.
- **Risks:** GitHub authentication, OneDrive locks, and npm audit findings may require separately approved remediation.
- **Approval decisions:** Test execution and screenshots remain separately permissioned.

## Phase 2 - Curriculum, data model, and parent authentication

**Objective:** Make approved curriculum and authorization, rather than AI, the source of truth.

- **Scope:** Add Supabase migrations, RLS, parent magic-link authentication, child-session design, audit records, curriculum inspection, and curriculum import/approval.
- **Prerequisites:** Phase 1 complete; Supabase access; parent email provided privately.
- **Files/systems:** Migrations and typed access for profiles, curriculum, vocabulary, sentence frames, phonics and writing targets, artifacts, approvals, overrides, evidence, mastery, reviews, provider metadata, and audit events.
- **Integrations:** Supabase Auth and PostgreSQL.
- **User-visible outcome:** Parent login, protected parent routes, curriculum inspection, honest empty states, and child-mode protection.
- **Technical outcome:** Explicit keys and constraints, typed queries, RLS denying anonymous learning-history access, and audited curriculum changes.
- **Data implications:** Seed six phase definitions only. Draft one Phase A Unit 1 pack and keep it inactive until explicit parent approval.
- **Security implications:** One allowlisted parent, no public signup, server-only service role, and reasoned/timestamped overrides.
- **Dependencies:** Approved database schema and successful connection to the existing Supabase project.
- **Excluded:** AI generation, lesson playback, voice, mastery calculations, and later-phase content.
- **Completion criteria:** Unauthorized access is denied; no curriculum target activates without an approval record; the parent can inspect the pilot draft.
- **Risks:** Pilot curriculum is educationally consequential and must not become canonical silently.
- **Approval decisions:** Parent must approve Unit 1 targets, novelty limits, literacy demands, and exit evidence before Phase 3.

## Phase 3 - Visual system and responsive experience shell

**Objective:** Establish a calm, polished visual language for parent and child workflows.

- **Scope:** Add design tokens, typography, icons, layouts, accessible controls, navigation, audio/microphone states, and loading, empty, error, and reduced-motion behavior.
- **Prerequisites:** Phase 2 role and route boundaries.
- **Files/systems:** Shared component library, route layouts, state patterns, and accessibility helpers.
- **Integrations:** Authenticated application data only.
- **User-visible outcome:** Cohesive desktop/mobile parent and child shells without gamification.
- **Technical outcome:** Reusable controls for progress, selection, recording, approval, alerts, and stories.
- **Data implications:** Components consume minimal typed view models and never issue privileged queries.
- **Security implications:** UI visibility never replaces server authorization.
- **Dependencies:** Approved visual direction and route map.
- **Excluded:** Final dashboard data, live generation, lesson execution, decorative motion, and screenshot baselines.
- **Completion criteria:** Primary layouts avoid horizontal scrolling; required states are defined; keyboard and touch interactions are supported.
- **Risks:** Visual refinement can expand scope beyond the shared system.
- **Approval decisions:** Parent reviews the running visual direction; screenshot capture still requires permission.

## Phase 4 - Structured generation and validation core

**Objective:** Build a server pipeline that cannot publish AI output directly.

- **Scope:** Add schemas, prompt assembly, jobs, retries, deterministic and semantic validation, provider failures, and sanitized audits for weekly plans, lessons, stories, and summaries.
- **Prerequisites:** Approved pilot curriculum and authorized OpenAI credential setup.
- **Files/systems:** Server-only OpenAI client, schema registry, curriculum snapshot builder, validators, generation records, and redacted logging.
- **Integrations:** Project-scoped OpenAI key and `gpt-5.5` Responses API.
- **User-visible outcome:** Generation readiness and understandable validation failures; no child publication.
- **Technical outcome:** Every request includes phase, unit, approved and banned targets, mastery/review context, duration, safety rules, and strict output schema.
- **Data implications:** Store model and prompt versions, reasoning configuration, curriculum snapshot, output version, validation report, and failure category; never store hidden reasoning.
- **Security implications:** Parent-only rate limiting, no client API calls, secret redaction, and fail-closed malformed output.
- **Dependencies:** Model access and approved structured schemas.
- **Excluded:** Automatic generation, approval, advancement, fallback models, and free chat.
- **Completion criteria:** Only schema- and curriculum-valid artifacts reach `validated`; violations remain visible and retries are idempotent.
- **Risks:** Model quota, availability, latency, and structured-output edge cases.
- **Approval decisions:** Stop if `gpt-5.5` is unavailable; do not substitute.

## Phase 5 - Parent command center and approval workflow

**Objective:** Give the parent complete control over generation and publication.

- **Scope:** Implement dashboard, weekly and daily generation, review/story requests, approval queue, rejection notes, regeneration, curriculum views, and integration status.
- **Prerequisites:** Phase 4 operational and pilot curriculum approved.
- **Files/systems:** Parent routes, server mutations, artifact versioning, approval state machine, and audit views.
- **Integrations:** Supabase and OpenAI.
- **User-visible outcome:** Parent requests, inspects, approves, rejects, and regenerates five-day plans and individual lessons.
- **Technical outcome:** Lessons require an approved week; publication requires current validation and explicit approval.
- **Data implications:** Preserve failed/rejected versions, notes, timestamps, curriculum snapshots, and regeneration ancestry.
- **Security implications:** Every mutation authorizes the parent; a changed curriculum snapshot invalidates stale approval.
- **Dependencies:** Stable Phase 4 contracts and database policies.
- **Excluded:** Child playback, voice, automatic scheduling, bulk approval, and phase advancement.
- **Completion criteria:** Child-facing queries never return drafts; missing prerequisites block generation with clear guidance.
- **Risks:** Reviews must be detailed without becoming overwhelming.
- **Approval decisions:** Parent approves the first week and lesson before Phase 6 consumes them.

## Phase 6 - Child lesson player and learning evidence

**Objective:** Deliver approved lessons independently and record evidence rather than completion alone.

- **Scope:** Add Alonso Home, introduction, ordered blocks, listening and picture selections, phonemic awareness, simple letter work, pause/resume, breaks, remediation, exit checks, and completion.
- **Prerequisites:** At least one approved Phase 5 lesson.
- **Files/systems:** Restricted child session, resumable player, activity registry, evidence ingestion, and child-safe recovery.
- **Integrations:** Supabase; approved static audio placeholders only.
- **User-visible outcome:** Alonso completes a predictable lesson on mobile or desktop without parent controls.
- **Technical outcome:** Only registered block types from approved versions render; unsupported content fails closed.
- **Data implications:** Separate first attempt from replay/scaffolded attempts and store latency, retries, assistance, breaks, and completion.
- **Security implications:** Child requests are scoped to the active lesson and cannot access parent data or arbitrary targets.
- **Dependencies:** Approved lesson contract and child-session authorization.
- **Excluded:** Live speech scoring, pronunciation correction, open conversation, advanced literacy, and automatic mastery.
- **Completion criteria:** Interrupted lessons resume, remediation reduces difficulty, and each scored block records meaningful evidence.
- **Risks:** Young-child usability needs carefully approved observation and iteration.
- **Approval decisions:** Formal usability tests and screenshots require permission.

## Phase 7 - ElevenLabs audio, speech, and pronunciation

**Objective:** Add consistent American English modeling and selective speech evidence.

- **Scope:** Add cached TTS, narration, audio replay, microphone permission, short/realtime STT, silence handling, retries, and limited pronunciation feedback.
- **Prerequisites:** Stable player and approved American English voice.
- **Files/systems:** ElevenLabs adapter, audio metadata/cache, recording state, transcript normalization, cleanup, and fallback UI.
- **Integrations:** ElevenLabs MCP for reusable/batch work and server-authorized streaming for interactive transcription.
- **User-visible outcome:** Immediate models, clear recording states, neutral retries, and child-safe failure recovery.
- **Technical outcome:** Quality-first reusable audio, balanced short transcription, and low-latency interactive turns.
- **Data implications:** Delete raw recordings immediately; retain derived evidence only and never use recordings for training.
- **Security implications:** No browser API key; recording begins only after child action; denial does not damage lesson state.
- **Dependencies:** Provider access, voice choice, and transport security.
- **Excluded:** Open voice chat, emotion diagnosis, recording archives, and accent-perfect scoring.
- **Completion criteria:** Silence differs from incorrect speech, provider failure falls back safely, and minor accent differences never block completion.
- **Risks:** Child speech transcription and pronunciation confidence can be unreliable.
- **Approval decisions:** Parent selects the voice and approves any retention-policy change.

## Phase 8 - Mastery, review, stories, and parent progress

**Objective:** Close the learning loop using recorded evidence.

- **Scope:** Add mastery transitions/regression, spaced review, remediation scheduling, progress, history, summaries, listening stories, Phase A retell, and advancement recommendations.
- **Prerequisites:** Completed lesson evidence and working voice/audio.
- **Files/systems:** Mastery engine, scheduler, summary builder, constrained story pipeline, and progress/history routes.
- **Integrations:** Supabase, `gpt-5.5` for stories, and `gpt-5.4-mini` for evidence-bound summaries.
- **User-visible outcome:** Parent sees strengths, unstable targets, assistance, frustration signals, reviews, and next actions in plain language.
- **Technical outcome:** Mastery uses evidence type, independence, transfer, and retrieval history, never completion alone.
- **Data implications:** Maintain target evidence histories and due dates; AI summaries reference underlying evidence internally.
- **Security implications:** AI cannot invent measurements or advance the learner; advancement is audited parent action.
- **Dependencies:** Evidence semantics and parent-approved mastery rules.
- **Excluded:** Full later-phase curriculum, automatic advancement, emotional diagnosis, and unapproved decodable content.
- **Completion criteria:** Weak targets return, stable targets receive maintenance, and uncertainty is reported when evidence is sparse.
- **Risks:** Early evidence can produce false confidence unless insufficient evidence is explicit.
- **Approval decisions:** Parent approves any movement beyond the pilot unit.

## Phase 9 - End-to-end hardening and pilot readiness

**Objective:** Prepare the approved Phase A pilot for reliable private use.

- **Scope:** Finish errors, responsive behavior, accessibility, provider health, recovery, documentation, privacy review, and acceptance artifacts.
- **Prerequisites:** Phases 1-8 complete.
- **Files/systems:** Runbook, curriculum guide, privacy notes, troubleshooting, backup/restore guidance, and test suites.
- **Integrations:** End-to-end Supabase, OpenAI, and ElevenLabs checks.
- **User-visible outcome:** One polished five-lesson Phase A week from generation through review.
- **Technical outcome:** Idempotency, safe retries, stale-data protection, sanitized failures, and documented recovery for every PRD failure mode.
- **Data implications:** Verify minimization, audio deletion, audit completeness, and absence of analytics.
- **Security implications:** Verify RLS, secret isolation, and child-session boundaries.
- **Dependencies:** Completed functionality and explicit permission to execute verification.
- **Excluded:** Public deployment, commercial features, multiple learners, later-phase content, analytics, and unapproved export/reset.
- **Completion criteria:** Pilot success criteria have evidence, drafts cannot reach Alonso, and documentation matches the system.
- **Risks:** Readiness cannot be claimed until authorized tests execute successfully.
- **Approval decisions:** Tests, screenshots, and deployment each require separate permission.

## Test and acceptance plan

Test artifacts may be created in their authorized phase, but commands must not run without explicit permission.

- Reject malformed schemas, unknown blocks, unsupported references, and unapproved curriculum or excess novelty.
- Prove drafts and failed validation never reach child queries and regeneration never inherits approval.
- Prove anonymous/child sessions cannot access parent data and only the allowlisted parent can approve or override.
- Preserve first-attempt evidence separately from replayed or scaffolded success; prove pause/resume is lossless.
- Cover microphone denial, silence, provider timeout, missing audio, retry, and immediate raw-audio deletion.
- Prove one success cannot establish mastery, independent retrieval may advance it, difficulty may regress it, and unstable due targets are prioritized.
- Cover provider and database failure, expired session, interruption, and malformed output without damaging approved data.
- Verify keyboard access, focus, labels, contrast, reduced motion, touch targets, and non-color-only feedback.
- Verify parent approval and child lessons on representative mobile and desktop layouts without horizontal scrolling.
- Final acceptance: approve a week and lesson, complete it, record evidence, update review, and produce an evidence-grounded parent summary.

## Defaults

- One parent, one child, one Phase A pilot unit, five lessons.
- Email magic-link parent authentication with public registration disabled.
- Immediate deletion of raw child audio.
- Local-first development with no public deployment.
- npm only; dependency versions are locked in `package-lock.json`.
- No phase continues automatically.
