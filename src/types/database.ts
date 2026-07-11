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
      generated_artifacts: TableDef<Timestamped & { id: string; kind: Database["public"]["Enums"]["artifact_kind"]; status: ArtifactStatus; version: number; previous_version_id: string | null; curriculum_unit_id: string; curriculum_snapshot: Json; content: Json; validation_report: Json | null; model_id: string | null; prompt_version: string | null; request_hash: string | null; reasoning_effort: string | null; semantic_validator_model_id: string | null; lineage_key: string; parent_artifact_id: string | null; day_number: number | null; created_by: string; updated_at: string }>;
      generation_jobs: TableDef<Timestamped & { id: string; idempotency_key: string; artifact_kind: Database["public"]["Enums"]["artifact_kind"]; curriculum_unit_id: string; curriculum_snapshot_id: string; request_hash: string; status: Database["public"]["Enums"]["generation_job_status"]; attempts: number; artifact_id: string | null; requested_by: string; safe_error_code: string | null; safe_error_message: string | null; started_at: string | null; completed_at: string | null; updated_at: string }>;
      approval_records: TableDef<Timestamped & { id: string; entity_type: string; entity_id: string; action: string; note: string | null; actor_id: string }>;
      curriculum_overrides: TableDef<Timestamped & { id: string; unit_id: string; target_type: string; target_id: string | null; reason: string; actor_id: string }>;
      lesson_attempts: TableDef<Timestamped & { id: string; child_id: string; lesson_artifact_id: string; status: string; started_at: string; completed_at: string | null; current_block_index: number; break_count: number; player_state: Json; last_activity_at: string }>;
      activity_evidence: TableDef<Timestamped & { id: string; client_event_id: string; attempt_id: string; block_id: string; target_type: string; target_id: string | null; evidence_type: string; first_attempt: boolean; support_level: string; correct: boolean | null; response_latency_ms: number | null; retry_count: number; transcript: string | null; provider_confidence: number | null; metadata: Json }>;
      mastery_records: TableDef<{ id: string; child_id: string; target_type: string; target_id: string; stage: string; evidence_count: number; last_retrieved_at: string | null; updated_at: string }>;
      review_schedules: TableDef<{ id: string; mastery_record_id: string; due_at: string; priority: number; reason: string; updated_at: string }>;
      provider_metadata: TableDef<Timestamped & { id: string; provider: string; operation: string; external_id: string | null; model_id: string | null; status: string; safe_metadata: Json }>;
      child_sessions: TableDef<Timestamped & { id: string; child_id: string; token_hash: string; active_lesson_id: string | null; issued_by: string; expires_at: string; revoked_at: string | null }>;
      audit_events: TableDef<Timestamped & { id: number; actor_id: string | null; event_type: string; entity_type: string; entity_id: string | null; safe_details: Json }>;
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
      get_child_lesson_home: { Args: Record<PropertyKey, never>; Returns: Json };
      start_child_lesson: { Args: { p_lesson_id: string }; Returns: Database["public"]["Tables"]["lesson_attempts"]["Row"] };
      get_child_lesson_attempt: { Args: { p_attempt_id: string }; Returns: Json };
      save_child_lesson_progress: { Args: { p_attempt_id: string; p_block_index: number; p_status: string; p_break_count: number; p_player_state: Json }; Returns: Database["public"]["Tables"]["lesson_attempts"]["Row"] };
      record_child_activity_evidence: { Args: { p_client_event_id: string; p_attempt_id: string; p_block_id: string; p_target_id: string | null; p_evidence_type: string; p_first_attempt: boolean; p_support_level: string; p_correct: boolean | null; p_response_latency_ms: number | null; p_retry_count: number; p_metadata: Json }; Returns: Database["public"]["Tables"]["activity_evidence"]["Row"] };
      record_child_speech_evidence: { Args: { p_client_event_id: string; p_attempt_id: string; p_block_id: string; p_target_id: string | null; p_evidence_type: string; p_first_attempt: boolean; p_support_level: string; p_correct: boolean | null; p_response_latency_ms: number | null; p_retry_count: number; p_transcript: string | null; p_provider_confidence: number | null; p_provider_model: string; p_outcome: string }; Returns: Database["public"]["Tables"]["activity_evidence"]["Row"] };
      complete_child_lesson: { Args: { p_attempt_id: string }; Returns: Database["public"]["Tables"]["lesson_attempts"]["Row"] };
    };
    Enums: {
      curriculum_status: CurriculumStatus;
      artifact_status: ArtifactStatus;
      artifact_kind: "weekly_plan" | "daily_lesson" | "review_lesson" | "story_lesson" | "parent_summary";
      approval_action: "approved" | "rejected" | "revoked";
      mastery_stage: "introduced" | "assisted_success" | "recognized" | "understood_in_context" | "used_with_prompt" | "used_independently" | "used_across_contexts" | "stable_mastery";
      generation_job_status: "queued" | "running" | "succeeded" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};
