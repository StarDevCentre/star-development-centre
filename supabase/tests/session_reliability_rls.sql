begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000008201'),('00000000-0000-4000-8000-000000008202'),('00000000-0000-4000-8000-000000008203');
insert into public.staff_members(user_id,role,active) values ('00000000-0000-4000-8000-000000008201','manager',true),('00000000-0000-4000-8000-000000008202','coach',true);
insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,notes,created_by) values ('00000000-0000-4000-8000-000000008210','Synthetic linked session','Other',now()+interval '1 day',now()+interval '1 day 1 hour','Test field','INTERNAL ONLY','00000000-0000-4000-8000-000000008201');
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values ('00000000-0000-4000-8000-000000008220','Synthetic','Fixture','Other',true,'00000000-0000-4000-8000-000000008201','00000000-0000-4000-8000-000000008201');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008201',true);
do $$ declare a uuid;b uuid;begin
 a:=public.publish_training_session('00000000-0000-4000-8000-000000008210','00000000-0000-4000-8000-000000008220');
 b:=public.publish_training_session('00000000-0000-4000-8000-000000008210','00000000-0000-4000-8000-000000008220');
 if a<>b then raise exception 'duplicate publication';end if;
 if not exists(select 1 from public.training_session_participants where session_id='00000000-0000-4000-8000-000000008210' and player_id='00000000-0000-4000-8000-000000008220') then raise exception 'booking not on roster';end if;
 if exists(select 1 from public.family_session_schedule where id=a and coach_focus='INTERNAL ONLY') then raise exception 'internal note leaked';end if;
end $$;
update public.training_sessions set title='Synthetic revised session',starts_at=starts_at+interval '2 days',ends_at=ends_at+interval '2 days',venue='Revised field' where id='00000000-0000-4000-8000-000000008210';
do $$ begin if not exists(select 1 from public.family_session_schedule f join public.training_sessions s on s.id=f.source_session_id where s.id='00000000-0000-4000-8000-000000008210' and row(f.title,f.starts_at,f.ends_at,f.venue)=row(s.title,s.starts_at,s.ends_at,s.venue)) then raise exception 'calendar sync failed';end if;end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008202',true);
do $$ begin
 if exists(select 1 from public.training_session_participants where session_id='00000000-0000-4000-8000-000000008210') then raise exception 'unassigned coach saw roster';end if;
 begin perform public.publish_training_session('00000000-0000-4000-8000-000000008210','00000000-0000-4000-8000-000000008220');raise exception 'coach published';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.coaching_assignments(player_id,staff_user_id) values ('00000000-0000-4000-8000-000000008220','00000000-0000-4000-8000-000000008202');
set local role authenticated;
insert into public.training_attendance(session_id,player_id,status,recorded_by) values ('00000000-0000-4000-8000-000000008210','00000000-0000-4000-8000-000000008220','late','00000000-0000-4000-8000-000000008202');
do $$ begin if not exists(select 1 from public.training_session_participants where session_id='00000000-0000-4000-8000-000000008210') then raise exception 'assigned coach cannot see roster';end if;end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008203',true);
do $$ begin
 if exists(select 1 from public.training_session_participants where session_id='00000000-0000-4000-8000-000000008210') then raise exception 'family/nonstaff saw private roster';end if;
 begin insert into public.training_session_participants(session_id,player_id,added_by) values ('00000000-0000-4000-8000-000000008210','00000000-0000-4000-8000-000000008220','00000000-0000-4000-8000-000000008203');raise exception 'nonstaff changed roster';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from public.training_sessions where id='00000000-0000-4000-8000-000000008210';
do $$ begin if exists(select 1 from public.family_session_schedule where source_session_id='00000000-0000-4000-8000-000000008210') then raise exception 'deleted session left booking';end if;end $$;
rollback;
select 'Session sync, roster, publication and permission checks passed; fixtures rolled back' as result;
