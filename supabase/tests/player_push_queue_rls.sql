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

-- Only synthetic, uncommitted devices exist during this transaction.
insert into public.player_push_preferences(user_id,enabled,consented_at,quiet_hours,categories)
 select child_a,true,now(),false,array['message','session','badge'] from welcome_test union all select child_b,true,now(),false,array['message','session','badge'] from welcome_test;
insert into public.player_push_subscriptions(user_id,endpoint,p256dh,auth)
 select child_a,'https://fcm.googleapis.com/fcm/send/fixture-'||child_a,repeat('A',87),repeat('B',22) from welcome_test union all select child_b,'https://fcm.googleapis.com/fcm/send/fixture-'||child_b,repeat('A',87),repeat('B',22) from welcome_test;
update welcome_test w set device_a=s.id from public.player_push_subscriptions s where s.user_id=w.child_a;
update welcome_test w set device_b=s.id from public.player_push_subscriptions s where s.user_id=w.child_b;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from welcome_test;
insert into public.player_space_messages(player_id,sender_id,sender_role,body) select player_a,coach_id,'coach','Private fixture '||n from welcome_test cross join generate_series(1,4) n;
reset role;
select set_config('request.jwt.claims','{}',true);
do $$ begin
 if (select count(*) from star_private.player_push_deliveries q join welcome_test w on q.subscription_id=w.device_a)<>4 then raise exception 'Messages did not queue';end if;
 if exists(select 1 from star_private.player_push_deliveries q join welcome_test w on q.subscription_id=w.device_b) then raise exception 'Wrong player received a delivery';end if;
 if star_private.next_push_time(false)<>now() or star_private.next_push_time(true)<now() then raise exception 'Quiet-hours timing invalid';end if;
end $$;
insert into public.player_notification_reads(user_id,notification_id) select w.child_a,min(n.id::text)::uuid from welcome_test w join public.player_notifications n on n.player_id=w.player_a and n.category='message' group by w.child_a;
insert into claimed_push select * from public.claim_player_push_deliveries(100);
do $$ begin if (select count(*) from claimed_push)<>3 then raise exception 'Read suppression or claim failed';end if;end $$;
select public.finish_player_push_delivery(c.id,gen_random_uuid(),'sent',201) from claimed_push c;
reset role;
do $$ begin if exists(select 1 from star_private.player_push_deliveries q join claimed_push c on c.id=q.id where q.status<>'sending') then raise exception 'Wrong lease completed delivery';end if;end $$;
select public.finish_player_push_delivery(c.id,c.claim_token,case when c.id=(select min(id) from claimed_push) then 'retry' else 'sent' end,201) from claimed_push c;
reset role;
do $$ begin
 if (select count(*) from star_private.player_push_deliveries q join claimed_push c on c.id=q.id where q.status='sent')<>2 then raise exception 'Success acknowledgement failed';end if;
 if (select count(*) from star_private.player_push_deliveries q join claimed_push c on c.id=q.id where q.status='queued' and q.available_at>now())<>1 then raise exception 'Retry backoff failed';end if;
end $$;
update star_private.player_push_deliveries set available_at=now() where id in(select id from claimed_push) and status='queued';
delete from claimed_push;
insert into claimed_push select * from public.claim_player_push_deliveries(100);
select public.finish_player_push_delivery(id,claim_token,'gone',410) from claimed_push;
reset role;
do $$ begin if exists(select 1 from public.player_push_subscriptions where id=(select device_a from welcome_test)) then raise exception 'Expired subscription retained';end if;end $$;
select 'PASS: scoped queue, read suppression, leased claims, wrong-token rejection, success acknowledgement, retry backoff and expired-subscription removal' as result;
rollback;
