-- Organisation scheduling is additive; existing family bookings are not populated automatically.
alter table public.training_sessions add column organisation_id uuid references public.star_organisations(id);
alter table public.training_sessions add column cancelled_at timestamptz;
create index training_sessions_organisation on public.training_sessions(organisation_id) where organisation_id is not null;
create table star_private.org_session_blocks(
 id uuid primary key default gen_random_uuid(),organisation_id uuid not null references public.star_organisations(id),
 request_id uuid references public.star_organisation_requests(id) on delete set null,
 created_by uuid not null references auth.users(id),client_id uuid not null,created_at timestamptz not null default now(),unique(created_by,client_id)
);
create table star_private.org_session_details(
 session_id uuid primary key references public.training_sessions(id) deferrable initially deferred,
 organisation_id uuid not null references public.star_organisations(id),block_id uuid not null references star_private.org_session_blocks(id),
 coach_id uuid references auth.users(id) on delete set null,coach_name text not null check(length(coach_name) between 2 and 100),
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
 change_note text not null default '' check(length(change_note)<=2000),revision bigint not null default 1,updated_at timestamptz not null default clock_timestamp()
);
create index org_session_blocks_organisation on star_private.org_session_blocks(organisation_id);
create index org_session_blocks_request on star_private.org_session_blocks(request_id);
create index org_session_details_coach on star_private.org_session_details(coach_id);
create index org_session_details_block on star_private.org_session_details(block_id);
create index org_session_details_org on star_private.org_session_details(organisation_id);
create table star_private.org_session_changes(
 id uuid primary key default gen_random_uuid(),session_id uuid not null references star_private.org_session_details(session_id),
 submitted_by uuid not null references auth.users(id),kind text not null check(kind in ('change','cancel')),
 details text not null check(length(details) between 5 and 2000),status text not null default 'pending' check(status in ('pending','applied','declined')),
 response text not null default '' check(length(response)<=2000),revision bigint not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default clock_timestamp()
);
create unique index org_session_one_pending_change on star_private.org_session_changes(session_id) where status='pending';
create index org_session_changes_sender on star_private.org_session_changes(submitted_by);
alter table star_private.org_session_blocks enable row level security;
alter table star_private.org_session_details enable row level security;
alter table star_private.org_session_changes enable row level security;
create policy no_direct_blocks on star_private.org_session_blocks for all using(false) with check(false);
create policy no_direct_session_details on star_private.org_session_details for all using(false) with check(false);
create policy no_direct_session_changes on star_private.org_session_changes for all using(false) with check(false);
revoke all on star_private.org_session_blocks,star_private.org_session_details,star_private.org_session_changes from public,anon,authenticated;

create function star_private.org_uk_time(value text) returns timestamptz language plpgsql immutable set search_path='' as $$
declare civil timestamp; stamp timestamptz;
begin
 if value is null or value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then raise exception 'Enter a valid UK date and time.'; end if;
 civil:=value::timestamp;stamp:=civil at time zone 'Europe/London';
 if stamp at time zone 'Europe/London'<>civil or (stamp-interval '1 hour') at time zone 'Europe/London'=civil or (stamp+interval '1 hour') at time zone 'Europe/London'=civil then raise exception 'Choose a UK time outside the missing or repeated clock-change hour.'; end if;
 return stamp;
end $$;

create function star_private.org_schedule_event(p_block uuid,p_body text,p_side text default 'staff') returns void language plpgsql security definer set search_path='' as $$
declare tid uuid; org uuid;
begin
 select organisation_id into strict org from star_private.org_session_blocks where id=p_block;
 insert into star_private.org_threads(organisation_id,subject,source_key) values(org,'Coaching schedule','schedule:'||p_block::text)
 on conflict(source_key) do update set source_key=excluded.source_key returning id into tid;
 insert into star_private.org_messages(thread_id,sender_id,sender_role,kind,body) values(tid,auth.uid(),p_side,'session_schedule',p_body);
end $$;

