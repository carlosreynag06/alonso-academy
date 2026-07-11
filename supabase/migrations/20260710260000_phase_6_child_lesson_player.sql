alter table public.lesson_attempts
  add column current_block_index integer not null default 0 check (current_block_index >= 0),
  add column break_count smallint not null default 0 check (break_count >= 0),
  add column player_state jsonb not null default '{}'::jsonb,
  add column last_activity_at timestamptz not null default now(),
  add constraint lesson_attempts_one_per_lesson unique (child_id, lesson_artifact_id);

alter table public.activity_evidence
  add column client_event_id uuid not null default gen_random_uuid() unique;

create or replace function private.current_child_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.child_profiles where auth_user_id = (select auth.uid()) limit 1;
$$;

revoke all on function private.current_child_id() from public, anon;
grant execute on function private.current_child_id() to authenticated;

create or replace function public.get_child_lesson_home()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  child_id_value uuid := private.current_child_id();
  result jsonb;
begin
  if child_id_value is null then raise exception 'Child access is not authorized'; end if;

  select jsonb_build_object(
    'child', jsonb_build_object('id', child.id, 'preferredName', child.preferred_name),
    'currentAttempt', (
      select jsonb_build_object(
        'id', attempt.id,
        'lessonId', attempt.lesson_artifact_id,
        'status', attempt.status,
        'currentBlockIndex', attempt.current_block_index,
        'breakCount', attempt.break_count
      )
      from public.lesson_attempts attempt
      join public.generated_artifacts lesson on lesson.id = attempt.lesson_artifact_id
      where attempt.child_id = child_id_value
        and attempt.status in ('in_progress', 'paused')
        and lesson.status = 'approved'
      order by attempt.last_activity_at desc limit 1
    ),
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', lesson.id,
        'kind', lesson.kind,
        'version', lesson.version,
        'dayNumber', lesson.day_number,
        'content', lesson.content
      ) order by lesson.day_number, lesson.created_at)
      from public.generated_artifacts lesson
      where lesson.status = 'approved'
        and lesson.kind in ('daily_lesson', 'review_lesson')
        and not exists (
          select 1 from public.lesson_attempts done
          where done.child_id = child_id_value
            and done.lesson_artifact_id = lesson.id
            and done.status = 'completed'
        )
    ), '[]'::jsonb)
  ) into result
  from public.child_profiles child where child.id = child_id_value;

  return result;
end;
$$;

create or replace function public.start_child_lesson(p_lesson_id uuid)
returns public.lesson_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_id_value uuid := private.current_child_id();
  attempt public.lesson_attempts;
begin
  if child_id_value is null then raise exception 'Child access is not authorized'; end if;
  if not exists (
    select 1 from public.generated_artifacts lesson
    where lesson.id = p_lesson_id and lesson.status = 'approved'
      and lesson.kind in ('daily_lesson', 'review_lesson')
  ) then raise exception 'Approved lesson is not available'; end if;

  select * into attempt from public.lesson_attempts
  where child_id = child_id_value and lesson_artifact_id = p_lesson_id;
  if attempt.id is not null then
    if attempt.status = 'paused' then
      update public.lesson_attempts set status = 'in_progress', last_activity_at = now()
      where id = attempt.id returning * into attempt;
    end if;
    return attempt;
  end if;

  insert into public.lesson_attempts (child_id, lesson_artifact_id, status)
  values (child_id_value, p_lesson_id, 'in_progress') returning * into attempt;
  return attempt;
end;
$$;

create or replace function public.get_child_lesson_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', attempt.id, 'status', attempt.status,
      'currentBlockIndex', attempt.current_block_index,
      'breakCount', attempt.break_count, 'playerState', attempt.player_state
    ),
    'lesson', jsonb_build_object(
      'id', lesson.id, 'kind', lesson.kind, 'version', lesson.version,
      'dayNumber', lesson.day_number, 'content', lesson.content
    )
  ) into result
  from public.lesson_attempts attempt
  join public.generated_artifacts lesson on lesson.id = attempt.lesson_artifact_id
  where attempt.id = p_attempt_id
    and attempt.child_id = private.current_child_id()
    and lesson.status = 'approved';
  if result is null then raise exception 'Lesson attempt is not available'; end if;
  return result;
end;
$$;

create or replace function public.save_child_lesson_progress(
  p_attempt_id uuid,
  p_block_index integer,
  p_status text,
  p_break_count integer,
  p_player_state jsonb
)
returns public.lesson_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare attempt public.lesson_attempts;
begin
  if p_block_index < 0 or p_status not in ('in_progress', 'paused') or p_break_count < 0 then
    raise exception 'Invalid lesson progress';
  end if;
  update public.lesson_attempts set
    current_block_index = p_block_index,
    status = p_status,
    break_count = p_break_count,
    player_state = coalesce(p_player_state, '{}'::jsonb),
    last_activity_at = now()
  where id = p_attempt_id and child_id = private.current_child_id()
    and status in ('in_progress', 'paused')
  returning * into attempt;
  if attempt.id is null then raise exception 'Lesson attempt is not available'; end if;
  return attempt;
