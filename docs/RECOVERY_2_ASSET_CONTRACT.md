# Recovery 2 Asset Registry Contract

## Status and authority

**Design contract — pending explicit parent approval. No database or storage implementation exists in Recovery 2.**

This document defines the immutable, versioned contract that Recovery 3 must implement for visual and audio assets. It does not create a registry, approve an asset, activate a provider, upload files, or make any media available to Alonso.

An image or audio file existing in the repository, local cache, Supabase Storage, or a provider account does not make it approved. A generated concept remains a review candidate until the parent records an explicit decision for its exact version.

## Goals

The registry must make these questions answerable before a lesson can validate or publish:

1. What exact asset version does this lesson reference?
2. What instructional role does it serve?
3. Does the file exist and match the recorded checksum and media metadata?
4. Is it approved for this child-facing use, locale, character, pose, and context?
5. Does it have the required alt text, transcript, caption, and fallback?
6. For audio, was the exact voice profile approved and was the file generated before publication?
7. If an asset is deprecated or replaced, which immutable lesson versions still reference it?

## Non-goals for Recovery 2

- no SQL migration or Supabase table;
- no Storage bucket or upload workflow;
- no runtime resolver or client component;
- no image generation claim beyond explicitly labeled concepts;
- no ElevenLabs activation or voice approval;
- no automatic approval based on file existence, generation success, or prior-version approval;
- no migration of v1 lesson content.

## Identity and immutability

Each asset version has two identities:

- `assetFamilyId`: stable UUID for the conceptual asset across revisions, such as the guide character's listening pose;
- `assetVersionId`: unique UUID for one immutable version of that family.

The canonical reference is `assetVersionId`. Human-readable keys aid review but never replace it.

Once a version enters `in_review`, the following fields are immutable:

- family and version identity;
- kind, role, locale, and variant dimensions;
- character, pose, scene, object, or gesture relationships;
- file locator and content checksum;
- visual or audio technical metadata;
- accessibility metadata;
- source, generation, and licensing provenance;
- fallback references;
- review checksum.

Any change creates a new `assetVersionId` with an incremented `version` and optional `supersedesAssetVersionId`. Approval never carries forward.

## Exact lifecycle states

`assetState` is exactly one of:

| State | Meaning | Child/runtime eligibility |
| --- | --- | --- |
| `draft` | Mutable working candidate not submitted for review. | Never eligible. |
| `in_review` | Immutable candidate presented to the parent with a review checksum. | Never eligible. |
| `changes_requested` | Parent requires a new version; this version remains immutable evidence of the review. | Never eligible. |
| `approved` | Parent approved this exact version and intended usage. | Eligible only if every other validation and publication prerequisite passes. |
| `rejected` | Parent rejected this exact version for child-facing use. | Never eligible. |
| `deprecated` | Previously approved version must not be used by newly validated content. Existing immutable history retains the reference. | Not eligible for new validation or publication. |
| `archived` | Retained for history only. | Never eligible. |

Allowed transitions are exact:

```text
draft -> in_review | archived
in_review -> approved | changes_requested | rejected
changes_requested -> archived
approved -> deprecated
rejected -> archived
deprecated -> archived
archived -> (terminal)
```

A requested edit after `changes_requested` starts a new `draft` version. An approved file is never changed in place. Re-approval after deprecation also requires a new version.

## Asset kinds and instructional roles

### `assetKind`

The exact top-level kinds are:

- `character`
- `character_pose`
- `character_expression`
- `scene`
- `object`
- `action`
- `gesture`
- `mouth_cue`
- `letter_form`
- `story_panel`
- `collection_image`
- `ui_illustration`
- `motion`
- `audio`

An asset version has one kind. Composite scenes reference component versions rather than silently embedding unregistered teaching assets.

### `instructionalRole`

The exact roles are:

- `instructional`: required to understand or complete the activity;
- `supporting`: reinforces meaning but is not the sole task cue;
- `feedback`: communicates response or recovery state;
- `decorative`: carries no instructional or state meaning.

Decorative assets cannot satisfy a lesson's required visual, gesture, or fallback contract.

