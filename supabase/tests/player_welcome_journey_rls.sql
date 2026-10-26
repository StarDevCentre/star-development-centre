-- Synthetic accounts and every queued delivery are rolled back. No HTTP sends.
begin;
create temp table welcome_test as select gen_random_uuid() owner_id,gen_random_uuid() coach_id,
 gen_random_uuid() parent_a,gen_random_uuid() parent_b,gen_random_uuid() child_a,gen_random_uuid() child_b,
 gen_random_uuid() player_a,gen_random_uuid() player_b,gen_random_uuid() session_a,
 gen_random_uuid() task_a,null::uuid device_a,null::uuid device_b;
grant select,update on welcome_test to authenticated,service_role;
create temp table claimed_push(id bigint,claim_token uuid,endpoint text,p256dh text,auth text,category text,notification_id uuid);
grant select,insert,delete on claimed_push to service_role;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_user_meta_data)
 select id,'authenticated','authenticated',id::text||'@welcome-fixture.invalid',now(),'{"role":"owner"}'::jsonb
 from welcome_test cross join lateral unnest(array[owner_id,coach_id,parent_a,parent_b,child_a,child_b]) id;
insert into public.staff_members(user_id,role,active) select owner_id,'owner',true from welcome_test union all select coach_id,'coach',true from welcome_test;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
 select player_a,'Welcome fixture','A','Other',true,owner_id,owner_id from welcome_test union all select player_b,'Welcome fixture','B','Other',true,owner_id,owner_id from welcome_test;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select parent_a,player_a,owner_id from welcome_test union all select parent_b,player_b,owner_id from welcome_test;

insert into public.coaching_assignments(player_id,staff_user_id) select player_a,coach_id from welcome_test;
insert into public.family_session_schedule(id,player_id,title,starts_at,ends_at,venue,published_by)
 select session_a,player_a,'Fixture session',now()+interval '2 hours',now()+interval '3 hours','Fixture venue',owner_id from welcome_test;
insert into public.player_training_assignments(id,player_id,title,instructions,created_by) select task_a,player_a,'Fixture practice','Written coaching instructions',owner_id from welcome_test;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_a,'role','authenticated')::text,true) from welcome_test;
insert into public.player_account_invites(player_id,player_user_id,guardian_id) select player_a,child_a,parent_a from welcome_test;
select set_config('request.jwt.claims',jsonb_build_object('sub',child_a,'role','authenticated')::text,true) from welcome_test;
select public.accept_player_invite(id) from public.player_account_invites where player_id=(select player_a from welcome_test);
insert into public.player_space_profiles(player_id,shirt_name,shirt_number,hero_skin,hero_hair_type,updated_by) select player_a,'STAR',9,'medium','curls',child_a from welcome_test;
insert into public.player_personal_goals(player_id,goal,created_by) select player_a,'Encourage a teammate every session',child_a from welcome_test;
insert into public.player_session_preparation(session_id,player_id,help_request,checked_kit,updated_by) select session_a,player_a,'Help with scanning',array[]::text[],child_a from welcome_test;
insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,confidence,enjoyment) select task_a,child_a,(now() at time zone 'Europe/London')::date,15,'Fixture practice completed',4,5 from welcome_test;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_a,'role','authenticated')::text,true) from welcome_test;
do $$ begin
 if not exists(select 1 from public.player_personal_goals where goal='Encourage a teammate every session') or not exists(select 1 from public.player_training_diary where reflection='Fixture practice completed') then raise exception 'Parent cannot view player progress';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from welcome_test;
do $$ begin if not exists(select 1 from public.player_session_preparation where help_request='Help with scanning') then raise exception 'Coach cannot view preparation';end if;end $$;
insert into public.player_space_messages(player_id,sender_id,sender_role,body) select player_a,coach_id,'coach','Great scanning in your practice' from welcome_test;
insert into public.player_training_feedback(diary_id,feedback,reviewed_by) select d.id,'Keep your head up',w.coach_id from public.player_training_diary d join welcome_test w on d.assignment_id=w.task_a;
insert into public.player_achievements(player_id,title,description,badge_id,awarded_by) select player_a,'First Steps','You tried your new skill','first-steps-bronze',coach_id from welcome_test;
reset role;
select set_config('request.jwt.claims','{}',true);
insert into public.training_sessions(id,title,programme,venue,created_by,starts_at,ends_at) select session_a,'Completed fixture session','Other','Fixture pitch',owner_id,now()-interval '2 hours',now()-interval '1 hour' from welcome_test;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from welcome_test;
insert into public.training_attendance(session_id,player_id,status,recorded_by) select session_a,player_a,'present',owner_id from welcome_test;
select set_config('request.jwt.claims',jsonb_build_object('sub',child_a,'role','authenticated')::text,true) from welcome_test;
do $$ begin
 if public.player_ball_progress((select player_a from welcome_test))<>1 then raise exception 'Attendance not reflected in player rewards';end if;
 if not exists(select 1 from public.player_achievements where title='First Steps') or not exists(select 1 from public.player_training_feedback where feedback='Keep your head up') or not exists(select 1 from public.player_space_messages where body='Great scanning in your practice') then raise exception 'Player cannot see coach badge, feedback or message';end if;
 if exists(select 1 from public.coaching_players where id=(select player_b from welcome_test)) then raise exception 'Other player exposed';end if;
end $$;
reset role;
select 'PASS: parent invitation, player activation, personalised card and goal, session preparation, practice log, parent progress visibility, assigned coach feedback/message/badge, recorded attendance and player trophy/reward visibility' as result;
rollback;
