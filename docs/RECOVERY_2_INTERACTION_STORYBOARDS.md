# Recovery 2 Interaction Storyboards

## Status and use

**Status (2026-07-13): proposed for parent review.** These storyboards are visual/audio concepts, not approved designs, generated lesson artifacts, production screens, playable lessons, or evidence that Alonso can use the application independently. They do not authorize image generation, provider activation, publication, or Recovery 3.

Read this document with `docs/RECOVERY_2_INSTRUCTIONAL_BLUEPRINT.md`. That blueprint owns pacing, instructional semantics, characters, art direction, support, accessibility, and the proposed asset contract. If the parent requests a change, the concepts and blueprint must be reconciled before either can be approved.

## Storyboard notation

Each concept specifies:

- **Visual:** what Alonso sees; no necessary instruction may live only in text.
- **Audio:** provisional American-English script or sound behavior. Scripts are content for review, not an approved voice asset.
- **Action:** the single primary child action.
- **Evidence:** what the later authoritative runtime may derive; “none” means the interaction cannot claim learning.
- **Fallback:** a real recovery state that preserves progress and does not manufacture success.
- **No-reading proof:** why a child can understand the task without reading English.

### Stable child-screen grammar

Every concept uses the same three zones:

1. **Character stage:** the speaking/listening character and meaningful scene occupy the upper or left focal area.
2. **Action stage:** one large action or two to three semantic picture choices occupy the center/lower area.
3. **Control dock:** Repeat (ear/speaker), Help (open hand), and Pause (two bars) stay in fixed positions. Each control plays a short spoken label on first focus. Controls never move between activities.

The primary action is at least 64 px high and never competes with another equally prominent button. Child choices never use written English labels. Optional captions are hidden by default and never contain unique information.

### Shared fallback grammar

| Condition | Visual behavior | Provisional audio | Evidence consequence |
| --- | --- | --- | --- |
| Repeat requested | Miko cups his ear; the same character action and English line replay. | Replay the exact quoted line in the active storyboard row, unchanged; add no lead-in or answer words. | Replay/support increments; first attempt stays unchanged. |
| Help requested | Miko demonstrates the task with a non-scored example; Moss may simplify the picture scene, and Spanish rescue becomes available. | Miko: “Sigue el ejemplo de Miko.” Then replay the exact quoted English prompt in the active row; add no answer words. | Subsequent response is prompted/rescue-supported. |
| First incorrect response | Choice returns to its scene; character compares meanings through action. | “Let’s look again.” | Incorrect first response remains authoritative. |
| Continued difficulty | Two choices remain; stable gesture appears. | Miko: “Elige una de las dos.” Then replay the exact quoted English prompt in the active row; add no answer words. | Reduced-choice support. |
| Silence | Recording glow settles; character remains attentive, not disappointed. | “I didn’t hear words yet. Try again, or show me.” | Silence is no response; semantic fallback is not spoken evidence. |
| Microphone permission requested | After Alonso taps the microphone, Miko holds a patient waiting pose while the browser permission surface appears. | Before the system surface opens, Miko says: “The microphone needs your okay.” | Permission request only; no recording or response evidence. |
| Microphone denied | Microphone moves to a secondary off state; a picture/gesture action becomes primary immediately. | “The microphone is off. You can show me.” | `microphone_denied`; no spoken evidence. |
| Speech provider unavailable | Microphone settles into a neutral rest pose; the same picture/gesture action becomes primary without retry pressure. | “The microphone needs a rest. You can show me.” | `provider_unavailable`; no spoken evidence. |
| Semantic fallback selected | The matching picture/action choices occupy the primary action stage and the character visibly waits. | “Show me with a picture.” | `semantic_fallback`; comprehension or intent only, never spoken success. |
| Required audio unavailable | Character holds a gentle pause pose; one large Home/path action appears. No text worksheet replaces audio. | A bundled nonlinguistic safe-pause earcon only. | State saved; no listen/evidence/completion event. |
| Required visual asset unavailable | Activity does not render with a broken image or word label. | None. | State saved; parent-facing prerequisite later. |
| Reduced motion | Travel and gestures become a sequence of held key poses with a focus halo. | Play the exact quoted line in the active storyboard row with its specified pauses unchanged. | No evidence difference. |

## Concept 1: Alonso Home — Luma Landing

### Purpose

Give Alonso one obvious mission, a recognizable guide, and a sense of place without exposing curriculum states, provider status, artifacts, day-slot taxonomy, or adult controls.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| H1 Arrival | Miko waits beside the ferry at Welcome Dock. Five Luma Landing places form one clear island route; only the current destination has full contrast and a gently moving character flag. No numbered cards or lesson titles are required. | Miko: “Hello, Alonso.” Then play the short welcome earcon. | Tap Miko or the one current mission marker. | No learning evidence. If audio is missing, the marker still has a play symbol but entry fails safely rather than teaching by text. |
| H2 Mission preview | The current location opens into one large scene vignette. Miko demonstrates the day’s core gesture, such as a wave or cup-ear pose. A large doorway/play control appears. | Miko: “Our English adventure is ready. Listen first.” | Start/Continue. | No target evidence. The lesson’s required first model remains inside the lesson. |
| H3 Resume | Miko stands at the exact saved location holding the current activity object/pose. A small path segment behind him shows progress through shapes, not scores. | “We saved your place. Let’s keep going.” | Continue. | Hydrates authoritative state. If hydration fails, do not start a second attempt. |
| H4 Nothing published | Miko and Nia quietly prepare the ferry at Welcome Dock. No destination is emphasized and no technical blocker text appears to Alonso. | Miko: “There’s no lesson right now. Come back later with a grown-up.” | Return to sign-in/close, visually secondary. | `nothing_published`; no learning evidence. Parent receives the actual prerequisite elsewhere. |
| H5 Parent-required closed | The current destination remains visible in a calm held state. Miko stands beside a simple grown-up hand symbol; the mission marker does not open. | Miko: “This adventure needs your grown-up first. Your place is safe.” | Return Home. | `parent_action_required`; no attempt starts and no target audio plays. |
| H6 Completed/replay preview | A completed location contains one picture memory. If parent-enabled replay exists, a circular replay symbol appears on that memory; no replay claim appears otherwise. | Miko: “Want to visit this story again?” | Replay, only when authoritative assignment permits it. | Starts a distinct replay attempt; never changes the original learning attempt. |

