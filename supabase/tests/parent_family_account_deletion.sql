-- Transaction-only synthetic test. All fixtures roll back.
-- Run only after applying the account-deletion migration.
begin;
create temp table star_deletion_fixture (
 parent_id uuid default gen_random_uuid(),
 child_id uuid default gen_random_uuid(),
 other_guardian_id uuid default gen_random_uuid(),
 staff_id uuid default gen_random_uuid(),
 player_id uuid default gen_random_uuid()
) on commit drop;
insert into star_deletion_fixture default values;

insert into auth.users(id,aud,role)
 select id,'authenticated','authenticated'
 from star_deletion_fixture f
 cross join lateral unnest(array[f.parent_id,f.child_id,f.other_guardian_id,f.staff_id]) id;

insert into public.guardian_profiles(user_id,display_name)
 select parent_id,'Synthetic Parent' from star_deletion_fixture
 union all select other_guardian_id,'Synthetic Other Guardian' from star_deletion_fixture
 on conflict (user_id) do nothing;
insert into public.staff_members(user_id,role,active)
 select staff_id,'coach',true from star_deletion_fixture;
insert into public.coaching_players(
 id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by
) select player_id,'Synthetic','Child','Assessment',true,parent_id,parent_id
from star_deletion_fixture;
insert into public.guardian_player_links(guardian_id,player_id,approved_by)
 select parent_id,player_id,staff_id from star_deletion_fixture;
insert into public.player_account_links(user_id,player_id,approved_by)
 select child_id,player_id,parent_id from star_deletion_fixture;
do $$
declare p uuid; c uuid; a jsonb; blocked boolean;
begin
 select parent_id,child_id into p,c from star_deletion_fixture;
 a:=public.star_family_account_deletion_plan(p);
 if a->>'child_count'<>'1' or a->'child_ids'<>jsonb_build_array(c) then
  raise exception 'Expected exactly one linked child login';
 end if;
 if a->>'linked_player_count'<>'1' then raise exception 'Expected one linked coaching profile';end if;
 blocked:=false;
 begin
  perform public.star_family_account_deletion_plan(c);
 exception when others then
  blocked:=true;
 end;
 if not blocked then raise exception 'Child account could initiate family deletion';end if;
end $$;

insert into public.guardian_player_links(guardian_id,player_id,approved_by)
 select other_guardian_id,player_id,staff_id from star_deletion_fixture;
do $$
declare p uuid; blocked boolean:=false;
begin
 select parent_id into p from star_deletion_fixture;
 begin
  perform public.star_family_account_deletion_plan(p);
 exception when others then blocked:=true;
 end;
 if not blocked then raise exception 'Shared child identity should block family deletion';end if;
end $$;
delete from public.guardian_player_links
where guardian_id=(select other_guardian_id from star_deletion_fixture);
do $$
declare p uuid; c uuid; result jsonb;
begin
 select parent_id,child_id into p,c from star_deletion_fixture;
 result:=public.star_family_account_deletion_cleanup(p);
 if result->'child_ids'<>jsonb_build_array(c) then raise exception 'Child deletion IDs not persisted'; end if;
 if exists(select 1 from public.guardian_profiles where user_id=p) then raise exception 'Parent profile not deleted';end if;
 if exists(select 1 from public.guardian_player_links where guardian_id=p) then raise exception 'Parent family access not revoked';end if;
 if exists(select 1 from public.player_account_links where user_id=c) then raise exception 'Child access not revoked';end if;
 if not exists(select 1 from public.coaching_players where created_by=p and consent_recorded_by=p) then
  raise exception 'Protected coaching audit attribution was destroyed';
 end if;
 if not exists(select 1 from star_private.family_account_deletion_jobs where guardian_id=p and c=any(child_ids)) then
  raise exception 'Interrupted deletion would not be retryable';
 end if;
 result:=public.star_family_account_deletion_cleanup(p);
 if result->'child_ids'<>jsonb_build_array(c) then raise exception 'Retry dropped child login ID';end if;
end $$;
rollback;
select 'PASS: synthetic parent and child deletion checks, isolation, audit preservation, retry. All test data rolled back.' as result;