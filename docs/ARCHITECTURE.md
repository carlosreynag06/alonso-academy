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
- All 19 exposed application tables have RLS enabled; anonymous access has no policies.
- Parent authorization requires both the configured local email and a matching database allowlist row.
- Public signup and anonymous sign-in are disabled in hosted and local Supabase Auth configuration.
- Child sessions store only SHA-256 token hashes and are designed for server-mediated access to one approved lesson.
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
- `validated` is still private. Phase 5 must add explicit parent approval and immutable publication transitions before anything is child-readable.
