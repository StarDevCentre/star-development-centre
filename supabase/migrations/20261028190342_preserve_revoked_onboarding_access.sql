-- Editing a saved intake must never restore access revoked by staff.
create or replace function star_private.connect_intake_portal() returns trigger language plpgsql security definer set search_path='' as $$
 declare target_id uuid;existing_id uuid;begin
 if new.completed_at is null or new.guardian_reviewed_at is null or new.guardian_id is null then return new;end if;
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
  values(left(new.first_name,80),left(new.last_name,80),'Assessment',true,new.guardian_id,new.guardian_reviewed_at,new.guardian_id) returning id into target_id;
 end if;
 new.portal_player_id:=target_id;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by,onboarding_intake_id) values(new.guardian_id,target_id,null,new.id) on conflict(guardian_id,player_id) do nothing;
 if new.player_user_id is not null then
  insert into public.player_account_links(user_id,player_id,approved_by) values(new.player_user_id,target_id,new.guardian_id) on conflict(user_id) do nothing;
  if not exists(select 1 from public.player_account_links where user_id=new.player_user_id and player_id=target_id) then raise exception 'Player login could not be connected safely. Contact STAR.';end if;
 end if;
 insert into public.player_space_profiles(player_id,updated_by,shirt_name,ambition,stronger_foot,playing_teams,experience)
 values(target_id,new.guardian_id,left(coalesce(nullif(new.details->>'preferred_name',''),new.first_name),30),left(coalesce(new.details->>'goals',''),500),case when new.details->>'stronger_foot' in ('Left','Right','Both') then new.details->>'stronger_foot' else '' end,left(coalesce(new.details->>'current_teams',''),200),case when new.date_of_birth<=current_date-interval '11 years' then 'senior' else 'junior' end)
 on conflict(player_id) do nothing;
 return new;
 end;$$;
