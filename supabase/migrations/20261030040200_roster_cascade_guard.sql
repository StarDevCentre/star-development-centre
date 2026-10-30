-- Parent-record cascades must remain possible; direct roster removal still protects records.
create or replace function star_private.protect_participant_removal() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.training_sessions where id=old.session_id)
 and exists(select 1 from public.coaching_players where id=old.player_id)
 and (exists(select 1 from public.training_attendance where session_id=old.session_id and player_id=old.player_id)
 or exists(select 1 from public.family_session_schedule where source_session_id=old.session_id and player_id=old.player_id)) then
  raise exception 'Remove the shared booking first. Players with recorded attendance stay in session history.';
 end if;
 return old;
end $$;