### No-reading proof

The active mission is communicated by Miko’s position at Welcome Dock, the full-color destination, gesture preview, ferry route, and one play marker. Removing every label leaves the mission and action understandable. Day numbers, artifact status, target names, and technical vocabulary never appear.

### Required concept assets

Miko home poses; Welcome Dock ferry; five Luma Landing environment vignettes; new/resume/nothing-published/parent-required/completed/replay states; grown-up hand symbol; mission gesture previews; stable Start/Continue/Replay icons; reduced-motion route; exact welcome, resume, nothing-published, parent-required, and replay audio plus earcons.

## Concept 2: Listen-and-find — Meaning in a scene

### Purpose

Measure receptive understanding using actions and situations instead of word cards.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| L1 Demonstration | Moss frames one full-width sample scene while Miko models the target without looking toward a future answer. For `hello`, Nia arrives and Miko waves. | Miko: “Hello, Nia.” Pause. “Hello.” | Listen; Repeat remains secondary. | Required model listen only. |
| L2 Non-scored example | Moss opens two familiar semantic scenes and removes irrelevant background detail. Miko’s hand follows a dotted motion path to complete one non-target sample while the other scene settles. | Miko: “Listen. Find it.” | Watch. | No scored evidence. |
| L3 Independent choice | Moss presents two or three equal picture scenes with neutral borders and stable semantic IDs. Miko holds a listening pose and does not look or gesture toward the answer. | Miko: “Find hello.” | Tap one scene. | Server later scores semantic option ID and preserves first response. |
| L4 Meaning feedback | Correct: the chosen scene plays its natural action and Moss briefly frames the meaning. Incorrect: both scenes return, Moss reduces clutter, then the model scene replays without shame. | Correct: “You found hello.” Retry: “Let’s look again.” | Next or Try again. | Correctness remains server-derived. Retry support is separate. |
| L5 Reduced choice | After support escalation, Moss removes distractors until two scenes remain; Miko repeats the stable gesture without pointing at either choice. | Spanish orientation: “Sigue el ejemplo de Miko.” Then Miko says: “Find hello.” | Tap one scene. | Reduced-choice/rescue-supported evidence. |

### Fallbacks

- If a scene is missing, the activity fails closed; it never substitutes `hello`/`goodbye` text.
- If prompt audio fails, the choice is not scoreable and the attempt pauses safely.
- If the child cannot tap, keyboard/switch focus plays each option’s neutral spoken description without saying whether it is correct.

### No-reading proof

The target is heard. Meaning is shown by arrival, departure, nod, head shake, polite exchange, or command gesture. Options are semantic scenes with no written labels.

## Concept 3: Character conversation — A real reason to respond

### Purpose

Move from imitation to a short communicative exchange where either an approved response or a semantic fallback changes the scene meaningfully.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| C1 Context | Nia faces Alonso across one familiar contextual prop while Moss quietly frames the visible choice. Miko stands to the side, not between Nia and Alonso. | Nia: “Would you like this?” | Attend/listen. | Listen/context only. |
| C2 Model turn | Miko briefly steps into a small demonstration vignette and answers Nia. Nia’s response makes the communicative effect visible. | Miko: “Yes, please.” Nia responds warmly and gives/opens the chosen item. | Listen; optional guided echo follows. | Modeled/guided evidence only. |
| C3 Alonso’s turn | The demo vignette disappears. Nia returns eye contact and waits with a visible listening posture. A microphone is primary only when available; two semantic gesture choices remain hidden until fallback/support. | Nia: “Would you like this?” Then play the soft turn-taking earcon. | Speak. | Provider-derived speech only through an authorized future boundary. |
| C4 Response effect | Nia responds to intent. Both `yes` and `no` are accepted warmly when the task permits either. | Acceptance: Nia says, “Okay. Here you go.” Then Miko recasts, “Yes, please.” Decline: Nia says, “Okay. No problem.” Then Miko recasts, “No, thank you.” Neither variant asks Alonso to repeat. | Continue. | Recast never upgrades the child response. |
| C5 Semantic fallback | If speech is unavailable or Alonso selects Show me, two large scenes/gestures appear: accept and decline. | “You can show Nia.” | Tap/gesture. | Comprehension/intent evidence only, never spoken use. |

### No-reading proof

Nia’s offer, expression, waiting pose, and the resulting action make the exchange understandable. Speech bubbles may be available only in parent preview or optional captions; they are never required child UI.

## Concept 4: Speaking and recording — Safe turn taking

### Purpose

