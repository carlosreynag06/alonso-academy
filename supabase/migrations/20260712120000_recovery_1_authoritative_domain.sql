begin;

-- Recovery 1 is deliberately fail closed. Existing approvals are preserved, but
-- child visibility now requires an explicit published assignment.

create type public.learning_week_status as enum ('planned', 'active', 'completed', 'archived');
create type public.lesson_assignment_status as enum (
  'assigned', 'scheduled', 'published', 'completed', 'withdrawn', 'replaced', 'archived', 'quarantined'
);
create type public.lesson_attempt_mode as enum ('learning', 'replay', 'scheduled_retrieval');
create type public.attempt_block_status as enum ('pending', 'active', 'completed');
create type public.evidence_authority_status as enum (
  'legacy_client_asserted', 'server_derived', 'provider_derived'
);

create table public.learning_weeks (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete restrict,
  curriculum_unit_id uuid not null references public.curriculum_units(id) on delete restrict,
  weekly_plan_artifact_id uuid not null unique references public.generated_artifacts(id) on delete restrict,
  status public.learning_week_status not null default 'planned',
  starts_on date,
  timezone text not null default 'America/New_York',
  created_by uuid not null references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_week_archive_consistent check (
    (status = 'archived' and archived_at is not null and archived_by is not null and length(trim(coalesce(archive_reason, ''))) >= 5)
    or (status <> 'archived' and archived_at is null and archived_by is null and archive_reason is null)
  )
);

create table public.week_day_slots (
  id uuid primary key default gen_random_uuid(),
  learning_week_id uuid not null references public.learning_weeks(id) on delete restrict,
  weekly_plan_artifact_id uuid not null references public.generated_artifacts(id) on delete restrict,
  day_number smallint not null check (day_number between 1 and 5),
  title text not null,
  objective text not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 45),
  lesson_kind public.artifact_kind not null check (lesson_kind in ('daily_lesson', 'review_lesson', 'story_lesson')),
  target_ids text[] not null,
  review_target_ids text[] not null default '{}'::text[],
  target_set_hash text not null,
  created_at timestamptz not null default now(),
  unique (learning_week_id, day_number),
  unique (id, weekly_plan_artifact_id, day_number, lesson_kind),
  constraint week_day_has_targets check (cardinality(target_ids) > 0)
);

create table public.week_day_targets (
  week_day_slot_id uuid not null references public.week_day_slots(id) on delete restrict,
  target_type text not null check (target_type in ('vocabulary', 'sentence_frame', 'phonics', 'writing')),
  target_id uuid not null,
  role text not null check (role in ('new', 'review')),
  created_at timestamptz not null default now(),
  primary key (week_day_slot_id, target_type, target_id)
);

create or replace function private.assert_week_has_five_slots()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  week_id_value uuid;
  slot_count integer;
  distinct_days integer;
begin
  if tg_table_name = 'learning_weeks' then
    week_id_value := new.id;
  else
    week_id_value := coalesce(new.learning_week_id, old.learning_week_id);
  end if;

  if not exists (select 1 from public.learning_weeks where id = week_id_value) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select count(*), count(distinct day_number)
  into slot_count, distinct_days
  from public.week_day_slots
  where learning_week_id = week_id_value;

  if slot_count <> 5 or distinct_days <> 5 then
    raise exception 'A learning week must contain exactly five distinct day slots';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create constraint trigger learning_week_five_slots_from_week
after insert or update on public.learning_weeks
deferrable initially deferred
for each row execute function private.assert_week_has_five_slots();

create constraint trigger learning_week_five_slots_from_slot
after insert or update or delete on public.week_day_slots
deferrable initially deferred
for each row execute function private.assert_week_has_five_slots();

alter table public.generated_artifacts
  add column week_day_slot_id uuid references public.week_day_slots(id) on delete restrict,
  add column binding_status text not null default 'not_applicable'
    check (binding_status in ('not_applicable', 'unverified', 'valid', 'invalid')),
  add column binding_report jsonb not null default '{}'::jsonb,
  add column binding_validated_at timestamptz,
  add column runtime_ready boolean not null default false,
  add column runtime_report jsonb not null default '{}'::jsonb;

alter table public.generated_artifacts
  add constraint generated_artifacts_id_slot_unique unique (id, week_day_slot_id);

create table private.lesson_runtime_blocks (
  lesson_artifact_id uuid not null references public.generated_artifacts(id) on delete cascade,
  block_id text not null,
  block_index integer not null check (block_index >= 0),
  block_type text not null,
  target_ids text[] not null default '{}'::text[],
  presentation jsonb not null,
  answer_rule jsonb not null default '{}'::jsonb,
  required boolean not null default true,
  scored boolean not null default false,
  exit_required boolean not null default false,
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (lesson_artifact_id, block_id),
  unique (lesson_artifact_id, block_index)
);

revoke all on table private.lesson_runtime_blocks from public, anon, authenticated;

