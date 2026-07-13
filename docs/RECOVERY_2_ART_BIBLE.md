# Recovery 2 Child Art Bible

**Status:** `in_review`
**Approval state:** not approved
**Art direction:** tactile illustrated adventure for a six-year-old oral English learner
**Related proposal:** `docs/RECOVERY_2_CHARACTER_WORLD.md`

This art bible defines a proposed visual system for the Alonso-facing world. It does not authorize production assets or a UI rebuild. The parent workspace requires its own adult-interface direction; this child art bible must not be applied wholesale to parent screens.

## Creative north star

**A handcrafted story world that behaves like a patient language teacher.**

The visual experience combines editorial children's illustration, cut-paper stagecraft, dry gouache texture, and crisp product interaction. It should feel authored and collectible, not assembled from stock educational vectors. Richness comes from composition, character acting, material detail, and color rhythm—not bulky cards, glossy effects, generic 3D rendering, or visual clutter.

### Desired qualities

- Warm, cinematic, tactile, and unmistakably original.
- Energetic enough to invite a six-year-old into the lesson.
- Predictable enough that the next action is always obvious.
- Premium enough to support close inspection on desktop and tablet.
- Simple enough to remain legible on a small phone.
- Expressive without overstimulation.

### Explicitly avoid

- glossy generic 3D mascots, plastic toy surfaces, and inflated app-store characters;
- stock vector classrooms, clip-art flashcards, and interchangeable “cute animal” scenes;
- gradients used as a substitute for composition or lighting;
- glassmorphism, neon glows, excessive bloom, and floating translucent UI;
- giant rounded white cards covering most of the world;
- confetti, coins, streak flames, treasure chests, badges, and manipulative reward spectacle;
- continuous idle motion while Alonso must listen;
- decorative characters that do not model, point, wait, react, or scaffold.

## Visual medium

The core look is **layered solid-color illustration** with tactile surface variation.

- Shapes resemble hand-cut paper and painted felt, with controlled imperfect edges.
- Shadows are flat offset shapes or short soft contact shadows, never dirty gray halos around every container.
- Lighting is conveyed through adjacent color planes, not airbrushed gradients.
- Dry-brush and paper-grain texture sits at low opacity and never reduces figure-ground clarity.
- Fine linework appears only where it explains a mouth, hand, object edge, or motion path.
- Small stitched, stamped, or pencil details reward attention without becoming required meaning cues.

## Color system

Color is organized around characters and places. It supports recognition but never carries meaning alone.

### Foundation palette

| Token | Hex | Use |
|---|---:|---|
| Deep Harbor Ink | `#123C43` | Primary dark text, outlines, deep scene anchors |
| Midnight Water | `#0B2F37` | Night scenes, high-contrast controls |
| Warm Paper | `#FFF8EA` | Light stage fields, caption/support surfaces |
| Shell White | `#FFFDF7` | Small high-clarity UI surfaces |
| Sandstone | `#E8D9BD` | Paths, dock, neutral props |
| Sky Wash | `#CBE9E6` | Day sky as a solid field |
| Sea Glass | `#84CEC8` | Water planes and quiet secondary accents |

### Character palette

| Character | Main | Deep | Light support | Accent rule |
|---|---:|---:|---:|---|
| Miko | Teal `#22A8A0` | `#08736F` | `#A9E4DE` | Teal identifies listening/modeling only when paired with Miko's ear pose or sound mark |
| Pippa | Coral `#FF735E` | `#C94A3E` | `#FFD0C5` | Coral marks action only when paired with a gesture silhouette or motion path |
| Moss | Moss `#759E59` | `#416A3C` | `#D1E1B6` | Green grounds objects/categories; never used as generic “correct” feedback |
| Nia | Gold `#F2C64E` | `#A96D14` | `#FBE6A1` | Gold frames conversation/story turns; never used as prize currency |

### Functional accents

| Token | Hex | Meaning |
|---|---:|---|
| Active Coral | `#FF795F` | Current child action, paired with icon/label/pose |
| Success Teal | `#168A80` | Confirmed meaning, paired with check and spoken feedback |
| Try Again Amber | `#D58B22` | Neutral retry state, paired with replay/hint action |
| Focus Blue | `#2468D7` | Keyboard focus and accessibility outline |
| Quiet Lavender | `#B7B0E8` | Optional story atmosphere, never instructional state by itself |

No character role color is reused as a universal pass/fail signal. Incorrect responses do not turn the scene red.

