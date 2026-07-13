import "server-only";

export type RecoveryFixtureStatus = "draft" | "validated" | "approved_private" | "published_ready" | "paused" | "completed" | "blocked";

export const RECOVERY_FIXTURE_CATALOG = {
  metadata: {
    id: "recovery-0-baseline-v1",
    source: "synthetic_in_memory",
    writesToSupabase: false,
    childName: "Alonso (fixture)",
    purpose: "Exercise current and target application states without creating curriculum, approval, attempt, evidence, or provider records.",
  },
  curriculum: {
    id: "fixture-unit-a-u1",
    code: "A-U1",
    title: "Hello, Listen, and Respond",
    status: "approved fixture",
    constraints: ["15-minute maximum", "Oral-first", "No reading demand", "Two sound anchors", "Parent-controlled publication"],
    targets: { vocabulary: 10, sentenceFrames: 4, soundAnchors: 2, letterSelection: 1 },
  },
  week: {
    id: "fixture-week-1",
    status: "approved fixture",
    days: [
      { day: 1, title: "Meet the guide", state: "validated", owner: "Parent review" },
      { day: 2, title: "Listen and find", state: "approved_private", owner: "Publication decision" },
      { day: 3, title: "Hello in context", state: "published_ready", owner: "Alonso" },
      { day: 4, title: "Listen, look, point", state: "paused", owner: "Alonso resume" },
      { day: 5, title: "Use it independently", state: "completed", owner: "Evidence and review" },
    ] satisfies Array<{ day: number; title: string; state: RecoveryFixtureStatus; owner: string }>,
  },
  lessonStates: [
    { id: "fixture-lesson-draft", state: "draft", route: "/parent/artifacts/[artifactId]", expectedAction: "Generate or revise; never child-visible" },
    { id: "fixture-lesson-validated", state: "validated", route: "/parent/artifacts/[artifactId]", expectedAction: "Review complete content and decide" },
    { id: "fixture-lesson-approved", state: "approved_private", route: "/parent/week", expectedAction: "Publish or replace; still private" },
    { id: "fixture-lesson-ready", state: "published_ready", route: "/alonso", expectedAction: "Show exactly one Today's Mission" },
    { id: "fixture-lesson-paused", state: "paused", route: "/alonso/lesson/[attemptId]", expectedAction: "Resume exact block and support state" },
    { id: "fixture-lesson-completed", state: "completed", route: "/parent/progress", expectedAction: "Show evidence and schedule review" },
  ] satisfies Array<{ id: string; state: RecoveryFixtureStatus; route: string; expectedAction: string }>,
  attempts: [
    { id: "fixture-attempt-new", status: "not_started", blockIndex: 0, retries: 0, support: "independent" },
    { id: "fixture-attempt-active", status: "in_progress", blockIndex: 3, retries: 1, support: "prompted" },
    { id: "fixture-attempt-paused", status: "paused", blockIndex: 4, retries: 2, support: "reduced_choices" },
    { id: "fixture-attempt-complete", status: "completed", blockIndex: 7, retries: 0, support: "independent" },
  ],
  evidence: [
    { id: "fixture-evidence-1", target: "hello", result: "correct", firstAttempt: true, support: "independent", context: "character greeting" },
    { id: "fixture-evidence-2", target: "listen", result: "incorrect", firstAttempt: true, support: "independent", context: "action selection" },
    { id: "fixture-evidence-3", target: "listen", result: "correct", firstAttempt: false, support: "modeled", context: "action selection" },
    { id: "fixture-evidence-4", target: "My name is Alonso.", result: "insufficient", firstAttempt: true, support: "speech unavailable", context: "guided turn" },
  ],
  providerFailures: [
    { id: "missing_voice", provider: "ElevenLabs", expectedBehavior: "Block publication and show the parent the exact voice-approval step." },
    { id: "microphone_denied", provider: "Browser", expectedBehavior: "Preserve lesson state and expose an immediate working fallback." },
    { id: "silence", provider: "ElevenLabs", expectedBehavior: "Treat as no response, not an incorrect pronunciation." },
    { id: "tts_timeout", provider: "ElevenLabs", expectedBehavior: "Use pre-generated audio or a safe parent-assisted fallback." },
    { id: "generation_quota", provider: "OpenAI", expectedBehavior: "Preserve approved data and provide a retryable parent action." },
    { id: "database_unavailable", provider: "Supabase", expectedBehavior: "Keep the current view, avoid optimistic success, and retry safely." },
  ],
} as const;
