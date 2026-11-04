-- Organisation conversations and transactional email queue. No historical notifications.
create table star_private.org_threads (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id) on delete cascade,
 link_id uuid references public.star_organisation_players(id) on delete cascade,
 subject text not null check(length(subject) between 2 and 200), source_key text unique,
 created_at timestamptz not null default now()
);
create index org_threads_organisation on star_private.org_threads(organisation_id);
create index org_threads_link on star_private.org_threads(link_id);
create table star_private.org_messages (
 id bigint generated always as identity primary key, thread_id uuid not null references star_private.org_threads(id) on delete cascade,
 sender_id uuid references auth.users(id) on delete set null, sender_role text not null check(sender_role in ('staff','organisation')),
 kind text not null default 'message', body text not null check(length(body) between 1 and 5000),
 client_id uuid, created_at timestamptz not null default clock_timestamp(), unique(sender_id,client_id)
);
create index org_messages_thread on star_private.org_messages(thread_id,id desc);
create index org_messages_sender on star_private.org_messages(sender_id);
create table star_private.org_deliveries (
 id uuid primary key default gen_random_uuid(), message_id bigint not null references star_private.org_messages(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade, audience text not null check(audience in ('staff','organisation')),
 read_at timestamptz, status text not null default 'pending' check(status in ('pending','sending','sent','skipped','failed')),
 attempts integer not null default 0, available_at timestamptz not null default now(), claim_token uuid,
 lease_until timestamptz, sent_at timestamptz, provider_id text, unique(message_id,recipient_id)
);
create index org_deliveries_unread on star_private.org_deliveries(recipient_id,message_id) where read_at is null;
create index org_deliveries_pending on star_private.org_deliveries(available_at) where status in ('pending','sending');
alter table star_private.org_threads enable row level security;
alter table star_private.org_messages enable row level security;
alter table star_private.org_deliveries enable row level security;
create policy org_threads_no_direct_access on star_private.org_threads for all using(false) with check(false);
create policy org_messages_no_direct_access on star_private.org_messages for all using(false) with check(false);
create policy org_deliveries_no_direct_access on star_private.org_deliveries for all using(false) with check(false);
revoke all on star_private.org_threads,star_private.org_messages,star_private.org_deliveries from public,anon,authenticated;

-- Target identity is evaluated against current database records, also for background delivery.
create function star_private.org_inbox_access(p_thread uuid,p_user uuid,p_audience text default '') returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from star_private.org_threads t join public.star_organisations o on o.id=t.organisation_id
 join auth.users u on u.id=p_user
 where t.id=p_thread and o.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
 and (t.link_id is null or exists(select 1 from public.star_organisation_players l join public.guardian_player_links g
 on g.player_id=l.player_id and g.guardian_id=l.approved_by where l.id=t.link_id and l.approved_at is not null))
 and ((p_audience in ('','staff') and exists(select 1 from public.staff_members s where s.user_id=p_user and s.active and s.role in ('owner','manager')))
 or (p_audience in ('','organisation') and exists(select 1 from public.star_organisation_members m where m.organisation_id=o.id
 and m.user_id=p_user and m.active and m.accepted_at is not null and m.email=lower(u.email)))))
$$;

create function star_private.org_queue_message() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.sender_role='staff' then
  insert into star_private.org_deliveries(message_id,recipient_id,audience)
  select new.id,m.user_id,'organisation' from public.star_organisation_members m join star_private.org_threads t on t.organisation_id=m.organisation_id
  where t.id=new.thread_id and m.user_id is not null and m.user_id is distinct from new.sender_id
   and star_private.org_inbox_access(t.id,m.user_id,'organisation') on conflict do nothing;
 else
  insert into star_private.org_deliveries(message_id,recipient_id,audience)
  select new.id,s.user_id,'staff' from public.staff_members s where s.user_id is distinct from new.sender_id
   and star_private.org_inbox_access(new.thread_id,s.user_id,'staff') on conflict do nothing;
 end if;
 return new;
end $$;
create trigger org_message_queue after insert on star_private.org_messages for each row execute function star_private.org_queue_message();

