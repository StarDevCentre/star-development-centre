-- Synthetic family only. No scheduler call or real push delivery; everything rolls back.
begin;
create temp table parent_alert_qa as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c,gen_random_uuid() owner_id,gen_random_uuid() player_id,gen_random_uuid() report_id,gen_random_uuid() session_id,gen_random_uuid() request_id,gen_random_uuid() application_id;
grant select on parent_alert_qa to authenticated,service_role;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from parent_alert_qa cross join lateral unnest(array[a,b,c,owner_id]) id;
insert into public.staff_members(user_id,role,active) select owner_id,'owner',true from parent_alert_qa;
insert into public.guardian_profiles(user_id,display_name) select id,'Notification QA parent' from parent_alert_qa cross join lateral unnest(array[a,b,c]) id;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_id,'Notification QA','Player','1-to-1',true,owner_id,owner_id from parent_alert_qa;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select id,player_id,owner_id from parent_alert_qa cross join lateral unnest(array[a,b]) id;
insert into public.parent_push_preferences(user_id,enabled,categories,quiet_hours,consented_at) select a,true,array['message','report','session','programme'],false,now() from parent_alert_qa;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true) from parent_alert_qa;
select public.register_parent_push_subscription(jsonb_build_object('account_id',a,'endpoint','https://fcm.googleapis.com/fcm/send/parent-qa-'||a,'keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22)))) from parent_alert_qa;
do $$begin
 begin perform public.register_parent_push_subscription(jsonb_build_object('account_id',(select a from parent_alert_qa),'endpoint','https://localhost/private','keys',jsonb_build_object('p256dh','bad','auth','bad')));raise exception 'TEST: unsafe endpoint accepted';exception when invalid_parameter_value then null;end;
 begin perform public.claim_parent_push_deliveries(1);raise exception 'TEST: parent claimed queue';exception when insufficient_privilege then null;end;
 begin perform public.player_push_worker_config();raise exception 'TEST: parent read worker secrets';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from parent_alert_qa;
insert into public.family_messages(player_id,guardian_id,sender_id,sender_role,kind,body) select player_id,a,owner_id,'staff','message','Synthetic private message' from parent_alert_qa;
insert into public.family_messages(player_id,guardian_id,sender_id,sender_role,kind,body) select player_id,a,a,'guardian','message','Synthetic parent reply' from parent_alert_qa;
insert into public.family_monthly_reports(id,player_id,review_month,strengths,development_areas,next_steps,published_by) select report_id,player_id,current_date,'Synthetic strengths','Synthetic development','Synthetic next step',owner_id from parent_alert_qa;
insert into public.family_session_schedule(id,player_id,title,starts_at,ends_at,venue,published_by) select session_id,player_id,'Synthetic shared session',now()+interval '2 days',now()+interval '2 days 1 hour','Synthetic venue',owner_id from parent_alert_qa;
update public.family_session_schedule set venue='Synthetic changed venue' where id=(select session_id from parent_alert_qa);
update public.family_session_schedule set venue=venue where id=(select session_id from parent_alert_qa);
insert into public.family_session_requests(id,guardian_id,player_id,published_session_id,request_type,reason) select request_id,a,player_id,session_id,'absence','Synthetic reason' from parent_alert_qa;
update public.family_session_requests set status='approved',staff_response='Synthetic reply',decided_by=(select owner_id from parent_alert_qa),decided_at=now() where id=(select request_id from parent_alert_qa);
insert into public.player_registrations(id,guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at) select application_id,c,'Synthetic','Player',current_date-interval '13 years','prestige','submitted',now() from parent_alert_qa;
update public.player_registrations set status='accepted',recommended_programme='prestige' where id=(select application_id from parent_alert_qa);
do $$declare job record; expected_id bigint;begin
 select min(q.id) into expected_id from star_private.parent_push_deliveries q join public.parent_push_subscriptions s on s.id=q.subscription_id where s.user_id=(select a from parent_alert_qa);
 update star_private.parent_push_deliveries set available_at=now()-interval '365 days' where id=expected_id;
 select * into job from public.claim_parent_push_deliveries(1);
 if job.id is distinct from expected_id then raise exception 'TEST: queue claim did not select due fixture';end if;
 if not public.check_parent_push_delivery(job.id,job.claim_token) then raise exception 'TEST: claimed fixture failed access check';end if;
 perform public.finish_parent_push_delivery(job.id,gen_random_uuid(),'sent',201);
 if not exists(select 1 from star_private.parent_push_deliveries where id=job.id and status='sending') then raise exception 'TEST: invalid claim token accepted';end if;
 perform public.finish_parent_push_delivery(job.id,job.claim_token,'retry',503);
 if not exists(select 1 from star_private.parent_push_deliveries where id=job.id and status='queued' and attempts=1 and available_at>now()) then raise exception 'TEST: retry queue failed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true) from parent_alert_qa;
do $$begin
 begin perform public.register_parent_push_subscription(jsonb_build_object('account_id',(select b from parent_alert_qa),'endpoint','https://fcm.googleapis.com/fcm/send/account-qa','keys',jsonb_build_object('p256dh',repeat('A',87),'auth',repeat('B',22))));raise exception 'TEST: mismatched opt-in account accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;rollback;select 'PASS: claimed queue, current access, token fencing, retry backoff and opt-in account binding; fixtures rolled back, no network delivery' result;