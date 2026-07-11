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
