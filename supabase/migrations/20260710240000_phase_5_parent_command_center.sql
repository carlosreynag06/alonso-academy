alter table public.generated_artifacts
  add column lineage_key text not null default 'default',
  add column parent_artifact_id uuid references public.generated_artifacts(id),
  add column day_number smallint check (day_number is null or day_number between 1 and 5);

alter table public.generated_artifacts
  drop constraint generated_artifacts_kind_curriculum_unit_id_version_key;

alter table public.generated_artifacts
  add constraint generated_artifacts_lineage_version_unique
  unique (kind, curriculum_unit_id, lineage_key, version);

alter table public.generated_artifacts
  add constraint generated_artifacts_lesson_parent_check check (
    (kind = 'weekly_plan' and parent_artifact_id is null and day_number is null)
    or (kind in ('daily_lesson', 'review_lesson', 'story_lesson') and parent_artifact_id is not null and day_number is not null)
    or kind = 'parent_summary'
  );

create index generated_artifacts_parent_idx on public.generated_artifacts (parent_artifact_id, day_number);
create index generated_artifacts_lineage_idx on public.generated_artifacts (lineage_key, version desc);

create or replace function public.approve_generated_artifact(p_artifact_id uuid, p_note text)
returns public.generated_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  artifact public.generated_artifacts;
  current_unit public.curriculum_units;
begin
  if not private.is_parent() or (select auth.uid()) is null then
    raise exception 'Parent access is not authorized';
  end if;
  if length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Approval note must contain at least 5 characters';
  end if;

  select * into artifact from public.generated_artifacts
  where id = p_artifact_id for update;
  if artifact.id is null or artifact.status <> 'validated' then
    raise exception 'Only a validated artifact can be approved';
  end if;

  select * into current_unit from public.curriculum_units where id = artifact.curriculum_unit_id;
  if current_unit.status <> 'approved'
     or artifact.curriculum_snapshot ->> 'unitVersion' <> current_unit.version::text
     or artifact.curriculum_snapshot ->> 'approvedAt' <> to_jsonb(current_unit.approved_at) #>> '{}' then
    raise exception 'The curriculum snapshot is stale';
  end if;

  if artifact.kind <> 'weekly_plan' and not exists (
    select 1 from public.generated_artifacts parent
    where parent.id = artifact.parent_artifact_id and parent.kind = 'weekly_plan' and parent.status = 'approved'
  ) then
    raise exception 'The parent weekly plan is not approved';
  end if;

  update public.generated_artifacts set status = 'approved'
  where id = p_artifact_id returning * into artifact;

  insert into public.approval_records (entity_type, entity_id, action, note, actor_id)
  values ('generated_artifact', artifact.id, 'approved', trim(p_note), (select auth.uid()));
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, safe_details)
  values ((select auth.uid()), 'artifact.approved', 'generated_artifact', artifact.id::text,
    jsonb_build_object('kind', artifact.kind, 'version', artifact.version));

  return artifact;
end;
$$;

create or replace function public.reject_generated_artifact(p_artifact_id uuid, p_note text)
returns public.generated_artifacts
language plpgsql
security definer
set search_path = ''
as $$
declare
  artifact public.generated_artifacts;
begin
  if not private.is_parent() or (select auth.uid()) is null then
    raise exception 'Parent access is not authorized';
  end if;
  if length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Rejection note must contain at least 5 characters';
  end if;

  update public.generated_artifacts set status = 'archived'
  where id = p_artifact_id and status in ('draft', 'validation_failed', 'validated')
  returning * into artifact;
  if artifact.id is null then
    raise exception 'This artifact cannot be rejected';
  end if;

  insert into public.approval_records (entity_type, entity_id, action, note, actor_id)
  values ('generated_artifact', artifact.id, 'rejected', trim(p_note), (select auth.uid()));
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, safe_details)
  values ((select auth.uid()), 'artifact.rejected', 'generated_artifact', artifact.id::text,
    jsonb_build_object('kind', artifact.kind, 'version', artifact.version));

  return artifact;
end;
$$;

revoke all on function public.approve_generated_artifact(uuid, text) from public, anon;
revoke all on function public.reject_generated_artifact(uuid, text) from public, anon;
grant execute on function public.approve_generated_artifact(uuid, text) to authenticated;
grant execute on function public.reject_generated_artifact(uuid, text) to authenticated;

comment on function public.approve_generated_artifact(uuid, text) is 'Approves only currently validated artifacts against the unchanged approved curriculum snapshot.';
comment on function public.reject_generated_artifact(uuid, text) is 'Archives a reviewable version and preserves the parent rejection note.';