create or replace function private.normalized_text(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function private.artifact_snapshot_is_current(p_artifact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.generated_artifacts artifact
    join public.curriculum_units unit on unit.id = artifact.curriculum_unit_id
    where artifact.id = p_artifact_id and unit.status = 'approved'
      and artifact.curriculum_snapshot ->> 'unitVersion' = unit.version::text
      and artifact.curriculum_snapshot ->> 'approvedAt' = to_jsonb(unit.approved_at) #>> '{}'
  );
$$;

create or replace function private.target_exists_for_unit(
  unit_id_value uuid,
  target_type_value text,
  target_id_value uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  case target_type_value
    when 'vocabulary' then
      return exists (select 1 from public.vocabulary_items where id = target_id_value and unit_id = unit_id_value and status = 'approved');
    when 'sentence_frame' then
      return exists (select 1 from public.sentence_frames where id = target_id_value and unit_id = unit_id_value and status = 'approved');
    when 'phonics' then
      return exists (select 1 from public.phonics_targets where id = target_id_value and unit_id = unit_id_value and status = 'approved');
    when 'writing' then
      return exists (select 1 from public.writing_targets where id = target_id_value and unit_id = unit_id_value and status = 'approved');
    else
      return false;
  end case;
end;
$$;

create or replace function private.validate_week_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  unit_id_value uuid;
begin
  select week.curriculum_unit_id into unit_id_value
  from public.week_day_slots day
  join public.learning_weeks week on week.id = day.learning_week_id
  where day.id = new.week_day_slot_id;
  if unit_id_value is null or not private.target_exists_for_unit(unit_id_value, new.target_type, new.target_id) then
    raise exception 'Week target is not an approved target in this curriculum unit';
  end if;
  return new;
end;
$$;

create trigger week_day_target_scope
before insert or update on public.week_day_targets
for each row execute function private.validate_week_target();

create or replace function private.validate_lesson_binding(p_artifact_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  artifact public.generated_artifacts;
  day public.week_day_slots;
  actual_targets text[];
  planned_targets text[];
  issues jsonb := '[]'::jsonb;
begin
  select * into artifact from public.generated_artifacts where id = p_artifact_id for update;
  if artifact.id is null or artifact.kind not in ('daily_lesson', 'review_lesson', 'story_lesson') then
    return false;
  end if;
  select * into day from public.week_day_slots where id = artifact.week_day_slot_id;
  if day.id is null then
    issues := issues || jsonb_build_array('missing_week_day_slot');
  else
    if artifact.parent_artifact_id is distinct from day.weekly_plan_artifact_id then issues := issues || jsonb_build_array('weekly_plan_mismatch'); end if;
    if artifact.day_number is distinct from day.day_number then issues := issues || jsonb_build_array('day_mismatch'); end if;
    if artifact.kind is distinct from day.lesson_kind then issues := issues || jsonb_build_array('lesson_kind_mismatch'); end if;
    if artifact.content ->> 'weeklyPlanId' is distinct from day.weekly_plan_artifact_id::text then issues := issues || jsonb_build_array('content_weekly_plan_mismatch'); end if;
    if nullif(artifact.content ->> 'day', '')::smallint is distinct from day.day_number then issues := issues || jsonb_build_array('content_day_mismatch'); end if;
    if artifact.content ->> 'objective' is distinct from day.objective then issues := issues || jsonb_build_array('objective_mismatch'); end if;

    select coalesce(array_agg(value order by value), '{}'::text[]) into actual_targets
    from jsonb_array_elements_text(coalesce(artifact.content -> 'targetIds', '[]'::jsonb)) value;
    select coalesce(array_agg(value order by value), '{}'::text[]) into planned_targets
    from unnest(day.target_ids || day.review_target_ids) value;
    if actual_targets is distinct from planned_targets then issues := issues || jsonb_build_array('target_set_mismatch'); end if;
  end if;

  update public.generated_artifacts
  set binding_status = case when jsonb_array_length(issues) = 0 then 'valid' else 'invalid' end,
      binding_report = jsonb_build_object('issues', issues),
      binding_validated_at = now(),
      runtime_ready = false,
      runtime_report = '{}'::jsonb
  where id = p_artifact_id;
  return jsonb_array_length(issues) = 0;
exception when others then
  update public.generated_artifacts
  set binding_status = 'invalid',
      binding_report = jsonb_build_object('issues', jsonb_build_array('binding_validation_error')),
      binding_validated_at = now(), runtime_ready = false
  where id = p_artifact_id;
  return false;
end;
$$;

create or replace function private.prepare_lesson_runtime(p_artifact_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  artifact public.generated_artifacts;
  block_value jsonb;
  ordinal_value bigint;
  block_kind text;
  block_identifier text;
  rule jsonb;
  base_presentation jsonb;
  option_list jsonb;
  correct_key text;
  distractor_label text;
  is_scored boolean;
  is_exit boolean;
  trigger_attempts smallint;
  inserted_count integer := 0;
  exit_count integer := 0;
begin
  select * into artifact from public.generated_artifacts where id = p_artifact_id for update;
  delete from private.lesson_runtime_blocks where lesson_artifact_id = p_artifact_id;
  if artifact.id is null or artifact.binding_status <> 'valid'
     or artifact.kind not in ('daily_lesson', 'review_lesson')
     or jsonb_typeof(artifact.content -> 'blocks') <> 'array'
     or jsonb_array_length(artifact.content -> 'blocks') = 0 then
    update public.generated_artifacts set runtime_ready = false,
      runtime_report = jsonb_build_object('issues', jsonb_build_array('unsupported_or_unbound_lesson'))
    where id = p_artifact_id;
    return false;
  end if;

  trigger_attempts := least(10, greatest(1, coalesce((artifact.content #>> '{remediation,triggerAfterIncorrectAttempts}')::smallint + 1, 3)));
  for block_value, ordinal_value in
    select value, ordinality from jsonb_array_elements(artifact.content -> 'blocks') with ordinality
  loop
    block_kind := block_value ->> 'type';
    block_identifier := nullif(block_value ->> 'id', '');
    if block_identifier is null or block_kind not in (
      'model_audio', 'listen_select', 'picture_action_select', 'phonemic_awareness',
      'letter_work', 'movement_break', 'exit_check'
    ) then
      raise exception 'Unsupported lesson block';
    end if;
    if exists (
      select 1
      from jsonb_array_elements_text(coalesce(block_value -> 'targetIds', '[]'::jsonb)) block_target(value)
      where not exists (
        select 1 from public.week_day_slots day
        where day.id = artifact.week_day_slot_id
          and block_target.value = any(day.target_ids || day.review_target_ids)
      )
    ) then
      raise exception 'Lesson block contains a target outside its bound day';
    end if;

    base_presentation := jsonb_build_object(
      'id', block_identifier,
      'type', block_kind,
      'estimatedSeconds', coalesce((block_value ->> 'estimatedSeconds')::integer, 0),
      'instruction', block_value ->> 'instruction'
    );
    option_list := '[]'::jsonb;
    is_scored := block_kind in ('listen_select', 'picture_action_select', 'phonemic_awareness', 'letter_work', 'exit_check');
    is_exit := block_kind = 'exit_check';
    if block_kind = 'model_audio' then
      base_presentation := base_presentation || jsonb_build_object(
        'modelText', block_value ->> 'modelText',
        'replayAllowed', coalesce((block_value ->> 'replayAllowed')::boolean, false)
      );
      rule := jsonb_build_object('kind', 'acknowledgement');
    elsif block_kind = 'listen_select' then
      if nullif(block_value ->> 'correctIndex', '') is null then raise exception 'Choice block has no answer'; end if;
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', block_identifier || '-option-' || option_number,
        'label', option_label
      ) order by option_number), '[]'::jsonb) into option_list
      from jsonb_array_elements_text(block_value -> 'options') with ordinality as option_value(option_label, option_number);
      if (block_value ->> 'correctIndex')::integer < 0
         or (block_value ->> 'correctIndex')::integer >= jsonb_array_length(option_list) then
        raise exception 'Choice block answer index is out of range';
      end if;
      correct_key := block_identifier || '-option-' || ((block_value ->> 'correctIndex')::integer + 1);
      base_presentation := base_presentation || jsonb_build_object('promptText', block_value ->> 'promptText', 'options', option_list);
      rule := jsonb_build_object('kind', 'choice_key', 'correctOptionKey', correct_key);
    elsif block_kind = 'picture_action_select' then
      if nullif(block_value ->> 'correctIndex', '') is null then raise exception 'Choice block has no answer'; end if;
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', block_identifier || '-option-' || option_number,
        'label', option_label
      ) order by option_number), '[]'::jsonb) into option_list
      from jsonb_array_elements_text(block_value -> 'optionLabels') with ordinality as option_value(option_label, option_number);
      if (block_value ->> 'correctIndex')::integer < 0
         or (block_value ->> 'correctIndex')::integer >= jsonb_array_length(option_list) then
        raise exception 'Choice block answer index is out of range';
      end if;
      correct_key := block_identifier || '-option-' || ((block_value ->> 'correctIndex')::integer + 1);
      base_presentation := base_presentation || jsonb_build_object('promptText', block_value ->> 'promptText', 'options', option_list);
      rule := jsonb_build_object('kind', 'choice_key', 'correctOptionKey', correct_key);
    elsif block_kind in ('phonemic_awareness', 'exit_check') then
      if jsonb_typeof(block_value -> 'acceptableResponses') <> 'array' or jsonb_array_length(block_value -> 'acceptableResponses') = 0 then
        raise exception 'Response block has no accepted response';
      end if;
      select coalesce(jsonb_agg(jsonb_build_object(
        'key', block_identifier || '-response-' || option_number,
        'label', option_label
      ) order by option_number), '[]'::jsonb) into option_list
      from jsonb_array_elements_text(block_value -> 'acceptableResponses') with ordinality as option_value(option_label, option_number);
      if block_kind = 'phonemic_awareness' then
        base_presentation := base_presentation || jsonb_build_object(
          'promptText', block_value ->> 'promptText',
          'responseMode', block_value ->> 'responseMode',
          'responseOptions', option_list
        );
      else
        base_presentation := base_presentation || jsonb_build_object(
          'promptText', block_value ->> 'promptText',
          'responseOptions', option_list
        );
      end if;
      rule := jsonb_build_object(
        'kind', 'acceptable_responses',
        'values', block_value -> 'acceptableResponses',
        'acceptedOptionKeys', (select coalesce(jsonb_agg(value -> 'key'), '[]'::jsonb) from jsonb_array_elements(option_list) value),
        'evidenceType', coalesce(block_value ->> 'evidenceType', 'phonemic_awareness')
      );
    elsif block_kind = 'letter_work' then
      distractor_label := case when lower(block_value ->> 'grapheme') = 'm' then 's' else 'm' end;
      option_list := jsonb_build_array(
        jsonb_build_object('key', block_identifier || '-option-1', 'label', block_value ->> 'grapheme'),
        jsonb_build_object('key', block_identifier || '-option-2', 'label', distractor_label)
      );
      base_presentation := base_presentation || jsonb_build_object(
        'grapheme', block_value ->> 'grapheme',
        'demand', block_value ->> 'demand',
        'modelText', block_value ->> 'modelText',
        'options', option_list
      );
      rule := jsonb_build_object('kind', 'choice_key', 'correctOptionKey', block_identifier || '-option-1');
    elsif block_kind = 'movement_break' then
      base_presentation := base_presentation || jsonb_build_object('movement', block_value ->> 'movement');
      rule := jsonb_build_object('kind', 'acknowledgement');
    else
      rule := jsonb_build_object('kind', 'acknowledgement');
    end if;

    insert into private.lesson_runtime_blocks (
      lesson_artifact_id, block_id, block_index, block_type, target_ids,
      presentation, answer_rule, required, scored, exit_required, max_attempts
    ) values (
      p_artifact_id, block_identifier, ordinal_value - 1, block_kind,
      coalesce(array(select jsonb_array_elements_text(coalesce(block_value -> 'targetIds', '[]'::jsonb))), '{}'::text[]),
      base_presentation, rule, true, is_scored, is_exit, trigger_attempts
    );
    inserted_count := inserted_count + 1;
    if is_exit then exit_count := exit_count + 1; end if;
  end loop;

  if exit_count = 0 then raise exception 'Lesson has no exit check'; end if;
  update public.generated_artifacts
  set runtime_ready = true,
      runtime_report = jsonb_build_object('blockCount', inserted_count, 'exitCount', exit_count, 'runtimeVersion', 'recovery1-v1')
  where id = p_artifact_id;
  return true;
exception when others then
  delete from private.lesson_runtime_blocks where lesson_artifact_id = p_artifact_id;
  update public.generated_artifacts
  set runtime_ready = false,
      runtime_report = jsonb_build_object('issues', jsonb_build_array('runtime_preparation_failed'))
  where id = p_artifact_id;
  return false;
end;
$$;

create or replace function private.child_safe_lesson(p_artifact_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'artifactId', artifact.id,
    'day', artifact.day_number,
    'title', artifact.content ->> 'title',
    'objective', artifact.content ->> 'objective',
    'durationMinutes', (artifact.content ->> 'durationMinutes')::integer,
    'blocks', coalesce((
      select jsonb_agg(block.presentation order by block.block_index)
      from private.lesson_runtime_blocks block
      where block.lesson_artifact_id = artifact.id
    ), '[]'::jsonb),
    'remediation', jsonb_build_object(
      'scaffoldInstruction', artifact.content #>> '{remediation,scaffoldInstruction}'
    )
  )
  from public.generated_artifacts artifact
  where artifact.id = p_artifact_id and artifact.binding_status = 'valid' and artifact.runtime_ready;
$$;

revoke all on function private.normalized_text(text) from public, anon, authenticated;
revoke all on function private.artifact_snapshot_is_current(uuid) from public, anon, authenticated;
revoke all on function private.target_exists_for_unit(uuid, text, uuid) from public, anon, authenticated;
revoke all on function private.validate_lesson_binding(uuid) from public, anon, authenticated;
revoke all on function private.prepare_lesson_runtime(uuid) from public, anon, authenticated;
revoke all on function private.child_safe_lesson(uuid) from public, anon, authenticated;

create table public.lesson_assignments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete restrict,
  week_day_slot_id uuid not null references public.week_day_slots(id) on delete restrict,
  lesson_artifact_id uuid not null,
  status public.lesson_assignment_status not null default 'assigned',
  primary_attempt_mode public.lesson_attempt_mode not null default 'learning'
    check (primary_attempt_mode in ('learning', 'scheduled_retrieval')),
  replay_allowed boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  published_at timestamptz,
  published_by uuid references auth.users(id),
  completed_at timestamptz,
  withdrawn_at timestamptz,
  withdrawn_by uuid references auth.users(id),
  withdrawal_reason text,
  superseded_by_assignment_id uuid,
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archive_reason text,
  quarantine_reason text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  state_version bigint not null default 0 check (state_version >= 0),
  foreign key (lesson_artifact_id, week_day_slot_id)
    references public.generated_artifacts(id, week_day_slot_id) on delete restrict,
  foreign key (superseded_by_assignment_id)
    references public.lesson_assignments(id) deferrable initially deferred,
  constraint lesson_assignment_window check (available_until is null or available_from is null or available_until > available_from),
  constraint lesson_assignment_state_consistent check (
    (status = 'assigned' and published_at is null and completed_at is null and withdrawn_at is null and superseded_by_assignment_id is null and archived_at is null)
    or (status = 'scheduled' and available_from is not null and published_at is null and completed_at is null and withdrawn_at is null and superseded_by_assignment_id is null and archived_at is null)
    or (status = 'published' and published_at is not null and published_by is not null and completed_at is null and withdrawn_at is null and superseded_by_assignment_id is null and archived_at is null)
    or (status = 'completed' and published_at is not null and completed_at is not null and withdrawn_at is null and superseded_by_assignment_id is null and archived_at is null)
    or (status = 'withdrawn' and withdrawn_at is not null and withdrawn_by is not null and length(trim(coalesce(withdrawal_reason, ''))) >= 5 and superseded_by_assignment_id is null and archived_at is null)
    or (status = 'replaced' and superseded_by_assignment_id is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null and archived_by is not null and length(trim(coalesce(archive_reason, ''))) >= 5)
    or (status = 'quarantined' and length(trim(coalesce(quarantine_reason, ''))) >= 5)
  )
);

create unique index lesson_assignments_one_active_slot
  on public.lesson_assignments (child_id, week_day_slot_id)
  where status in ('assigned', 'scheduled', 'published');

create unique index lesson_assignments_one_published_mission
  on public.lesson_assignments (child_id)
  where status = 'published';

create index lesson_assignments_child_schedule
  on public.lesson_assignments (child_id, status, available_from, available_until);

alter table public.lesson_attempts
  add column assignment_id uuid references public.lesson_assignments(id) on delete restrict,
  add column mode public.lesson_attempt_mode not null default 'learning',
  add column attempt_sequence integer not null default 1 check (attempt_sequence > 0),
  add column current_block_id text,
  add column state_version bigint not null default 0 check (state_version >= 0),
  add column paused_at timestamptz,
  add column abandoned_at timestamptz,
  add column legacy_quarantined boolean not null default false,
  add column quarantine_reason text,
  add constraint lesson_attempt_assignment_required check (legacy_quarantined or assignment_id is not null) not valid,
  add constraint lesson_attempt_quarantine_consistent check (
    (legacy_quarantined and length(trim(coalesce(quarantine_reason, ''))) >= 5)
    or (not legacy_quarantined and quarantine_reason is null)
  );

alter table public.lesson_attempts drop constraint lesson_attempts_one_per_lesson;

create unique index lesson_attempts_one_learning_attempt
  on public.lesson_attempts (assignment_id)
  where mode = 'learning' and not legacy_quarantined;

create unique index lesson_attempts_assignment_mode_sequence
  on public.lesson_attempts (assignment_id, mode, attempt_sequence)
  where assignment_id is not null;

create unique index lesson_attempts_one_open_mode
  on public.lesson_attempts (assignment_id, mode)
  where status in ('in_progress', 'paused') and not legacy_quarantined;

create table public.lesson_attempt_block_states (
  attempt_id uuid not null references public.lesson_attempts(id) on delete cascade,
  block_id text not null,
  block_index integer not null check (block_index >= 0),
  status public.attempt_block_status not null default 'pending',
  response_count integer not null default 0 check (response_count >= 0),
  listen_count integer not null default 0 check (listen_count >= 0),
  replay_count integer not null default 0 check (replay_count >= 0),
  support_level text not null default 'independent'
    check (support_level in ('independent', 'replay', 'prompted', 'reduced_choices', 'modeled')),
  first_presented_at timestamptz,
  completed_at timestamptz,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (attempt_id, block_id),
  unique (attempt_id, block_index),
  constraint attempt_block_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.lesson_response_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  attempt_id uuid not null references public.lesson_attempts(id) on delete cascade,
  block_id text not null,
  response_ordinal integer not null check (response_ordinal > 0),
  response_kind text not null check (response_kind in ('choice', 'text', 'speech')),
  response jsonb not null default '{}'::jsonb,
  correct boolean,
  outcome text not null check (outcome in ('correct', 'incorrect', 'silence', 'provider_unavailable')),
  first_attempt boolean not null,
  support_level text not null check (support_level in ('independent', 'replay', 'prompted', 'reduced_choices', 'modeled')),
  retry_count integer not null check (retry_count >= 0),
  response_latency_ms integer check (response_latency_ms is null or response_latency_ms >= 0),
  transcript text,
  provider_confidence numeric check (provider_confidence is null or provider_confidence between 0 and 1),
  provider_model text,
  authority public.evidence_authority_status not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, block_id, response_ordinal)
);

create table public.lesson_attempt_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  attempt_id uuid not null references public.lesson_attempts(id) on delete cascade,
  block_id text,
  command text not null check (command in (
    'start', 'pause', 'resume', 'start_break', 'end_break', 'record_listen',
    'request_hint', 'acknowledge', 'retry', 'advance', 'submit_response', 'complete'
  )),
  state_version_before bigint not null,
  state_version_after bigint not null,
  safe_payload jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.activity_evidence
  add column response_event_id uuid references public.lesson_response_events(id) on delete restrict,
  add column attempt_mode public.lesson_attempt_mode,
  add column authority public.evidence_authority_status not null default 'legacy_client_asserted',
  add column rule_version text,
  add column qualifies_for_completion boolean not null default false;

drop index if exists public.activity_evidence_first_attempt_unique;

create unique index activity_evidence_response_target_unique
  on public.activity_evidence (response_event_id, coalesce(target_id, '00000000-0000-0000-0000-000000000000'::uuid), evidence_type)
  where response_event_id is not null;

