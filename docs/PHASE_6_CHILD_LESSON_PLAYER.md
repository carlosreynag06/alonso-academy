# Phase 6: Child Lesson Player and Learning Evidence

## Outcome

Phase 6 establishes Alonso's independent learning application without inventing or auto-approving content. Alonso Home discovers only parent-approved daily or review lessons. Because the pilot curriculum and first lesson still await parent approval, the current live outcome is an intentional preparation state; the complete player becomes reachable as soon as a supported lesson is approved.

The child visual system is deliberately different from the parent workspace. It uses a warm illustrated landscape, large stable controls, vivid but non-competitive color, friendly motion that respects reduced-motion preferences, and predictable activity placement. It contains no points, streaks, leaderboards, prizes, or manipulative reward loop.

## Supported lesson flow

The player supports these registered Phase 6 blocks:

- model audio presentation;
- listening selection;
- picture/action selection;
- phonemic-awareness response;
- simple letter work;
- movement break;
- exit check.

Controlled-story blocks fail closed until their later authorized story phase. Unsupported or malformed lesson versions never appear on Alonso Home.

## Resume and recovery

Each approved lesson has at most one attempt for the singleton child. The attempt stores current block index, status, break count, minimal player state, and last activity time. Pause returns to Alonso Home; reopening resumes the same immutable lesson and block. A provider or network failure shows child-safe recovery without changing approved data.

Breaks are child-initiated, counted, and return to the same activity. Movement blocks and model blocks are unscored. Incorrect scored responses stay on the activity. After the configured threshold, remediation reduces choices and records the support level.

## Evidence boundary

Every scored response records:

- immutable attempt, block, and allowed target references;
- evidence type;
- whether it was the first attempt;
- independent, replayed, prompted, modeled, or reduced-choice support;
- correctness where applicable;
- response latency and retry count;
- minimal non-sensitive selection metadata.

The database validates attempt ownership, approved artifact status, block existence, and target membership. Client event IDs make retries idempotent. First-attempt evidence is unique per block and is never overwritten by later scaffolded success.

## Security and exclusions

All child RPCs derive the child from the authenticated Auth user linked to the singleton profile. The browser cannot request another child, arbitrary lesson, block, or target. Direct parent data remains inaccessible.

This phase does not add ElevenLabs, microphone access, live speech scoring, pronunciation feedback, open conversation, mastery calculation, review scheduling, or automatic progression. Audio-provider work remains Phase 7.

No test command or screenshot capture was run during this phase.
