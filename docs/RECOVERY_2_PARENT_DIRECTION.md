# Recovery 2 Parent Workspace Direction

## Status and authority

**Candidate direction — pending explicit parent approval.**

This document defines the adult-interface direction required by Recovery 2. It is a design specification for the Recovery 4 rebuild, not an implementation claim, screenshot baseline, or acceptance record. Nothing in this document approves the current parent interface or authorizes Recovery 3.

`PHASE_PLAN.md` remains authoritative. Recovery 1 lifecycle and authorization rules remain fixed constraints: curriculum approval, content approval, assignment, scheduling, publication, completion, withdrawal, replacement, revocation, and archival are separate actions.

## Product stance

The parent side is an operational application for an adult making consequential curriculum and publication decisions. It must feel precise, composed, efficient, and trustworthy.

The direction is deliberately not childlike and not a marketing dashboard:

- no gradients;
- no oversized decorative hero panels;
- no card grid used as the default page composition;
- no excessive whitespace that separates related operational facts;
- no large rounded containers or pill-shaped primary controls;
- no icon-only primary navigation;
- no technical readiness claim without supporting state and evidence;
- no color as the only indicator of status or consequence.

The child character world must not leak into the adult workspace. A small product mark or a restrained Alonso thumbnail may establish context, but characters never compete with the parent's task.

## Experience principles

1. **The next consequential action is obvious.** Every page identifies what is blocked, why, and the single most relevant next action.
2. **State is explicit.** Labels use the authoritative domain terms and distinguish private approval from child visibility.
3. **Density follows the work.** Related facts sit together in rows, split panes, compact summaries, and tables rather than isolated promotional cards.
4. **Preview precedes decision.** Approval and publication controls never precede the content, validation, and consequence preview they act upon.
5. **Destructive or child-visible actions explain their effect.** The confirmation language names the exact version, child, week, day, and resulting visibility.
6. **History is inspectable.** Versions, decisions, evidence, and replacement ancestry remain available without crowding the current task.
7. **The interface is calm through order, not emptiness.** Restraint comes from typography, alignment, hierarchy, and predictable placement.

## Information architecture

The production navigation is persistently labeled and uses these destinations in this order:

| Destination | Parent question answered | Primary object |
| --- | --- | --- |
| Overview | What needs my attention now? | blockers, review work, current week, recent learning |
| Week | What is planned and published for each day? | one authoritative learning week and five day slots |
| Review queue | Which generated versions need a decision? | validation-ready or failed immutable artifacts |
| Curriculum | What is Alonso allowed and expected to learn? | immutable unit version, targets, constraints, decisions |
| Alonso | What can my child access right now? | published mission, replay permissions, child-safe availability |
| Progress | What does the evidence support? | target evidence, assistance, mastery, due review, uncertainty |
| History | What happened and who decided it? | lessons, attempts, versions, publication and audit events |
| Settings | Which private application and provider decisions are active? | family access, voice approval, privacy, retention, integrations |

Global search is not required for the pilot. A scoped filter within Review queue, Curriculum, Progress, and History is sufficient.

## Application shell

### Desktop, 1200 px and wider

- Fixed 216–232 px left navigation with product name, eight labeled destinations, and a compact family/privacy footer.
- Active destination uses a 3 px accent bar, stronger text, and a subtle flat background. It is never represented by color alone.
- A 52–60 px top utility row contains the page breadcrumb/title context, environment or fixture label when applicable, and the signed-in parent menu.
- Main content uses a maximum readable width of approximately 1440 px but may fill the available width for five-day tables and preview split panes.
- Page gutters are 24–32 px; major section spacing is 24 px; related control spacing is 8–16 px.

```text
┌──────────────────────┬─────────────────────────────────────────────────────────────┐
│ Alonso Academy       │ Page context                         Parent / environment    │
│ Parent workspace     ├─────────────────────────────────────────────────────────────┤
│                      │                                                             │
│ Overview             │ Page title, concise state, primary action                  │
│ Week                 │ ──────────────────────────────────────────────────────────  │
│ Review queue         │ Operational content / split pane / table                    │
│ Curriculum           │                                                             │
│ Alonso               │                                                             │
│ Progress             │                                                             │
│ History              │                                                             │
│ Settings             │                                                             │
│                      │                                                             │
│ Private family app   │                                                             │
└──────────────────────┴─────────────────────────────────────────────────────────────┘
```

### Tablet, 768–1199 px

- Navigation remains labeled in a collapsible 200 px drawer.
- A persistent menu control exposes the current destination name; it must not become an unexplained icon rail.
- Split panes stack only when each pane would fall below 360 px.
- Five-day week rows remain rows; columns may reduce to day, lesson, state, and action, with secondary metadata in an expandable details region.

