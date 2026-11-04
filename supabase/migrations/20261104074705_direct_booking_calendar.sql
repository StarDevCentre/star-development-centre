-- Direct bookings share the staff training calendar. No sessions are published by this migration.
create table star_private.booking_services(
 id text primary key,title text not null,audience text not null check(audience in ('school','club','parent')),
 minutes integer not null,price_pence integer not null,min_age integer,max_age integer,fixed boolean not null default false,
 programme text not null default 'Other',max_players integer,description text not null default ''
);
insert into star_private.booking_services(id,title,audience,minutes,price_pence,min_age,max_age,fixed,programme,max_players,description) values
 ('school_taster','Football taster','school',60,4000,null,null,false,'Other',null,''),
 ('school_lunch','Lunchtime football club','school',45,3500,null,null,false,'Other',null,''),
 ('school_after','After-school football club','school',60,5000,null,null,false,'Other',null,''),
 ('school_workshop','Development workshop','school',90,7500,null,null,false,'Other',8,'Maximum 8 players.'),
 ('school_halfday','Half-day football programme','school',180,14500,null,null,false,'Other',null,'Three hours including breaks.'),
 ('school_observation','Individual player observation','school',30,2000,null,null,false,'Other',1,''),
 ('club_emergency','Emergency team coaching','club',60,3500,null,null,false,'Other',null,'£35 per hour. Book 1–6 hours.'),
 ('club_goalkeeper','Goalkeeper coaching','club',60,3500,null,null,false,'Other',null,''),
 ('club_observation','Individual player observation with full report','club',30,1000,null,null,false,'Other',1,'30-minute observation; report writing is separate.'),
 ('sparks_5_7','STAR Sparks · ages 5–7','parent',60,500,5,7,true,'Sparks',10,'Monday 3:45–4:45pm. Same venue as ages 8–10, with a different coach.'),
 ('sparks_8_10','STAR Sparks · ages 8–10','parent',60,500,8,10,true,'Sparks',10,'Monday 3:45–4:45pm. Same venue as ages 5–7, with a different coach.'),
 ('development_11_13','Development Group · ages 11–13','parent',45,500,11,13,true,'Development',null,'Tuesday 4pm.'),
 ('development_14_16','Development Group · ages 14–16','parent',45,500,14,16,true,'Development',null,'Tuesday 5pm.'),
 ('one_to_one','One to One Coaching','parent',60,4000,11,18,false,'1-to-1',1,''),
 ('flyers','STAR Flyers programme session','parent',60,0,7,10,false,'Flyers',1,'Uses one of your released programme sessions. Package payment remains as agreed with STAR.'),
 ('season_support','Player Season Support','parent',30,2500,5,18,false,'Other',1,'At the player’s club facilities; please agree club access first.'),
 ('assessment','FREE assessment and introduction','parent',30,0,5,18,false,'Other',1,'Does not enrol the player in a paid programme.');