Make spoken participation understandable and non-punitive while preserving a real fallback. This is a concept only; Recovery 6 owns provider activation and voice approval.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| S1 Hear the model | Miko faces Alonso. His mouth/gesture animation is clear but not used as a pronunciation score. A listening ring completes after required audio. | Miko: “Listen: ‘Hello, Nia.’” | Listen; Repeat secondary. | Required first listen/replay distinction. |
| S2 Ready | Miko points from himself to Alonso. A large microphone control shows a hand pressing it through a two-pose demonstration. | Miko: “When you’re ready, tap the microphone.” | Tap microphone. | Readiness action only; no response yet. |
| S3 Permission request | Miko holds a patient waiting pose while the browser permission surface appears only after the tap. | Before the surface opens, Miko says: “The microphone needs your okay.” | Allow or decline through the browser surface. | `permission_requested`; no recording or response evidence. |
| S4 Recording | After permission, the background quiets and Miko visibly listens. A simple breathing ring and elapsed arc show capture; there is no red countdown. | Miko: “Hold, then speak.” Start earcon, silence during capture, then a maximum-duration close earcon. | Hold, speak, release. | Raw audio exists only ephemerally in the future transport. |
| S5 Processing | Miko holds the listening pose; the control becomes a small neutral listening pulse. | If processing exceeds the short threshold, Miko says: “I’m listening.” | Wait; Pause remains available. | No correctness assumed. |
| S6 Meaningful match | Miko or Nia responds to the meaning in the scene, not to an “accent score.” | Miko: “I heard you.” The character then completes the exact scene action. | Continue. | Bounded transcript/confidence plus provider-derived target evidence; no raw audio. |
| S7 Silence | Miko leans closer gently; icon-led Try again and Show me actions appear with equal clarity. | Miko: “I didn’t hear words yet. Try again, or show me.” | Try again or semantic fallback. | `silence`; not incorrect. |
| S8 Microphone denied | The microphone settles into a secondary off state; the semantic picture/gesture action becomes primary. | Miko: “The microphone is off. You can show me.” | Choose semantic fallback. | `microphone_denied`; no spoken evidence. |
| S9 Provider unavailable | The microphone remains permitted but rests neutrally; no repeated permission prompt appears. The semantic action becomes primary. | Miko: “The microphone needs a rest. You can show me.” | Choose semantic fallback. | `provider_unavailable`; no spoken evidence. |
| S10 Semantic fallback | Two reviewed picture/action choices replace recording as the one primary action; Miko and Nia wait without signaling an answer. | Miko: “Show me with a picture.” | Tap or gesture. | `semantic_fallback`; comprehension/intent only, never spoken use. |
| S11 Retry support | Miko replays the exact target model and shows the stable gesture. After repeated difficulty, the semantic fallback stays visible. | Miko: “Listen once more.” Then: “Hello, Nia.” | Speak or show. | Replay/prompted support recorded. |

### Safety and accessibility requirements

- Recording begins only after Alonso’s deliberate action and ends on release, maximum duration, navigation, pause, or unmount.
- No percentage, pronunciation score, red failure meter, accent judgment, or waveform interpretation is shown.
- Microphone, silence, provider, and semantic fallback states use icon, pose, audio, and shape—not color alone.
- A parent preview must identify retention behavior and the exact evidence difference among permission request, microphone denial, provider failure, silence, speech, and semantic fallback.

## Concept 5: Listening story and retell — Three picture memories

### Purpose

Provide a short listening-only story that reuses approved targets in context, then invite retell through pictures, gestures, and an optional approved spoken turn.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| T1 Story invitation | At Story Camp, Nia opens her golden lantern and three-panel story table. Moss frames the key object in the first panel without narrating. | Nia: “Listen to a story.” | Play. | Story first listen. |
| T2 Panel 1 | Nia presents an arrival scene with held character gestures; no subtitles are required. | Nia: “Moss arrives. Miko says, ‘Hello!’” | Listen; pause/replay secondary. | Exposure only. |
| T3 Panel 2 | Nia’s trailing comet shape guides attention to a social-choice panel; Moss’s framing makes the offered object visually unambiguous. | Nia: “Moss says, ‘Yes, please.’” | Listen. | Exposure only. |
| T4 Panel 3 | Nia reveals the departure/solution panel and closes the story through her warm storyteller pose. | Nia: “Moss says, ‘Thank you. Goodbye!’” | Listen. | Exposure only. |
| T5 Picture order | The three silent key images appear in mixed order as large draggable/tappable panels. Nia demonstrates ordering two unrelated shapes first, then uses her trailing comet shape and the table positions to hold first/next/last. | Nia: “What happened first?” Subsequent prompts: “Then?” “Last?” | Tap panels in order. | Retell-sequence evidence tied to semantic panel IDs. |
| T6 Character retell | Nia opens one panel and uses a gesture or optional microphone to invite one approved target, not a free-form language test. | Nia: “Moss is leaving. What can you say?” | Speak, gesture, or semantic choice per rubric. | Spoken/gesture/choice retell remain distinct. |
| T7 Story saved | One picture memory folds into Alonso’s collection. | Nia: “This story is saved.” | Continue. | Exposure-neutral collection event; not memory, correctness, or mastery evidence. |

### Fallbacks and no-reading proof

The story is narrated and visually acted; no sentence must be read. Missing story audio or panel art blocks the activity. Retell uses scenes and character actions, never written sentence strips. Speech failure exposes a semantic gesture/picture response without claiming spoken retell.

## Concept 6: Completion — Communication changed the world

### Purpose

Close the lesson predictably and celebrate effort, listening, communication, and discovery without points, coins, streaks, rankings, or false mastery claims.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| F1 Result | The final communication completes the location’s story action: Nia understands the reply, Pippa follows the action signal, or Moss reveals the matching object. Characters respond quietly. | Conversation result: Nia says, “I understood you.” Action result: Pippa says, “I stopped.” Picture result: Moss says, “You showed me this one.” | Watch. | No new scored evidence. |
| F2 Effort reflection | Three small illustrated scene-icons depict an ear/listening moment, a supported try, and the response mode actually used. They contain no required words. If speech was unavailable, the final scene shows a picture/gesture response rather than implying speech. | Spoken-use variant: Miko says, “You listened and used English.” Semantic-fallback variant: Miko says, “You listened and showed your answer.” | Continue. | Honest summary of event types, not mastery. |
| F3 Picture memory | One approved scene/gesture image becomes available in the Word Gallery. It is labeled by audio when tapped, not by a required word caption. | Miko waves and says: “Hello.” | Tap to hear, then Done. | Replay event only. |
| F4 Next location | Miko faces the next distant location; the current location settles into a completed visual state. | “We’ll continue next time.” | Return Home. | Completion state comes from server gate, not this animation. |

### Failure handling

If the server has not accepted completion, the celebration does not play. The exact current activity reappears with a recoverable message/pose. An animation timeout cannot create completion.

## Concept 7: Learned-word collection — Picture memories, not flashcards

### Purpose

Let Alonso revisit meaningful scenes and models without presenting an unearned “words mastered” claim or requiring reading.

### Frames

