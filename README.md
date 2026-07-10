# Alonso Academy

Alonso Academy is a private, curriculum-controlled American English learning application for one child and one parent. The project is intentionally developed in separately approved phases.

## Current status

Phase 1 establishes only the repository and application foundation. Integrations, authentication, curriculum data, generation, and lesson delivery are intentionally inactive.

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

Tests and screenshots must not be executed without explicit user permission. See [PHASE_PLAN.md](./PHASE_PLAN.md) for the implementation protocol and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for foundation boundaries.