-- Shared calendar rows are the single source for date/time/venue; guard every write, including old clients.
create function star_private.guard_org_calendar() returns trigger language plpgsql security definer set search_path='' as $$
declare detail star_private.org_session_details;
begin
 if tg_op='DELETE' then
  if old.organisation_id is not null then raise exception 'Cancel organisation sessions through Schools & clubs to retain their history.'; end if; return old;
 end if;
 if tg_op='UPDATE' and new.organisation_id is distinct from old.organisation_id then raise exception 'Organisation ownership cannot change.'; end if;
 if new.organisation_id is null then
  if new.cancelled_at is not null then raise exception 'Use the existing family booking workflow for this session.'; end if;return new;
 end if;
 if auth.uid() is not null and (not star_private.is_staff_manager() or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and not coalesce(is_anonymous,false))) then raise exception 'Verified STAR management access required.'; end if;
 select * into detail from star_private.org_session_details where session_id=new.id;
 if detail.session_id is null or detail.organisation_id<>new.organisation_id then raise exception 'Create organisation sessions through Schools & clubs.'; end if;
 if not exists(select 1 from public.star_organisations where id=new.organisation_id and active) then raise exception 'Restore organisation access before changing its sessions.'; end if;
 if tg_op='UPDATE' then
  if old.cancelled_at is not null then raise exception 'Cancelled sessions retain their history. Schedule a new session instead.'; end if;
  if detail.status='completed' then raise exception 'Completed sessions retain their recorded arrangements.'; end if;
  if (new.starts_at,new.ends_at) is distinct from (old.starts_at,old.ends_at) and exists(select 1 from public.training_attendance where session_id=new.id) then raise exception 'This session has attendance records. Keep its recorded times.'; end if;
  if new.cancelled_at is not null and exists(select 1 from public.training_attendance where session_id=new.id) then raise exception 'This session has attendance records and cannot be cancelled.'; end if;
 end if;
 if new.cancelled_at is null then
  if not exists(select 1 from public.staff_members sm join auth.users u on u.id=sm.user_id where sm.user_id=detail.coach_id and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) then raise exception 'Choose an active STAR coach.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(detail.coach_id::text,42));
  if exists(select 1 from star_private.org_session_details d join public.training_sessions s on s.id=d.session_id where d.coach_id=detail.coach_id and d.status='scheduled' and s.cancelled_at is null and s.id<>new.id and s.starts_at<new.ends_at and s.ends_at>new.starts_at) then raise exception 'This coach already has an organisation session at that time.'; end if;
 end if;
 return new;
end $$;
create trigger guard_org_calendar before insert or update or delete on public.training_sessions for each row execute function star_private.guard_org_calendar();

create function star_private.org_calendar_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare detail star_private.org_session_details;
begin
 if new.organisation_id is null then return new; end if;
 update star_private.org_session_details set status=case when new.cancelled_at is not null then 'cancelled' else status end,revision=revision+1,updated_at=clock_timestamp() where session_id=new.id returning * into detail;
 if new.cancelled_at is not null then
  update star_private.org_session_changes set status='applied',response='STAR cancelled this session.',revision=revision+1,updated_at=clock_timestamp() where session_id=new.id and status='pending';
 end if;
 perform star_private.org_schedule_event(detail.block_id,case when new.cancelled_at is null then 'Session arrangements updated: ' else 'Session cancelled: ' end||new.title||E'\n'||to_char(new.starts_at at time zone 'Europe/London','Dy DD Mon YYYY HH24:MI')||' UK time'||E'\nVenue: '||new.venue||E'\nCoach: '||detail.coach_name||case when detail.change_note<>'' then E'\n'||detail.change_note else '' end);
 return new;
end $$;
create trigger org_calendar_changed after update of title,starts_at,ends_at,venue,cancelled_at on public.training_sessions for each row execute function star_private.org_calendar_changed();

-- Organisation group sessions are distinct from personal family bookings and rosters.
create function star_private.guard_org_family_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.training_sessions where id=new.source_session_id and organisation_id is not null) then raise exception 'Organisation sessions are shared through Schools & clubs. Schedule personal family bookings separately.'; end if;
 return new;
end $$;
create trigger guard_org_family_publication before insert or update of source_session_id on public.family_session_schedule for each row execute function star_private.guard_org_family_publication();

