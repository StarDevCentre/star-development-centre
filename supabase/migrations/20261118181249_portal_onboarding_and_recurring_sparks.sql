-- Carry an approved onboarding identity into admissions. Match only within the
-- same verified guardian and an exact full name and birth date. Stop on ambiguity.
create or replace function public.star_enrol_approved_application(p_application_id uuid,p_consent_verified boolean)
returns uuid language plpgsql security invoker set search_path='' as $$
declare
  application public.player_registrations;
  candidates uuid[];
  player uuid;
  target_programme text;
  target_slug text;
begin
  if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
  if p_consent_verified is distinct from true then raise exception 'Verified consent is required.'; end if;
  select * into application from public.player_registrations where id=p_application_id for update;
  if application.status='enrolled' and application.enrolled_player_id is not null then
    return application.enrolled_player_id;
  end if;
  if application.status is distinct from 'accepted' or application.enrolled_player_id is not null then
    raise exception 'Accept this application before enrolment.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(application.guardian_id::text,0));
  target_slug:=coalesce(application.recommended_programme,application.programme);
  target_programme:=case target_slug when 'sparks' then 'Sparks' when 'development' then 'Development'
    when 'flyers' then 'Flyers' when 'prestige' then 'Prestige' when 'one-to-one' then '1-to-1' when 'season-support' then 'Other' end;
  if target_programme is null then raise exception 'Unsupported programme.'; end if;
  if exists(
    select 1 from public.player_registrations r where r.guardian_id=application.guardian_id and r.status='enrolled'
      and r.date_of_birth=application.date_of_birth and lower(btrim(r.player_first_name))=lower(btrim(application.player_first_name))
      and lower(btrim(r.player_last_name))=lower(btrim(application.player_last_name))
      and coalesce(r.recommended_programme,r.programme)=target_slug
  ) then raise exception 'This player is already enrolled in this programme.'; end if;

  select array_agg(distinct match.id) into candidates from (
    select r.enrolled_player_id as id from public.player_registrations r
    where r.guardian_id=application.guardian_id and r.status='enrolled' and r.enrolled_player_id is not null
      and r.date_of_birth=application.date_of_birth and lower(btrim(r.player_first_name))=lower(btrim(application.player_first_name))
      and lower(btrim(r.player_last_name))=lower(btrim(application.player_last_name))
    union
    select i.portal_player_id from public.player_intakes i
    join public.guardian_player_links g on g.player_id=i.portal_player_id and g.guardian_id=i.guardian_id
    where i.guardian_id=application.guardian_id and i.portal_player_id is not null
      and i.completed_at is not null and i.guardian_reviewed_at is not null
      and i.date_of_birth=application.date_of_birth and lower(btrim(i.first_name))=lower(btrim(application.player_first_name))
      and lower(btrim(i.last_name))=lower(btrim(application.player_last_name))
  ) match;
  if cardinality(candidates)>1 then
    raise exception 'More than one coaching record matches. Review the linked player identities before enrolling.';
  end if;
  player:=candidates[1];
  if player is null then
    insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
    values(application.player_first_name,application.player_last_name,target_programme,true,auth.uid(),auth.uid())
    returning id into player;
  else
    -- Keep an established programme when this is an additional application.
    update public.coaching_players set programme=target_programme
    where id=player and not exists(
      select 1 from public.player_registrations r where r.enrolled_player_id=player and r.status='enrolled'
    );
  end if;
  update public.player_registrations set status='enrolled',enrolled_player_id=player,
    decision_at=now(),decided_by=auth.uid(),updated_at=now() where id=p_application_id;
  return player;
end $$;

create table public.staff_follow_up_owners (
  action_key text primary key check (length(action_key) between 43 and 52),
  owner_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now()
);
alter table public.staff_follow_up_owners enable row level security;
revoke all on public.staff_follow_up_owners from public,anon;
grant select on public.staff_follow_up_owners to authenticated;
create policy follow_up_owner_read on public.staff_follow_up_owners for select to authenticated
using ((select star_private.is_staff_manager()));

