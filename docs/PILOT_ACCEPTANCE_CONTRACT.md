# Pilot Acceptance Contract

## Authority

This is the single authoritative acceptance checklist for the private Alonso Academy pilot. It supersedes phase-completion language in older documentation. The pilot is one parent, one child, one Phase A Unit 1 curriculum version, one approved five-day weekly plan, and five unique lessons.

A feature, migration, route, provider key, successful build, or completed lesson is not sufficient evidence by itself. The pilot becomes `pilot-ready` only when every step below passes with objective evidence and the parent explicitly accepts the result for private use.

## Proof standard

Acceptable proof must identify the exact curriculum version, plan version, lesson version, child assignment, attempt, evidence rows, provider configuration, and audit events involved. Evidence must come from the running private application and authoritative hosted records, not from synthetic Recovery 0 fixtures.

Fixtures may be used to develop and demonstrate state handling before the final pilot. Fixture identifiers, screenshots, simulated provider failures, and in-memory records cannot satisfy a final acceptance item.

Formal test execution, browser screenshots, child-usability observation, and deployment require the explicit permissions specified in `PHASE_PLAN.md`. Until those permissions are granted and the relevant proof is collected, affected items remain unverified.

## Recovery 1 implementation handoff

As of 2026-07-12, the repository contains an `implemented` Recovery 1 foundation for checklist rows 2, 4, 7, and 8: exact five-day slots, private approval, explicit assignment/publication/replacement/withdrawal, assignment-bound attempts, idempotent server commands, server-derived evidence, and fail-closed completion. The exact contract and exclusions are in `docs/RECOVERY_1_DOMAIN.md`.

This is not acceptance evidence. Hosted migration application has not been established; no formal authorization/RLS, lifecycle, reload, stale-command, evidence, responsive, screenshot, provider, or child-usability proof is recorded. No checklist row passes merely because Recovery 1 is implemented, and live speech, mastery/review, character assets, final UI, and the complete pilot remain unverified or unimplemented as assigned below.

## Recovery 2 design handoff

As of 2026-07-13, the repository contains an implemented Recovery 2 candidate set: the Phase A instructional blueprint, original Luma Landing cast and world, child art bible, seven visual/audio interaction storyboards, separate adult-interface direction, design-level asset contract, four immutable generated concept files, and an authenticated read-only review gallery. Every direction and asset remains `in_review` pending explicit parent approval.

This is not checklist-row-6 proof. The concept set is not wired into lesson schema v2, a production asset registry, the child player, approved audio, or a verified fallback. Viewing or committing it does not constitute approval, usability evidence, media readiness, or pilot acceptance.

## Final ten-step acceptance checklist

