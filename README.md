# Alonso Academy

Alonso Academy is intended to become a private, curriculum-controlled American English learning application for one child and one parent. The repository currently contains an unverified product scaffold, not a pilot-ready learning application.

## Current status

The project has implemented **Recovery 0: truth reset, fixtures, and acceptance contract**. Earlier Phase 2-7 documents record useful implementation history, but their phase-completion language is superseded: compilation and the presence of routes, migrations, or adapters do not prove that the corresponding product outcome works. Recovery 0 is not `verified` or `pilot-ready` because formal tests, screenshots, usability observation, and end-to-end pilot acceptance were not authorized or performed.

What exists today includes a shared password entrance, parent curriculum/generation/review routes, an approved-artifact lesson renderer, evidence RPCs, and dormant ElevenLabs adapters. These pieces have not passed an authorized end-to-end pilot. The controlled-learning loop still lacks verified publication sequencing, reliable child evidence/resume behavior, mastery and review transitions, parent progress, and an evidence-bound summary.

Live ElevenLabs audio is not active until a provider key and an explicitly parent-approved American English voice are configured. The presence of the adapter must not be described as a working speech experience.

### Recovery 0 mutation lock

Until the recovery audit explicitly releases this lock, do not mutate hosted curriculum, approvals, generated artifacts, child evidence, mastery/review records, provider administration, or voice/retention settings. Product and UX exploration may use **local-only fixtures** that are visibly labeled as fixtures, remain outside hosted Supabase, contain no real child evidence, and can never be returned by child-facing production queries.

The fixture controller is available only in local development when `ALONSO_ENABLE_DEV_FIXTURES=true`, at `http://localhost:3000/dev/fixtures`. Fixture sessions use an ignored local JSON file and cannot instantiate the Supabase, OpenAI, or ElevenLabs clients.

Tests and screenshot capture still require explicit permission. A successful build is a compilation check only.

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

Tests and screenshots must not be executed without explicit user permission. See [PHASE_PLAN.md](./PHASE_PLAN.md) for the historical implementation protocol and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the current architecture and recovery boundaries.

The Phase 2-7 documents preserve historical design and implementation details. Their prominent recovery notices are authoritative wherever older outcome language implies verification.
