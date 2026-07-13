# Alonso Academy

Alonso Academy is intended to become a private, curriculum-controlled American English learning application for one child and one parent. The repository currently contains an unverified product scaffold, not a pilot-ready learning application.

## Current status

The project has implemented **Recovery 1: authoritative domain, publication, and evidence model** in the repository. Recovery 0’s truth reset, fixtures, and acceptance contract remain authoritative foundations. Neither recovery is `verified` or `pilot-ready`: the committed Recovery 1 migration is not claimed as applied to hosted Supabase, and formal tests, screenshots, child-usability observation, live-provider verification, and end-to-end pilot acceptance have not been established.

What exists today includes direct password authentication for the two configured identities, parent curriculum/generation/review routes, a transitional five-day publication board, private artifact approval, audited assignment/publication/replacement/withdrawal controls, one-assignment child delivery, assignment-bound attempts, and server-derived v1 evidence/progression. These pieces have not passed an authorized end-to-end pilot. The controlled-learning loop still lacks the approved character-led instructional design, final parent and child applications, lesson schema v2 and asset validation, verified production audio/speech, mastery/review transitions, parent progress/history, and an evidence-bound summary.

Live ElevenLabs audio is not active until a provider key and an explicitly parent-approved American English voice are configured. The presence of the adapter must not be described as a working speech experience.

### Recovery 1 fail-closed boundary

Generation, curriculum decisions, and live speech remain locked. The only enabled product transitions are the narrow audited Recovery 1 publication and assignment/attempt contracts. Approval remains private; only an explicit published assignment can be returned to the child. Broad authenticated table writes and the legacy browser-authoritative evidence/progress functions are superseded by the committed Recovery 1 migration.

Product and UX exploration may use **local-only fixtures** that are visibly labeled, remain outside hosted Supabase, contain no real child evidence, and can never satisfy final acceptance. The fixture controller is available only in local development when `ALONSO_ENABLE_DEV_FIXTURES=true`, at `http://localhost:3000/dev/fixtures`. Fixture sessions use ignored local JSON and cannot instantiate Supabase, OpenAI, or ElevenLabs clients. Hosted parent publication mutations are unavailable in fixture sessions.

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

Tests and screenshots must not be executed without explicit user permission. See [PHASE_PLAN.md](./PHASE_PLAN.md) for the recovery sequence, [Recovery 0 baseline](./docs/RECOVERY_0_BASELINE.md) for capability language and fixture isolation, [Recovery 1 domain](./docs/RECOVERY_1_DOMAIN.md) for the exact implemented schema/RPC/runtime contract, [route and state matrix](./docs/ROUTE_STATE_MATRIX.md) for current route behavior, and [pilot acceptance contract](./docs/PILOT_ACCEPTANCE_CONTRACT.md) for the proof required before private use is called pilot-ready.