-- All inbox actions use this independent, verified API; existing portal dispatcher is unchanged.
create function star_private.organisation_inbox(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); manager boolean; org uuid; tid uuid; lid uuid; body_text text; subject_text text; result jsonb; mid bigint; cid uuid;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager(); org:=nullif(p_data->>'organisation_id','')::uuid;
 if not manager and (org is null or not star_private.org_member(org)) then raise exception 'Current organisation access is required.'; end if;
 if org is not null and not exists(select 1 from public.star_organisations where id=org and active) then raise exception 'Organisation is unavailable.'; end if;
 if p_action='summary' then
  return jsonb_build_object('unread',(select count(*) from star_private.org_deliveries d join star_private.org_messages m on m.id=d.message_id join star_private.org_threads t on t.id=m.thread_id
   where d.recipient_id=uid and d.read_at is null and (org is null or t.organisation_id=org) and star_private.org_inbox_access(t.id,uid)),
   'threads',(select count(*) from star_private.org_threads t where (org is null or t.organisation_id=org) and star_private.org_inbox_access(t.id,uid)));
 elsif p_action='list' then
  return jsonb_build_object('threads',coalesce((select jsonb_agg(x order by x.last_id desc nulls last) from
   (select t.id,t.organisation_id,o.name organisation_name,case when t.link_id is null then t.subject else t.subject||' · '||(select p.first_name||' '||p.last_name from public.star_organisation_players l join public.coaching_players p on p.id=l.player_id where l.id=t.link_id) end subject,t.link_id,
    (select max(m.id) from star_private.org_messages m where m.thread_id=t.id) last_id,
    (select max(m.created_at) from star_private.org_messages m where m.thread_id=t.id) updated_at,
    (select count(*) from star_private.org_deliveries d join star_private.org_messages m on m.id=d.message_id where m.thread_id=t.id and d.recipient_id=uid and d.read_at is null) unread
    from star_private.org_threads t join public.star_organisations o on o.id=t.organisation_id where (org is null or t.organisation_id=org) and star_private.org_inbox_access(t.id,uid)) x),'[]'),
   'organisations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) order by o.name) from public.star_organisations o where o.active and (manager or star_private.org_member(o.id))),'[]'),
   'players',coalesce((select jsonb_agg(jsonb_build_object('link_id',l.id,'organisation_id',l.organisation_id,'name',p.first_name||' '||p.last_name)) from public.star_organisation_players l join public.coaching_players p on p.id=l.player_id where (org is null or l.organisation_id=org) and (manager or star_private.org_member(l.organisation_id)) and star_private.org_link_active(l.id)),'[]'));
 elsif p_action='create' then
  if org is null then raise exception 'Choose an organisation.'; end if;
  lid:=nullif(p_data->>'link_id','')::uuid; subject_text:=trim(p_data->>'subject'); body_text:=trim(p_data->>'body'); cid:=(p_data->>'client_id')::uuid;
  if cid is null or subject_text is null or length(subject_text) not between 2 and 200 or body_text is null or length(body_text) not between 1 and 2000 then raise exception 'Add a subject and a message of up to 2,000 characters.'; end if;
  if lid is not null and not exists(select 1 from public.star_organisation_players l where l.id=lid and l.organisation_id=org and star_private.org_link_active(l.id)) then raise exception 'Current parent sharing permission is required.'; end if;
  -- The sender lock serialises duplicate retries, including new-thread creation.
  perform pg_advisory_xact_lock(hashtextextended(uid::text,17));
  select m.thread_id into tid from star_private.org_messages m where m.sender_id=uid and m.client_id=cid;
  if tid is not null then
   if not star_private.org_inbox_access(tid,uid) then raise exception 'Conversation unavailable.'; end if;
   return jsonb_build_object('thread_id',tid);
  end if;
  if (select count(*) from star_private.org_messages where sender_id=uid and created_at>now()-interval '1 minute')>=20 then raise exception 'Please wait a minute before sending more messages.'; end if;
  insert into star_private.org_threads(organisation_id,link_id,subject) values(org,lid,subject_text) returning id into tid;
  insert into star_private.org_messages(thread_id,sender_id,sender_role,body,client_id) values(tid,uid,case when manager then 'staff' else 'organisation' end,body_text,cid);
  return jsonb_build_object('thread_id',tid);
 end if;
 tid:=(p_data->>'thread_id')::uuid;
 if not star_private.org_inbox_access(tid,uid) or not exists(select 1 from star_private.org_threads t where t.id=tid and (org is null or t.organisation_id=org)) then raise exception 'Conversation unavailable. Check current access and parent sharing permission.'; end if;
 if p_action='thread' then
  return jsonb_build_object('messages',coalesce((select jsonb_agg(x order by x.id::bigint) from
   (select m.id::text id,m.sender_role,m.kind,m.body,m.created_at,m.sender_id=uid own from star_private.org_messages m where m.thread_id=tid and (nullif(p_data->>'before','') is null or m.id<(p_data->>'before')::bigint) order by m.id desc limit 100) x),'[]'));
 elsif p_action='read' then
  mid:=(p_data->>'through')::bigint;
  if not exists(select 1 from star_private.org_messages where id=mid and thread_id=tid) then raise exception 'Message unavailable.'; end if;
  update star_private.org_deliveries d set read_at=coalesce(d.read_at,now()) from star_private.org_messages m where d.message_id=m.id and m.thread_id=tid and m.id<=mid and d.recipient_id=uid;
  return jsonb_build_object('ok',true);
 elsif p_action='send' then
  body_text:=trim(p_data->>'body'); cid:=(p_data->>'client_id')::uuid;
  if cid is null or body_text is null or length(body_text) not between 1 and 2000 then raise exception 'Write a message of up to 2,000 characters.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,17));
  if exists(select 1 from star_private.org_messages where sender_id=uid and client_id=cid and thread_id=tid) then return jsonb_build_object('thread_id',tid); end if;
  if (select count(*) from star_private.org_messages where sender_id=uid and created_at>now()-interval '1 minute')>=20 then raise exception 'Please wait a minute before sending more messages.'; end if;
  perform 1 from star_private.org_threads where id=tid for update;
  insert into star_private.org_messages(thread_id,sender_id,sender_role,body,client_id) values(tid,uid,case when manager then 'staff' else 'organisation' end,body_text,cid);
  return jsonb_build_object('thread_id',tid);
 end if;
 raise exception 'Unknown inbox action.';