| Frame | Visual | Audio | Primary action | Evidence / fallback |
| --- | --- | --- | --- | --- |
| W1 Collection shelf | In the Word Gallery, Moss opens a curated shelf of approved scene thumbnails grouped by useful situation or Luma Landing place. Each item shows the target gesture/context, not a written word tile. | Moss: “These are moments you practiced.” | Tap a picture memory. | No mastery claim; opening is navigation. |
| W2 Memory open | The original character action plays once in a small scene. A Repeat control and parent-enabled Replay Lesson control are distinct. | Miko waves and says: “Hello!” | Listen/repeat. | Listen replay only. |
| W3 Show meaning | Moss presents two small scene variants so Alonso can revisit meaning without a score unless a parent-assigned review attempt exists. | Moss: “Where did Miko say hello?” | Tap if in an explicit review; otherwise watch. | Casual browsing creates no mastery evidence; assigned retrieval uses a distinct attempt. |
| W4 Not available | An unpracticed or withdrawn target is absent rather than shown as a gray locked reward. | None. | None. | Avoids pressure and hidden curriculum. |

### No-reading proof

Every memory is a scene plus audio/gesture. Optional captions may support adults or accessibility but are not the organizing mechanism. The collection communicates practice history, not scores or mastery.

---

# Five-day A-U1 concept week

## Alignment notice

The following five storyboards allocate the committed A-U1 targets within the documented constraints. They are proposals for parent review and Recovery 3 reconciliation. They are not generated artifacts, do not inherit approval from fixtures or hosted records, and cannot be scheduled or published.

| Day | Teaching location | New oral targets (default 1–2) | Frame treatment | Review / sound / literacy | Communicative purpose |
| ---: | --- | --- | --- | --- | --- |
| 1 | Welcome Dock | `hello`, `goodbye` | `Hello!` occurs as a natural contextual model/recast; it is not separately required, scored, or represented as learned. | None | Greet someone arriving and recognize an interaction ending. |
| 2 | Action Grove | `yes`, `please` | `Yes, please.` combines the two taught words in a natural model/recast; evidence remains target-specific to `yes` and `please`. | Review `hello` | Accept a visible choice politely. |
| 3 | Story Camp | `no`, `thank you` | `No, thank you.` combines the two taught words in a natural model/recast; it is not an additional new-target claim. | Review `yes`, `please`, `goodbye` | Decline a visible choice safely and preserve the relationship. |
| 4 | Sound Workshop | `listen`, `look` | None | Review greetings/polite responses; `/m/` sound recognition only | Follow two demonstrated oral directions in a sound-focused setting. |
| 5 | Story Camp | `point`, `stop` | `My name is ___.` receives natural social modeling and an optional guided identity turn; it is exposure-only in this concept week. | Review week targets; `/s/`; select `m` or `s` | Point within a story, communicate stop independently, notice the two sound anchors, and hear self-introduction language in context. |

This allocation teaches all ten A-U1 vocabulary targets while keeping every day at the default two. The four sentence frames remain covered through natural models/recasts; no frame is counted as new, required, scored, or represented as learned in this unapproved concept allocation. The exact provisional scripts below contain all connective language; no additional narration is implied. Only listed new/review targets can be required, scored, or represented as learned. `/m/` examples (`moon`, `map`) and `/s/` examples (`sun`, `sound`) appear only as non-text anchor images; their names are not spoken or required. The Word Gallery remains a revisit surface for practiced picture memories and never serves as a new-target teaching location.

## Day 1 storyboard — A new friend at Welcome Dock

**Objective:** Alonso understands an arrival greeting, joins `Hello!`, and retrieves a greeting for a newly arriving character. He also recognizes `goodbye` through departure context.

**Target budget:** two new oral targets: `hello`, `goodbye`. `Hello!` is a natural contextual model/recast only.

| Time / arc | Visual beat | Provisional audio script | Action and evidence |
| --- | --- | --- | --- |
| 0:00–0:45 Greeting/context | Miko waits at Welcome Dock. Nia’s small ferry approaches; Nia looks eager to meet Alonso. | Miko: “Someone is coming.” Nia arrives. Miko: “Hello, Nia!” | Watch/listen; no scored evidence. |
| 0:45–2:00 Model | Miko faces Nia, waves once, then faces Alonso and repeats the gesture. | Miko: “Hello, Nia.” Pause. “Hello.” | Required first model listen; Repeat is distinct. |
| 2:00–3:30 Meaning | Split action sequence: Nia arrives and Miko says hello; later Nia turns to leave and Miko says goodbye. | Miko: “Hello.” Pause. “Goodbye.” | Watch; meaning through action. |
| 3:30–5:00 Guided imitation | Miko’s wave traces one slow arc; Alonso is invited to wave and optionally echo. | Miko: “Wave with me. Hello!” | Guided imitation/gesture; never independent. |
| 5:00–7:00 Listen-and-find | Two equal scenes: a character arriving/waving and a character departing/waving. | Miko: “Find hello.” Later: “Find goodbye.” | Semantic scene choice; first receptive responses preserved. |
| 7:00–8:00 Movement | Miko and Nia take one step toward each other for hello and one step away for goodbye. | Miko: “Hello.” Pause. “Goodbye.” | Participation/listen only. |
| 8:00–10:15 Contextual turn | Nia faces Alonso, waves, and waits. Miko remains outside the conversation. | Nia: “Hello, Alonso.” Turn earcon. | Speak `hello` or use the wave/semantic fallback. Mode remains explicit; no synonym is scored unless later approved. |
| 10:15–11:30 Spaced retrieval | The dock gate opens; Moss arrives from a different direction without Miko modeling. | Miko: “Moss is here. What can you say?” | Retrieval speech/gesture/choice; support recorded. |
| 11:30–12:15 Delayed goodbye check | Nia’s ferry begins to depart. Two equal scenes show arrival and departure. | Miko: “Find goodbye.” | Receptive `goodbye` evidence is captured before completion. |
| 12:15–14:15 Independent exit | Pippa arrives in a new pose. No answer is highlighted and no target is modeled. | Pippa waves silently. Miko: “What can you say?” | Independent `hello` first response. Help ends independence but allows completion recovery. |
| 14:15–15:00 Completion | Nia’s ferry reaches the next dock and a picture memory becomes available in the Word Gallery. | Miko: “You helped everyone meet.” | No new scored evidence; completion remains separate from mastery. |

