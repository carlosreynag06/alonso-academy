create type public.generation_job_status as enum ('queued', 'running', 'succeeded', 'failed');

alter table public.generated_artifacts
  add column request_hash text,
  add column reasoning_effort text,
  add column semantic_validator_model_id text,
  add constraint generated_artifacts_reasoning_effort_check
    check (reasoning_effort is null or reasoning_effort in ('high'));

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  artifact_kind public.artifact_kind not null,
  curriculum_unit_id uuid not null references public.curriculum_units(id),
  curriculum_snapshot_id text not null,
  request_hash text not null,
  status public.generation_job_status not null default 'queued',
  attempts smallint not null default 0 check (attempts between 0 and 3),
  artifact_id uuid references public.generated_artifacts(id),
  requested_by uuid not null references auth.users(id),
  safe_error_code text,
  safe_error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_job_completion_consistent check (
    (status in ('queued', 'running') and completed_at is null)
    or (status in ('succeeded', 'failed') and completed_at is not null)
  ),
  constraint generation_job_success_has_artifact check (status <> 'succeeded' or artifact_id is not null),
  constraint generation_job_failure_is_safe check (
    status <> 'failed' or (safe_error_code is not null and safe_error_message is not null)
  )
);

create trigger generation_jobs_updated_at before update on public.generation_jobs
for each row execute function private.set_updated_at();

alter table public.generation_jobs enable row level security;
revoke all on table public.generation_jobs from anon;
grant select, insert, update on table public.generation_jobs to authenticated;

create policy generation_jobs_read on public.generation_jobs
for select to authenticated using ((select private.is_parent()));
create policy generation_jobs_insert on public.generation_jobs
for insert to authenticated with check (
  (select private.is_parent()) and requested_by = (select auth.uid())
);
create policy generation_jobs_update on public.generation_jobs
for update to authenticated using (
  (select private.is_parent()) and requested_by = (select auth.uid())
) with check (
  (select private.is_parent()) and requested_by = (select auth.uid())
);

create index generation_jobs_status_created_idx on public.generation_jobs (status, created_at);
create index generation_jobs_unit_kind_idx on public.generation_jobs (curriculum_unit_id, artifact_kind);
create index generated_artifacts_request_hash_idx on public.generated_artifacts (request_hash)
where request_hash is not null;

comment on table public.generation_jobs is 'Idempotent parent-requested generation jobs. Error fields must contain only non-sensitive metadata.';
comment on column public.generated_artifacts.curriculum_snapshot is 'Immutable approved curriculum boundary used by the generator and validators.';
