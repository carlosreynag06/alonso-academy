# Alonso Academy

Alonso Academy is a private, curriculum-controlled American English learning application for one child and one parent. The project is intentionally developed in separately approved phases.

## Current status

Phase 3 adds the shared visual system, responsive parent and child shells, accessible learning controls, and standard loading, empty, error, audio, and microphone states. Parent sign-in remains deliberately locked until the single allowlist email is supplied and provisioned.

## Local setup

Requirements: Node.js 20.9 or newer and npm 11.

```bash
npm install
copy .env.example .env.local
npm run dev
```

The environment template contains names only. Never commit `.env.local` or any provider secret.

## Commands

- `npm run dev` — start local development
- `npm run build` — create a production build
- `npm run lint` — run ESLint
- `npm run typecheck` — check TypeScript
- `npm test` — run the Vitest suite
- `npm run supabase -- <command>` — run the pinned Supabase CLI
- `npm run db:status` — compare local and remote migration history
- `npm run db:push` — apply pending migrations to the linked project

Tests and screenshots must not be executed without explicit user permission. See [PHASE_PLAN.md](./PHASE_PLAN.md) for the implementation protocol and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for foundation boundaries.

Supabase setup and parent provisioning are documented in [docs/PHASE_2_DATA_AND_AUTH.md](./docs/PHASE_2_DATA_AND_AUTH.md). Visual-system behavior is documented in [docs/PHASE_3_VISUAL_SYSTEM.md](./docs/PHASE_3_VISUAL_SYSTEM.md).