end $$;
create function public.star_organisation_inbox(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select star_private.organisation_inbox(p_action,p_data) $$;
revoke all on function public.star_organisation_inbox(text,jsonb) from public,anon;
grant execute on function public.star_organisation_inbox(text,jsonb) to authenticated;
revoke all on function star_private.organisation_inbox(text,jsonb) from public,anon;
grant execute on function star_private.organisation_inbox(text,jsonb) to authenticated;
revoke all on function star_private.org_inbox_access(uuid,uuid,text),star_private.org_queue_message() from public,anon,authenticated;

-- New selected feedback, observations and request/referral updates appear together in the inbox.
create function star_private.org_record_inbox_event() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid; lid uuid; tid uuid; skey text; heading text; message_text text; side text:='staff'; event_kind text:='update';
begin
 if tg_table_name='star_organisation_updates' then
  lid:=new.link_id; skey:='player:'||lid::text; heading:='Player feedback & observations'; event_kind:='shared_feedback';
  message_text:=new.feedback||case when new.suggested_support<>'' then E'\n\nSuggested support: '||new.suggested_support else '' end;
 elsif tg_table_name='star_organisation_observations' then
  lid:=new.link_id; skey:='player:'||lid::text; heading:='Player feedback & observations';
  if tg_op='INSERT' then side:='organisation'; message_text:=new.observation; event_kind:='observation';
  elsif new.response is distinct from old.response and new.response<>'' then message_text:=new.response; event_kind:='observation_reply'; else return new; end if;
 elsif tg_table_name='star_organisation_requests' then
  org:=new.organisation_id; skey:='request:'||new.id::text; heading:=left('Coaching request · '||replace(new.service,'_',' '),200); event_kind:='session_request';
  if tg_op='INSERT' then side:='organisation'; message_text:=new.details;
  elsif new.response is distinct from old.response or new.status is distinct from old.status then message_text:='Request status: '||new.status||case when new.response<>'' then E'\n\n'||new.response else '' end; else return new; end if;
 else
  org:=new.organisation_id; skey:='referral:'||new.id::text; heading:=left('Referral · '||new.player_name,200); event_kind:='referral_update';
  if tg_op='INSERT' then return new; end if;
  if new.response is distinct from old.response or new.status is distinct from old.status then message_text:='Referral status: '||new.status||case when new.response<>'' then E'\n\n'||new.response else '' end; else return new; end if;
 end if;
 if lid is not null then
  select l.organisation_id into org from public.star_organisation_players l where l.id=lid;
  if not star_private.org_link_active(lid) then return new; end if;
 end if;
 if org is null or message_text is null or not exists(select 1 from public.star_organisations where id=org and active) then return new; end if;
 insert into star_private.org_threads(organisation_id,link_id,subject,source_key) values(org,lid,heading,skey)
 on conflict(source_key) do update set source_key=excluded.source_key returning id into tid;
 insert into star_private.org_messages(thread_id,sender_id,sender_role,kind,body) values(tid,auth.uid(),side,event_kind,message_text);
 return new;
end $$;
revoke all on function star_private.org_record_inbox_event() from public,anon,authenticated;
create trigger org_feedback_inbox after insert on public.star_organisation_updates for each row execute function star_private.org_record_inbox_event();
create trigger org_observation_inbox after insert or update of response on public.star_organisation_observations for each row execute function star_private.org_record_inbox_event();
create trigger org_request_inbox after insert or update of response,status on public.star_organisation_requests for each row execute function star_private.org_record_inbox_event();
create trigger org_referral_inbox after update of response,status on public.star_organisation_referrals for each row execute function star_private.org_record_inbox_event();

-- The worker holds a dedicated random secret, never a service role key or browser credential.
create function star_private.org_email_authorise(p_secret text) returns void language plpgsql security definer set search_path='' as $$
declare expected text;
begin
 select decrypted_secret into expected from vault.decrypted_secrets where name='organisation_email_worker_secret';
 if expected is null or length(coalesce(p_secret,''))<>64 or extensions.digest(p_secret,'sha256') is distinct from extensions.digest(expected,'sha256') then raise exception 'Worker access denied.'; end if;
end $$;
revoke all on function star_private.org_email_authorise(text) from public,anon,authenticated;
create function star_private.organisation_email_worker(p_secret text,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; job star_private.org_deliveries; tid uuid; email_text text;
begin
 perform star_private.org_email_authorise(p_secret);
 if p_action='claim' then
  update star_private.org_deliveries set status='failed',claim_token=null,lease_until=null where status in ('pending','sending') and attempts>=8 and (lease_until is null or lease_until<now());
  with picked as (select d.id from star_private.org_deliveries d where d.attempts<8 and d.available_at<=now() and (d.status='pending' or (d.status='sending' and d.lease_until<now())) order by d.available_at limit 10 for update skip locked),
  claimed as (update star_private.org_deliveries d set status='sending',claim_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1 from picked where d.id=picked.id returning d.id,d.claim_token)
  select coalesce(jsonb_agg(claimed),'[]') into result from claimed;
  return result;
 end if;
 select * into job from star_private.org_deliveries where id=(p_data->>'id')::uuid and claim_token=(p_data->>'claim_token')::uuid and status='sending' and lease_until>now() for update;
 if job.id is null then return null; end if;
 select m.thread_id into tid from star_private.org_messages m where m.id=job.message_id;
 if p_action='check' then
  if job.read_at is not null or not star_private.org_inbox_access(tid,job.recipient_id,job.audience) then
   update star_private.org_deliveries set status='skipped',claim_token=null,lease_until=null where id=job.id; return null;
  end if;
  select u.email into email_text from auth.users u where u.id=job.recipient_id;
  return jsonb_build_object('email',email_text,'audience',job.audience,'thread_id',tid);
 elsif p_action='finish' then
  if p_data->>'status' not in ('sent','retry','failed') then raise exception 'Invalid delivery outcome.'; end if;
  update star_private.org_deliveries set status=case when p_data->>'status'='retry' then case when attempts>=8 then 'failed' else 'pending' end else p_data->>'status' end,
   available_at=now()+make_interval(secs=>least(3600,60*power(2,attempts)::integer)),claim_token=null,lease_until=null,
   sent_at=case when p_data->>'status'='sent' then now() else null end,provider_id=left(p_data->>'provider_id',200) where id=job.id;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'Unknown worker action.';
end $$;
create function public.star_organisation_email_worker(p_secret text,p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select star_private.organisation_email_worker(p_secret,p_action,p_data) $$;
revoke all on function public.star_organisation_email_worker(text,text,jsonb),star_private.organisation_email_worker(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.star_organisation_email_worker(text,text,jsonb),star_private.organisation_email_worker(text,text,jsonb) to anon;

create function star_private.run_organisation_email_worker() returns void language plpgsql security definer set search_path='' as $$
declare secret_value text;
begin
 if not exists(select 1 from star_private.org_deliveries where status in ('pending','sending') and available_at<=now() and (lease_until is null or lease_until<now())) then return; end if;
 select decrypted_secret into secret_value from vault.decrypted_secrets where name='organisation_email_worker_secret';
 if secret_value is null then return; end if;
 perform net.http_post(url:='https://starfootball.uk/api/organisation-alerts',headers:=jsonb_build_object('Content-Type','application/json','x-star-worker-secret',secret_value),body:='{}'::jsonb,timeout_milliseconds:=60000);
end $$;
revoke all on function star_private.run_organisation_email_worker() from public,anon,authenticated;
-- Scheduling is enabled separately only after the production handler is ready.