create table star_private.booking_coaches(
 coach_id uuid primary key references public.staff_members(user_id),coach_name text not null check(length(coach_name) between 2 and 100),
 parent_venue text not null default '' check(length(parent_venue)<=150),enabled boolean not null default false,
 services text[] not null default '{}'
);
create table star_private.booking_sessions(
 session_id uuid primary key references public.training_sessions(id) deferrable initially deferred,
 service_id text not null references star_private.booking_services(id),coach_id uuid not null references public.staff_members(user_id),
 capacity integer not null check(capacity between 1 and 100),enabled boolean not null default true,pair_id uuid,
 created_by uuid not null references auth.users(id)
);
create table star_private.booking_orders(
 id uuid primary key default gen_random_uuid(),created_by uuid not null references auth.users(id),client_id uuid not null,
 organisation_id uuid references public.star_organisations(id),player_id uuid references public.coaching_players(id),
 service_id text not null references star_private.booking_services(id),fingerprint text not null,
 total_pence integer not null,discount_percent integer not null default 0,payment text not null,
 venue text not null,details text not null default '',created_at timestamptz not null default now(),unique(created_by,client_id)
);
create table star_private.booking_places(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references star_private.booking_orders(id),
 session_id uuid not null references star_private.booking_sessions(session_id),player_id uuid references public.coaching_players(id),
 cancelled_at timestamptz,unique(order_id,session_id)
);
create unique index booking_player_place on star_private.booking_places(session_id,player_id) where cancelled_at is null;
create index booking_places_session on star_private.booking_places(session_id) where cancelled_at is null;
create table star_private.booking_credits(player_id uuid primary key references public.coaching_players(id),remaining integer not null check(remaining between 0 and 100));
create table star_private.booking_closures(id uuid primary key default gen_random_uuid(),starts_at timestamptz not null,ends_at timestamptz not null,reason text not null default '' check(length(reason)<=150),check(ends_at>starts_at));
-- All writes, including legacy calendar clients, use one transaction lock before coach locks.
create function star_private.booking_open(p_start timestamptz,p_end timestamptz) returns boolean language sql stable set search_path='' as $$
 select p_start>now() and p_start<now()+interval '1 year' and p_end>p_start
 and (p_start at time zone 'Europe/London')::date=(p_end at time zone 'Europe/London')::date
 and extract(isodow from p_start at time zone 'Europe/London') between 1 and 6
 and (p_start at time zone 'Europe/London')::time>='10:00'::time
 and (p_end at time zone 'Europe/London')::time<=case extract(isodow from p_start at time zone 'Europe/London') when 3 then '17:00'::time when 6 then '16:00'::time else '20:00'::time end
 and not exists(select 1 from star_private.booking_closures c where c.starts_at<p_end and c.ends_at>p_start)
$$;
create function star_private.booking_free(p_coach uuid,p_start timestamptz,p_end timestamptz,p_ignore uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.training_sessions s
 left join star_private.org_session_details d on d.session_id=s.id
 left join star_private.booking_sessions b on b.session_id=s.id
 where s.cancelled_at is null and s.id is distinct from p_ignore
 and (coalesce(b.coach_id,d.coach_id)=p_coach or (b.coach_id is null and d.coach_id is null))
 and s.starts_at<p_end+interval '30 minutes' and s.ends_at+interval '30 minutes'>p_start)
$$;
create function star_private.booking_dob(p_player uuid) returns date language sql stable security definer set search_path='' as $$
 select coalesce((select i.date_of_birth from public.player_intakes i where i.portal_player_id=p_player order by i.created_at desc limit 1),
 (select r.date_of_birth from public.player_registrations r where r.enrolled_player_id=p_player order by r.created_at desc limit 1))
$$;
create function star_private.booking_guard_calendar() returns trigger language plpgsql security definer set search_path='' as $$
declare coach uuid; b star_private.booking_sessions;
begin
 perform pg_advisory_xact_lock(781493201);
 if tg_op='DELETE' then
  if exists(select 1 from star_private.booking_sessions where session_id=old.id) then raise exception 'Use Booking management to close or cancel a released session and retain its history.'; end if; return old;
 end if;
 select * into b from star_private.booking_sessions where session_id=new.id;
 if tg_op='UPDATE' and b.session_id is not null and (new.starts_at,new.ends_at,new.venue,new.title,new.programme,new.cancelled_at) is distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme,old.cancelled_at) then
  if not (not b.enabled and new.cancelled_at is not null and old.cancelled_at is null and (new.starts_at,new.ends_at,new.venue,new.title,new.programme) is not distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme)) then raise exception 'Released booking arrangements are fixed. Cancel through Booking management and release a replacement.'; end if;
 end if;
 if tg_op='INSERT' or (new.starts_at,new.ends_at,new.cancelled_at) is distinct from (old.starts_at,old.ends_at,old.cancelled_at) then
  select coalesce(b.coach_id,(select coach_id from star_private.org_session_details where session_id=new.id),new.created_by) into coach;
  if new.cancelled_at is null and not star_private.booking_free(coach,new.starts_at,new.ends_at,new.id) then raise exception 'This coach is already booked, including the 30-minute travel/setup gap.'; end if;
 end if;
 return new;
