create or replace function star_private.safeguarding_api(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); staff boolean; cid uuid; pid uuid; rid uuid; msg text; k text; result jsonb; c star_private.safeguarding_cases%rowtype; t star_private.safeguarding_tasks%rowtype; v_assignee uuid;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false) and (banned_until is null or banned_until<now())) then raise exception 'Access denied' using errcode='42501'; end if;
 if auth.jwt()->>'session_id' is not null and not exists(select 1 from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=uid) then raise exception 'Session expired' using errcode='42501'; end if;
 select exists(select 1 from public.staff_members where user_id=uid and active and role in ('owner','manager','coach','assistant_coach')) into staff;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>24000 then raise exception 'Invalid request'; end if;
 if p_action in ('submit','intake') then
  pid:=nullif(p_data->>'player_id','')::uuid;
  if p_action='submit' and (staff or pid is null or not star_private.is_player(pid)) then raise exception 'Access denied' using errcode='42501'; end if;
  if p_action='intake' and not staff then raise exception 'Access denied' using errcode='42501'; end if;
  msg:=btrim(p_data->>'body');rid:=(p_data->>'request_id')::uuid;
  if rid is null or msg is null or length(msg) not between 1 and 6000 then raise exception 'Write between 1 and 6000 characters'; end if;
  perform pg_advisory_xact_lock(hashtextextended('safeguarding:'||uid::text,0));
  select * into c from star_private.safeguarding_cases where reporter_id=uid and request_id=rid;
  if found then
   if c.original_body<>msg or c.player_id is distinct from pid or c.parent_requested is distinct from coalesce((p_data->>'parent_requested')::boolean,false) then raise exception 'Retry does not match the original report';end if;
   return jsonb_build_object('id',c.id,'reference',c.reference);
  end if;
  if (select count(*) from star_private.safeguarding_cases where reporter_id=uid and created_at>now()-interval '1 hour')>=20 then raise exception 'Too many reports. Please use the independent help options or contact STAR directly.';end if;
  insert into star_private.safeguarding_cases(player_id,reporter_id,subject,source,original_body,parent_requested,request_id)
   values(pid,uid,case when staff then btrim(p_data->>'subject') else coalesce((select first_name||' '||last_name from public.coaching_players where id=pid),'Player') end,
   case when staff then 'staff record' else 'player disclosure' end,msg,coalesce((p_data->>'parent_requested')::boolean,false),rid) returning * into c;
  insert into star_private.safeguarding_events(case_id,actor_id,kind,body,shared_with_player,request_id,request_payload) values(c.id,uid,'original_report',msg,false,rid,p_data);
  insert into star_private.safeguarding_audit(case_id,actor_id,action) values(c.id,uid,'submitted');
  return jsonb_build_object('id',c.id,'reference',c.reference);
 end if;
 if p_action='player_list' then
  pid:=(p_data->>'player_id')::uuid;
  if staff or not coalesce(star_private.is_player(pid),false) then raise exception 'Access denied' using errcode='42501';end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',id,'reference',reference,'created_at',created_at) order by created_at desc) from star_private.safeguarding_cases where player_id=pid and reporter_id=uid),'[]');
 end if;
 if not staff and p_action not in ('player_read','player_reply') then raise exception 'Access denied' using errcode='42501';end if;
 if p_action='summary' then
  return jsonb_build_object('unread',(select count(*) from star_private.safeguarding_cases sc where not exists(select 1 from star_private.safeguarding_reads r where r.case_id=sc.id and r.user_id=uid and r.read_at>=sc.updated_at)),
   'new',(select count(*) from star_private.safeguarding_cases where status='new'),
   'overdue',(select count(*) from star_private.safeguarding_tasks where completed_at is null and due_at<now()),
   'reviews',(select count(*) from star_private.safeguarding_cases where status<>'closed' and review_at<=now()));
 elsif p_action='list' then
  insert into star_private.safeguarding_audit(actor_id,action) values(uid,'register read');
  return jsonb_build_object('cases',coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at desc) from (select id,reference,subject,source,status,priority,assigned_to,review_at,created_at,updated_at from star_private.safeguarding_cases order by created_at desc limit 500) s),'[]'),
   'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'label',u.email)) from public.staff_members s join auth.users u on u.id=s.user_id where s.active and s.role in ('owner','manager','coach','assistant_coach') and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<now())),'[]'));
 elsif p_action='resources' then
  return jsonb_build_object('resources',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from star_private.safeguarding_resources r),'[]'), 'acknowledgements',coalesce((select jsonb_agg(to_jsonb(a)) from star_private.safeguarding_acknowledgements a),'[]'));
 elsif p_action='resource_add' then
  insert into star_private.safeguarding_resources(title,version,body,created_by,request_id) values(btrim(p_data->>'title'),btrim(p_data->>'version'),btrim(p_data->>'body'),uid,(p_data->>'request_id')::uuid) on conflict(created_by,request_id) do nothing;
  insert into star_private.safeguarding_audit(actor_id,action) values(uid,'policy version added');return '{}'::jsonb;
 elsif p_action='resource_ack' then
  insert into star_private.safeguarding_acknowledgements(resource_id,user_id) values((p_data->>'id')::uuid,uid) on conflict do nothing;
  insert into star_private.safeguarding_audit(actor_id,action) values(uid,'policy acknowledged');return '{}'::jsonb;
 end if;
 cid:=(p_data->>'id')::uuid;
 select * into c from star_private.safeguarding_cases where id=cid for update;
 if not found then raise exception 'Case unavailable' using errcode='42501';end if;
 if not staff and (c.reporter_id<>uid or c.source<>'player disclosure' or not coalesce(star_private.is_player(c.player_id),false)) then raise exception 'Case unavailable' using errcode='42501';end if;
 if p_action in ('read','export','player_read') then
  insert into star_private.safeguarding_audit(case_id,actor_id,action) values(cid,uid,p_action);
  insert into star_private.safeguarding_reads(case_id,user_id,read_at) values(cid,uid,now()) on conflict(case_id,user_id) do update set read_at=excluded.read_at;
  if not staff then
   return jsonb_build_object('id',c.id,'reference',c.reference,'body',c.original_body,'parent_requested',c.parent_requested,'created_at',c.created_at,
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'body',body,'recorded_at',recorded_at) order by recorded_at,id) from star_private.safeguarding_events where case_id=cid and shared_with_player),'[]'));
  end if;
  return jsonb_build_object('case',to_jsonb(c),'events',coalesce((select jsonb_agg(to_jsonb(e) order by recorded_at,id) from star_private.safeguarding_events e where case_id=cid),'[]'),
   'tasks',coalesce((select jsonb_agg(to_jsonb(trw) order by due_at) from star_private.safeguarding_tasks trw where case_id=cid),'[]'),
   'audit',coalesce((select jsonb_agg(to_jsonb(a) order by recorded_at,id) from star_private.safeguarding_audit a where case_id=cid),'[]'));
 end if;
 if p_action in ('event','player_reply','update','task_add','task_complete') then
  rid:=(p_data->>'request_id')::uuid;msg:=btrim(p_data->>'body');
  if rid is null or msg is null or length(msg) not between 1 and 6000 then raise exception 'Write between 1 and 6000 characters';end if;
  perform pg_advisory_xact_lock(hashtextextended('safeguarding:'||uid::text,0));
  select jsonb_build_object('case_id',case_id,'payload',request_payload) into result from star_private.safeguarding_events where actor_id=uid and request_id=rid;
  if result is not null then
   if (result->>'case_id')::uuid<>cid or result->'payload'<>p_data then raise exception 'Retry does not match';end if;
   return '{}'::jsonb;
  end if;
  if (select count(*) from star_private.safeguarding_events where actor_id=uid and recorded_at>now()-interval '1 minute')>=30 then raise exception 'Please wait a moment before sending again';end if;
  k:=case when p_action='player_reply' then 'player_message' when p_action='update' then 'decision' when p_action in ('task_add','task_complete') then p_action else p_data->>'kind' end;
  if k is null or k not in ('player_message','staff_reply','observation','judgement','decision','referral','parent_contact','correction','task_add','task_complete') then raise exception 'Choose a record type';end if;
  if p_action='event' and k='player_message' then raise exception 'Invalid record type';end if;
  if k='staff_reply' and c.source<>'player disclosure' then raise exception 'This case has no private player conversation';end if;
  if p_action='update' then
   if c.revision<>(p_data->>'revision')::integer or p_data->>'revision' is null then raise exception 'Case changed. Refresh before saving.';end if;
   v_assignee:=nullif(p_data->>'assigned_to','')::uuid;
   if v_assignee is not null and not exists(select 1 from public.staff_members s join auth.users u on u.id=s.user_id where s.user_id=v_assignee and s.active and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now())) then raise exception 'Choose active staff';end if;
   update star_private.safeguarding_cases set status=p_data->>'status',priority=p_data->>'priority',assigned_to=v_assignee,review_at=nullif(p_data->>'review_at','')::timestamptz,retention_review_at=nullif(p_data->>'retention_review_at','')::timestamptz,legal_hold=coalesce((p_data->>'legal_hold')::boolean,false) where id=cid;
   msg:=msg||E'\nState: '||(p_data-'body'-'request_id')::text;
  elsif p_action='task_add' then
   v_assignee:=(p_data->>'assigned_to')::uuid;
   if not exists(select 1 from public.staff_members where user_id=v_assignee and active) then raise exception 'Choose active staff';end if;
   insert into star_private.safeguarding_tasks(case_id,title,assigned_to,due_at,created_by) values(cid,p_data->>'title',v_assignee,(p_data->>'due_at')::timestamptz,uid);
   msg:=msg||E'\nAction: '||(p_data-'body'-'request_id')::text;
  elsif p_action='task_complete' then
   select * into t from star_private.safeguarding_tasks where id=(p_data->>'task_id')::uuid and case_id=cid;
   if not found or t.completed_at is not null then raise exception 'Action unavailable or already completed';end if;
   update star_private.safeguarding_tasks set completed_at=now() where id=t.id;
   msg:=msg||E'\nCompleted action: '||t.title||' ('||t.id::text||')';
  end if;
  insert into star_private.safeguarding_events(case_id,actor_id,kind,body,shared_with_player,occurred_at,request_id,request_payload)
   values(cid,uid,k,msg,k in ('player_message','staff_reply'),coalesce(nullif(p_data->>'occurred_at','')::timestamptz,now()),rid,p_data);
  update star_private.safeguarding_cases set updated_at=clock_timestamp(),revision=revision+1 where id=cid;
  insert into star_private.safeguarding_audit(case_id,actor_id,action) values(cid,uid,k);
  return '{}'::jsonb;
 end if;
 raise exception 'Unknown action';
end $$;

create policy safeguarding_deny_direct on star_private.safeguarding_cases for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_events for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_tasks for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_audit for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_reads for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_resources for all to authenticated using(false) with check(false);
create policy safeguarding_deny_direct on star_private.safeguarding_acknowledgements for all to authenticated using(false) with check(false);
