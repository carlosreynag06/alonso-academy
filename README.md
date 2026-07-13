# Alonso Academy

Alonso Academy is intended to become a private, curriculum-controlled American English learning application for one child and one parent. The repository currently contains an unverified product scaffold, not a pilot-ready learning application.

## Current status

The project now contains an **implemented Recovery 2 candidate direction** for parent review. Recovery 0's truth reset and acceptance contract and Recovery 1's authoritative domain implementation remain foundations. No recovery is `verified` or `pilot-ready`: the Recovery 2 character/world, interaction, adult-interface, and generated concept assets are not approved until the parent explicitly records a decision. The committed Recovery 1 migration is still not claimed as applied to hosted Supabase, and formal tests, screenshots, child-usability observation, live-provider verification, and end-to-end pilot acceptance have not been established.

Recovery 2 adds a 12–15 minute Phase A instructional blueprint, the original Luma Landing cast and art bible, seven visual/audio interaction storyboards, a separate compact adult-workspace direction, an immutable asset-contract proposal, four generated concept images, and the authenticated read-only review room at `http://localhost:3000/parent/recovery-2`. These are design candidates, not rebuilt production screens or lesson assets. The controlled-learning loop still lacks parent approval of this direction, lesson schema v2 and production asset validation, final parent and child applications, verified production audio/speech, mastery/review transitions, parent progress/history, and an evidence-bound summary.

Live ElevenLabs audio is not active until a provider key and an explicitly parent-approved American English voice are configured. The presence of the adapter must not be described as a working speech experience.

### Recovery 2 fail-closed boundary

Hosted product mutations, child delivery, generation, curriculum decisions, and live speech remain locked while the Recovery 2 direction awaits explicit parent approval. The Recovery 1 publication and attempt contracts remain implemented in the repository, but the unverified hosted migration state is not treated as permission to expose the old v1 child experience. Local fixture scenarios remain available for isolated recovery work.

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

Tests and screenshots must not be executed without explicit user permission. See [PHASE_PLAN.md](./PHASE_PLAN.md) for the recovery sequence, [Recovery 0 baseline](./docs/RECOVERY_0_BASELINE.md) for capability language and fixture isolation, [Recovery 1 domain](./docs/RECOVERY_1_DOMAIN.md) for the authoritative schema/RPC/runtime contract, [Recovery 2 instructional blueprint](./docs/RECOVERY_2_INSTRUCTIONAL_BLUEPRINT.md), [Recovery 2 character world](./docs/RECOVERY_2_CHARACTER_WORLD.md), [Recovery 2 child art bible](./docs/RECOVERY_2_ART_BIBLE.md), [Recovery 2 interaction storyboards](./docs/RECOVERY_2_INTERACTION_STORYBOARDS.md), [Recovery 2 adult direction](./docs/RECOVERY_2_PARENT_DIRECTION.md), [Recovery 2 asset contract](./docs/RECOVERY_2_ASSET_CONTRACT.md), [Recovery 2 image prompt record](./docs/RECOVERY_2_IMAGE_PROMPTS.md), [route and state matrix](./docs/ROUTE_STATE_MATRIX.md), and [pilot acceptance contract](./docs/PILOT_ACCEPTANCE_CONTRACT.md).