end;
$$;

create or replace function public.record_child_activity_evidence(
  p_client_event_id uuid,
  p_attempt_id uuid,
  p_block_id text,
  p_target_id uuid,
  p_evidence_type text,
  p_first_attempt boolean,
  p_support_level text,
  p_correct boolean,
  p_response_latency_ms integer,
  p_retry_count integer,
  p_metadata jsonb
)
returns public.activity_evidence
language plpgsql
security definer
set search_path = ''
as $$
declare
  evidence public.activity_evidence;
  block jsonb;
begin
  select block_value into block
  from public.lesson_attempts attempt
  join public.generated_artifacts lesson on lesson.id = attempt.lesson_artifact_id,
    lateral jsonb_array_elements(lesson.content -> 'blocks') block_value
  where attempt.id = p_attempt_id and attempt.child_id = private.current_child_id()
    and lesson.status = 'approved' and block_value ->> 'id' = p_block_id;
  if block is null then raise exception 'Activity is not available'; end if;
  if p_target_id is not null and not ((block -> 'targetIds') ? p_target_id::text) then
    raise exception 'Target is not available for this activity';
  end if;
  if p_evidence_type not in ('recognition','comprehension','supported_use','independent_use','selection','phonemic_awareness','letter_work') then
    raise exception 'Evidence type is not supported';
  end if;
  if p_support_level not in ('independent','replay','prompted','reduced_choices','modeled') then
    raise exception 'Support level is not supported';
  end if;

  insert into public.activity_evidence (
    client_event_id, attempt_id, block_id, target_type, target_id, evidence_type,
    first_attempt, support_level, correct, response_latency_ms, retry_count, metadata
  ) values (
    p_client_event_id, p_attempt_id, p_block_id, coalesce(block ->> 'type', 'activity'),
    p_target_id, p_evidence_type, p_first_attempt, p_support_level, p_correct,
    p_response_latency_ms, p_retry_count, coalesce(p_metadata, '{}'::jsonb)
  ) on conflict (client_event_id) do update set client_event_id = excluded.client_event_id
  returning * into evidence;
  return evidence;
end;
$$;

create or replace function public.complete_child_lesson(p_attempt_id uuid)
returns public.lesson_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare attempt public.lesson_attempts;
begin
  if exists (
    select 1 from public.lesson_attempts a
    join public.generated_artifacts lesson on lesson.id = a.lesson_artifact_id,
      lateral jsonb_array_elements(lesson.content -> 'blocks') block_value
    where a.id = p_attempt_id and a.child_id = private.current_child_id()
      and block_value ->> 'type' = 'exit_check'
      and not exists (
        select 1 from public.activity_evidence e
        where e.attempt_id = a.id and e.block_id = block_value ->> 'id'
      )
  ) then raise exception 'Exit evidence is required'; end if;

  update public.lesson_attempts set status = 'completed', completed_at = now(), last_activity_at = now()
  where id = p_attempt_id and child_id = private.current_child_id()
    and status in ('in_progress', 'paused') returning * into attempt;
  if attempt.id is null then raise exception 'Lesson attempt is not available'; end if;
  return attempt;
end;
$$;

revoke all on function public.get_child_lesson_home() from public, anon;
revoke all on function public.start_child_lesson(uuid) from public, anon;
revoke all on function public.get_child_lesson_attempt(uuid) from public, anon;
revoke all on function public.save_child_lesson_progress(uuid, integer, text, integer, jsonb) from public, anon;
revoke all on function public.record_child_activity_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, jsonb) from public, anon;
revoke all on function public.complete_child_lesson(uuid) from public, anon;
grant execute on function public.get_child_lesson_home() to authenticated;
grant execute on function public.start_child_lesson(uuid) to authenticated;
grant execute on function public.get_child_lesson_attempt(uuid) to authenticated;
grant execute on function public.save_child_lesson_progress(uuid, integer, text, integer, jsonb) to authenticated;
grant execute on function public.record_child_activity_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, jsonb) to authenticated;
grant execute on function public.complete_child_lesson(uuid) to authenticated;

create unique index activity_evidence_first_attempt_unique
  on public.activity_evidence (attempt_id, block_id) where first_attempt;
create index lesson_attempts_child_activity_idx
  on public.lesson_attempts (child_id, last_activity_at desc);

comment on function public.get_child_lesson_home() is 'Returns only the authenticated child profile and approved lesson metadata/content.';
comment on function public.record_child_activity_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, jsonb) is 'Validates attempt, approved artifact, block, and target scope before recording evidence.';