## Shape language

The world uses shape to organize attention before text is read.

- **Circles and cupped arcs:** listening, turn-taking, safety, and return.
- **Diagonal ribbons and held action lines:** movement and gesture.
- **Low rectangles and stable shelves:** objects, categories, and retrieval.
- **Lantern ovals and open crescents:** conversation and story.
- **Pointed starbursts:** reserved for sound origin or a single moment of discovery; never scattered as decoration.
- **Interaction targets:** generous but controlled, typically 16–24 px corner radius depending on scale. Pills are reserved for short statuses, not every container.

Large scene compositions should use one dominant shape, one supporting shape family, and one small accent rhythm. They should not be tiled into a dashboard grid.

## Line, texture, and depth

- Primary character contour: 3–5 px at a 1440 px artboard, using Deep Harbor Ink at 80–95% opacity.
- Interior detail: 1.5–3 px and only where it clarifies form or expression.
- Contact shadow: one short flat shadow shape, usually Midnight Water at 10–16% opacity.
- Paper grain: 2–5% opacity; no high-frequency noise behind option images or mouth cues.
- Fabric/felt flecks: sparse and directional, scaled with the asset.
- Depth uses overlap, scale, and two or three flat planes. Avoid faux-photographic depth of field.

## Character construction standards

Character assets must remain consistent across scenes, options, feedback, and animation.

The current candidate construction is Miko as a teal animal-adjacent sound scout with sail-like ears, cream muzzle/belly, navy explorer vest, coral field pouch, and forked fin-like tail; Pippa as a coral birdlike guide with wing-arms, crest, navy neckerchief, and pouch; Moss as a moss-green turtlelike guide with a leaf-pattern shell and ochre picture-card satchel; and Nia as a golden cometlike partner with a navy capelet and star cheek. These identifying features supersede any generic silhouette shorthand, while the teaching roles remain unchanged.

### Future production source views

The cast lineup and Miko's six-pose candidate sheet are `in_review`. They are not full production model sheets. Before production use, the approved direction will still require:

- front, three-quarter left, three-quarter right, profile, and back;
- neutral standing height reference shared across the cast;
- hand/gesture sheet;
- eye, brow, and mouth expression sheet;
- approved sound-specific mouth cues for Miko only where instructionally necessary;
- seated, low-to-ground, and cropped close-up construction;
- silhouette test at 64 px and grayscale contrast test.

### Acting rules

- Pose carries the instructional verb before facial expression adds emotion.
- Eyes look at Alonso during direct address, at the referent during joint attention, and neutrally forward during answer selection.
- No character looks toward the correct option before a response.
- Hands never overlap the important object or mouth cue.
- An active speaker has the clearest contrast and highest detail; supporting characters simplify and settle.
- A listening character holds a still receptive pose for the entire child turn.

## Luma Landing environment bible

### Welcome Dock

**Purpose:** arrival, orientation, one mission, and safe return.
**Composition:** broad horizontal timber shapes, teal water planes, one round bell, a small ferry, and a clear path into the current location.
**Signature detail:** signal flags show Miko's simple listen/wave icons, not letters Alonso must decode.
**Avoid:** busy harbor crowds, shop signs, maps full of locked islands, or multiple competing calls to action.

### Action Grove

**Purpose:** action verbs, gesture, and body movement.
**Composition:** oversized leaf arches create a stage; coral ribbon paths describe the active motion; stepping stones establish start and finish.
**Signature detail:** leaves briefly hold Pippa's key action silhouette after a demonstration.
**Avoid:** jungle stereotypes, hyperactive particle effects, hidden-object clutter, or movement that continues during listening.

### Sound Workshop

**Purpose:** listening, sound comparison, mouth/sound cues, and letter noticing.
**Composition:** intimate workbench stage with listening shells, paper tubes, resonant wooden objects, and a dark-teal quiet alcove for close listening.
**Signature detail:** sound paths are two or three flat expanding arcs originating from the real speaker/object.
**Avoid:** sci-fi laboratory tropes, equalizer visualizers with no teaching purpose, floating alphabet walls, or technical phonetic notation shown to Alonso.

### Story Camp

**Purpose:** conversation, contextual listening, sequencing, and retell.
**Composition:** a low semicircle around Nia's golden lantern, layered cloth tent shapes, and a transformable three-panel story table.
**Signature detail:** Nia's navy capelet and trailing comet shape lead the eye across first/next/last images without becoming a text banner.
**Avoid:** dark spooky camping scenes, theatrical spotlights, dense book pages, or dialogue bubbles required for comprehension.