create function star_private.organisation_schedule(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();manager boolean;staff boolean;org uuid;sid uuid;bid uuid;coach uuid;rid uuid;cid uuid;
 detail star_private.org_session_details; sess public.training_sessions; change star_private.org_session_changes;
 first_local text; date_value text; dates jsonb; start_stamp timestamptz; duration integer; title_text text;venue_text text;reply text; target_action text:=p_action; outcome text; result jsonb; id_value uuid; count_value integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager();staff:=exists(select 1 from public.staff_members where user_id=uid and active);
 org:=nullif(p_data->>'organisation_id','')::uuid;
 if p_action='list' then
  if not manager and not staff and (org is null or not star_private.org_member(org)) then raise exception 'Current organisation access is required.'; end if;
  if org is not null and not manager and not star_private.org_member(org) then raise exception 'Current organisation access is required.'; end if;
  return jsonb_build_object('delivered',(select count(*) from star_private.org_session_details d where d.status='completed' and (org is null or d.organisation_id=org) and (manager or (org is not null and star_private.org_member(org)) or (staff and d.coach_id=uid))),'sessions',coalesce((select jsonb_agg(x order by x.starts_at) from
   (select s.id,s.title,s.starts_at,s.ends_at,s.venue,d.status,d.revision,case when manager then d.coach_id else null end coach_id,d.block_id,s.organisation_id,o.name organisation_name,
    case when sm.active or d.status='completed' then d.coach_name else 'Coach to be confirmed' end coach_name,
    b.request_id,(select count(*) from star_private.org_session_details siblings where siblings.block_id=d.block_id) block_size
    from public.training_sessions s join star_private.org_session_details d on d.session_id=s.id join star_private.org_session_blocks b on b.id=d.block_id
    join public.star_organisations o on o.id=s.organisation_id left join public.staff_members sm on sm.user_id=d.coach_id left join auth.users u on u.id=d.coach_id
    where (org is null or s.organisation_id=org) and (manager or (org is not null and star_private.org_member(org)) or (staff and d.coach_id=uid))
     and (manager or o.active) and (coalesce(p_data->>'history','false')='true' or (s.ends_at>=now() and d.status='scheduled'))
    order by s.starts_at limit 500) x),'[]'),
   'changes',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'session_id',c.session_id,'kind',c.kind,'details',c.details,'status',c.status,'response',c.response,'revision',c.revision,'created_at',c.created_at) order by c.created_at desc) from star_private.org_session_changes c join star_private.org_session_details d on d.session_id=c.session_id
    where (org is null or d.organisation_id=org) and (manager or (org is not null and star_private.org_member(org))) and (manager or exists(select 1 from public.star_organisations where id=d.organisation_id and active))),'[]'),
   'coaches',case when manager then coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(nullif(left(u.raw_user_meta_data->>'full_name',100),''),u.email)) order by u.email) from public.staff_members s join auth.users u on u.id=s.user_id where s.active and u.email_confirmed_at is not null),'[]') else '[]'::jsonb end);
 end if;
 if p_action='create' then
  if not manager then raise exception 'STAR management access required.'; end if;
  if org is null or not exists(select 1 from public.star_organisations where id=org and active) then raise exception 'Choose an active organisation.'; end if;
  cid:=(p_data->>'client_id')::uuid; if cid is null then raise exception 'A request identifier is required.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text||cid::text,43));
  select id into bid from star_private.org_session_blocks where created_by=uid and client_id=cid;
  if bid is not null then return jsonb_build_object('block_id',bid,'reused',true); end if;
  rid:=nullif(p_data->>'request_id','')::uuid;
  if rid is not null and not exists(select 1 from public.star_organisation_requests where id=rid and organisation_id=org and status not in ('declined','completed')) then raise exception 'Choose an open request from this organisation.'; end if;
  coach:=(p_data->>'coach_id')::uuid;title_text:=trim(p_data->>'title');venue_text:=trim(p_data->>'venue');duration:=(p_data->>'duration_minutes')::integer;first_local:=p_data->>'starts_local';dates:=p_data->'dates';
  if title_text is null or length(title_text) not between 3 and 100 or venue_text is null or length(venue_text) not between 2 and 150 or duration is null or duration not between 15 and 360 then raise exception 'Check the session title, venue and duration (15–360 minutes).'; end if;
  if dates is null or jsonb_typeof(dates)<>'array' or jsonb_array_length(dates) not between 1 and 40 then raise exception 'Choose between one and forty session dates.'; end if;
  if (select count(distinct value) from jsonb_array_elements_text(dates))<>jsonb_array_length(dates) then raise exception 'Session dates cannot repeat.'; end if;
  perform star_private.org_uk_time(first_local);
  insert into star_private.org_session_blocks(organisation_id,request_id,created_by,client_id) values(org,rid,uid,cid) returning id into bid;
  for date_value in select value from jsonb_array_elements_text(dates) order by value loop
   if date_value !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Check session dates.'; end if;
   start_stamp:=star_private.org_uk_time(date_value||'T'||substring(first_local from 12));
   if start_stamp<=now() or start_stamp>now()+interval '1 year' then raise exception 'Choose future session dates within the next year.'; end if;
   sid:=gen_random_uuid();
   insert into star_private.org_session_details(session_id,organisation_id,block_id,coach_id,coach_name) values(sid,org,bid,coach,trim(p_data->>'coach_name'));
   insert into public.training_sessions(id,organisation_id,title,programme,starts_at,ends_at,venue,created_by) values(sid,org,title_text,'Other',start_stamp,start_stamp+make_interval(mins=>duration),venue_text,uid);
  end loop;
  if rid is not null then update public.star_organisation_requests set status='confirmed',updated_at=clock_timestamp() where id=rid and status<>'confirmed'; end if;
  perform star_private.org_schedule_event(bid,'STAR confirmed '||jsonb_array_length(dates)||' coaching session(s): '||title_text||E'\nDates: '||(select string_agg(value,', ' order by value) from jsonb_array_elements_text(dates))||E'\nStart: '||substring(first_local from 12)||' UK time · '||duration||' minutes'||E'\nVenue: '||venue_text||E'\nCoach: '||trim(p_data->>'coach_name'));
  return jsonb_build_object('block_id',bid,'created',jsonb_array_length(dates));
 end if;
 if p_action='resolve_change' then
  if not manager then raise exception 'STAR management access required.'; end if;
  -- Session lock precedes request lock in every mutation, avoiding cancellation/review deadlocks.
  select session_id into sid from star_private.org_session_changes where id=(p_data->>'id')::uuid;
 else sid:=(p_data->>'session_id')::uuid; end if;
 select * into sess from public.training_sessions where id=sid for update;
 select * into detail from star_private.org_session_details where session_id=sid for update;
 if detail.session_id is null or (org is not null and org<>detail.organisation_id) then raise exception 'Organisation session unavailable.'; end if;
 org:=detail.organisation_id;
 if not exists(select 1 from public.star_organisations where id=org and active) then raise exception 'Organisation is paused. Restore access before changing sessions.'; end if;
 if p_action='request_change' then
  if not star_private.org_member(org) then raise exception 'Current organisation access is required.'; end if;
  if detail.status<>'scheduled' or sess.starts_at<=now() then raise exception 'Only upcoming scheduled sessions can be changed.'; end if;
  if nullif(p_data->>'expected_revision','')::bigint is distinct from detail.revision then raise exception 'Session changed. Refresh before requesting a change.'; end if;
  if exists(select 1 from star_private.org_session_changes where session_id=sid and status='pending') then raise exception 'This session already has a pending request.'; end if;
  insert into star_private.org_session_changes(session_id,submitted_by,kind,details) values(sid,uid,p_data->>'kind',trim(p_data->>'details')) returning id into id_value;
  perform star_private.org_schedule_event(detail.block_id,'Organisation requested a '||case when p_data->>'kind'='cancel' then 'cancellation' else 'change' end||': '||sess.title||E'\n'||to_char(sess.starts_at at time zone 'Europe/London','Dy DD Mon YYYY HH24:MI')||' UK time'||E'\n'||trim(p_data->>'details'),'organisation');
  return jsonb_build_object('id',id_value);
 end if;
 if not manager then raise exception 'STAR management access required.'; end if;
 if nullif(p_data->>'expected_revision','')::bigint is distinct from detail.revision then raise exception 'Session changed. Refresh before saving.'; end if;
 if p_action='resolve_change' then
  select * into change from star_private.org_session_changes where id=(p_data->>'id')::uuid for update;
  if change.status<>'pending' or nullif(p_data->>'change_revision','')::bigint is distinct from change.revision then raise exception 'Request changed. Refresh before reviewing.'; end if;
  outcome:=p_data->>'outcome';reply:=trim(coalesce(p_data->>'response',''));
  if length(reply) not between 5 and 2000 then raise exception 'Add a clear response (5–2,000 characters).'; end if;
  if outcome='declined' then
   update star_private.org_session_changes set status='declined',response=reply,revision=revision+1,updated_at=clock_timestamp() where id=change.id;
   perform star_private.org_schedule_event(detail.block_id,'STAR reviewed a session request. Arrangements remain unchanged: '||sess.title||E'\n'||reply);
   return jsonb_build_object('ok',true);
  elsif outcome='applied' then target_action:=case when change.kind='cancel' then 'cancel' else 'save' end;
  else raise exception 'Choose apply or decline.'; end if;
 end if;
 if target_action='save' then
  if detail.status<>'scheduled' or sess.starts_at<=now() then raise exception 'Only upcoming scheduled sessions can be edited.'; end if;
  start_stamp:=star_private.org_uk_time(p_data->>'starts_local');duration:=(p_data->>'duration_minutes')::integer;coach:=(p_data->>'coach_id')::uuid;title_text:=trim(p_data->>'title');venue_text:=trim(p_data->>'venue');
  if start_stamp<=now() or start_stamp>now()+interval '1 year' or duration is null or duration not between 15 and 360 then raise exception 'Check the future start time and duration.'; end if;
  update star_private.org_session_details set coach_id=coach,coach_name=trim(p_data->>'coach_name'),change_note=trim(coalesce(p_data->>'response','')) where session_id=sid;
  update public.training_sessions set title=title_text,starts_at=start_stamp,ends_at=start_stamp+make_interval(mins=>duration),venue=venue_text where id=sid;
 elsif target_action='cancel' then
  if detail.status<>'scheduled' then raise exception 'Only scheduled sessions can be cancelled.'; end if;
  if length(trim(coalesce(p_data->>'response',''))) not between 5 and 2000 then raise exception 'Explain the cancellation (5–2,000 characters).'; end if;
  update star_private.org_session_details set change_note=trim(p_data->>'response') where session_id=sid;
  update public.training_sessions set cancelled_at=now() where id=sid;
 elsif target_action='complete' then
  if exists(select 1 from star_private.org_session_changes where session_id=sid and status='pending') then raise exception 'Review the pending session request before marking delivered.'; end if;
  if detail.status<>'scheduled' or sess.ends_at>now() then raise exception 'Mark delivered only after a scheduled session has ended.'; end if;
  update star_private.org_session_details set status='completed',revision=revision+1,updated_at=clock_timestamp() where session_id=sid;
  perform star_private.org_schedule_event(detail.block_id,'STAR marked this coaching session delivered: '||sess.title||E'\n'||to_char(sess.starts_at at time zone 'Europe/London','Dy DD Mon YYYY HH24:MI')||' UK time');
 else raise exception 'Unknown scheduling action.'; end if;
 if p_action='resolve_change' then update star_private.org_session_changes set status='applied',response=reply,revision=revision+1,updated_at=clock_timestamp() where id=change.id; end if;
 return jsonb_build_object('ok',true);
end $$;
create function public.star_organisation_schedule(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select star_private.organisation_schedule(p_action,p_data)$$;
revoke all on function public.star_organisation_schedule(text,jsonb),star_private.organisation_schedule(text,jsonb) from public,anon;
grant execute on function public.star_organisation_schedule(text,jsonb),star_private.organisation_schedule(text,jsonb) to authenticated;
revoke all on function star_private.org_uk_time(text),star_private.org_schedule_event(uuid,text,text),star_private.guard_org_calendar(),star_private.org_calendar_changed(),star_private.guard_org_family_publication() from public,anon,authenticated;