**Fallbacks:** Spanish rescue: “Sigue el ejemplo de Miko.” Then replay the English task prompt without supplying `hello` or `goodbye`. Speech unavailable: Alonso taps the arrival/wave scene; this proves greeting meaning, not spoken greeting. Missing arrival/departure art blocks the relevant choice.

**No-reading proof:** arrival/departure, body orientation, wave timing, and character response distinguish the meanings. No word labels or sentence bubbles are required.

**Required assets:** Welcome Dock establishing scene and ferry arrival/departure; Miko/Nia/Moss/Pippa wave and listening poses; arrival/departure semantic options; day-one lines and earcons; dock picture memory.

## Day 2 storyboard — The friendly choice at Action Grove

**Objective:** Alonso understands and uses a polite acceptance in response to a visible choice.

**Target budget:** two new oral targets: `yes`, `please`. `Yes, please.` is a natural combined model/recast, not a third target. Review: `hello`.

| Time / arc | Visual beat | Provisional audio script | Action and evidence |
| --- | --- | --- | --- |
| 0:00–0:45 Greeting/context | Miko and Alonso enter Action Grove. Nia waves, then presents two visually distinct route tokens without naming them. | Nia: “Hello!” Miko: “Hello, Nia!” | Optional greeting retrieval; no new model. |
| 0:45–2:00 Model | Nia offers one token. Miko nods, opens his hands, and receives it. | Nia: “Would you like this?” Miko: “Yes, please.” Pause. “Yes.” Pause. “Please.” | First models for the two new words; the complete phrase is natural context only. |
| 2:00–3:30 Meaning | A nod causes the offered token to move toward Miko. The same scene replays with hands-to-chest gesture for `please`. | Miko: “Yes.” Then: “Yes, please.” | Watch; no score. |
| 3:30–5:00 Guided imitation | Miko pairs one nod with `yes` and open hands with `please`; he does not ask Alonso to repeat the complete frame. | Miko: “With me: Yes.” Pause. “Please.” | Guided target-word imitation only. |
| 5:00–7:00 Listen-and-find | Scenes show acceptance versus decline, then a polite open-hands request versus a neutral reach. Moss keeps the options equally framed. | First trial, Miko: “Yes. Find it.” Second trial: “Please. Find it.” | Target-specific receptive semantic choices. |
| 7:00–8:00 Movement | Pippa traces one coral action path and leads nod-and-reach poses; the body stills during the English model. | Miko: “Yes.” Pause. “Please.” | Participation/listen. |
| 8:00–10:15 Contextual turn | Nia offers the path choice directly to Alonso and waits. | Nia: “Would you like this?” | Speak `Yes, please`/`Yes`; semantic accept fallback allowed and distinct. |
| 10:15–12:00 Spaced retrieval | At a second grove arch, Moss frames a different visible object while Nia makes the offer from a changed position with no response model. | Nia: “Would you like this?” | Changed-object and changed-scene retrieval; Nia retains the conversational role. |
| 12:00–14:00 Independent exit | Nia offers the final route marker. No nod animation appears until after Alonso responds. | Nia: “Would you like this?” | Independent response. `Yes` can evidence `yes`; `Yes, please` can evidence both taught words. The combined frame is not separately claimed learned. |
| 14:00–15:00 Completion | The accepted marker opens the next stepping-stone route. A nod/open-hands picture memory becomes available in the Word Gallery. | Spoken-response variant, Miko: “Nia understood your yes.” Semantic-choice variant: “Nia understood your choice.” | No new evidence or frame claim. |

**Fallbacks:** after difficulty, Miko silently demonstrates the response action with an unrelated practice object; reduced choices are accept/decline scenes. Spanish rescue: “Nia te ofrece algo. Respóndele.” Then Nia replays: “Would you like this?” The rescue orients the task without supplying `yes`, `please`, or the answer; later evidence is rescue-supported.

**No-reading proof:** the offer, nod, open-hands gesture, object movement, and character reaction make acceptance visible. Choices are scenes, never `YES`/`NO` text buttons.

**Required visual/audio/fallback assets:** Action Grove establishing view and reduced-motion held poses; two route tokens and changed-object variants; Nia offer/speaking/listening/accepting poses; Miko model/recast/listen/retry poses; Pippa nod-and-reach sequence; Moss object-framing and reduced-choice states; neutral accept/decline and `please` semantic scenes; exact English lines for every row; the reviewed Spanish orientation line; repeat, silence, microphone-denied, provider-unavailable, and semantic-choice audio/visual variants; day-two picture memory.

## Day 3 storyboard — A kind no at Story Camp

**Objective:** Alonso understands and uses a polite decline while seeing that `no` is safe and socially accepted.

**Target budget:** two new oral targets: `no`, `thank you`. `No, thank you.` is a natural combined model/recast, not a third target. Reviews: `yes`, `please`, `goodbye`.