create function star_private.set_follow_up_owner(p_kind text,p_id uuid,p_owner uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
  if not (
    p_kind='intake' and exists(select 1 from public.player_intakes where id=p_id)
    or p_kind='request' and exists(select 1 from public.family_session_requests where id=p_id and status='pending')
  ) then raise exception 'This action is no longer available.'; end if;
  if p_owner is null then
    delete from public.staff_follow_up_owners where action_key=p_kind||':'||p_id;
  else
    if not exists(select 1 from public.staff_members where user_id=p_owner and active and role in ('owner','manager')) then
      raise exception 'Choose an active STAR manager.';
    end if;
    insert into public.staff_follow_up_owners(action_key,owner_id) values(p_kind||':'||p_id,p_owner)
    on conflict(action_key) do update set owner_id=excluded.owner_id,assigned_at=now();
  end if;
end $$;

create function star_private.follow_up_staff()
returns table(id uuid,name text)
language plpgsql stable security definer set search_path='' as $$
begin
  if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
  return query
    select m.user_id,coalesce(nullif(btrim(u.raw_user_meta_data->>'display_name'),''),
      nullif(btrim(u.raw_user_meta_data->>'full_name'),''),nullif(btrim(u.raw_user_meta_data->>'name'),''),
      nullif(btrim(g.display_name),''),nullif(split_part(u.email,'@',1),''),initcap(m.role))
    from public.staff_members m join auth.users u on u.id=m.user_id
    left join public.guardian_profiles g on g.user_id=m.user_id
    where m.active and m.role in ('owner','manager') order by 2;
end $$;

create function public.star_follow_up_staff()
returns table(id uuid,name text) language sql stable security invoker set search_path='' as $$
  select * from star_private.follow_up_staff()
$$;
create function public.star_set_follow_up_owner(p_kind text,p_id uuid,p_owner uuid)
returns void language sql security invoker set search_path='' as $$
  select star_private.set_follow_up_owner(p_kind,p_id,p_owner)
$$;
revoke all on function star_private.follow_up_staff(),star_private.set_follow_up_owner(text,uuid,uuid),
  public.star_follow_up_staff(),public.star_set_follow_up_owner(text,uuid,uuid) from public,anon;
grant execute on function star_private.follow_up_staff(),star_private.set_follow_up_owner(text,uuid,uuid),
  public.star_follow_up_staff(),public.star_set_follow_up_owner(text,uuid,uuid) to authenticated;

create table public.staff_monthly_drafts (
  player_id uuid not null references public.coaching_players(id) on delete cascade,
  review_month date not null check(extract(day from review_month)=1),
  strengths text not null default '' check(length(strengths)<=2000),
  development_areas text not null default '' check(length(development_areas)<=2000),
  next_steps text not null default '' check(length(next_steps)<=2000),
  updated_at timestamptz not null default now(),
  primary key(player_id,review_month)
);
alter table public.staff_monthly_drafts enable row level security;
revoke all on public.staff_monthly_drafts from public,anon;
grant select,insert,update on public.staff_monthly_drafts to authenticated;
create policy monthly_drafts_managers on public.staff_monthly_drafts for all to authenticated
using ((select star_private.is_staff_manager()))
with check ((select star_private.is_staff_manager()));

-- Repair legacy standalone projections only when calendar details and the
-- recorded player roster identify exactly one appointment. This is a link-only
-- change and should not create a player notification.
alter table public.family_session_schedule disable trigger notify_player_update;
with matches as (
  select f.id,f.player_id,min(s.id::text)::uuid as session_id
  from public.family_session_schedule f
  join public.training_session_participants p on p.player_id=f.player_id
  join public.training_sessions s on s.id=p.session_id
    and (s.title,s.starts_at,s.ends_at,s.venue)=(f.title,f.starts_at,f.ends_at,f.venue)
  where f.source_session_id is null and s.organisation_id is null and s.cancelled_at is null
    and not exists(select 1 from star_private.booking_sessions b where b.session_id=s.id)
  group by f.id,f.player_id having count(*)=1
), unique_matches as (
  select matches.*,count(*) over(partition by session_id,player_id) as copies from matches
)
update public.family_session_schedule f set source_session_id=m.session_id
from unique_matches m where m.id=f.id and m.copies=1
  and not exists(select 1 from public.family_session_schedule existing where existing.source_session_id=m.session_id and existing.player_id=m.player_id);
alter table public.family_session_schedule enable trigger notify_player_update;

-- A Sparks membership holds a weekly place. Its dated bookings still use
-- the same order, place, family schedule and register tables as other sessions.
create table star_private.sparks_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.coaching_players(id) on delete cascade,
  guardian_id uuid references auth.users(id) on delete set null,
  service_id text not null references star_private.booking_services(id) check (service_id in ('sparks_5_7','sparks_8_10')),
  first_date date not null,
  first_order_id uuid references star_private.booking_orders(id) on delete set null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index sparks_one_place_per_player on star_private.sparks_memberships(player_id) where ended_at is null;
create index sparks_group_members on star_private.sparks_memberships(service_id,first_date) where ended_at is null;
alter table star_private.sparks_memberships enable row level security;
revoke all on star_private.sparks_memberships from public,anon,authenticated;

alter table star_private.booking_places
  add column sparks_membership_id uuid references star_private.sparks_memberships(id) on delete set null,
  add column absence_reported_at timestamptz,
  add column absence_reported_by uuid references auth.users(id) on delete set null;
create index sparks_membership_places on star_private.booking_places(sparks_membership_id) where cancelled_at is null;

create table star_private.sparks_booking_issues (
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  membership_id uuid not null references star_private.sparks_memberships(id) on delete cascade,
  reason text not null,
  primary key(session_id,membership_id)
);
alter table star_private.sparks_booking_issues enable row level security;
revoke all on star_private.sparks_booking_issues from public,anon,authenticated;

create function star_private.fill_sparks_place(p_session uuid,p_membership uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  appointment public.training_sessions;
  booking star_private.booking_sessions;
  member star_private.sparks_memberships;
  new_order uuid;
  birth date;
  age_years integer;
  issue text;
begin
  perform pg_advisory_xact_lock(781493201);
  select * into member from star_private.sparks_memberships where id=p_membership and ended_at is null;
  select * into booking from star_private.booking_sessions where session_id=p_session and enabled;
  select * into appointment from public.training_sessions where id=p_session and cancelled_at is null and starts_at>now();
  if member.id is null or appointment.id is null or booking.service_id is distinct from member.service_id
    or (appointment.starts_at at time zone 'Europe/London')::date<member.first_date
    or not exists(select 1 from public.guardian_player_links g where g.player_id=member.player_id and g.guardian_id=member.guardian_id) then
    return;
  end if;
  update star_private.booking_places set sparks_membership_id=member.id
  where session_id=p_session and player_id=member.player_id and cancelled_at is null;
  if found then return; end if;
  birth:=star_private.booking_dob(member.player_id);
  age_years:=extract(year from age((appointment.starts_at at time zone 'Europe/London')::date,birth));
  if age_years is null or not exists(
    select 1 from star_private.booking_services s where s.id=member.service_id and age_years between s.min_age and s.max_age
  ) then
    issue:='Review her Sparks age group.';
  elsif (select count(*) from star_private.booking_places where session_id=p_session and cancelled_at is null)>=10 then
    issue:='The released group has 10 booked places.';
  elsif not star_private.player_session_available(member.player_id,appointment.starts_at,appointment.ends_at) then
    issue:='This player has an overlapping session.';
  end if;
  if issue is not null then
    insert into star_private.sparks_booking_issues values(p_session,member.id,issue)
    on conflict(session_id,membership_id) do update set reason=excluded.reason;
    return;
  end if;

  insert into star_private.booking_orders(created_by,client_id,player_id,service_id,fingerprint,total_pence,payment,venue,details)
  select member.guardian_id,gen_random_uuid(),member.player_id,member.service_id,'sparks:'||p_session,
    s.price_pence,'Pay off-site after the session',appointment.venue,'Weekly Sparks place'
  from star_private.booking_services s where s.id=member.service_id returning id into new_order;
  insert into star_private.booking_places(order_id,session_id,player_id,sparks_membership_id)
  values(new_order,p_session,member.player_id,member.id);
  insert into public.family_session_schedule(player_id,source_session_id,title,starts_at,ends_at,venue,published_by)
  values(member.player_id,p_session,appointment.title,appointment.starts_at,appointment.ends_at,appointment.venue,booking.coach_id);
  delete from star_private.sparks_booking_issues where session_id=p_session and membership_id=member.id;
end $$;
revoke all on function star_private.fill_sparks_place(uuid,uuid) from public,anon,authenticated;

create function star_private.add_released_sparks_places()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  member_id uuid;
begin
  for member_id in
    select m.id from star_private.booking_sessions b
    join star_private.sparks_memberships m on m.service_id=b.service_id and m.ended_at is null
    where b.session_id=new.id order by m.created_at,m.id
  loop
    perform star_private.fill_sparks_place(new.id,member_id);
  end loop;
  return new;
end $$;
revoke all on function star_private.add_released_sparks_places() from public,anon,authenticated;
create trigger add_released_sparks_places after insert on public.training_sessions
for each row when (new.programme='Sparks' and new.organisation_id is null)
execute function star_private.add_released_sparks_places();

create function star_private.start_sparks_membership(p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  player uuid:=nullif(p_data->>'player_id','')::uuid;
  service text:=p_data->>'service_id';
  chosen uuid:=nullif(p_data->>'session_id','')::uuid;
  client uuid:=nullif(p_data->>'client_id','')::uuid;
  member star_private.sparks_memberships;
  order_result jsonb;
  released uuid;
begin
  if actor is null or not star_private.is_player_family(player) or service not in ('sparks_5_7','sparks_8_10')
     or p_data->>'organisation_id' is not null then
    raise exception 'Choose a Sparks place for your linked player.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(781493201);
  select * into member from star_private.sparks_memberships where player_id=player and ended_at is null;
  if member.id is not null then
    if exists(select 1 from star_private.booking_orders where id=member.first_order_id and created_by=actor and client_id=client) then
      return star_private.direct_booking('book',p_data);
    end if;
    raise exception 'This player already has a weekly Sparks place.';
  end if;
  if (select count(*) from star_private.sparks_memberships where service_id=service and ended_at is null)>=10 then
    raise exception 'All 10 weekly places in this Sparks group are reserved.';
  end if;
  order_result:=star_private.direct_booking('book',p_data);
  insert into star_private.sparks_memberships(player_id,guardian_id,service_id,first_date,first_order_id)
  select player,actor,service,(s.starts_at at time zone 'Europe/London')::date,(order_result->>'order_id')::uuid
  from public.training_sessions s where s.id=chosen returning * into member;
  if member.id is null then raise exception 'The selected Sparks session is no longer available.'; end if;
  for released in
    select s.id from star_private.booking_sessions b join public.training_sessions s on s.id=b.session_id
    where b.service_id=service and b.enabled and s.cancelled_at is null
      and (s.starts_at at time zone 'Europe/London')::date>=member.first_date
      and s.starts_at>now() order by s.starts_at
  loop
    perform star_private.fill_sparks_place(released,member.id);
  end loop;
  return order_result;
end $$;

create or replace function public.star_direct_booking(p_action text,p_data jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_action='book' and p_data->>'weekly_sparks'='true' and p_data->>'service_id' in ('sparks_5_7','sparks_8_10') then
    return star_private.start_sparks_membership(p_data);
  end if;
  return star_private.direct_booking(p_action,p_data);
end $$;

create function star_private.sparks_membership(p_player uuid,p_action text,p_session uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  member star_private.sparks_memberships;
  booked record;
  target_place uuid;
begin
  if not (star_private.is_staff_manager() or star_private.is_player_family(p_player)) then
    raise exception 'Linked family or STAR management access required.' using errcode='42501';
  end if;
  if p_action not in ('read','absence','end') or p_action is null then raise exception 'Choose a weekly place action.'; end if;
  if p_action<>'read' then perform pg_advisory_xact_lock(781493201); end if;
  select * into member from star_private.sparks_memberships where player_id=p_player and ended_at is null;
  if member.id is null then return null; end if;
  if p_action='absence' then
    select p.id into target_place
    from star_private.booking_places p join public.training_sessions s on s.id=p.session_id
    where p.sparks_membership_id=member.id and p.session_id=p_session and p.cancelled_at is null
      and s.starts_at>now() and s.cancelled_at is null;
    if target_place is null then raise exception 'Choose an upcoming Sparks date.'; end if;
    insert into public.training_attendance(session_id,player_id,status,recorded_by,recorded_at)
    values(p_session,p_player,'excused',auth.uid(),now()) on conflict(session_id,player_id) do nothing;
    update star_private.booking_places
    set absence_reported_at=coalesce(absence_reported_at,now()),absence_reported_by=coalesce(absence_reported_by,auth.uid())
    where id=target_place;
  elsif p_action='end' then
    update star_private.sparks_memberships set ended_at=now() where id=member.id;
    for booked in
      select p.id,p.session_id,p.absence_reported_by
      from star_private.booking_places p join public.training_sessions s on s.id=p.session_id
      where p.sparks_membership_id=member.id and p.cancelled_at is null and s.starts_at>now()
    loop
      update star_private.booking_places set cancelled_at=now() where id=booked.id;
      delete from public.family_session_schedule where source_session_id=booked.session_id and player_id=p_player;
      delete from public.training_attendance where session_id=booked.session_id and player_id=p_player
        and status='excused' and recorded_by=booked.absence_reported_by;
      delete from public.training_session_participants p where p.session_id=booked.session_id and p.player_id=p_player
        and not exists(select 1 from public.training_attendance r where r.session_id=p.session_id and r.player_id=p.player_id);
    end loop;
    return null;
  end if;
  return jsonb_build_object('service_id',member.service_id,'first_date',member.first_date,
    'upcoming',coalesce((
      select jsonb_agg(jsonb_build_object('id',s.id,'starts_at',s.starts_at,'venue',s.venue,
        'absent',p.absence_reported_at is not null) order by s.starts_at)
      from star_private.booking_places p join public.training_sessions s on s.id=p.session_id
      where p.sparks_membership_id=member.id and p.cancelled_at is null and s.cancelled_at is null and s.starts_at>now()
    ),'[]'::jsonb),
    'issues',coalesce((
      select jsonb_agg(jsonb_build_object('starts_at',s.starts_at,'reason',i.reason) order by s.starts_at)
      from star_private.sparks_booking_issues i join public.training_sessions s on s.id=i.session_id
      where i.membership_id=member.id and s.starts_at>now() and s.cancelled_at is null
    ),'[]'::jsonb));
end $$;

create function public.star_sparks_membership(p_player uuid,p_action text,p_session uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select star_private.sparks_membership(p_player,p_action,p_session)
$$;
revoke all on function star_private.start_sparks_membership(jsonb),star_private.sparks_membership(uuid,text,uuid),
  public.star_sparks_membership(uuid,text,uuid) from public,anon;
grant execute on function star_private.start_sparks_membership(jsonb),star_private.sparks_membership(uuid,text,uuid),
  public.star_sparks_membership(uuid,text,uuid) to authenticated;