### Word Gallery

**Purpose:** retrieval and visible evidence of familiar meaning.
**Composition:** a warm paper-and-moss hall with varied object niches, a central retrieval table, and clear breathing room around each learned picture moment.
**Signature detail:** each entry preserves a tiny contextual scene or character action, not a word alone on a card.
**Avoid:** trophy cabinets, rarity tiers, locked silhouettes, completion percentages aimed at Alonso, or a wall of text labels.

## Scene composition system

### Desktop and tablet stage

- Use a 16:9 or 3:2 illustrated stage occupying the primary viewport.
- Keep the active character within roughly 24–36% of stage width.
- Reserve a clear interaction zone in the lower or right third based on character eye line.
- Show one dominant task and at most one secondary support action.
- Keep system navigation visually outside the story stage.

### Mobile crop

- Recompose rather than merely shrink.
- Character face, hands, referent, and active choices must remain within the center 70% safe area.
- Background storytelling details may crop; instructional cues may not.
- Choices become a two-column or single-column picture field without horizontal scrolling.
- The primary audio/replay control remains reachable with one thumb and does not cover the scene.

### Attention hierarchy

1. Active character pose or relevant object.
2. Spoken prompt and audio state.
3. Response affordance.
4. Optional help/replay.
5. Progress and exit controls.

No decorative element may outrank levels 1–3 in contrast, motion, or scale.

## Product integration principles

The child interface should feel like an illustrated interactive stage, not an adult dashboard with brighter colors.

- Art and interaction share one composition; characters point toward or manipulate the actual semantic option.
- Picture choices are scene objects or illustrated tiles with strong figure-ground separation, not text buttons.
- Audio controls use a consistent ear/sound-wave symbol plus a visible Miko listening state.
- Child-visible text is optional support and remains subordinate to spoken instruction, imagery, and gesture.
- Progress appears as a short journey path or sequence of place marks, not a percentage bar or performance meter.
- System errors are translated into a safe character-led recovery state with one clear fallback action.
- White/support surfaces are used sparingly for legibility, with square-to-moderate geometry and intentional placement.

## Required visual concepts

All seven concepts below now have coded responsive compositions in `/parent/recovery-2`, and four supporting candidate images exist under `/public/recovery-2/concepts`. Every item remains `in_review`. The descriptions below are the evaluation criteria for those visible candidates, not claims of approval, usability proof, or finished assets.

### 1. Alonso Home - one mission at Welcome Dock

**Composition:** Miko waits beside the ferry at the left; the destination island occupies the middle distance; one illustrated mission marker sits on the dock path. A small Word Gallery doorway provides a secondary revisit entry only when available.
**Instruction without reading:** Miko waves, then points from Alonso toward the one mission; the destination character performs a held cue in the distance. Spoken greeting and mission prompt begin only after child action.
**Must show:** resume state, new mission state, nothing-published state, and parent-required closed state.
**Must not show:** grids of courses, phase labels, approval terminology, technical status, or multiple equal-weight cards.

### 2. Listen and find - Moss's object scene

**Composition:** Moss frames a simple scene with two to four plausible objects. Miko appears in a small anchored speaking position that does not reveal the answer.
**Instruction without reading:** Miko cups an ear and speaks; Moss opens the scene; each object has a distinct tappable silhouette and optional audio replay.
**Feedback:** selected object responds locally; correct meaning receives a brief Moss framing gesture, while retry resets attention and offers replay/hint.
**Evidence requirement:** option IDs remain stable and visual treatment cannot pre-signal the answer.

### 3. Character conversation - Nia's meaningful turn

**Composition:** Nia and Alonso's response space face each other across a small contextual prop, such as a bag, cup, or greeting flag. Turn ownership is shown by pose and a single flat speech halo behind the active speaker.
**Instruction without reading:** Nia asks or greets, settles into a listening pose, and the response control opens only for Alonso's turn.
**Fallback:** picture/action alternatives preserve the same semantic response when speech is unavailable.
**Must not show:** chat bubbles stacking like a messaging app or unrestricted conversation affordances.

### 4. Speaking and recording - Miko's sound turn

**Composition:** Miko models at close conversational distance; a large, stable recording control occupies the lower center; the target referent remains visible.
**States:** ready, permission request, listening, processing, matched, try again, silence, microphone denied, provider unavailable, and semantic fallback.
**Instruction without reading:** mouth/ear pose, microphone symbol, restrained pulse, and spoken cue agree. Recording never begins automatically.
**Motion:** one slow breathing ring during capture; no waveform score, confidence meter, or red failure state.

