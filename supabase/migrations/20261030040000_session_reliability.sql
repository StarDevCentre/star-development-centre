-- Additive: preserve every legacy booking and attendance mark. Link only unambiguous exact copies.
alter table public.family_session_schedule add column source_session_id uuid references public.training_sessions(id) on delete cascade;
alter table public.family_session_schedule add constraint family_source_player_unique unique(source_session_id,player_id);
create index family_schedule_source on public.family_session_schedule(source_session_id);
create table public.training_session_participants (
 session_id uuid not null references public.training_sessions(id) on delete cascade,
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 added_by uuid references auth.users(id),
 primary key(session_id,player_id)
);
create index session_participants_player on public.training_session_participants(player_id);
alter table public.training_session_participants enable row level security;
revoke all on public.training_session_participants from public,anon;
grant select,insert,delete on public.training_session_participants to authenticated;
create policy participants_read on public.training_session_participants for select to authenticated using (star_private.can_coach_player(player_id));
create policy participants_add on public.training_session_participants for insert to authenticated with check (star_private.can_coach_player(player_id) and added_by=(select auth.uid()));
create policy participants_remove on public.training_session_participants for delete to authenticated using (star_private.can_coach_player(player_id));
with matches as (
 select f.id,min(s.id::text)::uuid as source_id,count(*) over(partition by min(s.id::text),f.player_id) as copies
 from public.family_session_schedule f join public.training_sessions s
 on s.title=f.title and s.starts_at=f.starts_at and s.ends_at=f.ends_at and s.venue=f.venue
 group by f.id having count(*)=1
)
update public.family_session_schedule f set source_session_id=m.source_id from matches m where f.id=m.id and m.copies=1;
insert into public.training_session_participants(session_id,player_id)
select session_id,player_id from public.training_attendance union select source_session_id,player_id from public.family_session_schedule where source_session_id is not null on conflict do nothing;

create function star_private.link_family_session() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.training_sessions;
begin
 if new.source_session_id is not null then
  select * into strict s from public.training_sessions where id=new.source_session_id for share;
  new.title=s.title; new.starts_at=s.starts_at; new.ends_at=s.ends_at; new.venue=s.venue;
  insert into public.training_session_participants(session_id,player_id,added_by) values(s.id,new.player_id,auth.uid()) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger link_family_session before insert or update of source_session_id,title,starts_at,ends_at,venue on public.family_session_schedule for each row execute function star_private.link_family_session();
create function star_private.sync_family_sessions() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.family_session_schedule set title=new.title,starts_at=new.starts_at,ends_at=new.ends_at,venue=new.venue where source_session_id=new.id;
 return new;
end $$;
create trigger sync_family_sessions after update of title,starts_at,ends_at,venue on public.training_sessions for each row when (row(old.title,old.starts_at,old.ends_at,old.venue) is distinct from row(new.title,new.starts_at,new.ends_at,new.venue)) execute function star_private.sync_family_sessions();
create function public.publish_training_session(p_session uuid,p_player uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.training_sessions; result uuid;
begin
 if not star_private.is_staff_manager() then raise exception 'Manager access required' using errcode='42501'; end if;
 select * into strict s from public.training_sessions where id=p_session for update;
 select id into result from public.family_session_schedule where source_session_id=s.id and player_id=p_player;
 if result is null then
  insert into public.family_session_schedule(player_id,source_session_id,title,starts_at,ends_at,venue,published_by) values(p_player,s.id,s.title,s.starts_at,s.ends_at,s.venue,auth.uid()) returning id into result;
 end if;
 return result;
end $$;
revoke all on function public.publish_training_session(uuid,uuid) from public,anon;
grant execute on function public.publish_training_session(uuid,uuid) to authenticated;
revoke all on function star_private.link_family_session(),star_private.sync_family_sessions() from public,anon,authenticated;
-- A roster removal cannot silently discard attendance or leave a published booking behind.
create function star_private.protect_participant_removal() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.training_sessions where id=old.session_id) and
 (exists(select 1 from public.training_attendance where session_id=old.session_id and player_id=old.player_id) or exists(select 1 from public.family_session_schedule where source_session_id=old.session_id and player_id=old.player_id)) then
 raise exception 'Remove the shared booking first. Players with recorded attendance stay in session history.';
 end if;
 return old;
end $$;
create trigger protect_participant_removal before delete on public.training_session_participants for each row execute function star_private.protect_participant_removal();
revoke all on function star_private.protect_participant_removal() from public,anon,authenticated;
create function star_private.require_attendance_participant() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.training_session_participants where session_id=new.session_id and player_id=new.player_id) then raise exception 'Add this player to the session roster before recording attendance'; end if;
 return new;
end $$;
create trigger require_attendance_participant before insert or update on public.training_attendance for each row execute function star_private.require_attendance_participant();
revoke all on function star_private.require_attendance_participant() from public,anon,authenticated;