| Time / arc | Visual beat | Provisional audio script | Action and evidence |
| --- | --- | --- | --- |
| 0:00–0:45 Greeting/context | At Story Camp’s conversation table, Moss frames one familiar prop. Nia offers it to Miko; Miko smiles but does not want it, and Nia remains friendly. | Nia: “Would you like this?” | Context/listen only. |
| 0:45–2:00 Model | Miko gently shakes his head, places a hand to his heart, and Nia puts the item away without sadness. | Miko: “No, thank you.” Pause. “No.” Pause. “Thank you.” | First models for the two new words; the complete phrase is natural context only. |
| 2:00–3:30 Meaning | Accept and decline mini-scenes play side by side sequentially, not simultaneously highlighted. | Miko: “Yes, please.” Accept action. Then: “No, thank you.” Decline action. | Review contrast; no score. |
| 3:30–5:00 Guided imitation | Miko demonstrates a gentle head shake for `no` and hand-to-heart for `thank you`; he does not ask Alonso to repeat the complete frame. | Miko: “With me: No.” Pause. “Thank you.” | Guided target-word imitation only. |
| 5:00–7:00 Listen-and-find | Two offers produce different reactions; a second pair contrasts a hand-to-heart thanks moment with a neutral exchange. Moss keeps all scenes equally framed. | First trial, Miko: “No. Find it.” Second trial: “Thank you. Find it.” | Target-specific receptive choices, support-aware. |
| 7:00–8:00 Movement | Pippa leads freeze, head shake, hand-to-heart, relax. | Miko: “No.” Pause. “Thank you.” | Participation. |
| 8:00–10:15 Contextual turn | Nia offers Alonso one visible item. Both acceptance and refusal are valid communicative intents, but the block explicitly asks to practice declining. | Demonstration: Nia asks Miko, “Would you like this?” Miko answers, “No, thank you.” Alonso’s turn: Nia asks, “Would you like this?” | Speak/gesture `No, thank you`/`No`; fallback meaning distinct. |
| 10:15–12:00 Spaced retrieval | Moss frames another item in a quieter Story Camp arrangement while Nia offers it; no head-shake or answer cue is visible. | Nia: “Would you like this?” | Changed-object and changed-scene retrieval; Nia retains the spoken conversational role. |
| 12:00–14:00 Independent exit | Nia offers one final neutral choice, then waits without an answer gesture. Both acceptance and decline remain socially valid. | Nia: “Would you like this?” | Independent `no` evidence exists only if Alonso produces `No` or `No, thank you`; `thank you` is evidenced only if spoken. A `yes` response is honored and creates no false `no` evidence. |
| 14:00–15:00 Completion | Nia responds to Alonso’s actual intent, Moss places the practiced scene memory on a travel board for later Word Gallery access, and the group waves goodbye. | Decline result: Nia says, “Okay. Thank you. Goodbye!” Acceptance result: Nia says, “Okay. Here you go. Goodbye!” | Honest communication result; no “correct refusal” moral judgment and no new scored evidence. |

**Fallbacks:** Spanish rescue: “Nia te ofrece algo. Respóndele.” Then Nia replays: “Would you like this?” The rescue never says `no`, `thank you`, or the answer. If Alonso accepts during a decline-practice opportunity, Nia honors the intent; the activity records insufficient evidence for `no` rather than resetting or silently marking a decline.

**No-reading proof:** refusal meaning is carried by head shake, hand-to-heart, object withdrawal, and Nia’s accepting reaction.

**Required visual/audio/fallback assets:** Story Camp conversation-table establishing view and reduced-motion version; Nia offer/listen/accept/decline/closure poses; Moss prop-framing, scene-comparison, and reduced-choice states; Miko model/recast/retry poses; Pippa gesture sequence; familiar prop variants; equally weighted accept/decline and thanks/neutral semantic scenes; exact English lines including both completion outcomes; reviewed Spanish orientation; repeat, silence, microphone-denied, provider-unavailable, and semantic-choice variants; day-three practiced-scene memory for later Word Gallery availability.

## Day 4 storyboard — Follow the signal at Sound Workshop

**Objective:** Alonso follows demonstrated `listen` and `look` directions and notices `/m/` as a sound anchor. `Point` is reserved as a new target for Day 5.

**Target budget:** two new oral targets: `listen`, `look`. Review: greeting/polite-response gestures. Sound: `/m/` recognition only.

| Time / arc | Visual beat | Provisional audio script | Action and evidence |
| --- | --- | --- | --- |
| 0:00–0:45 Greeting/context | In Sound Workshop’s quiet alcove, a sound travels through one listening tube toward an unseen resonant object. Miko cups one sail-like ear. | Miko: “Listen.” | Attend; no score. |
| 0:45–2:15 Model | Pippa demonstrates two distinct poses in sequence: ear cup and eyes-to-object. Miko supplies each exact spoken model. | Miko: “Listen.” Pause. “Look.” | Required first models. |
| 2:15–3:45 Meaning | Each command causes only its matching action/scene effect. No written command appears. | For the ear-cup action Miko says, “Listen.” For the eyes-to-object action Miko says, “Look.” | Watch. |
| 3:45–5:15 Guided imitation | Pippa performs; Alonso may mirror and tap a large gesture icon after each while Miko voices the cue. | Miko: “Listen with Pippa.” Then: “Look.” | Guided/action participation. |
| 5:15–7:15 Listen-and-find | Two equal picture options show ear-cup and eyes-to-object while Pippa stays neutral. Their positions change between trials. | First trial, Miko: “Listen. Find it.” Second trial: “Look. Find it.” | Target-specific receptive semantic choices; first response preserved. |
| 7:15–8:15 Movement | Pippa leads a full-body listen/still and look/turn sequence with long pauses. | Miko: “Listen.” Pause. “Look.” | Participation; supports meaning. |
| 8:15–9:30 `/m/` sound moment | Moss frames approved moon/map anchor images beside a listening tube. Miko’s closed lips and cheek/throat cue are focal; no word labels appear. | Miko: “/m/.” Pause. “/m/.” The anchor images remain silent. | Hear, feel/gesture, then choose the closed-lips mouth cue from two mouth-shape images. Sound-recognition evidence only if approved. |
| 9:30–11:15 Contextual action | Moss reveals one workshop object and an environmental sound begins; Pippa holds still while Miko gives the two taught directions. | Miko: “Listen. Look.” | Alonso listens, then selects the scene showing eyes oriented toward the sound source. |
| 11:15–12:30 Spaced retrieval | In a changed workshop arrangement, two different sound sources appear; Moss keeps them equally framed and Pippa gives no gesture cue. | Miko: “Look.” | Independent receptive retrieval through the selected gaze/scene direction. |
| 12:30–14:15 Independent exit | Ear-cup and eyes-to-object action scenes appear in a changed order with no highlight. | Miko: “Listen. Look.” | Ordered semantic response for the two taught directions; support escalation is recorded only after the first attempt. |
| 14:15–15:00 Completion | The matched resonant object sounds and its workshop picture memory becomes available in the Word Gallery. | Miko: “You listened and found the sound.” | No new evidence. |