### 5. Story and retell - Story Camp panels

**Composition:** Nia presents a three-beat illustrated sequence on the cloth story table. Only the current beat is full contrast; earlier beats remain visible as memory anchors.
**Instruction without reading:** Nia points to first/next/last positions, acts the key emotion/action, and invites Alonso to select or say the approved retell element.
**Interaction:** reorder, choose the next picture, answer a character, or give a short supported retell.
**Must not show:** paragraphs, tiny comic panels, or decorative story art unrelated to the target language.

### 6. Completion - world consequence, not reward explosion

**Composition:** the lesson's small story purpose resolves in the current location; all active characters share a still warm reaction. One contextual item moves to its resolved place.
**Reflection:** two or three illustrated moments show what Alonso listened to, found, or communicated; this is not a scorecard.
**Next action:** return to Welcome Dock. Replay is secondary and appears only when permitted.
**Must not show:** stars, grades, accuracy percentages, streaks, confetti, loot, or “perfect.”

### 7. Learned-word collection - Word Gallery

**Composition:** Moss opens a curated gallery shelf containing familiar contextual moments. Entries group by useful situation or world place, not alphabetical order.
**Instruction without reading:** tapping an entry replays audio and a tiny character action; retrieval prompts ask Alonso to find or use a known meaning.
**Parent distinction:** mastery certainty and evidence detail stay in the adult interface. Alonso sees familiarity and possibility, not a clinical status.
**Must not show:** locked rare items, competitive totals, or every generated target regardless of evidence.

## Motion bible

Motion exists to demonstrate language, direct attention, communicate system state, or show a meaningful response.

### Timing

- Pose transition: 180–320 ms.
- Action demonstration: 700–1400 ms with a held final meaning pose.
- Feedback reaction: 350–700 ms, then settle.
- Scene transition: 450–800 ms using layered lateral movement or a paper-stage reveal.
- Listening wait: characters become still except for subtle breathing at most.

### Motion rules

- One primary motion event at a time.
- Demonstration can replay on request without changing correctness.
- No autoplay camera motion behind active choices.
- No bounce loops, floating buttons, shaking errors, or attention competition.
- Reduced-motion mode replaces movement with the instructional key pose, a short dissolve, and audio.
- Motion never communicates a state without a static shape/icon equivalent.

## Illustration and asset framing

### Asset categories

- character turnarounds and pose/expression families;
- mouth/sound cues;
- location establishing scenes and activity crops;
- semantic objects and action vignettes;
- gesture demonstrations;
- story beats and retell panels;
- interaction-state overlays;
- sound, motion, and navigation marks;
- texture swatches and flat shadow shapes.

### Framing rules

- Transparent character assets include enough breathing room for gesture extremities.
- Object assets use a consistent three-quarter or profile logic within one activity.
- Picture options have matching crop, scale logic, and visual detail so the answer is not stylistically privileged.
- Scene variants reserve safe zones for captions, controls, and mobile crops.
- No text is baked into art assets except a separately approved environmental mark that is never required for task completion.

## Asset registry contract proposal

Recovery 3 will define the production schema. Recovery 2 concepts should be prepared to supply at least:

| Field | Purpose |
|---|---|
| `reviewKey` | Human-readable Recovery 2 review key independent of filename. It is not the canonical Recovery 3 registry identity; that contract uses UUID `assetVersionId`. |
| `assetKind` | Use the exact `AssetKind` enum in `docs/RECOVERY_2_ASSET_CONTRACT.md`; this art bible does not duplicate or extend it. |
| `characterId` / `locationId` | Optional cast/place ownership |
| `instructionalRole` | Use the exact `InstructionalRole` enum in `docs/RECOVERY_2_ASSET_CONTRACT.md`; this art bible does not duplicate or extend it. |
| `semanticTags` | Approved concepts represented by the asset |
| `version` | Immutable asset version |
| `locale` | Language/locale dependency where applicable |
| `assetState` | Use the exact lifecycle and transitions in `docs/RECOVERY_2_ASSET_CONTRACT.md`; only `approved` is runtime-eligible. |
| `altText` | Concise child/accessibility description |
| `parentDescription` | Exact parent-visible instructional use |
| `dimensions` / `safeCrop` | Source geometry and responsive crop constraints |
| `motionFallbackId` | Static instructional pose for reduced motion |
| `rightsProvenance` | Original-generation and review record |

