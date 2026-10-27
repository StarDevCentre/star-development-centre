-- Additional programme applications reuse the same player after staff approval.
alter table public.player_registrations add column source_registration_id uuid references public.player_registrations(id);
alter table public.player_registrations drop constraint player_registrations_enrolled_player_id_key;
create index player_registrations_enrolled_player_idx on public.player_registrations(enrolled_player_id) where enrolled_player_id is not null;
create index player_registrations_source_idx on public.player_registrations(source_registration_id) where source_registration_id is not null;

create or replace function star_private.validate_registration_source() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.source_registration_id is not null and not exists(
  select 1 from public.player_registrations s where s.id=new.source_registration_id and s.id<>new.id
  and s.guardian_id=new.guardian_id and s.date_of_birth=new.date_of_birth
  and lower(btrim(s.player_first_name))=lower(btrim(new.player_first_name))
  and lower(btrim(s.player_last_name))=lower(btrim(new.player_last_name))
 ) then raise exception 'Choose a player registered to your own account'; end if;
 return new;
end $$;
create trigger validate_registration_source before insert or update of source_registration_id,guardian_id,player_first_name,player_last_name,date_of_birth
on public.player_registrations for each row execute function star_private.validate_registration_source();

create or replace function public.star_request_player_programme(p_source_registration_id uuid,p_programme text)
returns setof public.player_registrations language plpgsql set search_path='' as $$
declare s public.player_registrations%rowtype; result public.player_registrations%rowtype; years integer;
begin
 if (select auth.uid()) is null or coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) then raise exception 'Sign in to your parent account'; end if;
 if not exists(select 1 from public.guardian_profiles where user_id=(select auth.uid())) then raise exception 'Complete your parent details first'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended((select auth.uid())::text,0));
 select * into s from public.player_registrations where id=p_source_registration_id and guardian_id=(select auth.uid()) and status<>'draft';
 if not found then raise exception 'Choose a player registered to your own account'; end if;
 years:=extract(year from age((now() at time zone 'Europe/London')::date,s.date_of_birth));
 if not (years between 5 and 18 and (
  (p_programme='sparks' and years<=10) or (p_programme='development' and years between 11 and 16) or
  (p_programme='flyers' and years between 7 and 10) or (p_programme in ('prestige','one-to-one') and years>=11) or p_programme='season-support'
 )) then raise exception 'This programme is not available for her age'; end if;
 if exists(select 1 from public.player_registrations a where a.guardian_id=s.guardian_id
  and a.date_of_birth=s.date_of_birth and lower(btrim(a.player_first_name))=lower(btrim(s.player_first_name))
  and lower(btrim(a.player_last_name))=lower(btrim(s.player_last_name))
  and a.status in ('submitted','under_review','waitlisted','accepted','enrolled')
  and case when a.status in ('accepted','enrolled') then coalesce(a.recommended_programme,a.programme) else a.programme end=p_programme
 ) then raise exception 'She is already enrolled or has a request for this programme'; end if;
 insert into public.player_registrations(guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at,source_registration_id)
 values(s.guardian_id,s.player_first_name,s.player_last_name,s.date_of_birth,p_programme,'submitted',now(),s.id) returning * into result;
 return next result;
end $$;
revoke all on function public.star_request_player_programme(uuid,text) from public,anon;
grant execute on function public.star_request_player_programme(uuid,text) to authenticated;

create or replace function public.star_enrol_approved_application(p_application_id uuid,p_consent_verified boolean)
returns uuid language plpgsql set search_path='' as $$
declare a public.player_registrations%rowtype; new_id uuid; target_programme text; target_slug text;
begin
 if not (select star_private.is_staff_manager()) then raise exception 'Not authorised'; end if;
 if p_consent_verified is distinct from true then raise exception 'Verified consent is required'; end if;
 select * into a from public.player_registrations where id=p_application_id for update;
 if not found or a.status<>'accepted' or a.enrolled_player_id is not null then raise exception 'Application must be accepted and not already enrolled'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(a.guardian_id::text,0));
 target_slug:=coalesce(a.recommended_programme,a.programme);
 target_programme:=case target_slug when 'sparks' then 'Sparks' when 'development' then 'Development' when 'flyers' then 'Flyers' when 'prestige' then 'Prestige' when 'one-to-one' then '1-to-1' when 'season-support' then 'Other' else null end;
 if target_programme is null then raise exception 'Unsupported programme'; end if;
 if exists(select 1 from public.player_registrations s where s.guardian_id=a.guardian_id and s.status='enrolled'
  and s.date_of_birth=a.date_of_birth and lower(btrim(s.player_first_name))=lower(btrim(a.player_first_name))
  and lower(btrim(s.player_last_name))=lower(btrim(a.player_last_name)) and coalesce(s.recommended_programme,s.programme)=target_slug
 ) then raise exception 'Player is already enrolled in this programme'; end if;
 select s.enrolled_player_id into new_id from public.player_registrations s where s.guardian_id=a.guardian_id
  and s.status='enrolled' and s.enrolled_player_id is not null and s.date_of_birth=a.date_of_birth
  and lower(btrim(s.player_first_name))=lower(btrim(a.player_first_name)) and lower(btrim(s.player_last_name))=lower(btrim(a.player_last_name))
 order by s.created_at limit 1;
 if new_id is null then
  insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
  values(a.player_first_name,a.player_last_name,target_programme,true,(select auth.uid()),(select auth.uid())) returning id into new_id;
 end if;
 update public.player_registrations set status='enrolled',enrolled_player_id=new_id,decision_at=now(),decided_by=(select auth.uid()),updated_at=now() where id=p_application_id;
 return new_id;
end $$;
