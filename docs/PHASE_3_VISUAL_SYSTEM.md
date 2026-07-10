# Phase 3: Visual System and Responsive Shells

## Direction

The shared experience is warm, calm, and deliberate. It uses deep ink, restrained teal, warm paper, and small honey/coral accents. The interface avoids game economies, bright reward loops, excessive gradients, glow effects, and cartoon overload.

Parent pages prioritize scanning, trust, and clear approval boundaries. Alonso's pages use larger type, simpler language, generous spacing, and stable controls without looking unfinished or babyish.

## Design tokens

`src/app/globals.css` defines:

- semantic surface, ink, accent, success, warning, and neutral colors;
- five radius levels and three restrained shadow levels;
- responsive display typography;
- global focus, selection, screen-reader-only, and skip-link rules;
- reduced-motion behavior.

Global CSS is limited to tokens and true application-wide behavior. Route and component rules remain locally scoped in CSS Modules.

## Shared components

- `AcademyMark`: compact or full code-native academy mark.
- `ActionLink`: primary, light, and quiet navigation actions with 44-48px targets.
- `StatusBadge`: ready, waiting, and locked states with text plus icon, never color alone.
- `FeedbackState`, `LoadingState`, and `ErrorState`: consistent empty, loading, failure, and retry language.
- `AudioControl` and `MicrophoneControl`: stable ready/playing/recording/denied/unavailable presentations for later provider wiring.
- `ProgressTrack`: labelled progress with numeric text and accessible progress semantics.
- `ChoiceCard`: idle, selected, correct, and incorrect selection states with explicit text/icon cues.
- `StoryFrame`: responsive listening-versus-reading presentation that clearly labels the activity mode.

These components receive view data through props and perform no privileged queries.

## Shells

`ParentShell` provides restrained workspace navigation, private-context identity, and consistent responsive spacing. It never grants access; server checks and RLS do that.

`ChildShell` provides a stable academy header and Alonso identity without parent controls. Later lesson routes will preserve this shell so core navigation and control placement do not move between activities.

## Accessibility and responsive behavior

- Every page has a descriptive title and one primary heading.
- A keyboard-visible skip link targets `#main-content`.
- Focus indicators use a three-pixel high-contrast outline.
- Core actions are at least 44px high; lesson controls are 70px high.
- Status and correctness never rely on color alone.
- Loading states announce busy status; errors use plain-language recovery.
- Motion is subtle and disabled under `prefers-reduced-motion`.
- Parent grids and story frames collapse intentionally; mobile layouts do not horizontally scroll.

## Deliberate exclusions

This phase does not add live audio, microphone access, lesson execution, final dashboard data, animations unrelated to instructional state, or screenshot baselines. The reusable states exist for later authorized phases to wire to real behavior.