Suggested naming pattern: `luma.{location}.{character-or-object}.{instructional-role}.{variant}.v{n}`. Filenames may change; registry identity must not.

## Accessibility requirements

- Text and essential icons meet WCAG contrast against every approved background variant.
- Focus is a high-contrast 3–4 px outline with shape change or scale, never color alone.
- Touch targets are at least 48×48 CSS pixels and spaced for young-child motor accuracy.
- Options remain distinguishable in grayscale and common color-vision simulations.
- Alt text describes the semantic action or object, not decorative texture.
- Captions/transcripts exist as optional support but cannot become the only way to understand the task.
- Audio prompts have replay and visible state; recording has explicit start/stop and denial fallback.
- Reduced-motion assets preserve the exact gesture meaning in a held pose.
- Important content stays clear at 200% zoom and within representative mobile viewports without horizontal scrolling.
- No flashing, rapid parallax, or high-frequency patterned backgrounds.

## Quality bar: do and do not

| Do | Do not |
|---|---|
| Compose a scene around one language action | Place a character above a generic white question card |
| Let pose, object, and audio explain the task together | Depend on an English instruction paragraph |
| Use layered flat color and tactile texture | Use glossy 3D, glass panels, or gradient-heavy polish |
| Give each character a stable instructional job | Swap mascots decoratively between screens |
| Make distractors equally crafted and plausible | Make the correct answer larger, brighter, or better drawn |
| Celebrate a resolved communication moment | Trigger confetti, stars, coins, or accuracy spectacle |
| Preserve stillness during listening and speaking | Run constant idle loops or ambient camera motion |
| Recompose art for mobile | Shrink the desktop stage until controls and faces are tiny |
| Show honest provider fallback in the same scene | Replace the lesson with a technical error panel |
| Keep evidence detail in the parent product | Show scores, confidence, or mastery labels to Alonso |

## Direction-review coverage and later production work

The parent should review visual concepts—not only prose. The current cast, world, and seven coded interaction concepts are the Recovery 2 direction candidate. The final column records work that begins only after directional approval; it is not a prerequisite for deciding Recovery 2 and must not create a circular dependency on Recovery 3.

| Review deliverable | Current Recovery 2 coverage | Required after directional approval, before production use |
|---|---|---|
| Miko construction and teaching poses | Cast anchor plus six-pose `in_review` candidate | Full turnaround, expression/mouth system, scale checks, and requested revisions |
| Pippa, Moss, and Nia construction | Shared cast-anchor `in_review` lineup | Individual turnarounds, pose/expression sheets, and one signature teaching sequence each |
| Luma Landing | One `in_review` archipelago/world image | Reviewed map logic and individual establishing/location sheets for Welcome Dock, Action Grove, Sound Workshop, Story Camp, and Word Gallery |
| Alonso Home | Coded responsive concept using the world candidate | Parent review, mobile/desktop refinement, accessibility review, and later usability evidence |
| Six activity/collection concepts | Coded listen-and-find, conversation, speaking, story/retell, completion, and Word Gallery compositions | Parent review, visual-state expansion, and later usability evidence |
| Interaction art | One four-scene `in_review` storyboard candidate | Complete scene/state coverage across all seven coded concepts |
| Recovery and reduced motion | Coded recovery descriptions and state direction | Dedicated visual candidates for reduced motion, microphone denial, silence, and provider failure |
| Accessibility checks | Alt text in the four-item coded concept register and written requirements in this bible | Grayscale, contrast, crop, focus, and no-reading verification evidence |
| Concept register | Four coded entries with noncanonical review keys, hashes, paths, kinds, permitted uses, and alt text | Recovery 3 production registry with UUID version identity, explicit asset decisions, provenance, responsive geometry, and resolver validation |

## Approval boundary

This draft and its four candidate images plus seven coded screen concepts propose direction only. Their route presentation is `in_review`; it does not establish that:

- the parent has approved the cast, palette, medium, environments, or interaction concepts;
- generated images may be used in the product;
- any visual concept satisfies child usability without observation;
- any asset is registered, licensed, accessible, responsive, or production-ready;
- the current child UI should be reskinned rather than rebuilt under the later recovery phases;
- the parent interface should use this palette, texture, radius, illustration density, or composition.

Recovery 3 must not begin from this direction until the required character/world concepts and asset use are explicitly approved by the parent.
