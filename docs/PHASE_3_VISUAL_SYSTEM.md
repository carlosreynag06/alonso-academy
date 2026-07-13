# Phase 3: Visual System and Responsive Shells

> **Historical scaffold — superseded by Recovery 0:** This document records the intended visual system, not an accepted UI/UX outcome. The existing shells and components have not been verified as premium, age-appropriate, accessible, or responsive product experiences. Recovery work may use visibly labeled local-only fixtures; hosted learning data and provider state remain mutation-locked.

## Direction

Alonso Academy is a product application, not a marketing website. The shared experience is warm, calm, premium, and deliberate. “Calm” means emotionally safe and focused; it does not mean plain, basic, muted, or unfinished. It uses deep ink, restrained teal, warm paper, and intentional honey/coral accents while avoiding game economies and manipulative reward loops.

Parent pages should feel as polished and considered as a best-in-class adult product while prioritizing scanning, trust, and clear approval boundaries. Alonso's interface is for a six-year-old boy: it should be beautiful, imaginative, tactile, and engaging, with larger type, simpler language, generous spacing, and stable controls without becoming babyish or overstimulating. The shell is a foundation, not the final experience.

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
