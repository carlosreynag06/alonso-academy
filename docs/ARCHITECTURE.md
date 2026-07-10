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
- Supabase migrations and generated database types begin only in Phase 2.
- Generated instructional content is never exposed to a child unless its immutable version is validated and parent-approved.

## Security baseline

The foundation removes the framework signature header and sets conservative referrer, framing, content-type, camera, and microphone policies. The microphone policy remains disabled until the explicitly authorized voice phase designs the narrow required exception.

Content Security Policy is intentionally deferred until provider transports and asset origins are known; guessing those origins now would either break later integration or create an overly broad policy.