create index lesson_attempt_blocks_order on public.lesson_attempt_block_states (attempt_id, block_index);
create index lesson_responses_attempt_block on public.lesson_response_events (attempt_id, block_id, response_ordinal);
create index activity_evidence_authority on public.activity_evidence (authority, attempt_id, created_at);

create trigger learning_weeks_updated_at before update on public.learning_weeks
for each row execute function private.set_updated_at();
create trigger lesson_assignments_updated_at before update on public.lesson_assignments
for each row execute function private.set_updated_at();

create or replace function private.write_recovery_audit(
  event_type_value text,
  entity_type_value text,
  entity_id_value text,
  details_value jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, safe_details)
  values ((select auth.uid()), event_type_value, entity_type_value, entity_id_value, coalesce(details_value, '{}'::jsonb));
end;
$$;

create or replace function private.require_parent()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare actor_id_value uuid := (select auth.uid());
begin
  if actor_id_value is null or not private.is_parent() then raise exception 'Parent access is not authorized'; end if;
  return actor_id_value;
end;
$$;

revoke all on function private.write_recovery_audit(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function private.require_parent() from public, anon, authenticated;

create or replace function public.create_learning_week_from_plan(
  p_weekly_plan_artifact_id uuid,
  p_child_id uuid,
  p_starts_on date,
  p_timezone text,
  p_note text
)
returns public.learning_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  plan public.generated_artifacts;
  created_week public.learning_weeks;
  day_value jsonb;
  created_day public.week_day_slots;
  target_value text;
  target_record jsonb;
  role_value text;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'A decision note is required'; end if;
  if not exists (select 1 from public.child_profiles where id = p_child_id) then raise exception 'Child is not available'; end if;
  select * into plan from public.generated_artifacts where id = p_weekly_plan_artifact_id for update;
  if plan.id is null or plan.kind <> 'weekly_plan' or plan.status <> 'approved'
     or not private.artifact_snapshot_is_current(plan.id) then
    raise exception 'An approved weekly plan is required';
  end if;
  if jsonb_typeof(plan.content -> 'days') <> 'array'
     or jsonb_array_length(plan.content -> 'days') <> 5
     or (select count(distinct (value ->> 'day')::integer) from jsonb_array_elements(plan.content -> 'days')) <> 5
     or exists (select 1 from jsonb_array_elements(plan.content -> 'days') value where (value ->> 'day')::integer not between 1 and 5) then
    raise exception 'The approved weekly plan must contain exactly days 1 through 5';
  end if;

  insert into public.learning_weeks (
    child_id, curriculum_unit_id, weekly_plan_artifact_id, starts_on, timezone, created_by
  ) values (
    p_child_id, plan.curriculum_unit_id, plan.id, p_starts_on,
    coalesce(nullif(trim(p_timezone), ''), 'America/New_York'), actor_id_value
  ) returning * into created_week;

  for day_value in select value from jsonb_array_elements(plan.content -> 'days') order by (value ->> 'day')::integer
  loop
    insert into public.week_day_slots (
      learning_week_id, weekly_plan_artifact_id, day_number, title, objective,
      duration_minutes, lesson_kind, target_ids, review_target_ids, target_set_hash
    ) values (
      created_week.id, plan.id, (day_value ->> 'day')::smallint,
      day_value ->> 'title', day_value ->> 'objective', (day_value ->> 'durationMinutes')::smallint,
      (day_value ->> 'lessonKind')::public.artifact_kind,
      array(select jsonb_array_elements_text(coalesce(day_value -> 'targetIds', '[]'::jsonb)) order by 1),
      array(select jsonb_array_elements_text(coalesce(day_value -> 'reviewTargetIds', '[]'::jsonb)) order by 1),
      md5(coalesce((
        select string_agg(value, ',' order by value)
        from jsonb_array_elements_text(
          coalesce(day_value -> 'targetIds', '[]'::jsonb) || coalesce(day_value -> 'reviewTargetIds', '[]'::jsonb)
        ) value
      ), ''))
    ) returning * into created_day;

    for target_value, role_value in
      select value, 'new' from jsonb_array_elements_text(coalesce(day_value -> 'targetIds', '[]'::jsonb))
      union all
      select value, 'review' from jsonb_array_elements_text(coalesce(day_value -> 'reviewTargetIds', '[]'::jsonb))
    loop
      select value into target_record
      from jsonb_array_elements(coalesce(plan.curriculum_snapshot -> 'targets', '[]'::jsonb)) value
      where value ->> 'id' = target_value limit 1;
      if target_record is null then raise exception 'A planned target is missing from the approved snapshot'; end if;
      insert into public.week_day_targets (week_day_slot_id, target_type, target_id, role)
      values (created_day.id, target_record ->> 'kind', target_value::uuid, role_value)
      on conflict (week_day_slot_id, target_type, target_id) do nothing;
    end loop;
  end loop;

  perform private.write_recovery_audit('learning_week.created', 'learning_week', created_week.id::text,
    jsonb_build_object('weeklyPlanArtifactId', plan.id, 'note', trim(p_note)));
  return created_week;
end;
$$;

create or replace function public.schedule_lesson_assignment(
  p_week_day_slot_id uuid,
  p_lesson_artifact_id uuid,
  p_available_from timestamptz,
  p_available_until timestamptz,
  p_note text
)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  lesson public.generated_artifacts;
  day public.week_day_slots;
  week public.learning_weeks;
  assignment public.lesson_assignments;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'A decision note is required'; end if;
  if p_available_from is null or (p_available_until is not null and p_available_until <= p_available_from) then
    raise exception 'A valid schedule window is required';
  end if;
  select * into lesson from public.generated_artifacts where id = p_lesson_artifact_id for update;
  select * into day from public.week_day_slots where id = p_week_day_slot_id for update;
  select * into week from public.learning_weeks where id = day.learning_week_id for update;
  if lesson.id is null or day.id is null or week.id is null
     or lesson.status <> 'approved' or lesson.binding_status <> 'valid' or not lesson.runtime_ready
     or lesson.week_day_slot_id <> day.id
     or week.status not in ('planned', 'active')
     or not exists (
       select 1
       from public.generated_artifacts plan
       join public.curriculum_units unit on unit.id = plan.curriculum_unit_id
       where plan.id = day.weekly_plan_artifact_id and plan.status = 'approved'
         and private.artifact_snapshot_is_current(plan.id)
         and unit.status = 'approved'
         and lesson.curriculum_unit_id = unit.id
         and lesson.curriculum_snapshot ->> 'unitVersion' = unit.version::text
         and lesson.curriculum_snapshot ->> 'approvedAt' = to_jsonb(unit.approved_at) #>> '{}'
     ) then
    raise exception 'Only a runtime-ready approved lesson bound to this exact day may be scheduled';
  end if;
  insert into public.lesson_assignments (
    child_id, week_day_slot_id, lesson_artifact_id, status, primary_attempt_mode,
    available_from, available_until, created_by
  ) values (
    week.child_id, day.id, lesson.id, 'scheduled',
    case when lesson.kind = 'review_lesson' then 'scheduled_retrieval'::public.lesson_attempt_mode else 'learning'::public.lesson_attempt_mode end,
    p_available_from, p_available_until, actor_id_value
  ) returning * into assignment;
  perform private.write_recovery_audit('lesson_assignment.scheduled', 'lesson_assignment', assignment.id::text,
    jsonb_build_object('lessonArtifactId', lesson.id, 'weekDaySlotId', day.id, 'availableFrom', p_available_from, 'note', trim(p_note)));
  return assignment;
end;
$$;

create or replace function public.publish_lesson_assignment(p_assignment_id uuid, p_note text)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  assignment public.lesson_assignments;
  lesson public.generated_artifacts;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'A decision note is required'; end if;
  select * into assignment from public.lesson_assignments where id = p_assignment_id for update;
  select * into lesson from public.generated_artifacts where id = assignment.lesson_artifact_id for update;
  if assignment.id is null or assignment.status not in ('assigned', 'scheduled')
     or lesson.status <> 'approved' or lesson.binding_status <> 'valid' or not lesson.runtime_ready
     or not exists (
       select 1
       from public.week_day_slots day
       join public.learning_weeks week on week.id = day.learning_week_id
       join public.generated_artifacts plan on plan.id = day.weekly_plan_artifact_id
       join public.curriculum_units unit on unit.id = plan.curriculum_unit_id
       where day.id = assignment.week_day_slot_id
         and week.status in ('planned', 'active') and plan.status = 'approved'
         and private.artifact_snapshot_is_current(plan.id)
         and unit.status = 'approved'
         and lesson.curriculum_unit_id = unit.id
         and lesson.curriculum_snapshot ->> 'unitVersion' = unit.version::text
         and lesson.curriculum_snapshot ->> 'approvedAt' = to_jsonb(unit.approved_at) #>> '{}'
     ) then
    raise exception 'This assignment cannot be published';
  end if;
  if assignment.available_until is not null and assignment.available_until <= now() then
    raise exception 'The assignment availability window has ended';
  end if;
  update public.lesson_assignments
  set status = 'published', available_from = coalesce(available_from, now()),
      published_at = now(), published_by = actor_id_value, state_version = state_version + 1
  where id = assignment.id returning * into assignment;
  update public.learning_weeks set status = 'active'
  where id = (select learning_week_id from public.week_day_slots where id = assignment.week_day_slot_id)
    and status = 'planned';
  perform private.write_recovery_audit('lesson_assignment.published', 'lesson_assignment', assignment.id::text,
    jsonb_build_object('lessonArtifactId', lesson.id, 'note', trim(p_note)));
  return assignment;
end;
$$;

create or replace function public.set_lesson_assignment_replay(
  p_assignment_id uuid,
  p_replay_allowed boolean,
  p_note text
)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  assignment public.lesson_assignments;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'A replay decision note is required'; end if;
  update public.lesson_assignments assignment_row
  set replay_allowed = p_replay_allowed, state_version = state_version + 1
  where assignment_row.id = p_assignment_id
    and assignment_row.status in ('assigned', 'scheduled', 'published', 'completed')
    and (
      not p_replay_allowed
      or exists (
        select 1 from public.generated_artifacts lesson
        where lesson.id = assignment_row.lesson_artifact_id and lesson.status = 'approved'
          and lesson.binding_status = 'valid' and lesson.runtime_ready
      )
    )
  returning * into assignment;
  if assignment.id is null then raise exception 'Replay cannot be changed for this assignment'; end if;
  perform private.write_recovery_audit('lesson_assignment.replay_changed', 'lesson_assignment', assignment.id::text,
    jsonb_build_object('replayAllowed', p_replay_allowed, 'note', trim(p_note), 'actorId', actor_id_value));
  return assignment;
end;
$$;

create or replace function public.replace_lesson_assignment(
  p_assignment_id uuid,
  p_replacement_lesson_artifact_id uuid,
  p_activation_mode text,
  p_available_from timestamptz,
  p_available_until timestamptz,
  p_note text
)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  old_assignment public.lesson_assignments;
  replacement public.generated_artifacts;
  new_assignment public.lesson_assignments;
  new_id uuid := gen_random_uuid();
  new_status public.lesson_assignment_status;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'A decision note is required'; end if;
  if p_activation_mode not in ('assigned', 'scheduled', 'published') then raise exception 'Replacement mode is invalid'; end if;
  if p_activation_mode = 'scheduled' and p_available_from is null then raise exception 'A schedule time is required'; end if;
  if p_available_until is not null and p_available_from is not null and p_available_until <= p_available_from then raise exception 'Availability window is invalid'; end if;
  new_status := p_activation_mode::public.lesson_assignment_status;

  select * into old_assignment from public.lesson_assignments where id = p_assignment_id for update;
  select * into replacement from public.generated_artifacts where id = p_replacement_lesson_artifact_id for update;
  if old_assignment.id is null or old_assignment.status not in ('assigned', 'scheduled', 'published')
     or replacement.id is null or replacement.status <> 'approved'
     or replacement.binding_status <> 'valid' or not replacement.runtime_ready
     or replacement.week_day_slot_id <> old_assignment.week_day_slot_id
     or not exists (
       select 1
       from public.week_day_slots day
       join public.learning_weeks week on week.id = day.learning_week_id
       join public.generated_artifacts plan on plan.id = day.weekly_plan_artifact_id
       join public.curriculum_units unit on unit.id = plan.curriculum_unit_id
       where day.id = old_assignment.week_day_slot_id
         and week.status in ('planned', 'active') and plan.status = 'approved'
         and private.artifact_snapshot_is_current(plan.id)
         and unit.status = 'approved'
         and replacement.curriculum_unit_id = unit.id
         and replacement.curriculum_snapshot ->> 'unitVersion' = unit.version::text
         and replacement.curriculum_snapshot ->> 'approvedAt' = to_jsonb(unit.approved_at) #>> '{}'
     ) then
    raise exception 'Replacement must be a runtime-ready approved version for the same day';
  end if;

  update public.lesson_assignments
  set status = 'replaced', superseded_by_assignment_id = new_id, state_version = state_version + 1
  where id = old_assignment.id;

  insert into public.lesson_assignments (
    id, child_id, week_day_slot_id, lesson_artifact_id, status, primary_attempt_mode,
    replay_allowed, available_from, available_until, published_at, published_by, created_by
  ) values (
    new_id, old_assignment.child_id, old_assignment.week_day_slot_id, replacement.id, new_status,
    case when replacement.kind = 'review_lesson' then 'scheduled_retrieval'::public.lesson_attempt_mode else 'learning'::public.lesson_attempt_mode end,
    old_assignment.replay_allowed,
    case when new_status = 'assigned' then null else coalesce(p_available_from, now()) end,
    p_available_until,
    case when new_status = 'published' then now() else null end,
    case when new_status = 'published' then actor_id_value else null end,
    actor_id_value
  ) returning * into new_assignment;

  perform private.write_recovery_audit('lesson_assignment.replaced', 'lesson_assignment', old_assignment.id::text,
    jsonb_build_object('replacementAssignmentId', new_assignment.id, 'replacementArtifactId', replacement.id, 'activationMode', p_activation_mode, 'note', trim(p_note)));
  return new_assignment;
end;
$$;

create or replace function public.withdraw_lesson_assignment(p_assignment_id uuid, p_reason text)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  assignment public.lesson_assignments;
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'A withdrawal reason is required'; end if;
  update public.lesson_assignments
  set status = 'withdrawn', withdrawn_at = now(), withdrawn_by = actor_id_value,
      withdrawal_reason = trim(p_reason), state_version = state_version + 1
  where id = p_assignment_id and status in ('assigned', 'scheduled', 'published')
  returning * into assignment;
  if assignment.id is null then raise exception 'This assignment cannot be withdrawn'; end if;
  perform private.write_recovery_audit('lesson_assignment.withdrawn', 'lesson_assignment', assignment.id::text,
    jsonb_build_object('reason', trim(p_reason)));
  return assignment;
end;
$$;

create or replace function public.archive_lesson_assignment(p_assignment_id uuid, p_reason text)
returns public.lesson_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  assignment public.lesson_assignments;
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'An archive reason is required'; end if;
  update public.lesson_assignments
  set status = 'archived', archived_at = now(), archived_by = actor_id_value,
      archive_reason = trim(p_reason), state_version = state_version + 1
  where id = p_assignment_id and status in ('withdrawn', 'replaced', 'completed')
  returning * into assignment;
  if assignment.id is null then raise exception 'Only a terminal assignment can be archived'; end if;
  perform private.write_recovery_audit('lesson_assignment.archived', 'lesson_assignment', assignment.id::text,
    jsonb_build_object('reason', trim(p_reason)));
  return assignment;
end;
$$;

create or replace function public.revoke_generated_artifact_approval(p_artifact_id uuid, p_reason text)
returns public.generated_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  artifact public.generated_artifacts;
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'A revocation reason is required'; end if;
  select * into artifact from public.generated_artifacts where id = p_artifact_id for update;
  if artifact.id is null or artifact.status <> 'approved' then raise exception 'Only an approved artifact can be revoked'; end if;
  if exists (
    select 1 from public.lesson_assignments
    where lesson_artifact_id = artifact.id and status in ('assigned', 'scheduled', 'published')
  ) then raise exception 'Withdraw or replace active assignments before revoking approval'; end if;
  if artifact.kind = 'weekly_plan' and exists (
    select 1 from public.learning_weeks
    where weekly_plan_artifact_id = artifact.id and status <> 'archived'
  ) then raise exception 'Archive every learning week for this plan before revoking approval'; end if;
  if artifact.kind in ('daily_lesson', 'review_lesson', 'story_lesson') and exists (
    select 1 from public.lesson_assignments
    where lesson_artifact_id = artifact.id and status = 'completed' and replay_allowed
  ) then raise exception 'Disable replay or archive the completed assignment before revoking approval'; end if;
  -- Revocation removes the approval decision but does not archive the version.
  -- The parent may inspect, re-approve, or explicitly archive it in a separate action.
  update public.generated_artifacts set status = 'validated' where id = artifact.id returning * into artifact;
  insert into public.approval_records (entity_type, entity_id, action, note, actor_id)
  values ('generated_artifact', artifact.id, 'revoked', trim(p_reason), actor_id_value);
  perform private.write_recovery_audit('artifact.approval_revoked', 'generated_artifact', artifact.id::text,
    jsonb_build_object('reason', trim(p_reason)));
  return artifact;
end;
$$;

create or replace function public.archive_generated_artifact(p_artifact_id uuid, p_reason text)
returns public.generated_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  artifact public.generated_artifacts;
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'An archive reason is required'; end if;
  update public.generated_artifacts set status = 'archived'
  where id = p_artifact_id and status in ('draft', 'validation_failed', 'validated')
  returning * into artifact;
  if artifact.id is null then raise exception 'Approved artifacts must be revoked before archival'; end if;
  perform private.write_recovery_audit('artifact.archived', 'generated_artifact', artifact.id::text,
    jsonb_build_object('reason', trim(p_reason)));
  return artifact;
end;
$$;

create or replace function private.derive_support_level(response_count_value integer, replay_count_value integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when response_count_value <= 0 and replay_count_value <= 0 then 'independent'
    when response_count_value <= 0 and replay_count_value > 0 then 'replay'
    when response_count_value = 1 then 'prompted'
    else 'reduced_choices'
  end;
$$;

create or replace function private.score_lesson_response(answer_rule_value jsonb, response_value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  accepted_value text;
  response_text text;
begin
  if answer_rule_value ->> 'kind' = 'choice_key' then
    return nullif(response_value ->> 'optionKey', '') is not null
      and response_value ->> 'optionKey' = answer_rule_value ->> 'correctOptionKey';
  end if;
  if answer_rule_value ->> 'kind' = 'acceptable_responses' then
    if nullif(response_value ->> 'optionKey', '') is not null then
      return (answer_rule_value -> 'acceptedOptionKeys') ? (response_value ->> 'optionKey');
    end if;
    response_text := private.normalized_text(response_value ->> 'text');
    if response_text = '' then return false; end if;
    for accepted_value in select jsonb_array_elements_text(answer_rule_value -> 'values')
    loop
      if response_text = private.normalized_text(accepted_value) then return true; end if;
    end loop;
    return false;
  end if;
  return false;
end;
$$;

create or replace function private.reduced_option_keys(presentation_value jsonb, answer_rule_value jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(option_key order by priority, option_number), 'null'::jsonb)
  from (
    select option_value -> 'key' as option_key,
      option_number,
      case
        when answer_rule_value ->> 'kind' = 'choice_key'
          and option_value ->> 'key' = answer_rule_value ->> 'correctOptionKey' then 0
        else 1
      end as priority
    from jsonb_array_elements(
      coalesce(presentation_value -> 'options', presentation_value -> 'responseOptions', '[]'::jsonb)
    ) with ordinality as option_row(option_value, option_number)
    order by priority, option_number
    limit 2
  ) selected_options;
$$;

create or replace function private.advance_attempt_block(p_attempt_id uuid, p_block_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_block public.lesson_attempt_block_states;
  completed_index integer;
begin
  select block_index into completed_index from public.lesson_attempt_block_states
  where attempt_id = p_attempt_id and block_id = p_block_id and status in ('active', 'completed') for update;
  if completed_index is null then raise exception 'Current block is not advanceable'; end if;
  update public.lesson_attempt_block_states
  set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
  where attempt_id = p_attempt_id and block_id = p_block_id;

  select * into next_block
  from public.lesson_attempt_block_states
  where attempt_id = p_attempt_id and block_index > completed_index and status = 'pending'
  order by block_index limit 1 for update;

  if next_block.block_id is null then
    update public.lesson_attempts
    set current_block_id = null, current_block_index = completed_index + 1, last_activity_at = now()
    where id = p_attempt_id;
  else
    update public.lesson_attempt_block_states
    set status = 'active', first_presented_at = coalesce(first_presented_at, now()), updated_at = now()
    where attempt_id = p_attempt_id and block_id = next_block.block_id;
    update public.lesson_attempts
    set current_block_id = next_block.block_id, current_block_index = next_block.block_index, last_activity_at = now()
    where id = p_attempt_id;
  end if;
end;
$$;

create or replace function private.build_child_attempt_snapshot(p_attempt_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'attemptId', attempt.id,
    'assignmentId', assignment.id,
    'attemptMode', attempt.mode,
    'status', attempt.status,
    'stateVersion', attempt.state_version,
    'currentBlockId', attempt.current_block_id,
    'currentBlockIndex', attempt.current_block_index,
    'viewMode', case
      when attempt.status = 'completed' then 'complete'
      when coalesce((attempt.player_state ->> 'inBreak')::boolean, false) then 'break'
      else coalesce(attempt.player_state ->> 'viewMode', 'activity')
    end,
    'retryCount', greatest(coalesce(current_state.response_count, 0) - 1, 0),
    'supportLevel', coalesce(current_state.support_level, 'independent'),
    'selectedOptionKey', attempt.player_state ->> 'selectedOptionKey',
    'visibleOptionKeys', attempt.player_state -> 'visibleOptionKeys',
    'outcome', attempt.player_state ->> 'outcome',
    'feedback', attempt.player_state -> 'feedback',
    'fallbackAvailable', coalesce((attempt.player_state ->> 'fallbackAvailable')::boolean, false),
    'canAdvance', coalesce((attempt.player_state ->> 'canAdvance')::boolean, false),
    'breakCount', attempt.break_count,
    'progress', jsonb_build_object(
      'completed', (select count(*) from public.lesson_attempt_block_states state where state.attempt_id = attempt.id and state.status = 'completed'),
      'total', (select count(*) from public.lesson_attempt_block_states state where state.attempt_id = attempt.id)
    )
  )
  from public.lesson_attempts attempt
  join public.lesson_assignments assignment on assignment.id = attempt.assignment_id
  left join public.lesson_attempt_block_states current_state
    on current_state.attempt_id = attempt.id and current_state.block_id = attempt.current_block_id
  where attempt.id = p_attempt_id and not attempt.legacy_quarantined;
$$;

revoke all on function private.derive_support_level(integer, integer) from public, anon, authenticated;
revoke all on function private.score_lesson_response(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.reduced_option_keys(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.advance_attempt_block(uuid, text) from public, anon, authenticated;
revoke all on function private.build_child_attempt_snapshot(uuid) from public, anon, authenticated;

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
    'todayAssignment', (
      select jsonb_build_object(
        'id', assignment.id,
        'lessonArtifactId', assignment.lesson_artifact_id,
        'mode', assignment.primary_attempt_mode,
        'state', 'published',
        'day', slot.day_number,
        'title', lesson.content ->> 'title',
        'objective', lesson.content ->> 'objective',
        'durationMinutes', (lesson.content ->> 'durationMinutes')::integer,
        'activeAttemptId', (
          select attempt.id
          from public.lesson_attempts attempt
          where attempt.assignment_id = assignment.id
            and attempt.status in ('in_progress', 'paused')
            and not attempt.legacy_quarantined
          order by attempt.last_activity_at desc
          limit 1
        )
      )
      from public.lesson_assignments assignment
      join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
      join public.generated_artifacts lesson on lesson.id = assignment.lesson_artifact_id
      where assignment.child_id = child_id_value
        and assignment.status = 'published'
        and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
        and exists (
          select 1 from public.generated_artifacts plan
          where plan.id = slot.weekly_plan_artifact_id and plan.status = 'approved'
            and private.artifact_snapshot_is_current(plan.id)
        )
        and coalesce(assignment.available_from, '-infinity'::timestamptz) <= now()
        and coalesce(assignment.available_until, 'infinity'::timestamptz) > now()
      order by assignment.available_from nulls first, assignment.created_at
      limit 1
    ),
    'replayAssignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', assignment.id,
        'lessonArtifactId', assignment.lesson_artifact_id,
        'mode', 'replay',
        'state', 'completed',
        'day', slot.day_number,
        'title', lesson.content ->> 'title',
        'objective', lesson.content ->> 'objective',
        'durationMinutes', (lesson.content ->> 'durationMinutes')::integer,
        'activeAttemptId', (
          select attempt.id
          from public.lesson_attempts attempt
          where attempt.assignment_id = assignment.id and attempt.mode = 'replay'
            and attempt.status in ('in_progress', 'paused') and not attempt.legacy_quarantined
          order by attempt.last_activity_at desc limit 1
        )
      ) order by assignment.completed_at desc)
      from public.lesson_assignments assignment
      join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
      join public.generated_artifacts lesson on lesson.id = assignment.lesson_artifact_id
      where assignment.child_id = child_id_value
        and assignment.status = 'completed' and assignment.replay_allowed
        and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
        and exists (
          select 1 from public.generated_artifacts plan
          where plan.id = slot.weekly_plan_artifact_id and plan.status = 'approved'
            and private.artifact_snapshot_is_current(plan.id)
        )
    ), '[]'::jsonb),
    'retrievalAssignments', '[]'::jsonb
  ) into result
  from public.child_profiles child where child.id = child_id_value;
  return result;
end;
$$;

create or replace function public.get_child_attempt_snapshot(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  child_id_value uuid := private.current_child_id();
  allowed boolean;
begin
  if child_id_value is null then raise exception 'Child access is not authorized'; end if;
  select exists (
    select 1
    from public.lesson_attempts attempt
    join public.lesson_assignments assignment on assignment.id = attempt.assignment_id
    join public.generated_artifacts lesson on lesson.id = assignment.lesson_artifact_id
    join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
    join public.generated_artifacts plan on plan.id = slot.weekly_plan_artifact_id
    where attempt.id = p_attempt_id and attempt.child_id = child_id_value and not attempt.legacy_quarantined
      and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
      and plan.status = 'approved' and private.artifact_snapshot_is_current(plan.id)
      and (
        (assignment.status = 'published'
          and coalesce(assignment.available_from, '-infinity'::timestamptz) <= now()
          and coalesce(assignment.available_until, 'infinity'::timestamptz) > now())
        or (assignment.status = 'completed' and attempt.mode = 'replay' and assignment.replay_allowed)
      )
  ) into allowed;
  if not allowed then raise exception 'Lesson attempt is not available'; end if;
  return (
    select jsonb_build_object(
      'lesson', private.child_safe_lesson(attempt.lesson_artifact_id),
      'snapshot', private.build_child_attempt_snapshot(attempt.id)
    )
    from public.lesson_attempts attempt where attempt.id = p_attempt_id
  );
end;
$$;

create or replace function public.get_child_lesson_attempt(p_attempt_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.get_child_attempt_snapshot(p_attempt_id);
$$;

create or replace function public.start_child_assignment(
  p_assignment_id uuid,
  p_mode public.lesson_attempt_mode,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_id_value uuid := private.current_child_id();
  assignment public.lesson_assignments;
  existing_event public.lesson_attempt_events;
  attempt public.lesson_attempts;
  attempt_sequence_value integer;
  first_rule private.lesson_runtime_blocks;
  snapshot jsonb;
begin
  if child_id_value is null then raise exception 'Child access is not authorized'; end if;
  select * into existing_event from public.lesson_attempt_events where client_event_id = p_client_event_id;
  if existing_event.id is not null then
    select * into attempt from public.lesson_attempts where id = existing_event.attempt_id;
    if attempt.id is null or attempt.assignment_id <> p_assignment_id or attempt.mode <> p_mode then
      raise exception 'Client event was already used for another assignment';
    end if;
    return existing_event.result_snapshot;
  end if;

  select * into assignment from public.lesson_assignments
  where id = p_assignment_id and child_id = child_id_value for update;
  select * into existing_event from public.lesson_attempt_events where client_event_id = p_client_event_id;
  if existing_event.id is not null then
    select * into attempt from public.lesson_attempts where id = existing_event.attempt_id;
    if attempt.id is null or attempt.assignment_id <> p_assignment_id or attempt.mode <> p_mode then
      raise exception 'Client event was already used for another assignment';
    end if;
    return existing_event.result_snapshot;
  end if;
  if assignment.id is null or not exists (
    select 1
    from public.generated_artifacts lesson
    join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
    join public.generated_artifacts plan on plan.id = slot.weekly_plan_artifact_id
    where lesson.id = assignment.lesson_artifact_id
      and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
      and plan.status = 'approved' and private.artifact_snapshot_is_current(plan.id)
  ) then raise exception 'Assignment is not available'; end if;
  if p_mode = 'replay' then
    if assignment.status <> 'completed' or not assignment.replay_allowed then raise exception 'Replay is not available'; end if;
  else
    if assignment.status <> 'published'
       or coalesce(assignment.available_from, '-infinity'::timestamptz) > now()
       or coalesce(assignment.available_until, 'infinity'::timestamptz) <= now()
       or p_mode <> assignment.primary_attempt_mode then
      raise exception 'Published assignment is not available';
    end if;
  end if;

  if p_mode <> 'replay' then
    select * into attempt from public.lesson_attempts
    where assignment_id = assignment.id and mode = p_mode and not legacy_quarantined
    order by attempt_sequence limit 1;
  else
    select * into attempt from public.lesson_attempts
    where assignment_id = assignment.id and mode = 'replay'
      and status in ('in_progress', 'paused') and not legacy_quarantined
    order by attempt_sequence desc limit 1;
  end if;
  if attempt.id is not null then
    if attempt.status = 'paused' and not coalesce((attempt.player_state ->> 'inBreak')::boolean, false) then
      update public.lesson_attempts
      set status = 'in_progress', paused_at = null,
          state_version = state_version + 1, last_activity_at = now()
      where id = attempt.id returning * into attempt;
    end if;
    snapshot := jsonb_build_object(
      'lesson', private.child_safe_lesson(assignment.lesson_artifact_id),
      'snapshot', private.build_child_attempt_snapshot(attempt.id)
    );
    insert into public.lesson_attempt_events (
      client_event_id, attempt_id, block_id, command, state_version_before, state_version_after, result_snapshot
    ) values (p_client_event_id, attempt.id, attempt.current_block_id, 'start', attempt.state_version, attempt.state_version, snapshot);
    return snapshot;
  end if;

  select coalesce(max(attempt_sequence), 0) + 1 into attempt_sequence_value
  from public.lesson_attempts where assignment_id = assignment.id and mode = p_mode;
  select * into first_rule from private.lesson_runtime_blocks
  where lesson_artifact_id = assignment.lesson_artifact_id order by block_index limit 1;
  if first_rule.block_id is null then raise exception 'Lesson runtime is not prepared'; end if;

  insert into public.lesson_attempts (
    child_id, lesson_artifact_id, assignment_id, mode, attempt_sequence, status,
    current_block_index, current_block_id, player_state, legacy_quarantined
  ) values (
    child_id_value, assignment.lesson_artifact_id, assignment.id, p_mode, attempt_sequence_value,
    'in_progress', 0, first_rule.block_id, '{}'::jsonb, false
  ) returning * into attempt;

  insert into public.lesson_attempt_block_states (
    attempt_id, block_id, block_index, status, first_presented_at
  ) select attempt.id, block.block_id, block.block_index,
    case when block.block_index = 0 then 'active'::public.attempt_block_status else 'pending'::public.attempt_block_status end,
    case when block.block_index = 0 then now() else null end
  from private.lesson_runtime_blocks block
  where block.lesson_artifact_id = assignment.lesson_artifact_id
  order by block.block_index;

  snapshot := jsonb_build_object(
    'lesson', private.child_safe_lesson(assignment.lesson_artifact_id),
    'snapshot', private.build_child_attempt_snapshot(attempt.id)
  );
  insert into public.lesson_attempt_events (
    client_event_id, attempt_id, block_id, command, state_version_before, state_version_after, result_snapshot
  ) values (p_client_event_id, attempt.id, attempt.current_block_id, 'start', 0, 0, snapshot);
  perform private.write_recovery_audit('lesson_attempt.started', 'lesson_attempt', attempt.id::text,
    jsonb_build_object('assignmentId', assignment.id, 'mode', p_mode));
  return snapshot;
end;
$$;

create or replace function public.command_child_attempt(
  p_attempt_id uuid,
  p_client_event_id uuid,
  p_expected_state_version bigint,
  p_block_id text,
  p_command text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_id_value uuid := private.current_child_id();
  previous_event public.lesson_attempt_events;
  attempt public.lesson_attempts;
  assignment public.lesson_assignments;
  block_state public.lesson_attempt_block_states;
  runtime private.lesson_runtime_blocks;
  response_event public.lesson_response_events;
  response_ordinal_value integer;
  support_value text;
  correct_value boolean;
  evidence_rows integer;
  target_value text;
  snapshot jsonb;
  before_version bigint;
begin
  if child_id_value is null then raise exception 'Child access is not authorized'; end if;
  if p_command not in (
    'pause', 'resume', 'start_break', 'end_break', 'record_listen',
    'request_hint', 'acknowledge', 'retry', 'advance', 'submit_response', 'complete'
  ) then
    raise exception 'Attempt command is not supported';
  end if;
  if octet_length(coalesce(p_payload, '{}'::jsonb)::text) > 4096 then raise exception 'Attempt payload is too large'; end if;

  select * into previous_event from public.lesson_attempt_events where client_event_id = p_client_event_id;
  if previous_event.id is not null then
    if previous_event.attempt_id <> p_attempt_id or previous_event.command <> p_command then
      raise exception 'Client event was already used for another command';
    end if;
    return previous_event.result_snapshot;
  end if;

  select * into attempt from public.lesson_attempts where id = p_attempt_id for update;
  if attempt.id is null or attempt.child_id <> child_id_value or attempt.legacy_quarantined then
    raise exception 'Lesson attempt is not available';
  end if;
  select * into previous_event from public.lesson_attempt_events where client_event_id = p_client_event_id;
  if previous_event.id is not null then
    if previous_event.attempt_id <> p_attempt_id or previous_event.command <> p_command then
      raise exception 'Client event was already used for another command';
    end if;
    return previous_event.result_snapshot;
  end if;
  select * into assignment from public.lesson_assignments where id = attempt.assignment_id for update;
  if assignment.id is null or not (
    (assignment.status = 'published'
      and coalesce(assignment.available_from, '-infinity'::timestamptz) <= now()
      and coalesce(assignment.available_until, 'infinity'::timestamptz) > now())
    or (attempt.mode = 'replay' and assignment.status = 'completed' and assignment.replay_allowed)
  ) then
    raise exception 'Published assignment is not available';
  end if;
  if not exists (
    select 1
    from public.generated_artifacts lesson
    join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
    join public.generated_artifacts plan on plan.id = slot.weekly_plan_artifact_id
    where lesson.id = assignment.lesson_artifact_id
      and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
      and plan.status = 'approved' and private.artifact_snapshot_is_current(plan.id)
  ) then raise exception 'Approved lesson publication is no longer available'; end if;
  if attempt.state_version <> p_expected_state_version then raise exception 'Attempt state is stale'; end if;
  before_version := attempt.state_version;

  if p_command <> 'complete' then
    if attempt.current_block_id is null or p_block_id is distinct from attempt.current_block_id then
      raise exception 'Command does not target the current block';
    end if;
    select * into block_state from public.lesson_attempt_block_states
    where attempt_id = attempt.id and block_id = attempt.current_block_id for update;
    select * into runtime from private.lesson_runtime_blocks
    where lesson_artifact_id = attempt.lesson_artifact_id and block_id = attempt.current_block_id;
    if block_state.block_id is null or runtime.block_id is null
       or (block_state.status <> 'active' and not (
         p_command = 'advance' and block_state.status = 'completed'
         and coalesce((attempt.player_state ->> 'canAdvance')::boolean, false)
       )) then
      raise exception 'Current block state is invalid';
    end if;
  end if;

  case p_command
    when 'pause' then
      if attempt.status <> 'in_progress' then raise exception 'Only an active attempt can pause'; end if;
      update public.lesson_attempts set status = 'paused', paused_at = now(), last_activity_at = now()
      where id = attempt.id;

    when 'resume' then
      if attempt.status <> 'paused' or coalesce((attempt.player_state ->> 'inBreak')::boolean, false) then
        raise exception 'Attempt cannot resume while a break is active';
      end if;
      update public.lesson_attempts set status = 'in_progress', paused_at = null, last_activity_at = now()
      where id = attempt.id;

    when 'start_break' then
      if attempt.status <> 'in_progress' then raise exception 'Only an active attempt can start a break'; end if;
      update public.lesson_attempts
      set status = 'paused', paused_at = now(), break_count = break_count + 1,
          player_state = jsonb_set(coalesce(player_state, '{}'::jsonb), '{inBreak}', 'true'::jsonb, true),
          last_activity_at = now()
      where id = attempt.id;

    when 'end_break' then
      if attempt.status <> 'paused' or not coalesce((attempt.player_state ->> 'inBreak')::boolean, false) then
        raise exception 'No break is active';
      end if;
      update public.lesson_attempts
      set status = 'in_progress', paused_at = null,
          player_state = jsonb_set(coalesce(player_state, '{}'::jsonb), '{inBreak}', 'false'::jsonb, true),
          last_activity_at = now()
      where id = attempt.id;

    when 'record_listen' then
      if attempt.status <> 'in_progress' then raise exception 'Attempt is not active'; end if;
      update public.lesson_attempt_block_states
      set listen_count = listen_count + 1,
          replay_count = replay_count + case when listen_count > 0 then 1 else 0 end,
          support_level = case
            when listen_count > 0 and support_level = 'independent' then 'replay'
            else support_level
          end,
          updated_at = now()
      where attempt_id = attempt.id and block_id = block_state.block_id;

    when 'request_hint' then
      if attempt.status <> 'in_progress' then raise exception 'Attempt is not active'; end if;
      support_value := case when block_state.response_count >= 2 then 'reduced_choices' else 'prompted' end;
      update public.lesson_attempt_block_states
      set support_level = support_value, updated_at = now()
      where attempt_id = attempt.id and block_id = block_state.block_id;
      update public.lesson_attempts
      set player_state = jsonb_build_object(
        'viewMode', 'activity', 'outcome', null, 'feedback', null,
        'selectedOptionKey', null, 'fallbackAvailable', true, 'canAdvance', false,
        'visibleOptionKeys', private.reduced_option_keys(runtime.presentation, runtime.answer_rule)
      ), last_activity_at = now()
      where id = attempt.id;

    when 'retry' then
      if attempt.status <> 'in_progress' or coalesce(attempt.player_state ->> 'viewMode', '') <> 'feedback'
         or coalesce((attempt.player_state ->> 'canAdvance')::boolean, false) then
        raise exception 'Retry is not available';
      end if;
      support_value := case
        when block_state.support_level in ('prompted', 'reduced_choices', 'modeled') then block_state.support_level
        else private.derive_support_level(block_state.response_count, block_state.replay_count)
      end;
      update public.lesson_attempt_block_states set support_level = support_value, updated_at = now()
      where attempt_id = attempt.id and block_id = block_state.block_id;
      update public.lesson_attempts
      set player_state = jsonb_build_object(
        'viewMode', 'activity', 'outcome', null, 'feedback', null,
        'selectedOptionKey', null, 'fallbackAvailable', block_state.response_count > 0,
        'canAdvance', false,
        'visibleOptionKeys', case when block_state.response_count >= 2
          then private.reduced_option_keys(runtime.presentation, runtime.answer_rule)
          else 'null'::jsonb end
      ), last_activity_at = now()
      where id = attempt.id;

    when 'acknowledge' then
      if attempt.status <> 'in_progress' or runtime.scored then raise exception 'Acknowledgement is not available'; end if;
      if runtime.block_type = 'model_audio' and block_state.listen_count < 1 then
        raise exception 'Required model audio must be heard before acknowledging';
      end if;
      perform private.advance_attempt_block(attempt.id, block_state.block_id);
      update public.lesson_attempts set player_state = '{}'::jsonb where id = attempt.id;

    when 'advance' then
      if attempt.status <> 'in_progress' then raise exception 'Attempt is not active'; end if;
      if runtime.scored and (block_state.status <> 'completed'
         or not coalesce((attempt.player_state ->> 'canAdvance')::boolean, false)) then
        raise exception 'A correct response is required before advancing';
      end if;
      if not runtime.scored and runtime.block_type = 'model_audio' and block_state.listen_count < 1 then
        raise exception 'Required model audio must be heard before advancing';
      end if;
      perform private.advance_attempt_block(attempt.id, block_state.block_id);
      update public.lesson_attempts set player_state = '{}'::jsonb where id = attempt.id;

    when 'submit_response' then
      if attempt.status <> 'in_progress' then raise exception 'Attempt is not active'; end if;
      if not runtime.scored then raise exception 'This block does not accept a scored response'; end if;
      response_ordinal_value := block_state.response_count + 1;
      support_value := case
        when block_state.support_level in ('prompted', 'reduced_choices', 'modeled') then block_state.support_level
        else private.derive_support_level(block_state.response_count, block_state.replay_count)
      end;
      correct_value := private.score_lesson_response(
        runtime.answer_rule,
        case when jsonb_typeof(p_payload -> 'response') = 'object' then p_payload -> 'response' else coalesce(p_payload, '{}'::jsonb) end
      );

      insert into public.lesson_response_events (
        client_event_id, attempt_id, block_id, response_ordinal, response_kind,
        response, correct, outcome, first_attempt, support_level, retry_count,
        response_latency_ms, authority
      ) values (
        p_client_event_id, attempt.id, block_state.block_id, response_ordinal_value,
        case when runtime.answer_rule ->> 'kind' = 'choice_key' or nullif(coalesce(p_payload -> 'response', p_payload) ->> 'optionKey', '') is not null then 'choice' else 'text' end,
        case when jsonb_typeof(p_payload -> 'response') = 'object' then p_payload -> 'response' else coalesce(p_payload, '{}'::jsonb) end,
        correct_value,
        case when correct_value then 'correct' else 'incorrect' end,
        response_ordinal_value = 1, support_value, response_ordinal_value - 1,
        case when jsonb_typeof(p_payload -> 'responseLatencyMs') = 'number'
          then greatest(0, least(120000, (p_payload ->> 'responseLatencyMs')::integer)) else null end,
        'server_derived'
      ) returning * into response_event;

      update public.lesson_attempt_block_states
      set response_count = response_ordinal_value, support_level = support_value, updated_at = now()
      where attempt_id = attempt.id and block_id = block_state.block_id;

      insert into public.activity_evidence (
        client_event_id, attempt_id, block_id, target_type, target_id, evidence_type,
        first_attempt, support_level, correct, response_latency_ms, retry_count, metadata,
        response_event_id, attempt_mode, authority, rule_version, qualifies_for_completion
      )
      select
        p_client_event_id, attempt.id, block_state.block_id,
        case when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then coalesce((
          select target.target_type
          from public.week_day_targets target
          join public.generated_artifacts lesson on lesson.week_day_slot_id = target.week_day_slot_id
          where lesson.id = attempt.lesson_artifact_id and target.target_id = value::uuid
          limit 1
        ), runtime.block_type) else runtime.block_type end,
        case when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then value::uuid else null end,
        coalesce(runtime.answer_rule ->> 'evidenceType', runtime.block_type),
        response_ordinal_value = 1, support_value, correct_value,
        response_event.response_latency_ms, response_ordinal_value - 1,
        jsonb_build_object('authority', 'server', 'rawAudioStored', false),
        response_event.id, attempt.mode, 'server_derived', 'recovery1-v1', correct_value
      from unnest(runtime.target_ids) value;
      get diagnostics evidence_rows = row_count;
      if evidence_rows = 0 then
        insert into public.activity_evidence (
          client_event_id, attempt_id, block_id, target_type, target_id, evidence_type,
          first_attempt, support_level, correct, response_latency_ms, retry_count, metadata,
          response_event_id, attempt_mode, authority, rule_version, qualifies_for_completion
        ) values (
          p_client_event_id, attempt.id, block_state.block_id, runtime.block_type, null,
          coalesce(runtime.answer_rule ->> 'evidenceType', runtime.block_type),
          response_ordinal_value = 1, support_value, correct_value,
          response_event.response_latency_ms, response_ordinal_value - 1,
          jsonb_build_object('authority', 'server', 'rawAudioStored', false),
          response_event.id, attempt.mode, 'server_derived', 'recovery1-v1', correct_value
        );
      end if;
      if correct_value then
        update public.lesson_attempt_block_states
        set status = 'completed', completed_at = now(), updated_at = now()
        where attempt_id = attempt.id and block_id = block_state.block_id;
      end if;
      update public.lesson_attempts
      set player_state = jsonb_build_object(
        'viewMode', 'feedback',
        'outcome', case when correct_value then 'correct' else 'incorrect' end,
        'feedback', case when correct_value then
          jsonb_build_object('tone', 'success', 'title', 'Yes—that’s it.', 'message', 'You can move to the next step.')
        else jsonb_build_object('tone', 'retry', 'title', 'Almost. Let’s try again.', 'message', 'Listen once more, then choose again.') end,
        'selectedOptionKey', coalesce(p_payload #>> '{response,optionKey}', p_payload ->> 'optionKey'),
        'visibleOptionKeys', null,
        'fallbackAvailable', not correct_value,
        'canAdvance', correct_value
      ), last_activity_at = now()
      where id = attempt.id;

    when 'complete' then
      if attempt.status not in ('in_progress', 'paused') then raise exception 'Attempt is not completable'; end if;
      if exists (
        select 1
        from private.lesson_runtime_blocks runtime_required
        left join public.lesson_attempt_block_states state
          on state.attempt_id = attempt.id and state.block_id = runtime_required.block_id
        where runtime_required.lesson_artifact_id = attempt.lesson_artifact_id
          and runtime_required.required and coalesce(state.status::text, 'missing') <> 'completed'
      ) then raise exception 'Required lesson blocks are incomplete'; end if;
      if not exists (
        select 1
        from private.lesson_runtime_blocks exit_rule
        join public.activity_evidence evidence
          on evidence.attempt_id = attempt.id and evidence.block_id = exit_rule.block_id
        where exit_rule.lesson_artifact_id = attempt.lesson_artifact_id
          and exit_rule.exit_required and evidence.qualifies_for_completion
          and evidence.authority in ('server_derived', 'provider_derived')
      ) then raise exception 'Valid exit evidence is required'; end if;
      update public.lesson_attempts
      set status = 'completed', completed_at = now(), current_block_id = null,
          paused_at = null, player_state = jsonb_build_object(
            'viewMode', 'complete', 'outcome', 'completed', 'feedback', null,
            'selectedOptionKey', null, 'visibleOptionKeys', null,
            'fallbackAvailable', false, 'canAdvance', false
          ), last_activity_at = now()
      where id = attempt.id;
      if attempt.mode = assignment.primary_attempt_mode then
        update public.lesson_assignments
        set status = 'completed', completed_at = now(), state_version = state_version + 1
        where id = assignment.id and status = 'published';
      end if;
      perform private.write_recovery_audit('lesson_attempt.completed', 'lesson_attempt', attempt.id::text,
        jsonb_build_object('assignmentId', assignment.id, 'mode', attempt.mode));
  end case;

  update public.lesson_attempts
  set state_version = before_version + 1, last_activity_at = now()
  where id = attempt.id returning * into attempt;
  snapshot := jsonb_build_object(
    'snapshot', private.build_child_attempt_snapshot(attempt.id)
  ) || case
    when attempt.player_state ->> 'outcome' is null then '{}'::jsonb
    else jsonb_build_object('outcome', attempt.player_state ->> 'outcome')
  end;
  insert into public.lesson_attempt_events (
    client_event_id, attempt_id, block_id, command, state_version_before, state_version_after,
    safe_payload, result_snapshot
  ) values (
    p_client_event_id, attempt.id, nullif(p_block_id, ''), p_command,
    before_version, attempt.state_version,
    case when p_command = 'submit_response' then jsonb_build_object('responseSubmitted', true) else coalesce(p_payload, '{}'::jsonb) end,
    snapshot
  );
  return snapshot;
end;
$$;

create or replace function public.record_child_speech_provider_result_v2(
  p_attempt_id uuid,
  p_client_event_id uuid,
  p_expected_state_version bigint,
  p_block_id text,
  p_transcript text,
  p_provider_confidence numeric,
  p_provider_model text,
  p_provider_outcome text,
  p_response_latency_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt public.lesson_attempts;
  assignment public.lesson_assignments;
  block_state public.lesson_attempt_block_states;
  runtime private.lesson_runtime_blocks;
  response_event public.lesson_response_events;
  response_ordinal_value integer;
  support_value text;
  correct_value boolean;
  evidence_rows integer;
  before_version bigint;
  snapshot jsonb;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then raise exception 'Server provider access is required'; end if;
  if p_provider_outcome not in ('transcribed', 'silence') then raise exception 'Unavailable provider results cannot mutate learning state'; end if;
  if p_provider_confidence is not null and (p_provider_confidence < 0 or p_provider_confidence > 1) then raise exception 'Provider confidence is invalid'; end if;
  if p_response_latency_ms is not null and (p_response_latency_ms < 0 or p_response_latency_ms > 120000) then raise exception 'Response latency is invalid'; end if;
  if exists (select 1 from public.lesson_response_events where client_event_id = p_client_event_id) then
    select result_snapshot into snapshot from public.lesson_attempt_events where client_event_id = p_client_event_id;
    return snapshot;
  end if;

  select * into attempt from public.lesson_attempts where id = p_attempt_id for update;
  if exists (select 1 from public.lesson_response_events where client_event_id = p_client_event_id) then
    select result_snapshot into snapshot from public.lesson_attempt_events where client_event_id = p_client_event_id;
    return snapshot;
  end if;
  select * into assignment from public.lesson_assignments where id = attempt.assignment_id for update;
  if attempt.id is null or attempt.legacy_quarantined or attempt.status <> 'in_progress'
     or not (
       (assignment.status = 'published'
         and coalesce(assignment.available_from, '-infinity'::timestamptz) <= now()
         and coalesce(assignment.available_until, 'infinity'::timestamptz) > now())
       or (attempt.mode = 'replay' and assignment.status = 'completed' and assignment.replay_allowed)
     )
     or attempt.state_version <> p_expected_state_version
     or attempt.current_block_id is distinct from p_block_id then
    raise exception 'Authoritative speech state is not available';
  end if;
  if not exists (
    select 1
    from public.generated_artifacts lesson
    join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
    join public.generated_artifacts plan on plan.id = slot.weekly_plan_artifact_id
    where lesson.id = assignment.lesson_artifact_id
      and lesson.status = 'approved' and lesson.binding_status = 'valid' and lesson.runtime_ready
      and plan.status = 'approved' and private.artifact_snapshot_is_current(plan.id)
  ) then raise exception 'Approved speech lesson is no longer available'; end if;
  select * into block_state from public.lesson_attempt_block_states
  where attempt_id = attempt.id and block_id = p_block_id for update;
  select * into runtime from private.lesson_runtime_blocks
  where lesson_artifact_id = attempt.lesson_artifact_id and block_id = p_block_id;
  if block_state.status <> 'active' or runtime.answer_rule ->> 'kind' <> 'acceptable_responses' then
    raise exception 'Speech is not accepted for this block';
  end if;

  before_version := attempt.state_version;
  response_ordinal_value := block_state.response_count + 1;
  support_value := case
    when block_state.support_level in ('prompted', 'reduced_choices', 'modeled') then block_state.support_level
    else private.derive_support_level(block_state.response_count, block_state.replay_count)
  end;
  correct_value := p_provider_outcome = 'transcribed'
    and private.score_lesson_response(runtime.answer_rule, jsonb_build_object('text', left(coalesce(p_transcript, ''), 500)));

  insert into public.lesson_response_events (
    client_event_id, attempt_id, block_id, response_ordinal, response_kind, response,
    correct, outcome, first_attempt, support_level, retry_count, response_latency_ms,
    transcript, provider_confidence, provider_model, authority
  ) values (
    p_client_event_id, attempt.id, p_block_id, response_ordinal_value, 'speech',
    jsonb_build_object('providerProcessed', true, 'rawAudioStored', false),
    correct_value,
    case when p_provider_outcome = 'silence' then 'silence' when correct_value then 'correct' else 'incorrect' end,
    response_ordinal_value = 1, support_value, response_ordinal_value - 1, p_response_latency_ms,
    nullif(left(coalesce(p_transcript, ''), 500), ''), p_provider_confidence,
    left(coalesce(p_provider_model, ''), 80), 'provider_derived'
  ) returning * into response_event;

  update public.lesson_attempt_block_states
  set response_count = response_ordinal_value, support_level = support_value, updated_at = now()
  where attempt_id = attempt.id and block_id = p_block_id;

  insert into public.activity_evidence (
    client_event_id, attempt_id, block_id, target_type, target_id, evidence_type,
    first_attempt, support_level, correct, response_latency_ms, retry_count,
    transcript, provider_confidence, metadata, response_event_id, attempt_mode,
    authority, rule_version, qualifies_for_completion
  )
  select
    p_client_event_id, attempt.id, p_block_id,
    case when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then coalesce((
      select target.target_type
      from public.week_day_targets target
      join public.generated_artifacts lesson on lesson.week_day_slot_id = target.week_day_slot_id
      where lesson.id = attempt.lesson_artifact_id and target.target_id = value::uuid
      limit 1
    ), runtime.block_type) else runtime.block_type end,
    case when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then value::uuid else null end,
    coalesce(runtime.answer_rule ->> 'evidenceType', runtime.block_type),
    response_ordinal_value = 1, support_value, correct_value, p_response_latency_ms,
    response_ordinal_value - 1, response_event.transcript, p_provider_confidence,
    jsonb_build_object('provider', 'elevenlabs', 'model', left(coalesce(p_provider_model, ''), 80),
      'speechOutcome', p_provider_outcome, 'rawAudioStored', false),
    response_event.id, attempt.mode, 'provider_derived', 'recovery1-v1', correct_value
  from unnest(runtime.target_ids) value;
  get diagnostics evidence_rows = row_count;
  if evidence_rows = 0 then
    insert into public.activity_evidence (
      client_event_id, attempt_id, block_id, target_type, target_id, evidence_type,
      first_attempt, support_level, correct, response_latency_ms, retry_count,
      transcript, provider_confidence, metadata, response_event_id, attempt_mode,
      authority, rule_version, qualifies_for_completion
    ) values (
      p_client_event_id, attempt.id, p_block_id, runtime.block_type, null,
      coalesce(runtime.answer_rule ->> 'evidenceType', runtime.block_type),
      response_ordinal_value = 1, support_value, correct_value, p_response_latency_ms,
      response_ordinal_value - 1, response_event.transcript, p_provider_confidence,
      jsonb_build_object('provider', 'elevenlabs', 'model', left(coalesce(p_provider_model, ''), 80),
        'speechOutcome', p_provider_outcome, 'rawAudioStored', false),
      response_event.id, attempt.mode, 'provider_derived', 'recovery1-v1', correct_value
    );
  end if;
  if correct_value then
    update public.lesson_attempt_block_states
    set status = 'completed', completed_at = now(), updated_at = now()
    where attempt_id = attempt.id and block_id = p_block_id;
  end if;
  update public.lesson_attempts
  set player_state = jsonb_build_object(
        'viewMode', 'feedback',
        'outcome', case when p_provider_outcome = 'silence' then 'silence' when correct_value then 'matched' else 'incorrect' end,
        'feedback', case
          when correct_value then jsonb_build_object('tone', 'success', 'title', 'I heard you.', 'message', 'That works. You can move to the next step.')
          when p_provider_outcome = 'silence' then jsonb_build_object('tone', 'retry', 'title', 'I did not hear words yet.', 'message', 'Take your time, then try again or choose an answer.')
          else jsonb_build_object('tone', 'retry', 'title', 'Let us try that once more.', 'message', 'Listen again or choose the answer you wanted to say.')
        end,
        'selectedOptionKey', null,
        'visibleOptionKeys', null,
        'fallbackAvailable', not correct_value,
        'canAdvance', correct_value
      ),
      state_version = before_version + 1,
      last_activity_at = now()
  where id = attempt.id returning * into attempt;
  snapshot := jsonb_build_object(
    'snapshot', private.build_child_attempt_snapshot(attempt.id),
    'outcome', attempt.player_state ->> 'outcome'
  );
  insert into public.lesson_attempt_events (
    client_event_id, attempt_id, block_id, command, state_version_before, state_version_after,
    safe_payload, result_snapshot
  ) values (
    p_client_event_id, attempt.id, p_block_id, 'submit_response', before_version, attempt.state_version,
    jsonb_build_object('providerProcessed', true, 'rawAudioStored', false), snapshot
  );
  insert into public.provider_metadata (provider, operation, model_id, status, safe_metadata)
  values ('elevenlabs', 'speech_to_text', left(coalesce(p_provider_model, ''), 80), 'completed',
    jsonb_build_object('outcome', p_provider_outcome, 'rawAudioStored', false));
  return snapshot;
end;
$$;

-- Preflight only approved weekly plans. Invalid hosted data aborts the transaction
-- instead of being guessed into an authoritative week.
do $$
declare plan public.generated_artifacts;
begin
  for plan in select * from public.generated_artifacts where kind = 'weekly_plan' and status = 'approved'
  loop
    if not private.artifact_snapshot_is_current(plan.id)
       or jsonb_typeof(plan.content -> 'days') <> 'array'
       or jsonb_array_length(plan.content -> 'days') <> 5
       or (select count(distinct (value ->> 'day')::integer) from jsonb_array_elements(plan.content -> 'days')) <> 5
       or exists (select 1 from jsonb_array_elements(plan.content -> 'days') value where (value ->> 'day')::integer not between 1 and 5) then
      raise exception 'Approved weekly plan % cannot be backfilled safely', plan.id;
    end if;
  end loop;
end;
$$;

-- Backfill already-approved weekly plans into private planned weeks and exactly
-- five slots. This is not an assignment and never publishes a lesson.
insert into public.learning_weeks (
  child_id, curriculum_unit_id, weekly_plan_artifact_id, status, created_by
)
select child.id, plan.curriculum_unit_id, plan.id, 'planned', plan.created_by
from public.generated_artifacts plan
cross join lateral (select id from public.child_profiles order by created_at limit 1) child
where plan.kind = 'weekly_plan' and plan.status = 'approved';

insert into public.week_day_slots (
  learning_week_id, weekly_plan_artifact_id, day_number, title, objective,
  duration_minutes, lesson_kind, target_ids, review_target_ids, target_set_hash
)
select week.id, plan.id, (day.value ->> 'day')::smallint,
  day.value ->> 'title', day.value ->> 'objective', (day.value ->> 'durationMinutes')::smallint,
  (day.value ->> 'lessonKind')::public.artifact_kind,
  array(select jsonb_array_elements_text(coalesce(day.value -> 'targetIds', '[]'::jsonb)) order by 1),
  array(select jsonb_array_elements_text(coalesce(day.value -> 'reviewTargetIds', '[]'::jsonb)) order by 1),
  md5(coalesce((
    select string_agg(value, ',' order by value)
    from jsonb_array_elements_text(
      coalesce(day.value -> 'targetIds', '[]'::jsonb) || coalesce(day.value -> 'reviewTargetIds', '[]'::jsonb)
    ) value
  ), ''))
from public.learning_weeks week
join public.generated_artifacts plan on plan.id = week.weekly_plan_artifact_id
cross join lateral jsonb_array_elements(plan.content -> 'days') day(value);

insert into public.week_day_targets (week_day_slot_id, target_type, target_id, role)
select slot.id, snapshot_target.value ->> 'kind', target.value::uuid, target.role
from public.week_day_slots slot
join public.generated_artifacts plan on plan.id = slot.weekly_plan_artifact_id
cross join lateral (
  select value, 'new'::text as role from unnest(slot.target_ids) value
  union all
  select value, 'review'::text as role from unnest(slot.review_target_ids) value
) target
cross join lateral (
  select value from jsonb_array_elements(coalesce(plan.curriculum_snapshot -> 'targets', '[]'::jsonb)) value
  where value ->> 'id' = target.value limit 1
) snapshot_target
on conflict (week_day_slot_id, target_type, target_id) do nothing;

update public.generated_artifacts lesson
set week_day_slot_id = slot.id, binding_status = 'unverified'
from public.week_day_slots slot
where lesson.kind in ('daily_lesson', 'review_lesson', 'story_lesson')
  and lesson.parent_artifact_id = slot.weekly_plan_artifact_id
  and lesson.day_number = slot.day_number
  and lesson.kind = slot.lesson_kind;

update public.generated_artifacts
set binding_status = 'invalid',
    binding_report = jsonb_build_object('issues', jsonb_build_array('legacy_lesson_has_no_exact_week_day_binding')),
    binding_validated_at = now(), runtime_ready = false
where kind in ('daily_lesson', 'review_lesson', 'story_lesson') and week_day_slot_id is null;

do $$
declare artifact_id_value uuid;
begin
  for artifact_id_value in
    select id from public.generated_artifacts
    where kind in ('daily_lesson', 'review_lesson', 'story_lesson') and week_day_slot_id is not null
  loop
    if private.validate_lesson_binding(artifact_id_value) then
      perform private.prepare_lesson_runtime(artifact_id_value);
    end if;
  end loop;
end;
$$;

-- Preserve all old attempts and evidence, but quarantine their client-authored
-- authority. No normal assignment row is created by this migration.
update public.lesson_attempts
set legacy_quarantined = true,
    quarantine_reason = 'Legacy pre-Recovery-1 attempt; parent must explicitly republish.',
    mode = 'learning', attempt_sequence = 1;

do $$
declare
  attempt_record record;
  quarantine_assignment public.lesson_assignments;
begin
  for attempt_record in
    select attempt.id as attempt_id, attempt.child_id, attempt.lesson_artifact_id,
      lesson.week_day_slot_id, lesson.created_by
    from public.lesson_attempts attempt
    join public.generated_artifacts lesson on lesson.id = attempt.lesson_artifact_id
    where lesson.week_day_slot_id is not null
  loop
    insert into public.lesson_assignments (
      child_id, week_day_slot_id, lesson_artifact_id, status, primary_attempt_mode,
      quarantine_reason, created_by
    ) values (
      attempt_record.child_id, attempt_record.week_day_slot_id, attempt_record.lesson_artifact_id,
      'quarantined', 'learning', 'Legacy pre-Recovery-1 attempt; never auto-published.', attempt_record.created_by
    ) returning * into quarantine_assignment;
    update public.lesson_attempts set assignment_id = quarantine_assignment.id
    where id = attempt_record.attempt_id;
  end loop;
end;
$$;

update public.activity_evidence evidence
set authority = 'legacy_client_asserted',
    attempt_mode = attempt.mode,
    rule_version = 'legacy-v1',
    qualifies_for_completion = false,
    metadata = coalesce(evidence.metadata, '{}'::jsonb) || jsonb_build_object('legacyAuthority', true)
from public.lesson_attempts attempt
where attempt.id = evidence.attempt_id;

insert into public.lesson_attempt_block_states (
  attempt_id, block_id, block_index, status, first_presented_at, completed_at, state
)
select attempt.id, runtime.block_id, runtime.block_index,
  case
    when attempt.status = 'completed' or runtime.block_index < attempt.current_block_index then 'completed'::public.attempt_block_status
    when runtime.block_index = attempt.current_block_index and attempt.status in ('in_progress', 'paused') then 'active'::public.attempt_block_status
    else 'pending'::public.attempt_block_status
  end,
  case when runtime.block_index <= attempt.current_block_index then attempt.started_at else null end,
  case when attempt.status = 'completed' or runtime.block_index < attempt.current_block_index then coalesce(attempt.completed_at, attempt.last_activity_at) else null end,
  jsonb_build_object('legacyImported', true)
from public.lesson_attempts attempt
join private.lesson_runtime_blocks runtime on runtime.lesson_artifact_id = attempt.lesson_artifact_id;

update public.lesson_attempts attempt
set current_block_id = state.block_id
from public.lesson_attempt_block_states state
where state.attempt_id = attempt.id and state.status = 'active';

alter table public.lesson_attempts validate constraint lesson_attempt_assignment_required;

alter table public.activity_evidence
  drop constraint if exists activity_evidence_client_event_id_key;

alter table public.generated_artifacts
  add constraint generated_artifact_exact_day_binding
  foreign key (week_day_slot_id, parent_artifact_id, day_number, kind)
  references public.week_day_slots (id, weekly_plan_artifact_id, day_number, lesson_kind)
  on delete restrict not valid;

alter table public.generated_artifacts validate constraint generated_artifact_exact_day_binding;

alter table public.generated_artifacts
  add constraint generated_artifact_binding_shape check (
    (kind in ('daily_lesson', 'review_lesson', 'story_lesson') and (
      (week_day_slot_id is not null and binding_status in ('unverified', 'valid', 'invalid'))
      or (week_day_slot_id is null and binding_status = 'invalid')
    ))
    or (kind not in ('daily_lesson', 'review_lesson', 'story_lesson')
      and week_day_slot_id is null and binding_status = 'not_applicable')
  ) not valid;

alter table public.generated_artifacts validate constraint generated_artifact_binding_shape;

do $$
begin
  if exists (
    select 1
    from public.week_day_slots slot
    where (
      select count(*) from public.week_day_targets target where target.week_day_slot_id = slot.id
    ) <> cardinality(array(select distinct value from unnest(slot.target_ids || slot.review_target_ids) value))
  ) then raise exception 'A backfilled week target could not be resolved against the approved snapshot'; end if;
  if exists (select 1 from public.lesson_assignments where status = 'published') then
    raise exception 'Recovery migration must never auto-publish an assignment';
  end if;
  if exists (select 1 from public.lesson_assignments where status not in ('quarantined')) then
    raise exception 'Recovery migration must not create normal assignments';
  end if;
end;
$$;

create or replace function private.enforce_artifact_recovery_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.kind in ('daily_lesson', 'review_lesson', 'story_lesson') then
    if new.week_day_slot_id is null then
      raise exception 'Every new lesson version must bind to an exact approved week day';
    end if;
    new.binding_status := 'unverified';
    new.binding_report := '{}'::jsonb;
    new.binding_validated_at := null;
    new.runtime_ready := false;
    new.runtime_report := '{}'::jsonb;
  end if;
  if tg_op = 'UPDATE' then
    if new.kind is distinct from old.kind
       or new.curriculum_unit_id is distinct from old.curriculum_unit_id
       or new.curriculum_snapshot is distinct from old.curriculum_snapshot
       or new.content is distinct from old.content
       or new.parent_artifact_id is distinct from old.parent_artifact_id
       or new.day_number is distinct from old.day_number
       or new.week_day_slot_id is distinct from old.week_day_slot_id then
      raise exception 'Generated artifact identity and content are immutable';
    end if;
  end if;
  if new.status = 'approved' and new.kind in ('daily_lesson', 'review_lesson', 'story_lesson')
     and (new.binding_status <> 'valid' or not new.runtime_ready) then
    raise exception 'Only an exactly bound runtime-ready lesson can be approved';
  end if;
  return new;
end;
$$;

create trigger generated_artifact_recovery_contract
before insert or update on public.generated_artifacts
for each row execute function private.enforce_artifact_recovery_contract();

create or replace function public.approve_generated_artifact(p_artifact_id uuid, p_note text)
returns public.generated_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  artifact public.generated_artifacts;
  current_unit public.curriculum_units;
begin
  if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'Approval note must contain at least 5 characters'; end if;
  select * into artifact from public.generated_artifacts where id = p_artifact_id for update;
  if artifact.id is null or artifact.status <> 'validated' then raise exception 'Only a validated artifact can be approved'; end if;
  select * into current_unit from public.curriculum_units where id = artifact.curriculum_unit_id;
  if current_unit.status <> 'approved'
     or artifact.curriculum_snapshot ->> 'unitVersion' <> current_unit.version::text
     or artifact.curriculum_snapshot ->> 'approvedAt' <> to_jsonb(current_unit.approved_at) #>> '{}' then
    raise exception 'The curriculum snapshot is stale';
  end if;
  if artifact.kind <> 'weekly_plan' and artifact.kind <> 'parent_summary' then
    if not exists (
      select 1 from public.generated_artifacts parent
      where parent.id = artifact.parent_artifact_id and parent.kind = 'weekly_plan' and parent.status = 'approved'
    ) then raise exception 'The exact parent weekly plan is not approved'; end if;
    if not private.validate_lesson_binding(artifact.id) or not private.prepare_lesson_runtime(artifact.id) then
      raise exception 'Lesson binding or runtime preparation failed';
    end if;
    select * into artifact from public.generated_artifacts where id = artifact.id for update;
  end if;
  update public.generated_artifacts set status = 'approved'
  where id = artifact.id returning * into artifact;
  insert into public.approval_records (entity_type, entity_id, action, note, actor_id)
  values ('generated_artifact', artifact.id, 'approved', trim(p_note), actor_id_value);
  perform private.write_recovery_audit('artifact.approved_private', 'generated_artifact', artifact.id::text,
    jsonb_build_object('kind', artifact.kind, 'version', artifact.version, 'note', trim(p_note), 'published', false));
  return artifact;
end;
$$;

create or replace function public.archive_learning_week(p_learning_week_id uuid, p_reason text)
returns public.learning_weeks
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id_value uuid := private.require_parent();
  week public.learning_weeks;
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'An archive reason is required'; end if;
  if exists (
    select 1 from public.lesson_assignments assignment
    join public.week_day_slots slot on slot.id = assignment.week_day_slot_id
    where slot.learning_week_id = p_learning_week_id and assignment.status in ('assigned', 'scheduled', 'published')
  ) then raise exception 'Withdraw or replace active assignments before archiving the week'; end if;
  update public.learning_weeks
  set status = 'archived', archived_at = now(), archived_by = actor_id_value, archive_reason = trim(p_reason)
  where id = p_learning_week_id and status in ('planned', 'active', 'completed')
  returning * into week;
  if week.id is null then raise exception 'Learning week cannot be archived'; end if;
  perform private.write_recovery_audit('learning_week.archived', 'learning_week', week.id::text,
    jsonb_build_object('reason', trim(p_reason)));
  return week;
end;
$$;

-- Remove every broad table mutation policy. Authenticated users retain parent-only
-- reads; all writes must pass through the audited security-definer functions.
do $$
declare
  table_name_value text;
  policy_record record;
begin
  foreach table_name_value in array array[
    'parent_allowlist', 'parent_profiles', 'curriculum_phases', 'curriculum_units',
    'vocabulary_items', 'sentence_frames', 'phonics_targets', 'writing_targets',
    'child_profiles', 'generated_artifacts', 'generation_jobs', 'approval_records',
    'curriculum_overrides', 'lesson_attempts', 'activity_evidence', 'mastery_records',
    'review_schedules', 'provider_metadata', 'child_sessions', 'audit_events',
    'learning_weeks', 'week_day_slots', 'week_day_targets', 'lesson_assignments',
    'lesson_attempt_block_states', 'lesson_response_events', 'lesson_attempt_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name_value);
    for policy_record in
      select policyname from pg_policies where schemaname = 'public' and tablename = table_name_value
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, table_name_value);
    end loop;
    execute format('revoke insert, update, delete on table public.%I from authenticated', table_name_value);
    execute format('revoke all on table public.%I from anon', table_name_value);
    execute format('grant select on table public.%I to authenticated', table_name_value);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_parent()))',
      table_name_value || '_recovery_parent_read', table_name_value
    );
  end loop;
end;
$$;

-- Old browser-authoritative mutations are deliberately disabled. Compatibility
-- code must migrate to start_child_assignment + command_child_attempt.
revoke all on function public.start_child_lesson(uuid) from public, anon, authenticated;
revoke all on function public.save_child_lesson_progress(uuid, integer, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_child_activity_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_child_speech_evidence(uuid, uuid, text, uuid, text, boolean, text, boolean, integer, integer, text, numeric, text, text) from public, anon, authenticated;
revoke all on function public.complete_child_lesson(uuid) from public, anon, authenticated;

revoke all on function public.create_learning_week_from_plan(uuid, uuid, date, text, text) from public, anon;
revoke all on function public.schedule_lesson_assignment(uuid, uuid, timestamptz, timestamptz, text) from public, anon;
revoke all on function public.publish_lesson_assignment(uuid, text) from public, anon;
revoke all on function public.set_lesson_assignment_replay(uuid, boolean, text) from public, anon;
revoke all on function public.replace_lesson_assignment(uuid, uuid, text, timestamptz, timestamptz, text) from public, anon;
revoke all on function public.withdraw_lesson_assignment(uuid, text) from public, anon;
revoke all on function public.archive_lesson_assignment(uuid, text) from public, anon;
revoke all on function public.revoke_generated_artifact_approval(uuid, text) from public, anon;
revoke all on function public.archive_generated_artifact(uuid, text) from public, anon;
revoke all on function public.archive_learning_week(uuid, text) from public, anon;
revoke all on function public.get_child_lesson_home() from public, anon;
revoke all on function public.get_child_attempt_snapshot(uuid) from public, anon;
revoke all on function public.get_child_lesson_attempt(uuid) from public, anon;
revoke all on function public.start_child_assignment(uuid, public.lesson_attempt_mode, uuid) from public, anon;
revoke all on function public.command_child_attempt(uuid, uuid, bigint, text, text, jsonb) from public, anon;
revoke all on function public.record_child_speech_provider_result_v2(uuid, uuid, bigint, text, text, numeric, text, text, integer) from public, anon, authenticated;

grant execute on function public.create_learning_week_from_plan(uuid, uuid, date, text, text) to authenticated;
grant execute on function public.schedule_lesson_assignment(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.publish_lesson_assignment(uuid, text) to authenticated;
grant execute on function public.set_lesson_assignment_replay(uuid, boolean, text) to authenticated;
grant execute on function public.replace_lesson_assignment(uuid, uuid, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.withdraw_lesson_assignment(uuid, text) to authenticated;
grant execute on function public.archive_lesson_assignment(uuid, text) to authenticated;
grant execute on function public.revoke_generated_artifact_approval(uuid, text) to authenticated;
grant execute on function public.archive_generated_artifact(uuid, text) to authenticated;
grant execute on function public.archive_learning_week(uuid, text) to authenticated;
grant execute on function public.approve_generated_artifact(uuid, text) to authenticated;
grant execute on function public.get_child_lesson_home() to authenticated;
grant execute on function public.get_child_attempt_snapshot(uuid) to authenticated;
grant execute on function public.get_child_lesson_attempt(uuid) to authenticated;
grant execute on function public.start_child_assignment(uuid, public.lesson_attempt_mode, uuid) to authenticated;
grant execute on function public.command_child_attempt(uuid, uuid, bigint, text, text, jsonb) to authenticated;
grant execute on function public.record_child_speech_provider_result_v2(uuid, uuid, bigint, text, text, numeric, text, text, integer) to service_role;

revoke all on function private.assert_week_has_five_slots() from public, anon, authenticated;
revoke all on function private.validate_week_target() from public, anon, authenticated;
revoke all on function private.enforce_artifact_recovery_contract() from public, anon, authenticated;

comment on table public.learning_weeks is 'An approved weekly plan instantiated for one child; creation never publishes lessons.';
comment on table public.lesson_assignments is 'Explicit scheduling/publication boundary. Only status=published can create one child mission.';
comment on table private.lesson_runtime_blocks is 'Server-only child presentation and answer rules derived from an immutable lesson version.';
comment on function public.command_child_attempt(uuid, uuid, bigint, text, text, jsonb) is 'Single authoritative child mutation command. Browser correctness, support, retries, and progression are ignored and derived on the server.';
comment on function public.record_child_speech_provider_result_v2(uuid, uuid, bigint, text, text, numeric, text, text, integer) is 'Service-role-only persistence for derived speech results. Raw audio is prohibited.';

commit;
