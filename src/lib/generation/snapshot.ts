import "server-only";

import { createHash } from "node:crypto";
import type { CurriculumScope } from "./contracts";
import { createClient } from "@/lib/supabase/server";

export type SnapshotResult =
  | { ready: true; scope: CurriculumScope }
  | { ready: false; code: "CURRICULUM_NOT_FOUND" | "CURRICULUM_NOT_APPROVED" | "TARGETS_NOT_APPROVED"; message: string };

export async function buildApprovedCurriculumSnapshot(unitId: string): Promise<SnapshotResult> {
  const supabase = await createClient();
  const [unitResult, vocabularyResult, framesResult, phonicsResult, writingResult] = await Promise.all([
    supabase.from("curriculum_units").select("*").eq("id", unitId).maybeSingle(),
    supabase.from("vocabulary_items").select("*").eq("unit_id", unitId).eq("status", "approved"),
    supabase.from("sentence_frames").select("*").eq("unit_id", unitId).eq("status", "approved"),
    supabase.from("phonics_targets").select("*").eq("unit_id", unitId).eq("status", "approved"),
    supabase.from("writing_targets").select("*").eq("unit_id", unitId).eq("status", "approved"),
  ]);

  if (unitResult.error || !unitResult.data) {
    return { ready: false, code: "CURRICULUM_NOT_FOUND", message: "The requested curriculum unit could not be found." };
  }
  if (unitResult.data.status !== "approved" || !unitResult.data.approved_at) {
    return { ready: false, code: "CURRICULUM_NOT_APPROVED", message: "Generation stays locked until the parent approves this curriculum unit." };
  }
  const queryError = vocabularyResult.error ?? framesResult.error ?? phonicsResult.error ?? writingResult.error;
  if (queryError) throw queryError;

  const targets: CurriculumScope["targets"] = [
    ...(vocabularyResult.data ?? []).map((item) => ({ id: item.id, text: item.canonical_text, kind: "vocabulary" as const, oralReady: item.oral_ready, readingReady: item.reading_ready, writingReady: item.writing_ready })),
    ...(framesResult.data ?? []).map((item) => ({ id: item.id, text: item.frame, kind: "sentence_frame" as const, oralReady: true, readingReady: item.mode !== "oral_only", writingReady: item.mode === "writable" || item.mode === "fully_active" })),
    ...(phonicsResult.data ?? []).map((item) => ({ id: item.id, text: [item.phoneme, item.grapheme].filter(Boolean).join(" / "), kind: "phonics" as const, oralReady: true, readingReady: item.reading_allowed, writingReady: false })),
    ...(writingResult.data ?? []).map((item) => ({ id: item.id, text: item.title, kind: "writing" as const, oralReady: false, readingReady: false, writingReady: true })),
  ];

  if (targets.length === 0) {
    return { ready: false, code: "TARGETS_NOT_APPROVED", message: "The unit has no approved generation targets." };
  }

  const canonical = JSON.stringify({ unit: unitResult.data, targets });
  const snapshotId = createHash("sha256").update(canonical).digest("hex");
  return {
    ready: true,
    scope: {
      snapshotId,
      phaseCode: unitResult.data.phase_code,
      unitId: unitResult.data.id,
      unitCode: unitResult.data.code,
      unitVersion: unitResult.data.version,
      approvedAt: unitResult.data.approved_at,
      approvedTargetIds: targets.map(({ id }) => id),
      bannedTargetIds: [],
      targets,
      constraints: typeof unitResult.data.constraints === "object" && unitResult.data.constraints && !Array.isArray(unitResult.data.constraints) ? unitResult.data.constraints : {},
      masteryContext: [],
      reviewContext: [],
      safetyRules: [
        "Do not shame, diagnose, rank, or compare the learner.",
        "Do not require reading or writing beyond explicitly approved target readiness.",
        "Keep interactions bounded; never create free chat.",
        "Treat support, replay, and first-attempt evidence as distinct.",
      ],
    },
  };
}