end $$;
create trigger aaa_booking_guard before insert or update or delete on public.training_sessions for each row execute function star_private.booking_guard_calendar();
-- Preserve the existing organisation guard. Permit retained cancellation of released family sessions.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('star_private.guard_org_calendar()'::regprocedure);
 definition:=replace(definition,'if new.cancelled_at is not null then raise exception ''Use the existing family booking workflow for this session.'';',
 'if new.cancelled_at is not null and not exists(select 1 from star_private.booking_sessions where session_id=new.id and not enabled) then raise exception ''Use the existing family booking workflow for this session.'';');
 execute definition;
end $$;
create function star_private.direct_booking(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); manager boolean; org uuid:=nullif(p_data->>'organisation_id','')::uuid; pid uuid:=nullif(p_data->>'player_id','')::uuid;
 svc star_private.booking_services; cfg star_private.booking_coaches; slot star_private.booking_sessions; sess public.training_sessions;
 oid uuid; sid uuid; cid uuid; coach uuid; pair uuid; ref uuid; fp text; day date; birth date; age_years integer;
 stamp timestamptz; finish timestamptz; duration integer; sessions_count integer; hourly integer; total integer; discount integer:=0; venue_text text;
 dates jsonb; date_item jsonb; result jsonb:='[]'; choices jsonb:='[]'; items jsonb; valid boolean; capacity_value integer; remaining_value integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager();
 if p_action in ('manage','coach','publish','close','credit','closure','remove_closure') then
  if not manager then raise exception 'STAR management access required.'; end if;
  perform pg_advisory_xact_lock(781493201);
  if p_action='coach' then
   coach:=(p_data->>'coach_id')::uuid;
   if not exists(select 1 from public.staff_members s join auth.users u on u.id=s.user_id where s.user_id=coach and s.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) then raise exception 'Choose an active verified STAR coach.'; end if;
   if exists(select 1 from jsonb_array_elements_text(p_data->'services') v where not exists(select 1 from star_private.booking_services where id=v and not fixed)) then raise exception 'Choose valid individual or organisation services.'; end if;
   insert into star_private.booking_coaches(coach_id,coach_name,parent_venue,enabled,services) values(coach,trim(p_data->>'coach_name'),trim(coalesce(p_data->>'venue','')),coalesce((p_data->>'enabled')::boolean,false),array(select jsonb_array_elements_text(p_data->'services')))
   on conflict(coach_id) do update set coach_name=excluded.coach_name,parent_venue=excluded.parent_venue,enabled=excluded.enabled,services=excluded.services;
  elsif p_action='publish' then
   select * into svc from star_private.booking_services where id=p_data->>'service_id' and fixed;
   if not found then raise exception 'Choose a group service.'; end if;
   day:=(p_data->>'date')::date; venue_text:=trim(p_data->>'venue');
   coach:=(p_data->>'coach_id')::uuid; pair:=gen_random_uuid();
   capacity_value:=case when svc.programme='Sparks' then 10 else (p_data->>'capacity')::integer end;
   if svc.programme='Sparks' then
    if extract(isodow from day)<>1 or coach=(p_data->>'second_coach_id')::uuid or nullif(p_data->>'second_coach_id','') is null then raise exception 'Sparks requires a Monday and two different coaches.'; end if;
   elsif extract(isodow from day)<>2 then raise exception 'Development Groups run on Tuesdays.'; end if;
   for svc in select * from star_private.booking_services where (id=p_data->>'service_id' and programme<>'Sparks') or (programme='Sparks' and p_data->>'service_id' in ('sparks_5_7','sparks_8_10')) order by id loop
    coach:=case when svc.id='sparks_8_10' then (p_data->>'second_coach_id')::uuid else (p_data->>'coach_id')::uuid end;
    if not exists(select 1 from star_private.booking_coaches c join public.staff_members s on s.user_id=c.coach_id join auth.users u on u.id=s.user_id where c.coach_id=coach and c.enabled and s.active and u.email_confirmed_at is not null) then raise exception 'Enable each verified coach in Booking management first.'; end if;
    stamp:=star_private.org_uk_time(day::text||case svc.id when 'development_11_13' then 'T16:00' when 'development_14_16' then 'T17:00' else 'T15:45' end);finish:=stamp+make_interval(mins=>svc.minutes);
    if not star_private.booking_open(stamp,finish) then raise exception 'Choose a future session within opening hours, outside closures.'; end if;
    sid:=gen_random_uuid();insert into star_private.booking_sessions values(sid,svc.id,coach,capacity_value,true,pair,uid);
    insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by) values(sid,svc.title,svc.programme,stamp,finish,venue_text,uid);
   end loop;
  elsif p_action='close' then
   sid:=(p_data->>'session_id')::uuid;
   select * into strict sess from public.training_sessions where id=sid;
   if sess.starts_at<=now() or exists(select 1 from public.training_attendance where session_id=sid) then raise exception 'Past sessions or attendance records must retain their arrangements.'; end if;
   update star_private.booking_sessions set enabled=false where session_id=sid;
   if not found then raise exception 'Released session not found.'; end if;
   -- Return unused Flyers entitlement once when cancellation is confirmed.
   update star_private.booking_credits c set remaining=remaining+(select count(*) from star_private.booking_places p join star_private.booking_orders o on o.id=p.order_id where p.session_id=sid and p.cancelled_at is null and o.service_id='flyers' and p.player_id=c.player_id);
   update star_private.booking_places set cancelled_at=now() where session_id=sid and cancelled_at is null;
   delete from public.family_session_schedule where source_session_id=sid;
   delete from public.training_session_participants where session_id=sid;
   update public.training_sessions set cancelled_at=now() where id=sid and cancelled_at is null;
  elsif p_action='credit' then
   if not exists(select 1 from public.coaching_players where id=pid and programme='Flyers') then raise exception 'Choose an enrolled Flyers player.'; end if;
   insert into star_private.booking_credits values(pid,(p_data->>'remaining')::integer) on conflict(player_id) do update set remaining=excluded.remaining;
  elsif p_action='closure' then
   insert into star_private.booking_closures(starts_at,ends_at,reason) values(star_private.org_uk_time(p_data->>'starts_local'),star_private.org_uk_time(p_data->>'ends_local'),left(coalesce(p_data->>'reason',''),150));
  elsif p_action='remove_closure' then delete from star_private.booking_closures where id=(p_data->>'id')::uuid;
  end if;
  return jsonb_build_object('coaches',coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(c.coach_name,u.email),'venue',coalesce(c.parent_venue,''),'enabled',coalesce(c.enabled,false),'services',coalesce(c.services,'{}'))) from public.staff_members s join auth.users u on u.id=s.user_id left join star_private.booking_coaches c on c.coach_id=s.user_id where s.active and u.email_confirmed_at is not null),'[]'),
   'services',(select jsonb_agg(to_jsonb(v) order by audience,title) from star_private.booking_services v),
   'closures',coalesce((select jsonb_agg(to_jsonb(c) order by starts_at) from star_private.booking_closures c where ends_at>now()),'[]'),
   'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name,'remaining',coalesce(c.remaining,0))) from public.coaching_players p left join star_private.booking_credits c on c.player_id=p.id where p.programme='Flyers'),'[]'),
   'sessions',coalesce((select jsonb_agg(x order by x.starts_at) from (select s.id,s.title,s.starts_at,s.ends_at,s.venue,b.capacity,b.enabled,c.coach_name,(select count(*) from star_private.booking_places p where p.session_id=s.id and p.cancelled_at is null) booked,
    (select coalesce(jsonb_agg(jsonb_build_object('name',case when o.organisation_id is not null then g.name else cp.first_name||' '||cp.last_name end,'order_id',o.id,'total_pence',o.total_pence,'discount_percent',o.discount_percent,'payment',o.payment,'details',o.details)),'[]') from star_private.booking_places bp join star_private.booking_orders o on o.id=bp.order_id left join public.coaching_players cp on cp.id=bp.player_id left join public.star_organisations g on g.id=o.organisation_id where bp.session_id=s.id and bp.cancelled_at is null) bookings
    from star_private.booking_sessions b join public.training_sessions s on s.id=b.session_id left join star_private.booking_coaches c on c.coach_id=b.coach_id where s.ends_at>now() order by s.starts_at limit 500) x),'[]'));
 end if;
 -- Caller context is checked on every read and write; revoked links grant nothing.
 if org is not null then
  pid:=null;
  if not star_private.org_member(org) then raise exception 'Current organisation access required.'; end if;
 elsif pid is null or not exists(select 1 from public.guardian_player_links where guardian_id=uid and player_id=pid) then raise exception 'Current parent access to this player is required.';
 end if;
 if p_action='catalogue' then
  return jsonb_build_object('services',coalesce((select jsonb_agg(to_jsonb(v) order by title) from star_private.booking_services v where (org is not null and v.audience=(select kind from public.star_organisations where id=org)) or (pid is not null and org is null and v.audience='parent' and extract(year from age((now() at time zone 'Europe/London')::date,star_private.booking_dob(pid))) between v.min_age and v.max_age and (v.id<>'flyers' or exists(select 1 from star_private.booking_credits where player_id=pid and remaining>0)))),'[]'),
   'credits',coalesce((select remaining from star_private.booking_credits where player_id=pid),0),
   'orders',coalesce((select jsonb_agg(x order by x.created_at desc) from (select o.id,o.created_at,v.title,o.total_pence,o.discount_percent,o.payment,o.venue,
     (select jsonb_agg(jsonb_build_object('id',p.id,'starts_at',s.starts_at,'ends_at',s.ends_at,'cancelled',p.cancelled_at is not null,'coach_name',c.coach_name) order by s.starts_at) from star_private.booking_places p join public.training_sessions s on s.id=p.session_id join star_private.booking_sessions bs on bs.session_id=s.id left join star_private.booking_coaches c on c.coach_id=bs.coach_id where p.order_id=o.id) sessions
    from star_private.booking_orders o join star_private.booking_services v on v.id=o.service_id where (org is not null and o.organisation_id=org) or (org is null and o.player_id=pid and o.organisation_id is null) order by o.created_at desc limit 100) x),'[]'));
 end if;
 select * into svc from star_private.booking_services where id=p_data->>'service_id';
 if not found or (org is not null and svc.audience<>(select kind from public.star_organisations where id=org)) or (org is null and svc.audience<>'parent') then raise exception 'Choose an available service.'; end if;
 hourly:=case when svc.id='club_emergency' then coalesce((p_data->>'hours')::integer,1) else 1 end;
 if hourly not between 1 and 6 then raise exception 'Choose 1–6 hours.'; end if;duration:=svc.minutes*hourly;
 if p_action='availability' then
  day:=(p_data->>'date')::date;
  if day<(now() at time zone 'Europe/London')::date or day>(now() at time zone 'Europe/London')::date+365 then raise exception 'Choose a date within the next year.'; end if;
  birth:=star_private.booking_dob(pid);age_years:=extract(year from age(day,birth));
  if org is null and (birth is null or age_years not between svc.min_age and svc.max_age) then raise exception 'This service is outside the player’s age range.'; end if;
  if svc.fixed then
   select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'starts_at',s.starts_at,'ends_at',s.ends_at,'venue',s.venue,'coach_name',c.coach_name,'remaining',b.capacity-(select count(*) from star_private.booking_places p where p.session_id=s.id and p.cancelled_at is null)) order by s.starts_at),'[]') into choices
   from star_private.booking_sessions b join public.training_sessions s on s.id=b.session_id join star_private.booking_coaches c on c.coach_id=b.coach_id join public.staff_members sm on sm.user_id=c.coach_id join auth.users u on u.id=sm.user_id
   where b.service_id=svc.id and b.enabled and c.enabled and sm.active and u.email_confirmed_at is not null and s.cancelled_at is null and (s.starts_at at time zone 'Europe/London')::date=day and star_private.booking_open(s.starts_at,s.ends_at)
   and (select count(*) from star_private.booking_places p where p.session_id=s.id and p.cancelled_at is null)<b.capacity;
  else
   for stamp in select x at time zone 'Europe/London' from generate_series(day+'10:00'::time,day+'19:45'::time,interval '15 minutes') x loop
    finish:=stamp+make_interval(mins=>duration);
    if star_private.booking_open(stamp,finish) and exists(select 1 from star_private.booking_coaches c join public.staff_members sm on sm.user_id=c.coach_id join auth.users u on u.id=sm.user_id where c.enabled and sm.active and u.email_confirmed_at is not null and svc.id=any(c.services) and (org is not null or svc.id='season_support' or length(c.parent_venue)>=2) and star_private.booking_free(c.coach_id,stamp,finish)) then
     select c.* into cfg from star_private.booking_coaches c join public.staff_members sm on sm.user_id=c.coach_id join auth.users u on u.id=sm.user_id where c.enabled and sm.active and u.email_confirmed_at is not null and svc.id=any(c.services) and (org is not null or svc.id='season_support' or length(c.parent_venue)>=2) and star_private.booking_free(c.coach_id,stamp,finish) order by c.coach_id limit 1;
     choices:=choices||jsonb_build_array(jsonb_build_object('starts_local',to_char(stamp at time zone 'Europe/London','YYYY-MM-DD"T"HH24:MI'),'starts_at',stamp,'ends_at',finish,'coach_id',case when org is null then cfg.coach_id else null end,'coach_name',case when org is null then cfg.coach_name else null end,'venue',case when org is null and svc.id<>'season_support' then cfg.parent_venue else null end));
    end if;
   end loop;
  end if;return jsonb_build_object('slots',choices);
 end if;
 if p_action<>'book' then raise exception 'Unknown booking action.'; end if;
 perform pg_advisory_xact_lock(781493201);
 cid:=(p_data->>'client_id')::uuid; if cid is null then raise exception 'Booking reference required.'; end if;
 fp:=md5((p_data-'client_id')::text);
 select id into oid from star_private.booking_orders where created_by=uid and client_id=cid and fingerprint=fp;
 if oid is not null then return jsonb_build_object('order_id',oid,'confirmed',true,'reused',true); end if;
 if exists(select 1 from star_private.booking_orders where created_by=uid and client_id=cid) then raise exception 'The booking changed. Refresh before confirming.'; end if;
 if svc.fixed then
  if org is not null then raise exception 'Group sessions are for family bookings.'; end if;
  sid:=(p_data->>'session_id')::uuid;select * into strict slot from star_private.booking_sessions where session_id=sid and service_id=svc.id and enabled;
  select * into strict sess from public.training_sessions where id=sid and cancelled_at is null;
  select * into strict cfg from star_private.booking_coaches where coach_id=slot.coach_id and enabled;
  if not exists(select 1 from public.staff_members sm join auth.users u on u.id=sm.user_id where sm.user_id=cfg.coach_id and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) or not star_private.booking_open(sess.starts_at,sess.ends_at) then raise exception 'This session is no longer available.'; end if;
  if (select count(*) from star_private.booking_places where session_id=sid and cancelled_at is null)>=slot.capacity then raise exception 'This age group is full. Choose another date.'; end if;
  stamp:=sess.starts_at;venue_text:=sess.venue;dates:=jsonb_build_array(to_char(stamp at time zone 'Europe/London','YYYY-MM-DD"T"HH24:MI'));coach:=slot.coach_id;
 else
  dates:=p_data->'dates';
  if jsonb_typeof(dates)<>'array' or jsonb_array_length(dates) not between 1 and 40 or (select count(distinct value) from jsonb_array_elements_text(dates))<>jsonb_array_length(dates) then raise exception 'Choose 1–40 different session dates.'; end if;
  if org is null and jsonb_array_length(dates)<>1 then raise exception 'Book individual family sessions one at a time.'; end if;
  for cfg in select c.* from star_private.booking_coaches c join public.staff_members s on s.user_id=c.coach_id join auth.users u on u.id=s.user_id where c.enabled and s.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and svc.id=any(c.services) and (org is not null or c.coach_id=nullif(p_data->>'coach_id','')::uuid) and (org is not null or svc.id='season_support' or length(c.parent_venue)>=2) order by c.coach_id loop
   valid:=true;
   for date_item in select * from jsonb_array_elements(dates) loop
    stamp:=star_private.org_uk_time(date_item#>>'{}');finish:=stamp+make_interval(mins=>duration);
    if not star_private.booking_open(stamp,finish) or not star_private.booking_free(cfg.coach_id,stamp,finish) then valid:=false;exit;end if;
   end loop;
   if valid then coach:=cfg.coach_id;exit;end if;
  end loop;
  if coach is null then raise exception 'These dates are no longer all available with one coach. Refresh availability or choose other dates.'; end if;
  venue_text:=case when org is not null or svc.id='season_support' then trim(p_data->>'venue') else cfg.parent_venue end;
 end if;
 if length(coalesce(venue_text,'')) not between 2 and 150 then raise exception 'Provide the venue and full location.'; end if;
 if length(coalesce(p_data->>'details',''))>2000 then raise exception 'Keep booking details within 2,000 characters.'; end if;
 if org is not null and coalesce((p_data->>'facilities')::boolean,false) is not true then raise exception 'Confirm your organisation provides suitable facilities.'; end if;
 if org is not null and (coalesce((p_data->>'players')::integer,0) not between 1 and coalesce(svc.max_players,1000)) then raise exception 'Check the player count for this service.'; end if;
 sessions_count:=jsonb_array_length(dates);if org is not null and sessions_count>=10 then discount:=15; end if;
 total:=round(svc.price_pence*hourly*sessions_count*(100-discount)/100.0);
 insert into star_private.booking_orders(created_by,client_id,organisation_id,player_id,service_id,fingerprint,total_pence,discount_percent,payment,venue,details)
 values(uid,cid,org,case when org is null then pid else null end,svc.id,fp,total,discount,case when org is not null then 'Invoice' when svc.id='flyers' then 'Existing programme arrangement' when svc.price_pence=0 then 'Free session' else 'Pay off-site after the session' end,venue_text,coalesce(p_data->>'details','')) returning id into oid;
 for date_item in select * from jsonb_array_elements(dates) loop
  stamp:=star_private.org_uk_time(date_item#>>'{}');finish:=stamp+make_interval(mins=>duration);
  if org is null then
   birth:=star_private.booking_dob(pid);age_years:=extract(year from age((stamp at time zone 'Europe/London')::date,birth));
   if birth is null or age_years not between svc.min_age and svc.max_age then raise exception 'This service is outside the player’s age range. Complete the linked onboarding details if her date of birth is missing.'; end if;
   if exists(select 1 from public.family_session_schedule f where f.player_id=pid and f.starts_at<finish and f.ends_at>stamp) then raise exception 'This player already has a session at that time.'; end if;
   if svc.id='flyers' then
    update star_private.booking_credits set remaining=remaining-1 where player_id=pid and remaining>0 and exists(select 1 from public.coaching_players where id=pid and programme='Flyers');
    if not found then raise exception 'No released Flyers programme sessions remain. Contact STAR.'; end if;
   end if;
   if svc.id='assessment' and (exists(select 1 from public.player_intakes where portal_player_id=pid and assessment_starts_at is not null) or exists(select 1 from star_private.booking_places p join star_private.booking_orders o on o.id=p.order_id where o.player_id=pid and o.service_id='assessment' and p.cancelled_at is null)) then raise exception 'An assessment is already booked. Contact STAR to change it.'; end if;
  end if;
  if not svc.fixed then
   sid:=gen_random_uuid();
   insert into star_private.booking_sessions values(sid,svc.id,coach,1,true,null,uid);
   insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by) values(sid,svc.title,svc.programme,stamp,finish,venue_text,coach);
  end if;
  insert into star_private.booking_places(order_id,session_id,player_id) values(oid,sid,case when org is null then pid else null end);
  if org is null then
   insert into public.training_session_participants(session_id,player_id,added_by) values(sid,pid,coach) on conflict do nothing;
   insert into public.family_session_schedule(player_id,title,starts_at,ends_at,venue,published_by,source_session_id) values(pid,svc.title,stamp,finish,venue_text,coach,sid);
  end if;
 end loop;
 if org is not null then
  insert into star_private.org_threads(organisation_id,subject,source_key) values(org,'Confirmed coaching booking','booking:'||oid::text) returning id into ref;
  insert into star_private.org_messages(thread_id,sender_id,sender_role,kind,body) values(ref,uid,'organisation','session_schedule','Booking confirmed: '||svc.title||E'\nSessions: '||sessions_count||E'\nTotal: £'||to_char(total/100.0,'FM999990.00')||case when discount>0 then ' (15% block discount applied)' else '' end||E'\nPayment: invoice. Your organisation provides the facilities.\nVenue: '||venue_text);
 end if;
 return jsonb_build_object('order_id',oid,'confirmed',true,'total_pence',total,'discount_percent',discount);
end $$;

create function star_private.booking_guard_family() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(781493201);
 if tg_op='DELETE' then
  if exists(select 1 from star_private.booking_places p where p.session_id=old.source_session_id and p.player_id=old.player_id and p.cancelled_at is null) then raise exception 'Cancel direct bookings through Booking management to retain their record.'; end if;return old;
 end if;
 if exists(select 1 from star_private.booking_sessions where session_id=new.source_session_id) and not exists(select 1 from star_private.booking_places p where p.session_id=new.source_session_id and p.player_id=new.player_id and p.cancelled_at is null) then raise exception 'Book a released place through the booking calendar.'; end if;
 if tg_op='INSERT' or (new.starts_at,new.ends_at,new.player_id) is distinct from (old.starts_at,old.ends_at,old.player_id) then
  if exists(select 1 from public.family_session_schedule f where f.player_id=new.player_id and f.id<>new.id and f.starts_at<new.ends_at and f.ends_at>new.starts_at) then raise exception 'The player already has a session at that time.'; end if;
 end if;
 return new;
end $$;
create trigger zzz_booking_guard_family before insert or update or delete on public.family_session_schedule for each row execute function star_private.booking_guard_family();
revoke all on function star_private.booking_guard_family() from public,anon,authenticated;

-- Tables stay private. Only narrowly checked RPC entry points are callable.
do $$ declare t text; begin foreach t in array array['booking_services','booking_coaches','booking_sessions','booking_orders','booking_places','booking_credits','booking_closures'] loop
 execute format('alter table star_private.%I enable row level security',t);
 execute format('create policy deny_direct on star_private.%I for all using(false) with check(false)',t);
 execute format('revoke all on star_private.%I from public,anon,authenticated',t);
end loop;end $$;
revoke all on function star_private.booking_open(timestamptz,timestamptz),star_private.booking_free(uuid,timestamptz,timestamptz,uuid),star_private.booking_dob(uuid),star_private.booking_guard_calendar(),star_private.direct_booking(text,jsonb) from public,anon,authenticated;
create function public.star_direct_booking(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select star_private.direct_booking(p_action,p_data) $$;
revoke all on function public.star_direct_booking(text,jsonb) from public,anon;
grant execute on function public.star_direct_booking(text,jsonb),star_private.direct_booking(text,jsonb) to authenticated;
