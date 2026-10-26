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
insert into public.player_account_links(user_id,player_id,approved_by) select child_a,player_a,parent_a from welcome_test union all select child_b,player_b,parent_b from welcome_test;
insert into public.coaching_assignments(player_id,staff_user_id) select player_a,coach_id from welcome_test;
insert into public.family_session_schedule(id,player_id,title,starts_at,ends_at,venue,published_by)
 select session_a,player_a,'Fixture session',now()+interval '2 hours',now()+interval '3 hours','Fixture venue',owner_id from welcome_test;
insert into public.player_training_assignments(id,player_id,title,instructions,created_by) select task_a,player_a,'Fixture practice','Written coaching instructions',owner_id from welcome_test;

insert into public.player_push_preferences(user_id,enabled,consented_at,quiet_hours) select child_a,true,now(),false from welcome_test;
insert into public.player_push_subscriptions(user_id,endpoint,p256dh,auth) select child_a,'https://fcm.googleapis.com/fcm/send/fixture-'||child_a,repeat('A',87),repeat('B',22) from welcome_test;
update welcome_test w set device_a=s.id from public.player_push_subscriptions s where s.user_id=w.child_a;
insert into public.player_notifications(player_id,category,title,body,tab,source_key) select player_a,'message','Fixture','PRIVATE','messages','fixture' from welcome_test;
insert into public.player_notifications(player_id,category,title,body,tab,source_key) select player_a,'session','Reminder','PRIVATE','home','reminder:'||s.id||':'||s.starts_at::text from welcome_test w join public.family_session_schedule s on s.id=w.session_a;
update public.family_session_schedule set starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day' where id=(select session_a from welcome_test);
do $$ begin if exists(select 1 from public.player_notifications n join welcome_test w on n.player_id=w.player_a where n.source_key like 'reminder:%' and star_private.push_delivery_allowed(n.id,w.device_a)) then raise exception 'Rescheduled reminder still eligible';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_a,'role','authenticated')::text,true) from welcome_test;
delete from public.player_account_links where player_id=(select player_a from welcome_test);
reset role;
select set_config('request.jwt.claims','{}',true);
insert into claimed_push select * from public.claim_player_push_deliveries(100);
reset role;
do $$ begin if exists(select 1 from claimed_push) then raise exception 'Revoked player received a queued alert';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',child_a,'role','authenticated')::text,true) from welcome_test;
do $$ begin begin perform public.player_push_public_key();raise exception 'Revoked player can enable alerts';exception when insufficient_privilege then null;end;end $$;
reset role;
select 'PASS: rescheduled reminders invalidated and queued push access revoked immediately' as result;
rollback;