### Audio subtypes

An `audio` asset has exactly one `audioRole`:

- `spoken_instruction`
- `model_word`
- `model_sentence`
- `option_audio`
- `character_turn`
- `feedback_line`
- `hint`
- `spanish_rescue`
- `story_narration`
- `sound_anchor`
- `sound_effect`

Sound effects are supporting or decorative and cannot replace spoken instruction or language modeling.

## Logical registry record

Recovery 3 may implement this logical shape in normalized tables and private/public views. Field names and semantics must remain stable even if storage is normalized.

```ts
type AssetVersion = {
  schemaVersion: "1.0";
  assetFamilyId: string;                 // UUID
  assetVersionId: string;                // UUID, canonical lesson reference
  key: string;                           // stable human-readable family key
  version: number;                       // positive integer within family
  assetState: AssetState;
  assetKind: AssetKind;
  instructionalRole: InstructionalRole;

  title: string;                         // parent-facing review name
  description: string;                   // intended meaning and use
  locale: "en-US" | "es" | "none";
  audience: "child" | "parent" | "shared";
  tags: string[];

  characterId: string | null;
  poseId: string | null;
  expressionId: string | null;
  sceneId: string | null;
  objectId: string | null;
  gestureId: string | null;
  targetKeys: string[];                  // curriculum keys for review; not authority by itself

  file: AssetFile;
  visual: VisualMetadata | null;
  audio: AudioMetadata | null;
  motion: MotionMetadata | null;
  accessibility: AccessibilityMetadata;
  fallback: FallbackMetadata;
  provenance: ProvenanceMetadata;

  supersedesAssetVersionId: string | null;
  createdAt: string;
  createdBy: string;
  submittedAt: string | null;
  reviewChecksum: string;                // SHA-256 of immutable review payload
  approval: ApprovalMetadata | null;
  deprecatedAt: string | null;
  archivedAt: string | null;
};
```

## File and technical metadata

```ts
type AssetFile = {
  storageProvider: "repository" | "supabase_storage" | "provider_cache";
  locator: string;                       // private storage key or approved repository path
  publicDeliveryPath: string | null;     // assigned only by the delivery layer
  mimeType: string;
  byteLength: number;
  sha256: string;
  fileExtension: string;
};
```

Rules:

- `locator` is not a lesson-authentication mechanism; child delivery still requires assignment authorization.
- External provider URLs are not durable registry locators.
- The resolver verifies file existence, MIME type, and SHA-256 before a version can be validated.
- The client never receives private storage credentials, source prompts, provider keys, or unapproved variants.
- Repository concept paths must include a visible `draft` or `review` boundary until approved and imported by Recovery 3.

## Visual metadata

```ts
type VisualMetadata = {
  width: number;
  height: number;
  aspectRatio: string;                   // e.g. "4:3"
  colorSpace: "sRGB";
  hasTransparency: boolean;
  focalPoint: { x: number; y: number };  // normalized 0–1
  safeArea: { top: number; right: number; bottom: number; left: number };
  minimumDisplayWidth: number;
  backgroundPolicy: "transparent" | "fixed" | "adaptable";
  containsText: boolean;
  embeddedTextLocale: "en-US" | "es" | "none";
};
```

Visual rules:

- Instructional object and action choices must remain distinguishable at the smallest approved child viewport.
- Distractors cannot differ only by color.
- Embedded English text cannot carry the task in Phase A.
- Character expressions and poses require distinct silhouette or gesture cues, not color-only differences.
- A composite scene identifies every instructional component version it contains.
- Cropping may not remove a gesture, mouth cue, target object, or other instructional focal point.

## Motion metadata

```ts
type MotionMetadata = {
  durationMs: number;
  loops: boolean;
  loopCount: number | null;
  frameRate: number | null;
  autoplayAllowed: boolean;
  reducedMotionAssetVersionId: string | null;
  pauseable: boolean;
  conveysInstruction: boolean;
};
```

If motion conveys instruction, a parent-approved static or reduced-motion equivalent is mandatory. Decorative motion cannot delay, block, or obscure the child action.

## Accessibility metadata

