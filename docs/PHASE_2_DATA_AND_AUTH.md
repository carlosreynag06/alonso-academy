# Phase 2: Data and Parent Authentication

## Hosted project

- Project: `Alonso Academy`
- Project reference: `plodimwenhxkrcwfvhwc`
- Region: `us-east-2`
- Local URL: `http://localhost:3000`
- Auth callback: `http://localhost:3000/auth/confirm`

The publishable project URL/key live only in ignored `.env.local`. The personal access token and privileged project keys are never stored in the repository.

## Authentication policy

Public signup and anonymous authentication are disabled. The application calls magic-link sign-in with `shouldCreateUser: false`, so an unknown address cannot create an account.

Parent access requires all three conditions:

1. `PARENT_ALLOWLIST_EMAIL` contains the normalized parent email in `.env.local`.
2. The same email exists in `public.parent_allowlist`.
3. A corresponding Supabase Auth user has been provisioned administratively.

The parent Auth user and allowlist entry were provisioned after the parent supplied the address privately. The normalized address is stored only in ignored local configuration and the private Supabase allowlist; it is not committed. Never infer or add another parent identity from Git or provider ownership.

## Curriculum approval

The migration creates six structural phase records and one draft pilot unit, `A-U1: Hello, Listen, and Respond`. Its vocabulary, sentence frames, sound anchors, and letter-selection target are all drafts.

The parent review screen calls `approve_curriculum_unit`. The database function:

- verifies the caller against the parent allowlist;
- requires a meaningful approval reason;
- promotes the unit and all its targets atomically;
- records an immutable approval record and audit event.

No draft is visible through a child-facing policy or session.

## Migration workflow

The authoritative migration is `supabase/migrations/20260710220000_phase_2_foundation.sql`. The hosted database records version `20260710220000` in `supabase_migrations.schema_migrations`.

For future changes:

1. Create a new timestamped migration.
2. Review SQL and RLS policies before applying it.
3. Link the CLI using secure authentication outside the repository.
4. Run `npm run db:status` before `npm run db:push`.
5. Never rewrite an applied migration.

## Data minimization

- Only one child profile is allowed by a singleton constraint.
- Child audio has no storage column; only derived transcripts and confidence metadata are permitted.
- Provider metadata is explicitly restricted to safe, non-secret JSON.
- Audit and approval history is append-only through RLS policies.
- Later child access must use server-side validation of a hashed, time-limited session token.
