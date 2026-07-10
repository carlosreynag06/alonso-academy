create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.curriculum_status as enum ('draft', 'approved', 'inactive', 'archived');
create type public.artifact_kind as enum ('weekly_plan', 'daily_lesson', 'review_lesson', 'story_lesson', 'parent_summary');
create type public.artifact_status as enum ('draft', 'validating', 'validation_failed', 'validated', 'approved', 'active', 'completed', 'archived');
create type public.approval_action as enum ('approved', 'rejected', 'revoked');
create type public.mastery_stage as enum (
  'introduced',
  'assisted_success',
  'recognized',
  'understood_in_context',
  'used_with_prompt',
  'used_independently',
  'used_across_contexts',
  'stable_mastery'
);

create table public.parent_allowlist (
  email citext primary key,
  added_at timestamptz not null default now(),
  added_by uuid references auth.users(id),
  constraint parent_allowlist_normalized check (email = lower(email))
);

create table public.parent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name text not null default 'Parent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_profile_normalized check (email = lower(email))
);

create table public.curriculum_phases (
  code text primary key check (code in ('A', 'B', 'C', 'D', 'E', 'F')),
  sequence smallint not null unique check (sequence between 1 and 6),
  name text not null,
  purpose text not null,
  status public.curriculum_status not null default 'approved',
  created_at timestamptz not null default now()
);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  phase_code text not null references public.curriculum_phases(code),
  code text not null unique,
  title text not null,
  description text not null,
  version integer not null default 1 check (version > 0),
  status public.curriculum_status not null default 'draft',
  constraints jsonb not null default '{}'::jsonb,
  mastery_requirements jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_unit_approval_consistent check (
    (status = 'approved' and approved_at is not null and approved_by is not null)
    or (status <> 'approved' and approved_at is null and approved_by is null)
  )
);

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  canonical_text text not null,
  item_kind text not null check (item_kind in ('word', 'phrase')),
  part_of_speech text,
  theme text not null,
  communication_function text not null,
  priority smallint not null default 3 check (priority between 1 and 5),
  imageable boolean not null default false,
  gesture_support text,
  oral_ready boolean not null default true,
  reading_ready boolean not null default false,
  writing_ready boolean not null default false,
  status public.curriculum_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (unit_id, canonical_text)
);

create table public.sentence_frames (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  frame text not null,
  communication_function text not null,
  mode text not null check (mode in ('oral_only', 'readable', 'writable', 'fully_active')),
  acceptable_responses jsonb not null default '[]'::jsonb,
  recast_guidance text,
  status public.curriculum_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (unit_id, frame)
);

create table public.phonics_targets (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  phoneme text not null,
  grapheme text,
  target_type text not null check (target_type in ('sound_awareness', 'letter_sound_anchor', 'blending', 'segmenting', 'heart_word')),
  reading_allowed boolean not null default false,
  status public.curriculum_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (unit_id, phoneme, grapheme)
);