```ts
type AccessibilityMetadata = {
  semanticRole: "instructional_image" | "state_image" | "decorative" | "audio_content";
  altText: string | null;
  longDescription: string | null;
  caption: string | null;
  transcript: string | null;
  spokenInstructionEquivalent: string | null;
  nonAudioEquivalentAssetVersionId: string | null;
  nonVisualEquivalentAssetVersionId: string | null;
  readingRequired: boolean;
  colorIndependent: boolean;
  reducedMotionSupported: boolean;
};
```

Rules:

- Instructional and state images require concise parent-reviewed alt text that communicates the intended meaning without revealing a hidden answer to the child UI.
- Decorative assets use `semanticRole: "decorative"` and `altText: null`; renderers remove them from the accessibility tree.
- Spoken content requires an exact transcript. Optional child captions may be visually hidden by default in Phase A but must be available as an accessibility or parent setting.
- `readingRequired` must be `false` for every Phase A child activity asset.
- Audio-dependent tasks require a non-audio fallback. Visual-dependent tasks require an appropriate non-visual equivalent or must be marked unsupported for that accessibility configuration.
- Accessibility metadata is versioned and approved with the asset; it cannot be patched independently onto an approved file.

## Audio metadata

```ts
type AudioMetadata = {
  audioRole: AudioRole;
  language: "en-US" | "es" | "none";
  transcript: string;
  sourceTextHash: string;
  durationMs: number;
  sampleRateHz: number;
  channels: 1 | 2;
  loudnessLufs: number | null;
  peakDb: number | null;

  voiceProfileId: string | null;
  voiceProfileVersion: number | null;
  voiceApprovalDecisionId: string | null;
  provider: "elevenlabs" | "human" | "local" | "none";
  providerModel: string | null;
  providerOutputId: string | null;
  pronunciationNotes: string[];
  speakingRate: "slow" | "learning" | "natural";
  preGenerated: boolean;
  rawChildAudio: false;
};
```

Audio rules:

- Child-facing instructional audio must be pre-generated, cached, checksum-verified, and approved before lesson publication. On-demand provider success is not readiness.
- Any voice change creates new audio asset versions and requires the applicable parent voice and asset decisions. Approval does not inherit across voices or models.
- `voiceApprovalDecisionId` is required for synthesized character speech, model words/sentences, prompts, options, hints, rescues, feedback, and narration.
- `transcript` must exactly match the reviewed spoken content, including a Spanish rescue line when present.
- Option audio versions are bound to immutable semantic option IDs in the lesson contract; array position is not identity.
- Loudness and peak values must fall within the production limits established in Recovery 6 before publication.
- Provider IDs and models are parent-visible provenance, never child-facing labels.
- Raw child audio is not an asset and must never enter this registry.

## Fallback metadata

```ts
type FallbackMetadata = {
  fallbackAssetVersionIds: string[];
  fallbackText: string | null;
  fallbackAction: "replay" | "show_static" | "show_gesture" | "show_choices" | "spanish_rescue" | "ask_parent" | "none";
  preservesTaskMeaning: boolean;
  preservesEvidenceSemantics: boolean;
};
```

An instructional asset cannot be approved without a fallback that prevents a dead end. A fallback may increase support and therefore change evidence semantics; `preservesEvidenceSemantics` documents whether the runtime must mark the response as prompted, replayed, reduced-choice, or modeled.

## Provenance and rights metadata

```ts
type ProvenanceMetadata = {
  sourceType: "original_generated" | "original_drawn" | "original_recorded" | "licensed";
  creator: string;
  createdAt: string;
  generationProvider: string | null;
  generationModel: string | null;
  sourcePromptHash: string | null;
  sourceReferenceIds: string[];
  license: string;
  licenseEvidenceLocator: string | null;
  allowedUse: "private_family_app";
  trainingUseAllowed: boolean;
};
```

Only original or appropriately licensed assets may enter review. Provenance is parent-visible. Prompt text may remain server/private, but its checksum and provider/model are retained for reproducibility and audit.

## Approval metadata

