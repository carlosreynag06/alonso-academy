# Recovery 2 Parent Review Record

**Concept set:** `recovery-2-direction-01`
**Prepared:** 2026-07-13
**Current state:** `in_review`
**Parent decision:** pending
**Recovery 3 authorization:** closed

This record identifies the exact Recovery 2 candidate set available at `/parent/recovery-2`. Viewing the route, opening an image, running the local server, or committing these files is not approval. A parent decision must explicitly accept, reject, or request changes to each decision area below.

## Decision areas

| Area | Candidate | State | Parent note |
| --- | --- | --- | --- |
| Character cast | Miko, Pippa, Moss, and Nia in `luma.cast.anchor.v1` | `pending` | — |
| World and child art direction | Luma Landing and `RECOVERY_2_ART_BIBLE.md` | `pending` | — |
| Child interaction and audio direction | Seven concepts in `RECOVERY_2_INTERACTION_STORYBOARDS.md` | `pending` | — |
| Adult parent-workspace direction | `RECOVERY_2_PARENT_DIRECTION.md` and the coded Week concept | `pending` | — |
| Generated concept asset direction | Four immutable review files below; each retains its own permitted use | `pending` | Parent said “images are ok” on 2026-07-13 and asked that no more images be opened; this is recorded as positive directional feedback, not a version-specific runtime asset approval. |

## Exact generated concept assets

All four images were generated with the built-in image-generation tool, copied into the repository, and registered only as `in_review` concepts. They are not production lesson assets and are not resolved by the lesson runtime. Approval of the Recovery 2 direction does not set a future registry `assetState` to `approved`; Recovery 3 must use an individual, version-specific decision for every production asset and permitted use.

The final prompt set is recorded in `docs/RECOVERY_2_IMAGE_PROMPTS.md`.

| Review key | Repository path | Permitted Recovery 2 use | SHA-256 |
| --- | --- | --- | --- |
| `luma.cast.anchor.v1` | `public/recovery-2/concepts/luma-cast-concept-v1.png` | Cast identity and art-direction review only | `897225eac720347ad874f4ad5bf70db751998c062b2c70b13fc26f108043fd66` |
| `luma.world.home.v1` | `public/recovery-2/concepts/luma-landing-world-v1.png` | World and composition review only | `b40bb9a7f2862f4200b3c08d45dd9f2c322b24af340ce1190ee86d5ee5b85d13` |
| `luma.miko.teaching-poses.v1` | `public/recovery-2/concepts/miko-teaching-poses-v1.png` | Teaching-pose direction review only | `c6c95760dd54e3a180ec078c2576853a638d80974aaab17bd7ba9ade182abd4a` |
| `luma.interactions.storyboard.v1` | `public/recovery-2/concepts/luma-interactions-v1.png` | Directional storyboard; its apple-pointing vignette is a non-scored demonstration only and may not serve an independent/scored choice | `bccfd44c214db14f7cde72b2b816b2606273f27ec8d95d3660e73377cf7c785a` |

## Review criteria

The parent should assess the candidate set against these phase gates:

- Miko is memorable, original, emotionally safe, and credible as the primary guide.
- Pippa, Moss, and Nia have distinct instructional jobs rather than decorative personalities.
- Luma Landing feels engaging for a six-year-old without becoming noisy, manipulative, or babyish.
- The art medium and cast can support the full range of listening, gesture, speaking, story, support, and recovery poses.
- Every one of the seven child concepts communicates the task through voice, image, gesture, and demonstration before text.
- The adult direction is restrained, compact, persistently labeled, minimally rounded, and operationally clear.
- No generated concept is promoted to a production registry without version-specific approval.

## Decision language

A valid decision can be recorded in one of these forms:

- `Approve Recovery 2 direction 01 in all five directional decision areas.`
- `Approve [named areas/assets]; request these changes for [named areas/assets]: ...`
- `Reject Recovery 2 direction 01 because: ...`

Any requested change creates a new candidate version or a new immutable asset version. Directional approval never carries from a replaced image or revised direction and never substitutes for the version-specific production-asset decisions required by the asset contract.

## Verification boundary

This candidate set has not received formal screenshot review, browser usability testing, six-year-old observation, provider audio exercise, or production asset validation. Recovery 2 approval accepts a direction for implementation; it does not make the product verified or pilot-ready.
