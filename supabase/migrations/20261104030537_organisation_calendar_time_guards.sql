CREATE OR REPLACE FUNCTION star_private.guard_org_calendar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 if auth.uid() is not null and new.cancelled_at is null then
  if new.ends_at-new.starts_at<interval '15 minutes' or new.ends_at-new.starts_at>interval '360 minutes' then raise exception 'Organisation sessions must last 15–360 minutes.'; end if;
  if tg_op='INSERT' then
   if new.starts_at<=now() or new.starts_at>now()+interval '1 year' then raise exception 'Choose a future organisation session within the next year.'; end if;
  elsif (new.starts_at,new.ends_at) is distinct from (old.starts_at,old.ends_at) then
   if old.starts_at<=now() or new.starts_at<=now() or new.starts_at>now()+interval '1 year' then raise exception 'Keep past session times and choose future arrangements within the next year.'; end if;
  end if;
 end if;
 if new.cancelled_at is null then
  if not exists(select 1 from public.staff_members sm join auth.users u on u.id=sm.user_id where sm.user_id=detail.coach_id and sm.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) then raise exception 'Choose an active STAR coach.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(detail.coach_id::text,42));
  if exists(select 1 from star_private.org_session_details d join public.training_sessions s on s.id=d.session_id where d.coach_id=detail.coach_id and d.status='scheduled' and s.cancelled_at is null and s.id<>new.id and s.starts_at<new.ends_at and s.ends_at>new.starts_at) then raise exception 'This coach already has an organisation session at that time.'; end if;
 end if;
 return new;
end $function$
