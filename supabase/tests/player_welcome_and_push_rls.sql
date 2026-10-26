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

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',child_a,'role','authenticated')::text,true) from welcome_test;
insert into public.player_space_onboarding(user_id,player_id,step,status) select child_a,player_a,3,'in_progress' from welcome_test;
update public.player_space_onboarding set step=5,status='completed' where player_id=(select player_a from welcome_test);
do $$ begin
 if not exists(select 1 from public.player_space_onboarding where step=5 and status='completed') then raise exception 'Setup completion did not persist';end if;
 begin insert into public.player_space_onboarding(user_id,player_id) select child_a,player_b from welcome_test;raise exception 'Player changed another player setup';exception when insufficient_privilege then null;end;
 begin insert into public.player_space_onboarding(user_id,player_id) select parent_a,player_a from welcome_test;raise exception 'Player changed parent setup';exception when insufficient_privilege then null;end;
 begin perform public.player_push_worker_config();raise exception 'Client read worker secrets';exception when insufficient_privilege then null;end;
 begin perform public.claim_player_push_deliveries(25);raise exception 'Client claimed deliveries';exception when insufficient_privilege then null;end;
 if public.player_push_public_key() is null then raise exception 'Linked user cannot load public key';end if;
 begin perform public.register_player_push_subscription(jsonb_build_object('endpoint','https://fcm.googleapis.com/fcm/send/fixture','keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22))));raise exception 'Registration worked before opt-in';exception when insufficient_privilege then null;end;
end $$;
insert into public.player_push_preferences(user_id) select child_a from welcome_test;
do $$ begin if exists(select 1 from public.player_push_preferences where enabled) then raise exception 'Alerts enabled by default';end if;end $$;
update public.player_push_preferences set enabled=true,consented_at=now(),quiet_hours=false,categories=array['message','session','badge'] where user_id=(select child_a from welcome_test);
update welcome_test set device_a=public.register_player_push_subscription(jsonb_build_object('endpoint','https://fcm.googleapis.com/fcm/send/fixture-'||child_a,'keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22))));
do $$ declare original uuid;again uuid; begin
 select device_a into original from welcome_test;
 select public.register_player_push_subscription(jsonb_build_object('endpoint','https://fcm.googleapis.com/fcm/send/fixture-'||child_a,'keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22)))) into again from welcome_test;
 if again<>original or (select count(*) from public.player_push_subscriptions)<>1 then raise exception 'Subscription registration was not idempotent';end if;
 begin perform public.register_player_push_subscription(jsonb_build_object('endpoint','https://127.0.0.1/private','keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22))));raise exception 'Local endpoint accepted';exception when invalid_parameter_value then null;end;
 begin perform public.register_player_push_subscription(jsonb_build_object('endpoint','https://fcm.googleapis.com.evil.invalid/send/test','keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22))));raise exception 'Lookalike endpoint accepted';exception when invalid_parameter_value then null;end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.player_push_worker_config()','execute') or has_function_privilege('authenticated','public.player_push_worker_config()','execute') or has_function_privilege('anon','public.register_player_push_subscription(jsonb)','execute') then raise exception 'Push RPC grants are too broad';end if;
end $$;
select 'PASS: saved onboarding completion, account isolation, opt-in default, public/secret key permissions, scoped idempotent subscription registration and endpoint rejection' as result;
rollback;
