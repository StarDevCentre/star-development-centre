
create table star_private.org_register_entries(
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null references public.star_organisations(id),
 name text not null check(length(trim(name)) between 2 and 150)
);
create index org_register_entries_org on star_private.org_register_entries(organisation_id);
create table star_private.org_register_memberships(
 group_id uuid not null references star_private.org_groups(id) on delete cascade,
 entry_id uuid not null references star_private.org_register_entries(id) on delete cascade,
 primary key(group_id,entry_id)
);
create index org_register_memberships_entry on star_private.org_register_memberships(entry_id);
alter table star_private.org_register_entries enable row level security;
alter table star_private.org_register_memberships enable row level security;
create policy no_direct_access on star_private.org_register_entries for all using(false) with check(false);
create policy no_direct_access on star_private.org_register_memberships for all using(false) with check(false);
revoke all on star_private.org_register_entries,star_private.org_register_memberships from public,anon,authenticated;

create function star_private.organisation_register(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();org uuid:=(p_data->>'organisation_id')::uuid;entry uuid;gid uuid;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified account.';end if;
 if not exists(select 1 from public.star_organisations where id=org and active) or not (star_private.is_staff_manager() or star_private.org_member(org)) then raise exception 'Current organisation access required.';end if;
 if p_action='workspace' then
  return jsonb_build_object(
   'register_entries',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name,id) from star_private.org_register_entries where organisation_id=org),'[]'),
   'register_memberships',coalesce((select jsonb_agg(jsonb_build_object('group_id',m.group_id,'entry_id',m.entry_id)) from star_private.org_register_memberships m join star_private.org_groups g on g.id=m.group_id join star_private.org_register_entries e on e.id=m.entry_id where g.organisation_id=org and e.organisation_id=org and g.active),'[]'));
 elsif p_action='add_name' then
  gid:=nullif(p_data->>'group_id','')::uuid;
  if gid is not null then
   perform 1 from star_private.org_groups where id=gid and organisation_id=org and active for update;
   if not found then raise exception 'This group is unavailable.';end if;
  end if;
  insert into star_private.org_register_entries(organisation_id,name) values(org,trim(p_data->>'name')) returning id into entry;
  if gid is not null then insert into star_private.org_register_memberships values(gid,entry);end if;
 elsif p_action in ('rename_name','delete_name','name_membership') then
  entry:=(p_data->>'entry_id')::uuid;
  perform 1 from star_private.org_register_entries where id=entry and organisation_id=org for update;
  if not found then raise exception 'This register name is unavailable.';end if;
  if p_action='rename_name' then update star_private.org_register_entries set name=trim(p_data->>'name') where id=entry;
  elsif p_action='delete_name' then delete from star_private.org_register_entries where id=entry;
  else
   gid:=(p_data->>'group_id')::uuid;
   perform 1 from star_private.org_groups where id=gid and organisation_id=org and active for update;
   if not found then raise exception 'This group is unavailable.';end if;
   if (p_data->>'assigned')::boolean then insert into star_private.org_register_memberships values(gid,entry) on conflict do nothing;
   else delete from star_private.org_register_memberships where group_id=gid and entry_id=entry;end if;
  end if;
 else raise exception 'Unknown register action.';end if;
 return jsonb_build_object('ok',true);
end $$;
create function public.star_organisation_register(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select star_private.organisation_register(p_action,p_data)$$;
revoke all on function public.star_organisation_register(text,jsonb),star_private.organisation_register(text,jsonb) from public,anon;
grant execute on function public.star_organisation_register(text,jsonb),star_private.organisation_register(text,jsonb) to authenticated;
