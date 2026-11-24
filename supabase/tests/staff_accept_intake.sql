-- Exercise both login arrangements using temporary synthetic families.
begin;
do $$
declare
 manager uuid;
 parent_id uuid;
 child_id uuid;
 draft public.player_intakes;
 accepted public.player_intakes;
 with_child boolean;
begin
 select user_id into strict manager from public.staff_members where active and role in ('owner','manager') limit 1;
 foreach with_child in array array[false,true] loop
  parent_id:=gen_random_uuid();
  child_id:=case when with_child then gen_random_uuid() end;
  insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at)
  select u,u||'@example.invalid','authenticated','authenticated',now(),now(),now()
  from unnest(array[parent_id,child_id]) u where u is not null;
  insert into public.guardian_profiles(user_id,display_name) values(parent_id,'Synthetic parent');
  insert into public.player_intakes(creator_id,guardian_id,player_user_id,first_name,last_name)
  values(parent_id,parent_id,child_id,'Synthetic','Player') returning * into draft;
  perform set_config('request.jwt.claim.sub',parent_id::text,true);
  begin
   perform public.staff_accept_intake(draft.id,draft.version);
   raise exception 'A family could approve itself';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',manager::text,true);
  accepted:=public.staff_accept_intake(draft.id,draft.version);
  if accepted.staff_accepted_by is distinct from manager or accepted.guardian_reviewed_at is not null
   or accepted.details<>draft.details or accepted.completed_at is not null
   or accepted.assessment_requested_at is not null
   or not exists(select from public.guardian_player_links where player_id=accepted.portal_player_id and guardian_id=parent_id)
   or not exists(select from public.player_space_profiles where player_id=accepted.portal_player_id)
   or not exists(select from public.coaching_players where id=accepted.portal_player_id and not consent_confirmed)
   or with_child is distinct from exists(select from public.player_account_links where player_id=accepted.portal_player_id and user_id=child_id)
  then raise exception 'Incorrect portal access or form state'; end if;
  if (public.staff_accept_intake(draft.id,draft.version)).version<>accepted.version then raise exception 'Repeated acceptance changed the form'; end if;
 end loop;
end $$;
rollback;
select 'Staff acceptance checks passed' as result;
