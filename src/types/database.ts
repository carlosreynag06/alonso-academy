export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDef<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamped = { created_at: string };

export type CurriculumStatus = "draft" | "approved" | "inactive" | "archived";
export type ArtifactStatus = "draft" | "validating" | "validation_failed" | "validated" | "approved" | "active" | "completed" | "archived";
export type LearningWeekStatus = "planned" | "active" | "completed" | "archived";
export type LessonAssignmentStatus = "assigned" | "scheduled" | "published" | "completed" | "withdrawn" | "replaced" | "archived" | "quarantined";
export type LessonAttemptMode = "learning" | "replay" | "scheduled_retrieval";
export type AttemptBlockStatus = "pending" | "active" | "completed";
export type EvidenceAuthorityStatus = "legacy_client_asserted" | "server_derived" | "provider_derived";

export type Database = {
  public: {
    Tables: {
      parent_allowlist: TableDef<{ email: string; added_at: string; added_by: string | null }>;
      parent_profiles: TableDef<Timestamped & { id: string; email: string; display_name: string; updated_at: string }>;
      curriculum_phases: TableDef<Timestamped & { code: string; sequence: number; name: string; purpose: string; status: CurriculumStatus }>;
      curriculum_units: TableDef<Timestamped & { id: string; phase_code: string; code: string; title: string; description: string; version: number; status: CurriculumStatus; constraints: Json; mastery_requirements: Json; approved_at: string | null; approved_by: string | null; updated_at: string }>;
      vocabulary_items: TableDef<Timestamped & { id: string; unit_id: string; canonical_text: string; item_kind: string; part_of_speech: string | null; theme: string; communication_function: string; priority: number; imageable: boolean; gesture_support: string | null; oral_ready: boolean; reading_ready: boolean; writing_ready: boolean; status: CurriculumStatus; metadata: Json }>;
      sentence_frames: TableDef<Timestamped & { id: string; unit_id: string; frame: string; communication_function: string; mode: string; acceptable_responses: Json; recast_guidance: string | null; status: CurriculumStatus }>;
      phonics_targets: TableDef<Timestamped & { id: string; unit_id: string; phoneme: string; grapheme: string | null; target_type: string; reading_allowed: boolean; status: CurriculumStatus; metadata: Json }>;
      writing_targets: TableDef<Timestamped & { id: string; unit_id: string; title: string; demand: string; activity_type: string; status: CurriculumStatus; metadata: Json }>;
      child_profiles: TableDef<Timestamped & { id: string; auth_user_id: string | null; singleton: boolean; preferred_name: string; home_language: string; target_language: string; current_phase_code: string | null; current_unit_id: string | null; updated_at: string }>;
      generated_artifacts: TableDef<Timestamped & { id: string; kind: Database["public"]["Enums"]["artifact_kind"]; status: ArtifactStatus; version: number; previous_version_id: string | null; curriculum_unit_id: string; curriculum_snapshot: Json; content: Json; validation_report: Json | null; model_id: string | null; prompt_version: string | null; request_hash: string | null; reasoning_effort: string | null; semantic_validator_model_id: string | null; lineage_key: string; parent_artifact_id: string | null; day_number: number | null; week_day_slot_id: string | null; binding_status: "not_applicable" | "unverified" | "valid" | "invalid"; binding_report: Json; binding_validated_at: string | null; runtime_ready: boolean; runtime_report: Json; created_by: string; updated_at: string }>;
      generation_jobs: TableDef<Timestamped & { id: string; idempotency_key: string; artifact_kind: Database["public"]["Enums"]["artifact_kind"]; curriculum_unit_id: string; curriculum_snapshot_id: string; request_hash: string; status: Database["public"]["Enums"]["generation_job_status"]; attempts: number; artifact_id: string | null; requested_by: string; safe_error_code: string | null; safe_error_message: string | null; started_at: string | null; completed_at: string | null; updated_at: string }>;
      approval_records: TableDef<Timestamped & { id: string; entity_type: string; entity_id: string; action: string; note: string | null; actor_id: string }>;
      curriculum_overrides: TableDef<Timestamped & { id: string; unit_id: string; target_type: string; target_id: string | null; reason: string; actor_id: string }>;
      lesson_attempts: TableDef<Timestamped & { id: string; child_id: string; lesson_artifact_id: string; assignment_id: string | null; mode: Database["public"]["Enums"]["lesson_attempt_mode"]; attempt_sequence: number; status: string; started_at: string; completed_at: string | null; current_block_index: number; current_block_id: string | null; break_count: number; player_state: Json; state_version: number; paused_at: string | null; abandoned_at: string | null; legacy_quarantined: boolean; quarantine_reason: string | null; last_activity_at: string }>;
      activity_evidence: TableDef<Timestamped & { id: string; client_event_id: string; attempt_id: string; block_id: string; target_type: string; target_id: string | null; evidence_type: string; first_attempt: boolean; support_level: string; correct: boolean | null; response_latency_ms: number | null; retry_count: number; transcript: string | null; provider_confidence: number | null; metadata: Json; response_event_id: string | null; attempt_mode: Database["public"]["Enums"]["lesson_attempt_mode"] | null; authority: Database["public"]["Enums"]["evidence_authority_status"]; rule_version: string | null; qualifies_for_completion: boolean }>;
      mastery_records: TableDef<{ id: string; child_id: string; target_type: string; target_id: string; stage: string; evidence_count: number; last_retrieved_at: string | null; updated_at: string }>;
      review_schedules: TableDef<{ id: string; mastery_record_id: string; due_at: string; priority: number; reason: string; updated_at: string }>;
      provider_metadata: TableDef<Timestamped & { id: string; provider: string; operation: string; external_id: string | null; model_id: string | null; status: string; safe_metadata: Json }>;
      child_sessions: TableDef<Timestamped & { id: string; child_id: string; token_hash: string; active_lesson_id: string | null; issued_by: string; expires_at: string; revoked_at: string | null }>;
      audit_events: TableDef<Timestamped & { id: number; actor_id: string | null; event_type: string; entity_type: string; entity_id: string | null; safe_details: Json }>;
      learning_weeks: TableDef<Timestamped & { id: string; child_id: string; curriculum_unit_id: string; weekly_plan_artifact_id: string; status: Database["public"]["Enums"]["learning_week_status"]; starts_on: string | null; timezone: string; created_by: string; archived_at: string | null; archived_by: string | null; archive_reason: string | null; updated_at: string }>;
      week_day_slots: TableDef<Timestamped & { id: string; learning_week_id: string; weekly_plan_artifact_id: string; day_number: number; title: string; objective: string; duration_minutes: number; lesson_kind: Database["public"]["Enums"]["artifact_kind"]; target_ids: string[]; review_target_ids: string[]; target_set_hash: string }>;
      week_day_targets: TableDef<Timestamped & { week_day_slot_id: string; target_type: "vocabulary" | "sentence_frame" | "phonics" | "writing"; target_id: string; role: "new" | "review" }>;
      lesson_assignments: TableDef<Timestamped & { id: string; child_id: string; week_day_slot_id: string; lesson_artifact_id: string; status: Database["public"]["Enums"]["lesson_assignment_status"]; primary_attempt_mode: Database["public"]["Enums"]["lesson_attempt_mode"]; replay_allowed: boolean; available_from: string | null; available_until: string | null; published_at: string | null; published_by: string | null; completed_at: string | null; withdrawn_at: string | null; withdrawn_by: string | null; withdrawal_reason: string | null; superseded_by_assignment_id: string | null; archived_at: string | null; archived_by: string | null; archive_reason: string | null; quarantine_reason: string | null; created_by: string; updated_at: string; state_version: number }>;
      lesson_attempt_block_states: TableDef<{ attempt_id: string; block_id: string; block_index: number; status: Database["public"]["Enums"]["attempt_block_status"]; response_count: number; listen_count: number; replay_count: number; support_level: "independent" | "replay" | "prompted" | "reduced_choices" | "modeled"; first_presented_at: string | null; completed_at: string | null; state: Json; updated_at: string }>;
      lesson_response_events: TableDef<Timestamped & { id: string; client_event_id: string; attempt_id: string; block_id: string; response_ordinal: number; response_kind: "choice" | "text" | "speech"; response: Json; correct: boolean | null; outcome: "correct" | "incorrect" | "silence" | "provider_unavailable"; first_attempt: boolean; support_level: "independent" | "replay" | "prompted" | "reduced_choices" | "modeled"; retry_count: number; response_latency_ms: number | null; transcript: string | null; provider_confidence: number | null; provider_model: string | null; authority: Database["public"]["Enums"]["evidence_authority_status"] }>;
      lesson_attempt_events: TableDef<Timestamped & { id: string; client_event_id: string; attempt_id: string; block_id: string | null; command: "start" | "pause" | "resume" | "start_break" | "end_break" | "record_listen" | "request_hint" | "acknowledge" | "retry" | "advance" | "submit_response" | "complete"; state_version_before: number; state_version_after: number; safe_payload: Json; result_snapshot: Json }>;
    };
    Views: Record<string, never>;
    Functions: {
      ensure_parent_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["parent_profiles"]["Row"];
      };
      approve_curriculum_unit: {
        Args: { p_unit_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["curriculum_units"]["Row"];
      };
      approve_generated_artifact: {
        Args: { p_artifact_id: string; p_note: string };
        Returns: Database["public"]["Tables"]["generated_artifacts"]["Row"];
      };
      reject_generated_artifact: {
        Args: { p_artifact_id: string; p_note: string };
        Returns: Database["public"]["Tables"]["generated_artifacts"]["Row"];
      };
      get_current_child_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["child_profiles"]["Row"];
      };
      create_learning_week_from_plan: {
        Args: { p_weekly_plan_artifact_id: string; p_child_id: string; p_starts_on: string | null; p_timezone: string | null; p_note: string };
        Returns: Database["public"]["Tables"]["learning_weeks"]["Row"];
      };
      schedule_lesson_assignment: {
        Args: { p_week_day_slot_id: string; p_lesson_artifact_id: string; p_available_from: string; p_available_until: string | null; p_note: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      publish_lesson_assignment: {
        Args: { p_assignment_id: string; p_note: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      set_lesson_assignment_replay: {
        Args: { p_assignment_id: string; p_replay_allowed: boolean; p_note: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      replace_lesson_assignment: {
        Args: { p_assignment_id: string; p_replacement_lesson_artifact_id: string; p_activation_mode: "assigned" | "scheduled" | "published"; p_available_from: string | null; p_available_until: string | null; p_note: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      withdraw_lesson_assignment: {
        Args: { p_assignment_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      archive_lesson_assignment: {
        Args: { p_assignment_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["lesson_assignments"]["Row"];
      };
      revoke_generated_artifact_approval: {
        Args: { p_artifact_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["generated_artifacts"]["Row"];
      };
      archive_generated_artifact: {
        Args: { p_artifact_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["generated_artifacts"]["Row"];
      };
      archive_learning_week: {
        Args: { p_learning_week_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["learning_weeks"]["Row"];
      };
      get_child_lesson_home: { Args: Record<PropertyKey, never>; Returns: Json };
      get_child_attempt_snapshot: { Args: { p_attempt_id: string }; Returns: Json };
      get_child_lesson_attempt: { Args: { p_attempt_id: string }; Returns: Json };
      start_child_assignment: {
        Args: { p_assignment_id: string; p_mode: Database["public"]["Enums"]["lesson_attempt_mode"]; p_client_event_id: string };
        Returns: Json;
      };
      command_child_attempt: {
        Args: { p_attempt_id: string; p_client_event_id: string; p_expected_state_version: number; p_block_id: string; p_command: string; p_payload: Json };
        Returns: Json;
      };
      record_child_speech_provider_result_v2: {
        Args: { p_attempt_id: string; p_client_event_id: string; p_expected_state_version: number; p_block_id: string; p_transcript: string | null; p_provider_confidence: number | null; p_provider_model: string; p_provider_outcome: "transcribed" | "silence"; p_response_latency_ms: number | null };
        Returns: Json;
      };
    };
    Enums: {
      curriculum_status: CurriculumStatus;
      artifact_status: ArtifactStatus;
      artifact_kind: "weekly_plan" | "daily_lesson" | "review_lesson" | "story_lesson" | "parent_summary";
      approval_action: "approved" | "rejected" | "revoked";
      mastery_stage: "introduced" | "assisted_success" | "recognized" | "understood_in_context" | "used_with_prompt" | "used_independently" | "used_across_contexts" | "stable_mastery";
      generation_job_status: "queued" | "running" | "succeeded" | "failed";
      learning_week_status: LearningWeekStatus;
      lesson_assignment_status: LessonAssignmentStatus;
      lesson_attempt_mode: LessonAttemptMode;
      attempt_block_status: AttemptBlockStatus;
      evidence_authority_status: EvidenceAuthorityStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