**Fallbacks:** Spanish rescue: “Sigue la demostración y responde.” Then replay the exact English prompt without translating `listen` or `look`. If gaze/turn response is unavailable, tapping the semantic scene is the response. `/m/` never asks Alonso to read `moon` or `map`; the images support the sound moment only.

**No-reading proof:** each command has a stable full-body pose and immediate scene consequence. The sound task uses audio plus mouth/feeling cue; no spelling or printed anchor word is required.

**Required visual/audio/fallback assets:** Sound Workshop quiet alcove, listening tubes, two sound-source arrangements, and reduced-motion states; Miko sail-ear listen, model-speak, `/m/` mouth cue, processing, and retry poses; Pippa listen/look demonstrations and held-pose alternatives; Moss anchor-image/object framing and equal-option states; ear-cup and eyes-to-object semantic scenes; moon/map non-text anchor images; exact English lines and `/m/` audio; reviewed Spanish orientation; audio-missing safe pause, image-missing fail-closed, repeat, reduced-choice, silence, microphone-denied, provider-unavailable, and semantic-response variants; day-four workshop picture memory.

## Day 5 storyboard — The Story Camp signal

**Objective:** Alonso understands and uses `point` and `stop`, distinguishes `/m/` and `/s/`, selects `m` or `s` after a sound, retrieves the week’s social language in a listening-only micro-story, and hears `My name is ___.` in a natural social exchange without a learned-frame claim.

**Target budget:** two new oral targets: `point`, `stop`. `My name is ___.` is exposure-only natural modeling and an optional guided identity turn. Sound: `/s/`; review `/m/`; approved letter selection `m`/`s`. All other required language is review.

| Time / arc | Visual beat | Provisional audio script | Action and evidence |
| --- | --- | --- | --- |
| 0:00–0:45 Greeting/context | Miko, Nia, Moss, and Pippa gather around Nia’s closed golden lantern at Story Camp. Moss frames the story panels while Pippa waits beside a coral action ribbon. | Miko: “Hello, Alonso. We have one more story.” | Optional greeting retrieval; no new-target evidence. |
| 0:45–2:00 `point` model | Moss reveals two equal story panels. Pippa extends one clear wing-arm toward the panel Miko names, then returns to neutral. | Miko: “Point.” Pause. “Point to this picture.” | First `point` model and visible meaning; no score. |
| 2:00–3:15 `stop` model and meaning | Pippa moves along the coral ribbon; Miko raises an open palm, says the target, and Pippa freezes in a strong held pose. | Miko: “Stop.” Pause. “Stop.” | First `stop` model and meaning through action; no score. |
| 3:15–4:15 Guided action | Pippa alternates pointing and moving/freezing while Moss changes the focal panel. | Miko: “Point with Pippa.” Then: “Stop.” | Guided point/stop participation; never independent. |
| 4:15–5:30 Name-language exposure | Miko and Nia each indicate their own portrait token. Nia then faces Alonso; no sentence strip or required response appears. | Miko: “My name is Miko.” Nia: “My name is Nia. What is your name?” | Alonso may say `Alonso`, use the full frame, or point to his portrait. Record guided identity participation only; do not create frame evidence or a learned-frame claim. |
| 5:30–7:30 Listening story | Nia presents three listening-only panels: Moss arrives and greets Miko; Nia visibly offers Moss a picture while Moss frames it before answering; Pippa moves toward the lantern, follows a stop signal, and Moss says goodbye. | Nia: “Moss comes to Story Camp.” Miko: “Hello, Moss!” Moss: “Hello!” Nia: “Would you like this?” Moss: “Yes, please. Thank you.” Nia: “Pippa moves toward the lantern.” Miko: “Stop.” Nia: “Pippa stops. Moss says goodbye.” Moss: “Goodbye!” | Listen; no reading or score. |
| 7:30–8:45 Story retell and `point` check | Nia mixes the three silent panels and uses her trailing comet shape plus table positions to demonstrate first/next/last with unrelated shapes. Moss keeps the panels equally clear. | Nia: “What happened first?” Then Miko says: “Point to the first picture.” | Semantic panel-order evidence plus target-specific `point` response; support remains explicit. |
| 8:45–10:15 `/s/` and `/m/` contrast | Moss frames non-character anchor images: moon/map for `/m/` and sun/sound for `/s/`. Miko models the closed-lips `/m/` cue and the narrow-air `/s/` cue side by side. | Miko: “/m/.” Pause. “/s/.” Trial A prompt: Miko says, “/m/.” Trial B prompt: Miko says, “/s/.” The trial order may swap, but no other words play. | Choose the matching mouth/sound-path cue; sound discrimination evidence. Character names are never used as anchors. |
| 10:15–11:30 Letter selection | Two large tactile glyph tiles `m` and `s` appear beside the approved non-character anchor imagery and Miko’s reviewed mouth cues. No word labels appear. | `/m/` variant: Miko says, “/m/.” `/s/` variant: Miko says, “/s/.” No other words play. | Tap `m` or `s`; this is the only literacy demand. |
| 11:30–12:30 Spaced retrieval | Moss presents a changed pair of story panels while Miko and Pippa remain neutral. | Miko: “Point to the picture where Pippa stops.” | Changed-context `point` retrieval; first response and support are preserved. |
| 12:30–14:15 Independent exit | Pippa begins moving toward the open lantern. No target model, open-palm cue, answer highlight, or sentence starter appears. Miko waits in a neutral listening pose. | Miko: “What should Pippa do?” | Independent spoken `stop` exists only if Alonso produces `stop` without help. An open-palm response is independent semantic meaning evidence, not spoken use. Help ends independence but permits supported recovery. |
| 14:15–15:00 Completion | Pippa settles safely; Nia’s lantern opens into a five-scene picture memory that becomes available in the Word Gallery. The next mission remains closed pending future parent direction. | Spoken-use variant, Miko: “Pippa heard you. You said stop.” Gesture/fallback variant: “Pippa understood your signal.” | Completion only after the authoritative gate; no new scored evidence or frame claim. |

