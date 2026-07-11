# Alonso Academy

Alonso Academy is a private, curriculum-controlled American English learning application for one child and one parent. The project is intentionally developed in separately approved phases.

## Current status

Phase 5 adds the parent command center and the complete planning approval workflow. The allowlisted parent can review the pilot curriculum, request a five-day plan, inspect validation, approve or reject immutable versions, regenerate with precise direction, and create individual daily, review, or listening-story lessons after approving a week. OpenAI remains server-only and nothing generated is child-readable yet.

The application entrance is available at `/` and `/login`. The two pre-provisioned Supabase accounts sign in directly with their passwords; the verified identity routes to either the parent workspace or Alonso's learning space. There is no public signup or magic-link flow.

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

Supabase setup and parent provisioning are documented in [docs/PHASE_2_DATA_AND_AUTH.md](./docs/PHASE_2_DATA_AND_AUTH.md). Visual-system behavior is documented in [docs/PHASE_3_VISUAL_SYSTEM.md](./docs/PHASE_3_VISUAL_SYSTEM.md). The generation boundary is documented in [docs/PHASE_4_GENERATION_CORE.md](./docs/PHASE_4_GENERATION_CORE.md), and the parent workflow in [docs/PHASE_5_PARENT_COMMAND_CENTER.md](./docs/PHASE_5_PARENT_COMMAND_CENTER.md).