create table public.writing_targets (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  title text not null,
  demand text not null,
  activity_type text not null,
  status public.curriculum_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (unit_id, title)
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  preferred_name text not null default 'Alonso',
  home_language text not null default 'Spanish',
  target_language text not null default 'American English',
  current_phase_code text references public.curriculum_phases(code),
  current_unit_id uuid references public.curriculum_units(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generated_artifacts (
  id uuid primary key default gen_random_uuid(),
  kind public.artifact_kind not null,
  status public.artifact_status not null default 'draft',
  version integer not null check (version > 0),
  previous_version_id uuid references public.generated_artifacts(id),
  curriculum_unit_id uuid not null references public.curriculum_units(id),
  curriculum_snapshot jsonb not null,
  content jsonb not null,
  validation_report jsonb,
  model_id text,
  prompt_version text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, curriculum_unit_id, version),
  constraint artifact_approval_requires_validation check (status <> 'approved' or validation_report is not null)
);

create table public.approval_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('curriculum_unit', 'generated_artifact', 'phase_advancement')),
  entity_id uuid not null,
  action public.approval_action not null,
  note text,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.curriculum_overrides (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id),
  target_type text not null,
  target_id uuid,
  reason text not null check (length(trim(reason)) >= 10),
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  lesson_artifact_id uuid not null references public.generated_artifacts(id),
  status text not null check (status in ('in_progress', 'paused', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_evidence (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.lesson_attempts(id) on delete cascade,
  block_id text not null,
  target_type text not null,
  target_id uuid,
  evidence_type text not null,
  first_attempt boolean not null,
  support_level text not null,
  correct boolean,
  response_latency_ms integer check (response_latency_ms is null or response_latency_ms >= 0),
  retry_count smallint not null default 0 check (retry_count >= 0),
  transcript text,
  provider_confidence numeric check (provider_confidence is null or provider_confidence between 0 and 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.mastery_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  target_type text not null,
  target_id uuid not null,
  stage public.mastery_stage not null default 'introduced',
  evidence_count integer not null default 0 check (evidence_count >= 0),
  last_retrieved_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (child_id, target_type, target_id)
);

create table public.review_schedules (
  id uuid primary key default gen_random_uuid(),
  mastery_record_id uuid not null unique references public.mastery_records(id) on delete cascade,
  due_at timestamptz not null,
  priority smallint not null default 3 check (priority between 1 and 5),
  reason text not null,
  updated_at timestamptz not null default now()
);

create table public.provider_metadata (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai', 'elevenlabs', 'supabase')),
  operation text not null,
  external_id text,
  model_id text,
  status text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.child_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  token_hash text not null unique,
  active_lesson_id uuid references public.generated_artifacts(id),
  issued_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint child_session_expiry check (expires_at > created_at)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  event_type text not null,
  entity_type text not null,
  entity_id text,
  safe_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_parent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_allowlist allowlist
    where allowlist.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;

revoke all on function private.is_parent() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_parent() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger parent_profiles_updated_at before update on public.parent_profiles
for each row execute function private.set_updated_at();
create trigger curriculum_units_updated_at before update on public.curriculum_units
for each row execute function private.set_updated_at();
create trigger child_profiles_updated_at before update on public.child_profiles
for each row execute function private.set_updated_at();
create trigger generated_artifacts_updated_at before update on public.generated_artifacts
for each row execute function private.set_updated_at();
create trigger mastery_records_updated_at before update on public.mastery_records
for each row execute function private.set_updated_at();
create trigger review_schedules_updated_at before update on public.review_schedules
for each row execute function private.set_updated_at();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'parent_allowlist', 'parent_profiles', 'curriculum_phases', 'curriculum_units',
    'vocabulary_items', 'sentence_frames', 'phonics_targets', 'writing_targets',
    'child_profiles', 'generated_artifacts', 'approval_records', 'curriculum_overrides',
    'lesson_attempts', 'activity_evidence', 'mastery_records', 'review_schedules',
    'provider_metadata', 'child_sessions', 'audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select private.is_parent())) with check ((select private.is_parent()))',
      table_name || '_parent_access', table_name
    );
  end loop;
end
$$;

drop policy parent_allowlist_parent_access on public.parent_allowlist;
create policy parent_allowlist_read on public.parent_allowlist
for select to authenticated using ((select private.is_parent()));

drop policy approval_records_parent_access on public.approval_records;
create policy approval_records_read on public.approval_records
for select to authenticated using ((select private.is_parent()));
create policy approval_records_insert on public.approval_records
for insert to authenticated with check ((select private.is_parent()) and actor_id = (select auth.uid()));

drop policy audit_events_parent_access on public.audit_events;
create policy audit_events_read on public.audit_events
for select to authenticated using ((select private.is_parent()));
create policy audit_events_insert on public.audit_events
for insert to authenticated with check ((select private.is_parent()) and actor_id = (select auth.uid()));

create index curriculum_units_phase_status_idx on public.curriculum_units (phase_code, status);
create index vocabulary_items_unit_status_idx on public.vocabulary_items (unit_id, status);
create index generated_artifacts_status_idx on public.generated_artifacts (status, kind);
create index approval_records_entity_idx on public.approval_records (entity_type, entity_id, created_at desc);
create index activity_evidence_attempt_idx on public.activity_evidence (attempt_id, created_at);
create index review_schedules_due_idx on public.review_schedules (due_at, priority desc);
create index audit_events_created_idx on public.audit_events (created_at desc);

create or replace function public.ensure_parent_profile()
returns public.parent_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.parent_profiles;
  email_value text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
begin
  if not private.is_parent() or (select auth.uid()) is null then
    raise exception 'Parent access is not authorized';
  end if;

  insert into public.parent_profiles (id, email)
  values ((select auth.uid()), email_value)
  on conflict (id) do update set email = excluded.email
  returning * into profile;

  return profile;
end;
$$;

create or replace function public.approve_curriculum_unit(p_unit_id uuid, p_reason text)
returns public.curriculum_units
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_unit public.curriculum_units;
begin
  if not private.is_parent() or (select auth.uid()) is null then
    raise exception 'Parent access is not authorized';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception 'Approval reason must contain at least 10 characters';
  end if;

  update public.curriculum_units
  set status = 'approved', approved_at = now(), approved_by = (select auth.uid())
  where id = p_unit_id and status = 'draft'
  returning * into approved_unit;

  if approved_unit.id is null then
    raise exception 'Only a draft curriculum unit can be approved';
  end if;

  update public.vocabulary_items set status = 'approved' where unit_id = p_unit_id and status = 'draft';
  update public.sentence_frames set status = 'approved' where unit_id = p_unit_id and status = 'draft';
  update public.phonics_targets set status = 'approved' where unit_id = p_unit_id and status = 'draft';
  update public.writing_targets set status = 'approved' where unit_id = p_unit_id and status = 'draft';

  insert into public.approval_records (entity_type, entity_id, action, note, actor_id)
  values ('curriculum_unit', p_unit_id, 'approved', trim(p_reason), (select auth.uid()));
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, safe_details)
  values ((select auth.uid()), 'curriculum.unit.approved', 'curriculum_unit', p_unit_id::text, jsonb_build_object('reason', trim(p_reason)));

  return approved_unit;
end;
$$;

revoke all on function public.ensure_parent_profile() from public, anon;
revoke all on function public.approve_curriculum_unit(uuid, text) from public, anon;
grant execute on function public.ensure_parent_profile() to authenticated;
grant execute on function public.approve_curriculum_unit(uuid, text) to authenticated;

insert into public.curriculum_phases (code, sequence, name, purpose) values
  ('A', 1, 'Sound, Meaning, and Confidence', 'Establish English sound recognition, connect words with pictures and actions, teach first routines, and introduce letter-sound anchors.'),
  ('B', 2, 'Core Oral Vocabulary and Survival Phrases', 'Build useful vocabulary for wants, needs, objects, actions, feelings, questions, and locations.'),
  ('C', 3, 'Sentence Frames and Guided Interaction', 'Move from isolated words into productive short sentences and controlled dialogues.'),
  ('D', 4, 'Phonemic Awareness, Phonics, and Early Decoding', 'Teach systematic sound-symbol relationships, blending, segmenting, and controlled decoding.'),
  ('E', 5, 'Connected Reading and Sentence Writing', 'Develop short connected reading, comprehension, dictation, sequencing, and sentence writing.'),
  ('F', 6, 'Narration, Explanation, Conversation, and School Language', 'Develop longer oral turns, retelling, explanation, clarification, opinion, and classroom language.');

with unit as (
  insert into public.curriculum_units (
    phase_code, code, title, description, status, constraints, mastery_requirements
  ) values (
    'A',
    'A-U1',
    'Hello, Listen, and Respond',
    'Draft pilot unit for greetings, simple classroom responses, and first sound anchors. Parent approval is required before use.',
    'draft',
    '{"lesson_days":5,"lesson_minutes":15,"max_new_oral_targets_per_lesson":3,"reading_demand":"none","writing_demand":"letter selection only","new_phonics_anchors_per_week":2,"translation":"parent support only","stories":"listening only"}'::jsonb,
    '{"minimum_independent_retrievals":2,"minimum_contexts":2,"requires_parent_approval":true,"completion_does_not_equal_mastery":true}'::jsonb
  ) returning id
), vocabulary(canonical_text, item_kind, part_of_speech, theme, communication_function, priority, imageable, gesture_support) as (
  values
    ('hello', 'word', 'interjection', 'greetings', 'greet someone', 1, false, 'wave'),
    ('goodbye', 'word', 'interjection', 'greetings', 'end an interaction', 1, false, 'wave goodbye'),
    ('yes', 'word', 'response', 'responses', 'affirm', 1, false, 'nod'),
    ('no', 'word', 'response', 'responses', 'decline or negate', 1, false, 'shake head'),
    ('please', 'word', 'politeness marker', 'routines', 'make a polite request', 2, false, null),
    ('thank you', 'phrase', 'social phrase', 'routines', 'express thanks', 2, false, null),
    ('listen', 'word', 'verb', 'learning routines', 'follow an oral direction', 1, true, 'hand near ear'),
    ('look', 'word', 'verb', 'learning routines', 'follow a visual direction', 1, true, 'point to eyes'),
    ('point', 'word', 'verb', 'learning routines', 'respond with a gesture', 1, true, 'point'),
    ('stop', 'word', 'verb', 'learning routines', 'stop an action', 1, true, 'open palm')
)
insert into public.vocabulary_items (
  unit_id, canonical_text, item_kind, part_of_speech, theme,
  communication_function, priority, imageable, gesture_support, status
)
select unit.id, vocabulary.*, 'draft'::public.curriculum_status from unit cross join vocabulary;

with unit as (select id from public.curriculum_units where code = 'A-U1')
insert into public.sentence_frames (unit_id, frame, communication_function, mode, acceptable_responses, recast_guidance, status)
select unit.id, frame, communication_function, 'oral_only', responses::jsonb, recast_guidance, 'draft'
from unit cross join (values
  ('Hello!', 'greet someone', '["Hello!","Hi!"]', 'Model once and accept an intelligible greeting.'),
  ('My name is ___.', 'introduce oneself', '["My name is Alonso.","Alonso."]', 'Recast the full frame without requiring repetition.'),
  ('Yes, please.', 'accept politely', '["Yes, please.","Yes."]', 'Model the polite form after meaning is clear.'),
  ('No, thank you.', 'decline politely', '["No, thank you.","No."]', 'Model the polite form after meaning is clear.')
) as frames(frame, communication_function, responses, recast_guidance);

with unit as (select id from public.curriculum_units where code = 'A-U1')
insert into public.phonics_targets (unit_id, phoneme, grapheme, target_type, reading_allowed, status, metadata)
select unit.id, phoneme, grapheme, 'letter_sound_anchor', false, 'draft', metadata::jsonb
from unit cross join (values
  ('/m/', 'm', '{"examples":["moon","map"],"instruction":"sound recognition only"}'),
  ('/s/', 's', '{"examples":["sun","sock"],"instruction":"sound recognition only"}')
) as targets(phoneme, grapheme, metadata);

with unit as (select id from public.curriculum_units where code = 'A-U1')
insert into public.writing_targets (unit_id, title, demand, activity_type, status, metadata)
select unit.id, 'Choose the sound letter', 'Select m or s after hearing its anchor sound.', 'letter_selection', 'draft', '{"typing_required":false}'::jsonb
from unit;

insert into public.child_profiles (preferred_name, current_phase_code)
values ('Alonso', 'A');

comment on table public.parent_allowlist is 'Intentionally empty after migration. Add exactly one parent email through an approved administrative action.';
comment on table public.child_sessions is 'Stores hashes only. Raw child-session bearer tokens must never be persisted.';
comment on table public.activity_evidence is 'Raw child audio is prohibited. Transcript and derived evidence only.';