```ts
type ApprovalMetadata = {
  decisionId: string;
  decision: "approved";
  assetVersionId: string;
  reviewChecksum: string;
  approvedUses: string[];
  approvedLocale: "en-US" | "es" | "none";
  approvedBy: string;
  approvedAt: string;
  note: string;
};
```

Rejection and changes-requested decisions are separate immutable decision records with the same asset version and review checksum.

Approval rules:

- only the allowlisted parent can approve;
- a decision applies to one exact `assetVersionId` and `reviewChecksum`;
- the approved uses must include the lesson role requesting the asset;
- a parent-approved character design does not automatically approve every pose, expression, scene, or voice line;
- a parent-approved voice profile does not automatically approve generated audio content;
- superseding, regenerating, re-encoding, cropping, recoloring, retiming, or changing accessibility text creates a new version;
- viewing, downloading, generating, or using a concept in a fixture does not create approval.

## Character, pose, scene, and object relationships

Character-led content uses explicit version relationships:

- a character identity version defines canonical silhouette, palette, proportions, personality notes, and permitted roles;
- each pose and expression version references the exact approved character identity version;
- a scene version references every instructional character pose, object, action, gesture, and background version;
- a story panel references an approved scene or enumerates the same component versions;
- a learned-word collection image references the curriculum target key and exact object/action version;
- character audio references both the exact character identity version and approved voice profile version.

The resolver rejects incompatible combinations, such as a pose created for a superseded character proportion sheet or a scene with an unapproved instructional object.

## Asset bundles

A lesson may reference a versioned `assetBundle` for review convenience, but the bundle does not replace exact asset references.

```ts
type AssetBundle = {
  bundleId: string;
  version: number;
  title: string;
  assetVersionIds: string[];
  manifestHash: string;
  state: AssetState;
  approvalDecisionId: string | null;
};
```

Bundle approval is valid only when every member version is already approved and the parent approves the exact manifest hash. Changing membership creates a new bundle version.

## Resolver and validation contract for Recovery 3

For every referenced asset, deterministic validation must fail unless all conditions are true:

1. the `assetVersionId` exists;
2. its state is `approved`;
3. kind and instructional role match the lesson field using it;
4. locale and audience are compatible;
5. file locator resolves and MIME type, byte length, and SHA-256 match;
6. required visual, audio, motion, and accessibility metadata are complete;
7. character/pose/scene/object relationships resolve to compatible approved versions;
8. the parent's approved uses cover the requested activity role;
9. no required fallback is missing or unapproved;
10. audio is pre-generated and references the approved voice decision when required;
11. the asset is not deprecated or archived;
12. Phase A assets do not introduce a reading requirement.

Semantic validation may report additional concerns but cannot override any deterministic failure.

## Child-safe delivery view

The child receives only the minimum authorized delivery fields:

- opaque `assetVersionId`;
- assignment-authorized delivery URL or stream endpoint;
- kind and renderer role;
- dimensions, duration, and focal/safe-area information needed by the renderer;
- child-safe alt text, caption, transcript, and fallback reference where applicable.

The child never receives approval notes, hidden answers, curriculum target authority, source prompts, provider administration metadata, private locators, licensing evidence, or storage credentials.

## Parent review contract

Before a decision, the parent review surface must show:

- the exact file rendered at its intended child size;
- family key, version, checksum prefix, kind, role, locale, and intended activities;
- character/pose/scene/object relationships;
- alt text, transcript, captions, and every fallback;
- visual crop/safe-area examples and reduced-motion equivalent when applicable;
- voice profile/version, provider/model, source transcript, and audio playback for audio;
- provenance and rights summary;
- differences from the superseded version;
- consequence text stating that approval is version-specific and does not publish a lesson.

The review action requires a note and produces an immutable decision record. There is no bulk approval for instructional character, scene, gesture, option, or audio assets in the pilot.

## Recovery 2 approval boundary

Concept assets produced during Recovery 2 must remain `draft` or `in_review` candidates in documentation. This contract and the concept set require explicit parent review. Recovery 3 may implement the registry only after the parent approves the character/world direction, adult-interface direction, and exact concept asset set identified by version/checksum.