### Mobile, below 768 px

- A compact top bar names the current destination and opens a full-height labeled navigation sheet.
- No bottom navigation is required for eight destinations.
- Tables become structured row groups with visible field labels, not horizontally scrolling desktop tables.
- Sticky action bars may contain at most one primary and one secondary action. All other actions move into a labeled menu or consequence panel.
- The complete approval, publication, withdrawal, and evidence-inspection flows must remain possible without switching to desktop.

## Visual language

### Color

Use flat, solid colors only. Gradients are prohibited in the parent workspace.

| Role | Direction |
| --- | --- |
| Application background | warm off-white or very light neutral |
| Primary surface | white |
| Secondary surface | slightly darker neutral, visibly clean rather than shadowed |
| Primary ink | deep graphite or blue-black |
| Secondary ink | cool neutral with WCAG-compliant contrast |
| Brand/action accent | one restrained teal |
| Attention | muted amber with icon and label |
| Error/destructive | restrained red with icon and explicit consequence text |
| Success/approved | deep green with icon and label |
| Child-visible publication | distinct blue-teal status, always named `Published to Alonso` |

Pastel color blocks, decorative coral/yellow panels, and multiple competing accent colors are not part of the adult direction.

### Typography

- Use a highly legible sans serif with tabular numerals where state counts, times, or evidence values align.
- Page title: 30–36 px desktop, 26–30 px mobile.
- Section title: 20–24 px.
- Row title/body: 14–16 px.
- Metadata: no smaller than 12 px, with sufficient contrast and normal letter spacing.
- Uppercase micro-labels are limited to short state/category labels; they are not used for sentences.
- Line length for explanatory copy is approximately 60–75 characters.

### Shape and depth

- Standard radius: 6 px.
- Dense controls and table containers: 4–6 px.
- Large containing surfaces: 8 px maximum.
- Dialogs and temporary overlays: 10 px maximum.
- Pills are reserved for short status chips, never for ordinary buttons, navigation items, or large containers.
- Default surfaces use a 1 px border with no shadow.
- Shadows are limited to temporary overlays, menus, and dialogs. They must not create a dirty halo around permanent content.

### Icons

- Icons support a visible text label; they do not replace primary labels.
- Use one consistent stroke family and 16–20 px default size.
- Status icons are paired with status text.
- Decorative icons are rare and hidden from assistive technology.

## Core page specifications

### Overview

The overview is a work queue, not a welcome hero.

```text
Overview                                           Last refreshed 10:42 AM
──────────────────────────────────────────────────────────────────────────
Needs attention (3)                 Current week · Jul 13–17
1  Curriculum decision              Day 1  Published      Open
2  Lesson validation failure        Day 2  Approved only  Schedule
3  Voice approval missing           Day 3  No lesson      Create
                                     Day 4  No lesson      Create
                                     Day 5  No lesson      Create
──────────────────────────────────────────────────────────────────────────
Recent learning                     Due review
Evidence summary rows               Target rows with reason and due date
```

- The first region is an ordered list of real blockers or decisions.
- Current week shows all five day slots and distinguishes `approved privately`, `scheduled`, and `published`.
- Recent learning does not infer mastery before the mastery engine exists; unsupported areas read `Insufficient evidence`.

### Week

The Week page is the operational center for one five-day plan.

```text
Week of Jul 13                         Planned week     [Week actions]
──────────────────────────────────────────────────────────────────────────
Day  Focus / targets         Lesson version       Validation   Child state
1    hello · greeting       Daily lesson v2      Passed       Published
2    yes · hello review     Daily lesson v1      Passed       Scheduled
3    no · yes review        No approved lesson   —            Not available
4    guided greeting        Review lesson v1     Failed       Not available
5    independent hello      No lesson             —            Not available
──────────────────────────────────────────────────────────────────────────
Selecting a row opens a detail drawer with target boundary, lineage,
assignment history, availability window, replay state, and allowed actions.
```

- Exactly five rows are always visible when a learning week exists.
- Lesson approval and publication are separate columns.
- The row action changes according to the authoritative next transition: review, approve, schedule, publish, withdraw, replace, or inspect.
- Bulk approval and bulk publication are not offered.

### Review queue

```text
Review queue (2)                [All kinds] [All states] [Oldest first]
──────────────────────────────────────────────────────────────────────────
Kind / day      Version   Validation       Created       Required action
Daily · Day 2   v3        Passed           9:40 AM       Review version
Daily · Day 4   v2        2 failures       9:18 AM       Inspect failures
```