### Day 5 story audio draft

The exact narration is provisional and must be validated against the approved snapshot before use:

1. Nia: “Moss comes to Story Camp.” Miko: “Hello, Moss!” Moss: “Hello!”
2. Nia: “Would you like this?” Moss: “Yes, please. Thank you.”
3. Nia: “Pippa moves toward the lantern.” Miko: “Stop.” Nia: “Pippa stops. Moss says goodbye.” Moss: “Goodbye!”

No sentence is shown as required child text. The exact lines above are the complete provisional story script; no additional connective narration is implied. Connective words in those lines are exposure only and are never scored or represented as learned.

**Fallbacks:** For the name-language exposure, Spanish orientation is: “Nia quiere saber tu nombre. Respóndele.” Then replay only “What is your name?” For `point` or `stop`, use: “Responde a Miko según la escena.” Then replay the exact English prompt without supplying or translating the target. Once rescue is used, the response is rescue-supported. Speech unavailable exposes the reviewed picture/open-palm response; it can demonstrate meaning but never spoken use. Audio or story-panel failure pauses safely.

**No-reading proof:** identity is shown by portrait ownership and pointing; `stop` by frozen movement; story by acted panels; sound by mouth/gesture and audio. Only the explicitly approved `m`/`s` glyph choice contains letters.

**Required assets:** Story Camp lantern and three-panel table; group/portrait tokens; Miko/Nia name-model and neutral-listening poses; Nia storyteller plus first/next/last comet-trail poses; Moss equal-panel/object framing and reduced-choice states; Pippa point/move/stop sequences and reduced-motion held poses; three story panels; moon/map and sun/sound anchor imagery; Miko `/m/` and `/s/` mouth/sound-path cues; tactile `m`/`s` tiles; final five-scene Word Gallery memory; exact English story, prompt, result, and frame-exposure audio; reviewed Spanish orientation; repeat, silence, microphone-denied, provider-unavailable, semantic-response, audio-missing, and image-missing variants.

## Week-level evidence and retrieval plan

This table defines concept intent only. Recovery 3 must encode exact rubric IDs; Recovery 7 later decides mastery/review.

| Target | First teaching context | Planned changed-context retrieval | Strongest proposed evidence this week |
| --- | --- | --- | --- |
| `hello`; exposure-only `Hello!` frame | Miko greets arriving Nia at Welcome Dock | Moss/Pippa arrival; Day 5 Story Camp opening | Independent `hello` plus receptive scene discrimination; the natural `Hello!` frame model creates no separate frame evidence |
| `goodbye` | Nia departs Welcome Dock | Day 3 Story Camp closure and Day 5 story | Receptive departure meaning captured before Day 1 completion; optional contextual use |
| `yes`, `please`; exposure-only `Yes, please.` frame | Nia offers a route token at Action Grove | Nia offers a different Moss-framed object; Day 5 story exposure | Target-specific receptive evidence and independent production when present; the combined recast is not a third learned target |
| `no`, `thank you`; exposure-only `No, thank you.` frame | Nia’s offer at Story Camp | Nia repeats the offer with a changed Moss-framed object; later story exposure | Independent target evidence only for words Alonso actually produces; valid acceptance never becomes false decline evidence |
| `listen`, `look` | Miko voices cues while Pippa demonstrates at Sound Workshop | Changed workshop arrangement and ordered independent exit | Independent receptive action/ordered semantic response |
| `point` | Miko models while Pippa points at Story Camp | Story-panel retell and changed-panel retrieval | Target-specific receptive/action response with exact support level |
| `stop` | Miko models while Pippa freezes at Story Camp | Independent changed-action exit | Independent spoken use or independent semantic gesture, kept mode-specific |
| exposure-only `My name is ___.` | Miko and Nia model during the Day 5 social beat | Optional guided identity response in the same beat | Exposure/guided participation only; no independent frame evidence or learned-target claim in this concept allocation |
| `/m/`, `/s/`, select `m`/`s` | Miko mouth/sound-path cues with non-character moon/map and sun/sound imagery | Day 5 sound contrast and letter selection | Sound discrimination and approved glyph selection, not reading/decoding |

One success cannot create mastery. A correct supported response stays supported; an unavailable microphone cannot create speech evidence; a completed week cannot advance Alonso automatically.

## Parent concept review checklist

For every concept and day, the parent should be able to answer:

- Does the character have a real instructional role rather than decorating the screen?
- Can the task be understood from voice, scene, gesture, demonstration, and stable controls without reading English?
- Is there exactly one obvious primary action?
- Is every new oral target within the daily budget and the A-U1 boundary?
- Are first model, replay, support, Spanish rescue, semantic fallback, and independent exit visibly distinct?
- Does the audio script sound warm, concise, natural, and age-appropriate rather than babyish or evaluative?
- Does every wrong/silent/unavailable state recover without shame, dead end, or invented success?
- Does the evidence label match what Alonso actually did—listened, chose, gestured, or spoke?
- Are raw audio, accent scoring, coins, streaks, leaderboards, and automatic mastery absent?
- Are all required character, pose, scene, object, motion, audio, fallback, caption, and alt-text assets named for later registry implementation?

## Approval boundary

Nothing in this document is approved by its existence. Before Recovery 3:

1. the parent must explicitly approve or request changes to all seven interaction concepts;
2. the parent must explicitly approve or request changes to the five A-U1 lesson storyboards and target allocation;
3. the parent must approve the character/world and adult-interface direction in the companion blueprint;
4. any future generated image asset must receive individual parent review;
5. documentation must record unresolved changes rather than silently treating them as accepted.

No production screen has been rebuilt, and no visual/audio concept has been tested with Alonso under this Recovery 2 document.
