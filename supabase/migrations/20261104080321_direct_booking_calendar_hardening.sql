create or replace function star_private.booking_guard_calendar() returns trigger language plpgsql security definer set search_path='' as $$
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
 if new.cancelled_at is null then
  select coalesce(b.coach_id,(select coach_id from star_private.org_session_details where session_id=new.id),new.created_by) into coach;
  if new.cancelled_at is null and not star_private.booking_free(coach,new.starts_at,new.ends_at,new.id) then raise exception 'This coach is already booked, including the 30-minute travel/setup gap.'; end if;
 end if;
 return new;
end $$;

create or replace function star_private.direct_booking(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); manager boolean; org uuid:=nullif(p_data->>'organisation_id','')::uuid; pid uuid:=nullif(p_data->>'player_id','')::uuid;
 svc star_private.booking_services; cfg star_private.booking_coaches; slot star_private.booking_sessions; sess public.training_sessions;
 oid uuid; sid uuid; cid uuid; coach uuid; pair uuid; ref uuid; fp text; day date; birth date; age_years integer;
 stamp timestamptz; finish timestamptz; duration integer; sessions_count integer; hourly integer; total integer; discount integer:=0; venue_text text;
 dates jsonb; date_item jsonb; result jsonb:='[]'; choices jsonb:='[]'; items jsonb; valid boolean; capacity_value integer; remaining_value integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager();
 if p_action in ('manage','coach','publish','close','credit','closure','remove_closure','cancel_place') then
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
  elsif p_action='cancel_place' then
   ref:=(p_data->>'place_id')::uuid;
   select p.session_id into sid from star_private.booking_places p join public.training_sessions s on s.id=p.session_id where p.id=ref and p.cancelled_at is null and s.starts_at>now();
   if sid is null or exists(select 1 from public.training_attendance where session_id=sid) then raise exception 'Choose an upcoming booked place without attendance records.'; end if;
   select p.player_id,p.order_id into pid,oid from star_private.booking_places p where p.id=ref;
   update star_private.booking_places set cancelled_at=now() where id=ref;
   if exists(select 1 from star_private.booking_orders where id=oid and service_id='flyers') then update star_private.booking_credits set remaining=remaining+1 where player_id=pid; end if;
   delete from public.family_session_schedule where source_session_id=sid and player_id=pid;
   delete from public.training_session_participants where session_id=sid and player_id=pid;
   if exists(select 1 from star_private.booking_sessions b join star_private.booking_services v on v.id=b.service_id where b.session_id=sid and not v.fixed) then
    update star_private.booking_sessions set enabled=false where session_id=sid;
    update public.training_sessions set cancelled_at=now() where id=sid and cancelled_at is null;
   end if;
   update public.player_intakes set assessment_status='cancelled',assessment_starts_at=null,assessment_venue=null where portal_player_id=pid and assessment_starts_at=(select starts_at from public.training_sessions where id=sid) and exists(select 1 from star_private.booking_orders where id=oid and service_id='assessment');
  elsif p_action='close' then
   sid:=(p_data->>'session_id')::uuid;
   select * into strict sess from public.training_sessions where id=sid;
   if sess.starts_at<=now() or exists(select 1 from public.training_attendance where session_id=sid) then raise exception 'Past sessions or attendance records must retain their arrangements.'; end if;
   update star_private.booking_sessions set enabled=false where session_id=sid;
   if not found then raise exception 'Released session not found.'; end if;
   update public.player_intakes set assessment_status='cancelled',assessment_starts_at=null,assessment_venue=null where portal_player_id in(select p.player_id from star_private.booking_places p join star_private.booking_orders o on o.id=p.order_id where p.session_id=sid and p.cancelled_at is null and o.service_id='assessment') and assessment_starts_at=sess.starts_at;
   -- Return unused Flyers entitlement once when cancellation is confirmed.
   update star_private.booking_credits c set remaining=remaining+(select count(*) from star_private.booking_places p join star_private.booking_orders o on o.id=p.order_id where p.session_id=sid and p.cancelled_at is null and o.service_id='flyers' and p.player_id=c.player_id);
   update star_private.booking_places set cancelled_at=now() where session_id=sid and cancelled_at is null;
   delete from public.family_session_schedule where source_session_id=sid;
   delete from public.training_session_participants where session_id=sid;
   update public.training_sessions set cancelled_at=now() where id=sid and cancelled_at is null;
  elsif p_action='credit' then
   if not exists(select 1 from public.coaching_players where id=pid and programme='Flyers') then raise exception 'Choose an enrolled Flyers player.'; end if;
   if coalesce((p_data->>'remaining')::integer,-1)<0 or coalesce((p_data->>'remaining')::integer,101)+(select count(*) from star_private.booking_places p join star_private.booking_orders o on o.id=p.order_id join public.training_sessions ts on ts.id=p.session_id where p.player_id=pid and o.service_id='flyers' and p.cancelled_at is null and ts.starts_at>now())>100 then raise exception 'Check unused entitlement, allowing room to return already-booked sessions.'; end if;
   insert into star_private.booking_credits values(pid,(p_data->>'remaining')::integer) on conflict(player_id) do update set remaining=excluded.remaining;
  elsif p_action='closure' then
   insert into star_private.booking_closures(starts_at,ends_at,reason) values(star_private.org_uk_time(p_data->>'starts_local'),star_private.org_uk_time(p_data->>'ends_local'),left(coalesce(p_data->>'reason',''),150));
  elsif p_action='remove_closure' then delete from star_private.booking_closures where id=(p_data->>'id')::uuid;
  end if;
  if p_action in ('close','cancel_place') then
   for ref in select distinct o.id from star_private.booking_orders o join star_private.booking_places p on p.order_id=o.id where p.session_id=sid and o.organisation_id is not null and (p_action='close' or o.id=oid) loop
    insert into star_private.org_messages(thread_id,sender_id,sender_role,kind,body) select t.id,uid,'staff','session_schedule','STAR cancelled a dated session in this booking: '||to_char(ts.starts_at at time zone 'Europe/London','Dy DD Mon YYYY HH24:MI')||' UK time. Contact STAR to agree replacement arrangements or any invoice adjustment.' from star_private.org_threads t cross join public.training_sessions ts where t.source_key='booking:'||ref::text and ts.id=sid;
   end loop;
  end if;
  return jsonb_build_object('coaches',coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(c.coach_name,u.email),'venue',coalesce(c.parent_venue,''),'enabled',coalesce(c.enabled,false),'services',coalesce(c.services,'{}'))) from public.staff_members s join auth.users u on u.id=s.user_id left join star_private.booking_coaches c on c.coach_id=s.user_id where s.active and u.email_confirmed_at is not null),'[]'),
   'services',(select jsonb_agg(to_jsonb(v) order by audience,title) from star_private.booking_services v),
   'closures',coalesce((select jsonb_agg(to_jsonb(c) order by starts_at) from star_private.booking_closures c where ends_at>now()),'[]'),
   'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name,'remaining',coalesce(c.remaining,0))) from public.coaching_players p left join star_private.booking_credits c on c.player_id=p.id where p.programme='Flyers'),'[]'),
   'sessions',coalesce((select jsonb_agg(x order by x.starts_at) from (select s.id,s.title,s.starts_at,s.ends_at,s.venue,b.capacity,b.enabled,c.coach_name,(select count(*) from star_private.booking_places p where p.session_id=s.id and p.cancelled_at is null) booked,
    (select coalesce(jsonb_agg(jsonb_build_object('place_id',bp.id,'name',case when o.organisation_id is not null then g.name else cp.first_name||' '||cp.last_name end,'order_id',o.id,'total_pence',o.total_pence,'discount_percent',o.discount_percent,'payment',o.payment,'details',o.details)),'[]') from star_private.booking_places bp join star_private.booking_orders o on o.id=bp.order_id left join public.coaching_players cp on cp.id=bp.player_id left join public.star_organisations g on g.id=o.organisation_id where bp.session_id=s.id and bp.cancelled_at is null) bookings
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
   where b.service_id=svc.id and b.enabled and c.enabled and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and s.cancelled_at is null and (s.starts_at at time zone 'Europe/London')::date=day and star_private.booking_open(s.starts_at,s.ends_at)
   and (select count(*) from star_private.booking_places p where p.session_id=s.id and p.cancelled_at is null)<b.capacity;
  else
   for stamp in select x at time zone 'Europe/London' from generate_series(day+'10:00'::time,day+'19:45'::time,interval '15 minutes') x loop
    finish:=stamp+make_interval(mins=>duration);
    if star_private.booking_open(stamp,finish) and exists(select 1 from star_private.booking_coaches c join public.staff_members sm on sm.user_id=c.coach_id join auth.users u on u.id=sm.user_id where c.enabled and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and svc.id=any(c.services) and (org is not null or svc.id='season_support' or length(c.parent_venue)>=2) and star_private.booking_free(c.coach_id,stamp,finish)) then
     select c.* into cfg from star_private.booking_coaches c join public.staff_members sm on sm.user_id=c.coach_id join auth.users u on u.id=sm.user_id where c.enabled and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and svc.id=any(c.services) and (org is not null or svc.id='season_support' or length(c.parent_venue)>=2) and star_private.booking_free(c.coach_id,stamp,finish) order by c.coach_id limit 1;
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
   if svc.id='assessment' then update public.player_intakes set assessment_status='confirmed',assessment_starts_at=stamp,assessment_venue=venue_text,assessment_message='Confirmed through the STAR booking calendar.' where portal_player_id=pid; end if;
  end if;
 end loop;
 if org is not null then
  insert into star_private.org_threads(organisation_id,subject,source_key) values(org,'Confirmed coaching booking','booking:'||oid::text) returning id into ref;
  insert into star_private.org_messages(thread_id,sender_id,sender_role,kind,body) values(ref,uid,'organisation','session_schedule','Booking confirmed: '||svc.title||E'\nSessions: '||sessions_count||E'\nTotal: £'||to_char(total/100.0,'FM999990.00')||case when discount>0 then ' (15% block discount applied)' else '' end||E'\nPayment: invoice. Your organisation provides the facilities.\nVenue: '||venue_text);
 end if;
 return jsonb_build_object('order_id',oid,'confirmed',true,'total_pence',total,'discount_percent',discount);
end $$;

do $$ declare definition text; begin
 definition:=pg_get_functiondef('star_private.organisation_schedule(text,jsonb)'::regprocedure);
 definition:=regexp_replace(definition,E'\\nbegin\\n',E'\nbegin\n if p_action<>''list'' then perform pg_advisory_xact_lock(781493201); end if;\n');
 execute definition;
end $$;
