alter table public.player_intakes
 add column staff_accepted_at timestamptz,
 add column staff_accepted_by uuid references auth.users(id) on delete set null;

-- A portal-only assessment profile may precede parental coaching consent.
alter table public.coaching_players
 alter column consent_recorded_at drop not null,
 alter column consent_recorded_by drop not null,
 drop constraint coaching_players_consent_confirmed_check,
 add constraint coaching_players_consent_confirmed_check check (
  (consent_confirmed and consent_recorded_at is not null and consent_recorded_by is not null)
  or (not consent_confirmed and programme='Assessment' and consent_recorded_at is null and consent_recorded_by is null)
 );

create or replace function star_private.connect_intake_portal() returns trigger language plpgsql security definer set search_path='' as $$
 declare target_id uuid;existing_id uuid;begin
 if new.guardian_id is null or (new.staff_accepted_at is null and (new.completed_at is null or new.guardian_reviewed_at is null)) then return new;end if;
 -- Deleting/revoking a login must remain possible even after staff withdraw
 -- the guardian link; this branch clears identity and grants no access.
 if tg_op='UPDATE' and old.player_user_id is not null and new.player_user_id is null then return new;end if;
 target_id:=new.portal_player_id;
 if target_id is not null and not exists(select 1 from public.guardian_player_links where guardian_id=new.guardian_id and player_id=target_id) then
  raise exception 'Family access to this Player Space has been withdrawn. Contact STAR for help.';
 end if;
 if new.player_user_id is not null then
  select player_id into existing_id from public.player_account_links where user_id=new.player_user_id;
  if existing_id is not null then
   if not exists(select 1 from public.guardian_player_links where player_id=existing_id and guardian_id=new.guardian_id) or (target_id is not null and target_id<>existing_id) then raise exception 'This player login is already connected to a different player profile. Contact STAR for help.';end if;
   target_id:=existing_id;
  end if;
 end if;
 if target_id is null then
  insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,consent_recorded_at,created_by)
  values(left(new.first_name,80),left(new.last_name,80),'Assessment',new.guardian_reviewed_at is not null,case when new.guardian_reviewed_at is not null then new.guardian_id end,new.guardian_reviewed_at,coalesce(new.staff_accepted_by,new.guardian_id)) returning id into target_id;
 elsif new.guardian_reviewed_at is not null then
  update public.coaching_players set consent_confirmed=true,consent_recorded_by=new.guardian_id,consent_recorded_at=new.guardian_reviewed_at where id=target_id and not consent_confirmed;
 end if;
 new.portal_player_id:=target_id;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by,onboarding_intake_id) values(new.guardian_id,target_id,new.staff_accepted_by,new.id) on conflict(guardian_id,player_id) do nothing;
 if new.player_user_id is not null then
  insert into public.player_account_links(user_id,player_id,approved_by) values(new.player_user_id,target_id,coalesce(new.staff_accepted_by,new.guardian_id)) on conflict(user_id) do nothing;
  if not exists(select 1 from public.player_account_links where user_id=new.player_user_id and player_id=target_id) then raise exception 'Player login could not be connected safely. Contact STAR.';end if;
 end if;
 insert into public.player_space_profiles(player_id,updated_by,shirt_name,ambition,stronger_foot,playing_teams,experience)
 values(target_id,new.guardian_id,left(coalesce(nullif(new.details->>'preferred_name',''),new.first_name),30),left(coalesce(new.details->>'goals',''),500),case when new.details->>'stronger_foot' in ('Left','Right','Both') then new.details->>'stronger_foot' else '' end,left(coalesce(new.details->>'current_teams',''),200),case when new.date_of_birth<=current_date-interval '12 years' then 'teenagers' else 'children' end)
 on conflict(player_id) do nothing;
 return new;
 end;$$;


drop trigger connect_approved_intake on public.player_intakes;
create trigger connect_approved_intake before insert or update of completed_at,guardian_reviewed_at,guardian_id,player_user_id,staff_accepted_at
on public.player_intakes for each row execute function star_private.connect_intake_portal();

create function star_private.staff_accept_intake(p_id uuid,p_version integer)
returns public.player_intakes language plpgsql security definer set search_path='' as $$
declare r public.player_intakes;
begin
 if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
 select * into r from public.player_intakes where id=p_id for update;
 if not found then raise exception 'Form unavailable.'; end if;
 if r.staff_accepted_at is not null then return r; end if;
 if r.version is distinct from p_version then raise exception 'The form has changed. Reopen it before accepting.'; end if;
 if r.guardian_id is null or btrim(r.first_name)='' or btrim(r.last_name)='' then
  raise exception 'A linked parent and the player’s first and last name are needed to grant access.';
 end if;
 update public.player_intakes set staff_accepted_at=now(),staff_accepted_by=auth.uid(),version=version+1,updated_at=now()
 where id=p_id returning * into r;
 return r;
end $$;

create function public.staff_accept_intake(p_id uuid,p_version integer)
returns public.player_intakes language sql security invoker set search_path='' as $$
 select star_private.staff_accept_intake(p_id,p_version)
$$;
revoke all on function public.staff_accept_intake(uuid,integer),star_private.staff_accept_intake(uuid,integer) from public,anon;
grant execute on function public.staff_accept_intake(uuid,integer),star_private.staff_accept_intake(uuid,integer) to authenticated;
