-- Preserve an assessment player's roster membership but show one contact card.
-- Exclude onboarding-assessment players from the generic roster branch, as the
-- assessment branch already supplies their name, age and guardian contacts.
-- No training/attendance or parent records are altered by this function change.
create or replace function star_private.staff_calendar_people(p_session_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 uid uuid := auth.uid();
 manager boolean;
 result jsonb;
begin
 if uid is null or not star_private.is_active_staff() then
   raise exception 'STAR staff access required.';
 end if;
 if coalesce(array_length(p_session_ids,1),0)>100 then
   raise exception 'Too many sessions requested.';
 end if;
 manager:=star_private.is_staff_manager();

 with people as (
   -- Direct bookings, including parent, programme, school and club bookings.
   select bp.session_id, 'booking:'||bp.id::text as item_key,
     jsonb_build_object(
       'player_name',nullif(btrim(coalesce(pl.first_name,'')||' '||coalesce(pl.last_name,'')),''),
       'player_age',case when dob.dob is not null then
         extract(year from age((ts.starts_at at time zone 'Europe/London')::date,dob.dob))::int end,
       'guardian_name',coalesce(nullif(btrim(gp.display_name),''),nullif(btrim(link_guardian.display_name),'')),
       'guardian_phone',coalesce(nullif(btrim(gp.contact_phone),''),nullif(btrim(link_guardian.contact_phone),'')),
       'booked_by',gp.display_name,
       'details',nullif(bo.details,''),
       'organisation',org.name,
       'service',sv.title
     ) as card
   from star_private.booking_places bp
   join star_private.booking_sessions bs on bs.session_id=bp.session_id
   join public.training_sessions ts on ts.id=bp.session_id
   join star_private.booking_orders bo on bo.id=bp.order_id
   join star_private.booking_services sv on sv.id=bo.service_id
   left join public.coaching_players pl on pl.id=coalesce(bp.player_id,bo.player_id)
   left join public.guardian_profiles gp on gp.user_id=bo.created_by
   left join public.star_organisations org on org.id=bo.organisation_id
   left join lateral (
     select g.display_name,g.contact_phone
     from public.guardian_player_links gl
     join public.guardian_profiles g on g.user_id=gl.guardian_id
     where gl.player_id=pl.id
     order by gl.approved_at desc limit 1
   ) link_guardian on true
   left join lateral (select star_private.booking_dob(pl.id) as dob) dob on true
   where bp.session_id=any(p_session_ids) and bp.cancelled_at is null
     and ts.cancelled_at is null
     and (manager or bs.coach_id=uid)
   union all
   -- Booked/assigned players at ordinary coaching sessions.
   select sp.session_id,'roster:'||sp.player_id::text,
     jsonb_build_object(
       'player_name',nullif(btrim(pl.first_name||' '||pl.last_name),''),
       'player_age',case when dob.dob is not null then
         extract(year from age((ts.starts_at at time zone 'Europe/London')::date,dob.dob))::int end,
       'guardian_name',nullif(btrim(link_guardian.display_name),''),
       'guardian_phone',nullif(btrim(link_guardian.contact_phone),''),
       'booked_by',null,
       'details',null,
       'organisation',null,
       'service',ts.title
     )
   from public.training_session_participants sp
   join public.training_sessions ts on ts.id=sp.session_id
   join public.coaching_players pl on pl.id=sp.player_id
   left join lateral (
     select g.display_name,g.contact_phone
     from public.guardian_player_links gl
     join public.guardian_profiles g on g.user_id=gl.guardian_id
     where gl.player_id=pl.id
     order by gl.approved_at desc limit 1
   ) link_guardian on true
   left join lateral (select star_private.booking_dob(pl.id) as dob) dob on true
   where sp.session_id=any(p_session_ids) and ts.cancelled_at is null
     and (manager or exists(select 1 from public.coaching_assignments a
       where a.staff_user_id=uid and a.player_id=sp.player_id))
     and not exists(select 1 from star_private.booking_places bp
       where bp.session_id=sp.session_id and bp.player_id=sp.player_id and bp.cancelled_at is null)
     and not exists (
       select 1
       from star_private.assessment_calendar_links l
       join public.player_intakes i on i.id=l.intake_id
       where l.session_id=sp.session_id and i.portal_player_id=sp.player_id
     )
   union all
   -- The pre-assessment onboarding flow may confirm an assessment separately from direct bookings.
   select l.session_id,'assessment:'||i.id::text,
     jsonb_build_object(
       'player_name',nullif(btrim(i.first_name||' '||i.last_name),''),
       'player_age',case when i.date_of_birth is not null then
         extract(year from age((ts.starts_at at time zone 'Europe/London')::date,i.date_of_birth))::int end,
       'guardian_name',coalesce(nullif(btrim(gp.display_name),''),nullif(btrim(i.details->>'contact_name'),'')),
       'guardian_phone',coalesce(nullif(btrim(gp.contact_phone),''),nullif(btrim(i.details->>'contact_phone'),'')),
       'booked_by',null,
       'details',null,
       'organisation',null,
       'service','FREE 30-minute assessment'
     )
   from star_private.assessment_calendar_links l
   join public.player_intakes i on i.id=l.intake_id
   join public.training_sessions ts on ts.id=l.session_id
   left join public.guardian_profiles gp on gp.user_id=i.guardian_id
   where l.session_id=any(p_session_ids) and ts.cancelled_at is null
     and i.assessment_status='confirmed' and manager
 )
 select coalesce(jsonb_object_agg(by_session.session_id::text,by_session.cards),'{}'::jsonb) into result
 from (
   select session_id,jsonb_agg(card order by item_key) as cards
   from people group by session_id
 ) by_session;
 return coalesce(result,'{}'::jsonb);
end;
$$;
