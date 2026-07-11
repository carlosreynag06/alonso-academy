# Foundation Architecture

## Runtime

- Next.js 16.2 App Router with React and strict TypeScript
- npm with a committed `package-lock.json`
- Server Components by default; Client Components only where browser interaction requires them
- CSS Modules for route/component styling and global CSS only for tokens and base rules

## Planned boundaries

- `src/app` owns routes and minimal view composition.
- `src/lib` owns domain, data, validation, and provider boundaries.
- Secrets are read only by modules that import `server-only`.
- Browser code never receives OpenAI, ElevenLabs, or Supabase service-role credentials.
- Supabase migrations and typed database contracts live under `supabase/migrations` and `src/types`.
- Generated instructional content is never exposed to a child unless its immutable version is validated and parent-approved.

## Phase 2 data and identity boundaries

- Supabase SSR clients are created per request and use the publishable key plus user cookies.
- `src/proxy.ts` refreshes authentication cookies but does not replace database authorization.
- All 20 exposed application tables have RLS enabled; anonymous access has no policies.
- Parent authorization requires the configured identity, a matching database allowlist row, and a verified Supabase password session.
- Alonso authorization requires the configured child identity, a verified password session, and a database link from that Auth user to the singleton child profile.
- Public signup and anonymous sign-in are disabled in hosted and local Supabase Auth configuration.
- Parent and Alonso sessions use Supabase's server-managed authentication cookies. Role switching requires sign-out and reauthentication.
- The Phase A pilot and every target begin as `draft`; the approval RPC promotes the unit and targets together and writes approval/audit records.

## Security baseline

The foundation removes the framework signature header and sets conservative referrer, framing, content-type, camera, and microphone policies. The microphone policy remains disabled until the explicitly authorized voice phase designs the narrow required exception.

Content Security Policy is intentionally deferred until provider transports and asset origins are known; guessing those origins now would either break later integration or create an overly broad policy.

## Phase 3 experience architecture

- Global CSS owns semantic tokens, base accessibility rules, focus treatment, and reduced-motion behavior.
- CSS Modules own route and component styling; no route imports privileged data into a Client Component.
- `src/components/ui` provides reusable action, status, feedback, progress, selection, audio, microphone, and story primitives.
- `src/components/shells` separates the professional parent workspace from Alonso's warmer, simpler learning environment.
- Parent navigation is presentation only; Supabase RLS and server access checks remain authoritative.
- Route-level loading, error, and not-found boundaries use plain-language recovery and never expose technical details to Alonso.

## Phase 4 generation boundary

- `src/lib/generation/contracts.ts` is the versioned registry for plans, lessons, blocks, stories, summaries, validation reports, evidence, mastery, review, approvals, and provider results.
- `src/lib/generation/snapshot.ts` reads only approved curriculum targets and hashes the immutable boundary supplied to a request.
- `src/lib/generation/provider.ts` is server-only, fixes instructional work to `gpt-5.5` with high reasoning, disables API-side response storage, and has no fallback path.
- Deterministic schema and curriculum checks run before semantic validation. Model judgment cannot override a code-level failure.
- `generation_jobs` provides one request hash per idempotency key, bounded attempts, safe failure fields, and parent-only RLS.
- `validated` is still private. Explicit parent approval produces a distinct audited state, and child delivery remains absent until Phase 6.

## Phase 5 parent-control boundary

- Parent actions call `getParentAccessState` before every generation, approval, rejection, or regeneration mutation; RLS and security-definer RPC checks independently enforce the same boundary.
- The command center progresses from curriculum approval, to weekly-plan generation, to weekly approval, to individual lesson generation. Missing prerequisites remain visible and fail closed.
- Artifact lineage is explicit. A lineage key plus version is unique, regeneration points to the previous version, and approval records apply to one artifact ID only.
- `approve_generated_artifact` accepts only `validated` artifacts whose stored curriculum unit version and approval timestamp still match the current approved unit.
- Non-week artifacts additionally require their exact parent weekly plan to remain approved.
- Rejection archives rather than deletes the version and preserves the parent's note in append-only approval and audit history.
- No child query or lesson renderer is introduced in this phase.

## Two-user password entrance

- `/` and `/login` render the same private entrance. There is no public marketing route or role selector.
- The server action accepts only the two configured identities and calls Supabase `signInWithPassword`; generic errors do not reveal which account exists.
- After verification, the account identity determines `/parent` or `/alonso`. A submitted role value cannot influence authorization.
- Parent pages require the parent allowlist and profile RPC. Alonso pages require `get_current_child_profile`, which succeeds only when the authenticated Auth user is linked to the singleton child profile.
- The former magic-link callback now redirects to `/login`, and the legacy `/parent/login` route does the same.

## Phase 6 child lesson boundary

- Alonso Home calls a security-definer RPC that resolves the authenticated singleton child and returns only approved daily/review lessons plus that child's active attempt.
- The server parses every returned lesson through the strict daily-lesson schema and a registered Phase 6 block allowlist. Unknown or later-phase blocks fail closed and never render.
- Starting, resuming, saving, recording evidence, and completing are separate child-only RPCs. Each derives the child ID from `auth.uid()` rather than trusting a browser-supplied child ID.
- Evidence ingestion verifies that the attempt belongs to the child, the artifact remains approved, the block ID exists in that immutable artifact, and the optional target ID belongs to that exact block.
- A client event UUID makes evidence retries idempotent. A partial unique index preserves one first-attempt record per attempt/block while allowing later supported or scaffolded attempts.
- Lesson progress stores the current block index, break count, minimal player state, and last activity time. Pause/resume never changes the approved artifact.
- Completion refuses to proceed while an exit-check block lacks recorded evidence.
- Phase 6 uses no microphone, raw audio, pronunciation scoring, mastery transitions, or child-facing free chat.

## Phase 7 audio and speech boundary

- Audio routes resolve text from the authenticated child's active approved artifact and block ID. The browser cannot submit arbitrary text for synthesis.
- ElevenLabs credentials and the approved voice ID are read only in server-only provider modules. Missing provider configuration produces a safe text/choice fallback and never interrupts lesson state.
- Quality-first MP3 models are cached under ignored local application data using a SHA-256 key derived from voice, model, and approved text.
- Microphone recording begins only after Alonso taps the control. A short recording remains in browser/request memory, is sent directly for transcription, and is released without filesystem, object-storage, or database persistence.
- The speech RPC stores only transcript, provider confidence, latency, retry/support state, deterministic outcome, and safe model metadata. Its metadata explicitly records that raw audio was not stored.
- Deterministic normalization treats silence separately from a mismatch and accepts close transcriptions. Minor accent variation cannot block the lesson; a choice fallback remains available after a retry or provider failure.
- Phase 7 does not add open voice conversation, emotional inference, audio archives, automatic mastery, or phase advancement.
