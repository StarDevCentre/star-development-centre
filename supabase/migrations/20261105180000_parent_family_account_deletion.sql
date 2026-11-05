-- Parent-initiated account deletion. Service-role only; never grant to browser roles.
-- The Edge Function verifies the existing JWT and reauthenticates with the password.
-- Retain staff coaching/booking/safeguarding history, detached from deleted logins.
create or replace function public.star_family_account_deletion_plan(p_guardian uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_children uuid[] := array[]::uuid[];
  v_all uuid[];
  v_all_text text[];
  v_files jsonb := '[]'::jsonb;
  v_linked_players integer := 0;
begin
  if p_guardian is null or not exists(select 1 from auth.users where id=p_guardian) then
    raise exception 'Account not found.';
  end if;
  -- Business users must be handled separately to avoid orphaning STAR organisations.
  if exists(select 1 from public.staff_members where user_id=p_guardian)
    or exists(select 1 from public.star_organisation_members where user_id=p_guardian)
    or exists(select 1 from public.star_organisations where created_by=p_guardian) then
    raise exception 'Accounts also used for staff or organisation access require STAR assistance.';
  end if;
  select count(*) into v_linked_players from public.guardian_player_links where guardian_id=p_guardian;
  select coalesce(array_agg(distinct u.user_id),array[]::uuid[]) into v_children from (
    select pal.user_id
      from public.player_account_links pal
      join public.guardian_player_links gl on gl.player_id=pal.player_id
      where gl.guardian_id=p_guardian
    union
    select i.player_user_id as user_id
      from public.player_intakes i where i.guardian_id=p_guardian
  ) u where u.user_id is not null and u.user_id<>p_guardian;
  -- Never delete an identity whose player is also linked to another guardian.
  if exists (
    select 1 from public.player_account_links pal
    join public.guardian_player_links gl on gl.player_id=pal.player_id
    where pal.user_id=any(v_children) and gl.guardian_id<>p_guardian
  ) or exists (
    select 1 from public.player_intakes i
    join public.guardian_player_links gl on gl.player_id=i.portal_player_id
    where i.player_user_id=any(v_children) and gl.guardian_id<>p_guardian
  ) or exists (
    select 1 from public.player_account_links pal
    where pal.user_id=any(v_children)
      and not exists(select 1 from public.guardian_player_links gl where gl.player_id=pal.player_id and gl.guardian_id=p_guardian)
  ) or exists (
    select 1 from public.player_intakes i
    where i.player_user_id=any(v_children) and i.guardian_id is distinct from p_guardian
  ) then
    raise exception 'A child login is shared with another family. Contact STAR to arrange safe deletion.';
  end if;
  if exists(select 1 from public.guardian_profiles where user_id=any(v_children))
    or exists(select 1 from public.staff_members where user_id=any(v_children))
    or exists(select 1 from public.star_organisation_members where user_id=any(v_children))
    or exists(select 1 from public.star_organisations where created_by=any(v_children)) then
    raise exception 'A linked child login has another account role. Contact STAR for safe deletion.';
  end if;
  v_all := array_append(v_children,p_guardian);
  v_all_text := array(select x::text from unnest(v_all) x);
  select coalesce(jsonb_agg(jsonb_build_object('bucket',o.bucket_id,'name',o.name)),'[]'::jsonb)
    into v_files from storage.objects o
    where (o.owner=any(v_all) or o.owner_id=any(v_all_text))
      and o.bucket_id is not null and o.name is not null;
  return jsonb_build_object(
    'child_ids',to_jsonb(v_children),
    'child_count',cardinality(v_children),
    'linked_player_count',v_linked_players,
    'files',v_files
  );
end $$;

create or replace function public.star_family_account_deletion_cleanup(p_guardian uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_plan jsonb;
  v_child_ids uuid[];
  v_all uuid[];
  ref record;
begin
  -- Serialise concurrent deletion attempts against the authenticated account.
  perform 1 from auth.users where id=p_guardian for update;
  v_plan := public.star_family_account_deletion_plan(p_guardian);
  v_child_ids := array(select jsonb_array_elements_text(v_plan->'child_ids')::uuid);
  v_all := array_append(v_child_ids,p_guardian);
  if exists(
    select 1 from storage.objects
    where owner=any(v_all)
       or owner_id=any(array(select x::text from unnest(v_all) x))
  ) then
    raise exception 'Account files still need to be removed. Retry deletion.';
  end if;
  -- Delete parent-owned private interactions and family links.
  delete from public.family_messages where guardian_id=p_guardian;
  delete from public.family_session_requests where guardian_id=p_guardian;
  delete from public.player_training_diary where guardian_id=p_guardian;
  delete from public.player_account_invites where guardian_id=p_guardian;
  delete from public.guardian_player_links where guardian_id=p_guardian;
  delete from public.player_account_links where user_id=any(v_child_ids);
  -- Other application tables contain historical references to the account.
  -- Preserve coaching, attendance, invoices and audit records, but remove ID ties.
  -- FK references configured NO ACTION are currently nullable; fail closed if this changes.
  for ref in
    select c.conrelid::regclass as relation, a.attname as column_name, a.attnotnull as required
    from pg_constraint c
    join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    join pg_namespace n on n.oid=(select relnamespace from pg_class where oid=c.conrelid)
    where c.contype='f' and c.confrelid='auth.users'::regclass
      and c.confdeltype='a' and cardinality(c.conkey)=1
      and n.nspname in ('public','star_private')
  loop
    if ref.required then
      raise exception 'Account deletion requires a staff review of database references.';
    end if;
    execute format('update %s set %I=null where %I=any($1)',ref.relation,ref.column_name,ref.column_name)
      using v_all;
  end loop;
  return jsonb_build_object('child_ids',to_jsonb(v_child_ids));
end $$;

revoke all on function public.star_family_account_deletion_plan(uuid) from public,anon,authenticated;
revoke all on function public.star_family_account_deletion_cleanup(uuid) from public,anon,authenticated;
grant execute on function public.star_family_account_deletion_plan(uuid) to service_role;
grant execute on function public.star_family_account_deletion_cleanup(uuid) to service_role;