- Validation failures display issue count and highest consequence, not a green/yellow decorative treatment.
- Opening an item uses the artifact review split view defined below.

### Artifact review split view

```text
Daily lesson · Day 2 · Version 3                 Validated, private
──────────────────────────────────────────────────────────────────────────
Child preview (fluid 65–70%)        Decision rail (320–380 px)
Screen 1 · character/context        Curriculum snapshot
spoken line + visual + fallback     Day/target binding
Screen 2 · model                    Validation issues
screen-by-screen continuation       Version lineage
                                     Consequences
                                     [Approve privately]
                                     [Request changes]
```

- The preview exposes every child screen, spoken prompt, optional caption, visual/character/pose, option and option audio, hidden answer in a parent-only layer, hint ladder, remediation, evidence rubric, and exit requirement.
- The decision rail remains visible while previewing on desktop and follows the preview on mobile.
- Approval names the exact immutable version and explicitly says it does not publish.
- Publication is offered only in the Week or Alonso operational context after private approval and scheduling prerequisites.

### Curriculum

- Left pane: versioned unit outline and target groups.
- Main pane: compact target table with canonical text, function, acceptable responses, recast, gesture, imageability, oral/reading/writing readiness, mastery requirement, and decision state.
- Right detail drawer: complete metadata, history, overrides, and consequences.
- Parent decisions occur at the immutable revision level and expose all changed items before approval.

### Alonso

- Names the one mission currently visible to Alonso, if any.
- Shows the exact lesson version, week/day, publication time/window, attempt state, and replay permission.
- The primary action is contextual: inspect, publish, withdraw, resume visibility investigation, or open attempt history.
- This page does not imitate the child world; a small approved scene thumbnail may identify the lesson.

### Progress

- Begins with evidence sufficiency and due-review information, not celebratory totals.
- Target rows show mastery stage, independent/supported evidence counts, last retrieval, next review, and uncertainty.
- Selecting a target opens the evidence trace and rule version.
- AI-written summary text is visually subordinate to the underlying evidence and clearly labeled as a summary.

### History

- One chronological table can filter by curriculum decision, generation, artifact decision, assignment/publication, attempt, provider failure, and mastery/review transition.
- Each row names actor, exact object/version, action, timestamp, reason, and resulting state.
- Technical identifiers are available in an expanded details region rather than dominating the default row.

### Settings

- Family access: the two provisioned identities and roles; no public signup controls.
- Voice: approved voice/version and decision status, not merely environment-variable presence.
- Privacy and retention: raw-audio rule, derived-data policy, and cleanup status.
- Providers: configuration, last verified health, and safe failure state are separate fields.
- Fixture/development information appears only in local development and is unmistakably labeled.

## Interaction and consequence patterns

### Primary actions

- One filled primary button per decision region.
- Secondary actions use bordered buttons or text links.
- Destructive actions are never visually adjacent to the primary action without separation and consequence text.
- Disabled controls are accompanied by a visible prerequisite explanation; hiding every unavailable action is avoided when it would obscure the workflow.

### Confirmation language

Every child-visible or destructive confirmation states:

- exact artifact kind and version;
- Alonso as the affected child;
- exact week and day slot;
- current state and resulting state;
- whether visibility begins or ends;
- whether history remains preserved;
- required parent note or reason.

### Status language

Use authoritative labels without euphemism:

- Draft
- Validating
- Validation failed
- Validated — awaiting parent review
- Approved privately
- Assigned privately
- Scheduled — not visible
- Published to Alonso
- In progress
- Completed
- Withdrawn
- Replaced
- Approval revoked
- Archived
- Quarantined

`Ready`, `active`, or `complete` may not stand alone when they could be mistaken for child visibility or pilot readiness.

## Accessibility and responsive acceptance direction

- All navigation and actions are keyboard reachable with a visible focus indicator.
- Touch targets are at least 44 by 44 CSS pixels.
- Tables retain programmatic headers when transformed into mobile row groups.
- Status and validation results include text and icon, not color alone.
- Dialog focus is trapped and restored; drawers have a labeled close control.
- Dense content supports browser zoom to 200% without loss of action access or horizontal page scrolling.
- Motion is unnecessary for comprehension and follows reduced-motion preferences.
- Dates include timezone context where publication availability can change meaning.
- Parent copy uses plain language first, with technical details available on demand.

## Recovery 2 deliverable boundary

This direction may be represented by reviewed static concepts and a read-only local concept gallery. It does not authorize extending the existing rejected parent CSS, wiring new production routes, changing lifecycle logic, or claiming usability verification.

The direction remains pending until the parent explicitly approves or rejects it. Approval must identify this document version and the exact associated concept set; viewing the concepts is not approval.