| # | Required outcome | Objective proof required | Failure conditions | Evidence owner |
| --- | --- | --- | --- | --- |
| 1 | **The parent reviews and revises the complete curriculum boundary.** | The running curriculum workbench exposes the exact immutable A-U1 version, every vocabulary item, sentence frame, acceptable response, recast, gesture, phonics/writing limit, novelty limit, mastery requirement, and exit requirement. An audit record identifies the parent decision and approved version. | Hidden targets or constraints; whole-unit approval without item visibility; a stale or fixture approval; no immutable decision history. | Recovery 1 domain model and Recovery 4 parent application. |
| 2 | **The parent approves one five-day weekly plan.** | One validated weekly-plan version references the approved curriculum snapshot and contains exactly five distinct ordered day slots with objective, kind, duration, and target set. The parent approval record references that exact version. | More or fewer than five days; duplicate day slots; stale curriculum; approval inherited by regeneration; missing target/day detail. | Recovery 1, Recovery 3, and Recovery 4. |
| 3 | **The parent creates, completely previews, validates, and approves five unique lessons.** | Each day slot has exactly one approved-private lesson version. Parent preview evidence shows every child screen, prompt, model line, option, answer, acceptable speech response, target, character/scene/asset, audio, hint ladder, remediation, evidence rubric, and exit requirement. Deterministic validation reports pass for all five exact versions. | Duplicate days; hidden instructional content; missing/unapproved asset; text-dependent Phase A activity; validation warning treated as a pass; merely generated or merely validated lesson counted as approved. | Recovery 3 and Recovery 4. |
| 4 | **The parent explicitly publishes one assigned lesson and can withdraw it immediately.** | A parent audit trail shows separate approve and publish actions for one child/week/day assignment. A uniqueness constraint or transactional proof shows only one published version occupies that slot. A withdraw action removes child visibility without deleting history; replacement atomically retires the previous version. | Approval alone exposes content; two active versions; withdrawal requires database intervention; stale/superseded content remains child-visible. | Recovery 1 and Recovery 4. |
| 5 | **Alonso sees only the published lesson and completes it without needing to read English.** | The authenticated child home returns one Today's Mission for the exact published assignment. The complete attempt contains the required modeled listening, meaning through image/action, guided practice, contextual spoken use, retrieval, and exit blocks. Approved usability evidence shows the child can follow voice, image, gesture, and demonstration without English reading. | Draft, validated, approved-private, stale, withdrawn, unsupported, or other-day content appears; task comprehension depends on reading; a required activity is skipped. | Recovery 5 and Recovery 8. |
| 6 | **The guide character and audio make every task understandable.** | Every lesson activity resolves approved character/pose, scene/object/gesture, spoken instruction, prompt/option audio, accessible fallback, and alt/caption metadata from the asset registry. The parent-approved American-English voice and retention decision are audited. Published audio readiness is verified before start. | Decorative-only character; missing first-listen audio; unapproved voice or asset; on-demand provider success required to understand the current step; technical taxonomy shown to Alonso. | Recovery 2, Recovery 3, Recovery 5, and Recovery 6. |
| 7 | **Pause, reload, microphone denial, silence, and provider failure never lose state or strand Alonso.** | For the same attempt, recorded recovery evidence shows exact block/support/retry restoration after pause and reload; microphone denial offers a working fallback; silence is stored as no response rather than incorrect pronunciation; TTS/STT timeout or quota failure preserves state and allows safe continuation. | Lost or duplicated first attempt; block regression/skip; hidden fallback; dead end; provider failure changes correctness or completes the lesson; raw audio remains stored. | Recovery 1, Recovery 5, Recovery 6, and Recovery 8. |
| 8 | **Evidence distinguishes first attempt, independence, replay, prompt, and scaffolded success.** | Authoritative evidence rows trace to assigned lesson, immutable block/option IDs, target IDs, answer key/rubric, and server-held attempt history. A controlled trace proves browser-supplied correctness/support flags cannot override the server. Independent first retrieval remains separate from replayed, prompted, reduced-choice, and modeled success. | Browser declares learning facts; one event overwrites first attempt; replay is recorded as independent; success lacks target/block provenance; raw recording is stored. | Recovery 1 and Recovery 8. |
| 9 | **Mastery and review recommendations update deterministically.** | Target histories demonstrate that one success cannot master a target, repeated difficulty can regress it, weak/unstable targets receive prompt review, stable targets receive maintenance review, and lesson completion alone never advances phase/unit. Every recommendation cites its evidence IDs and rule version. | AI changes mastery; completion equals mastery; sparse data produces certainty; unstable target disappears; advancement occurs without parent decision. | Recovery 7 and Recovery 8. |
| 10 | **The parent receives an evidence-grounded summary and retains control of advancement.** | The parent progress/history view links each summary claim to stored evidence, reports assistance and uncertainty, says `insufficient evidence` when required, and offers an explicit audited parent advancement decision. The parent records explicit acceptance of the complete pilot for private use. | Invented measurement; untraceable summary claim; automatic advancement; no way to inspect evidence; acceptance inferred from use or lesson completion. | Recovery 7 and Recovery 8. |

## Cross-cutting pass conditions

Every checklist row is also subject to the repository’s authorization, accessibility, responsive, privacy, and recovery requirements. In particular:

- anonymous and child identities cannot read or mutate parent data;
- parent-sensitive mutations use narrow audited boundaries;
- the complete parent and child workflows are usable at the authorized representative desktop and mobile sizes without horizontal scrolling;
- keyboard, focus, labels, contrast, reduced motion, touch targets, captions, alt text, and no-color-only feedback meet the defined accessibility checks;
- raw child audio, secrets, unrestricted analytics, and unapproved external sharing are absent;
- idempotent retries, stale-data protection, replacement, withdrawal, and interruption recovery preserve previously approved data;
- documentation matches the exact running version used for acceptance.

A cross-cutting failure fails every affected checklist item; it cannot be waived by visual polish or successful happy-path completion.

## Acceptance record

The final Recovery 8 acceptance record must contain:

- the Git commit and hosted migration version under review;
- identifiers and versions for the accepted curriculum, week, five lessons, publication assignment, child attempt, and supporting evidence;
- provider voice approval and privacy/retention decision identifiers;
- results of every authorized acceptance check, including documented failure-and-recovery cases;
- unresolved limitations, if any, explicitly accepted by the parent;
- the parent’s dated explicit statement accepting or rejecting the pilot for private use.

Until that record exists and all ten rows pass, the highest truthful product label is `verified` for the individual scopes that have objective evidence. The application must not be labeled `pilot-ready`.
