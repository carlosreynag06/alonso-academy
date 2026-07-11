create or replace function public.record_child_speech_evidence(
  p_client_event_id uuid, p_attempt_id uuid, p_block_id text, p_target_id uuid,
  p_evidence_type text, p_first_attempt boolean, p_support_level text, p_correct boolean,
  p_response_latency_ms integer, p_retry_count integer, p_transcript text,
  p_provider_confidence numeric, p_provider_model text, p_outcome text
)
returns public.activity_evidence
language plpgsql
security definer
set search_path = ''
as $$
declare evidence public.activity_evidence; block jsonb;
begin
  select block_value into block
  from public.lesson_attempts attempt
  join public.generated_artifacts lesson on lesson.id = attempt.lesson_artifact_id,
    lateral jsonb_array_elements(lesson.content -> 'blocks') block_value
  where attempt.id = p_attempt_id and attempt.child_id = private.current_child_id()
    and lesson.status = 'approved' and block_value ->> 'id' = p_block_id;
  if block is null then raise exception 'Activity is not available'; end if;
  if block ->> 'type' not in ('phonemic_awareness', 'exit_check') then raise exception 'Speech is not available for this activity'; end if;
  if p_target_id is not null and not ((block -> 'targetIds') ? p_target_id::text) then raise exception 'Target is not available'; end if;
  if p_provider_confidence is not null and (p_provider_confidence < 0 or p_provider_confidence > 1) then raise exception 'Confidence is invalid'; end if;
  if p_outcome not in ('matched','try_again','silence') then raise exception 'Speech outcome is invalid'; end if;
  if p_support_level not in ('independent','replay','prompted','reduced_choices','modeled') then raise exception 'Support is invalid'; end if;

  insert into public.activity_evidence (
    client_event_id, attempt_id, block_id, target_type, target_id, evidence_type, first_attempt,
    support_level, correct, response_latency_ms, retry_count, transcript, provider_confidence, metadata
  ) values (
    p_client_event_id, p_attempt_id, p_block_id, block ->> 'type', p_target_id, p_evidence_type,
    p_first_attempt, p_support_level, p_correct, p_response_latency_ms, p_retry_count,
    nullif(left(coalesce(p_transcript, ''), 500), ''), p_provider_confidence,
    jsonb_build_object('provider', 'elevenlabs', 'model', left(coalesce(p_provider_model, ''), 80), 'speechOutcome', p_outcome, 'rawAudioStored', false)
  ) on conflict (client_event_id) do update set client_event_id = excluded.client_event_id
  returning * into evidence;

  insert into public.provider_metadata(provider, operation, model_id, status, safe_metadata)
  values ('elevenlabs', 'speech_to_text', left(coalesce(p_provider_model, ''), 80), 'completed', jsonb_build_object('outcome', p_outcome, 'rawAudioStored', false));
  return evidence;
end;
$$;

revoke all on function public.record_child_speech_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, text, numeric, text, text) from public, anon;
grant execute on function public.record_child_speech_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, text, numeric, text, text) to authenticated;
comment on function public.record_child_speech_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, text, numeric, text, text) is 'Records only derived speech evidence; raw microphone audio is never persisted.';
