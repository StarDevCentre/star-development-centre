-- Separate pre-assessment records; no existing coaching/family access is granted by onboarding.
create table public.player_intakes (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references auth.users(id) on delete cascade,
 guardian_id uuid references auth.users(id) on delete set null, player_user_id uuid unique references auth.users(id) on delete set null,
 first_name text not null default '' check(length(first_name)<=100),last_name text not null default '' check(length(last_name)<=100),date_of_birth date,
 details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=40000),photo_path text,
 version integer not null default 1,completed_at timestamptz,guardian_reviewed_at timestamptz,guardian_reviewed_by uuid references auth.users(id),
 consent_version text,assessment_status text not null default 'not_requested' check(assessment_status in ('not_requested','requested','confirmed','completed','cancelled')),
 assessment_requested_at timestamptz,assessment_starts_at timestamptz,assessment_venue text,assessment_message text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(guardian_id is null or player_user_id is null or guardian_id<>player_user_id)
);
create index player_intakes_creator on public.player_intakes(creator_id);
create index player_intakes_guardian on public.player_intakes(guardian_id);
create index player_intakes_queue on public.player_intakes(assessment_status,assessment_requested_at);
create table star_private.intake_invitations (
 id uuid primary key default gen_random_uuid(),intake_id uuid not null references public.player_intakes(id) on delete cascade,
 token_hash text not null unique,target_email text not null,target_role text not null check(target_role in ('guardian','player')),
 created_by uuid not null references auth.users(id),expires_at timestamptz not null default now()+interval '48 hours',used_at timestamptz
);
create index intake_invitations_intake on star_private.intake_invitations(intake_id);
alter table public.player_intakes enable row level security;
alter table star_private.intake_invitations enable row level security;
revoke all on public.player_intakes from anon,authenticated;
grant select on public.player_intakes to authenticated;
revoke all on star_private.intake_invitations from public,anon,authenticated;

create function star_private.intake_access(p_id uuid,p_staff boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.player_intakes i where i.id=p_id and (i.creator_id=auth.uid() or i.guardian_id=auth.uid() or i.player_user_id=auth.uid() or (p_staff and star_private.is_staff_manager())));
$$;
revoke all on function star_private.intake_access(uuid,boolean) from public,anon;
grant execute on function star_private.intake_access(uuid,boolean) to authenticated;
create policy intake_read on public.player_intakes for select to authenticated using(star_private.intake_access(id,true));

create function star_private.intake_require_verified() returns void language plpgsql stable security definer set search_path='' as $$
 begin if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Sign in with a verified email account first.';end if;end;$$;
revoke all on function star_private.intake_require_verified() from public,anon;

create function star_private.intake_create(p_role text) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin
 perform star_private.intake_require_verified();
 if p_role not in ('guardian','player') then raise exception 'Choose parent or player.';end if;
 if p_role='guardian' and not exists(select 1 from public.guardian_profiles where user_id=auth.uid()) then raise exception 'Complete your parent account contact details first.';end if;
 if (select count(*) from public.player_intakes where creator_id=auth.uid())>=10 then raise exception 'Contact STAR to add another player.';end if;
 insert into public.player_intakes(creator_id,guardian_id,player_user_id) values(auth.uid(),case when p_role='guardian' then auth.uid() end,case when p_role='player' then auth.uid() end) returning * into r;return r;end;$$;

create function star_private.intake_save(p_id uuid,p_version int,p_first text,p_last text,p_dob date,p_details jsonb,p_photo text,p_complete boolean) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;k text;v jsonb;required_keys text[]:=array['address','postcode','contact_name','relationship','contact_phone','contact_email','emergency_name','emergency_relationship','emergency_phone','experience','playing_history','weekly_football','positions','stronger_foot','enjoys','strengths','challenges','goals','confidence','learning','support','medical','allergies','medication','injuries','emergency_plan','training_top_size','boot_size','coaching_media','public_photos','public_video','public_name','availability'];
 begin perform star_private.intake_require_verified();
 select * into r from public.player_intakes where id=p_id for update;
 if not found or not star_private.intake_access(p_id) then raise exception 'Player profile unavailable.';end if;
 if r.version<>p_version then raise exception 'This profile changed in another session. Reload before saving.';end if;
 if p_first is null or p_last is null or p_details is null or jsonb_typeof(p_details)<>'object' or octet_length(p_details::text)>40000 then raise exception 'Check the player details.';end if;
 if p_dob is not null and (p_dob>current_date or p_dob>current_date-interval '5 years' or p_dob<=current_date-interval '19 years') then raise exception 'Player must be aged 5–18.';end if;
 for k,v in select * from jsonb_each(p_details) loop if jsonb_typeof(v)<>'string' or length(v#>>'{}')>2000 then raise exception 'Keep each answer under 2,000 characters.';end if;end loop;
 foreach k in array array['coaching_media','public_photos','public_video','public_name'] loop if coalesce(p_details->>k,'') not in ('','Yes','No') then raise exception 'Check consent choices.';end if;end loop;
 if p_photo is not null and not exists(select 1 from storage.objects where bucket_id='player-intake-photos' and name=p_photo and split_part(name,'/',1)=p_id::text) then raise exception 'Upload the player photograph before saving.';end if;
 if p_complete then
  if length(btrim(p_first))<1 or length(btrim(p_last))<1 or p_dob is null or p_photo is null then raise exception 'Complete the player name, date of birth and photograph.';end if;
  foreach k in array required_keys loop if coalesce(btrim(p_details->>k),'')='' then raise exception 'Complete all required sections before finishing.';end if;end loop;
  if p_details->>'medical'='Details below' and coalesce(btrim(p_details->>'medical_details'),'')='' then raise exception 'Add the relevant medical details.';end if;
 end if;
 update public.player_intakes set first_name=btrim(p_first),last_name=btrim(p_last),date_of_birth=p_dob,details=p_details,photo_path=p_photo,completed_at=case when p_complete then now() end,guardian_reviewed_at=null,guardian_reviewed_by=null,consent_version=null,version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;

create function star_private.intake_invite(p_id uuid,p_email text) returns text language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;role_name text;code text;begin perform star_private.intake_require_verified();
 select * into r from public.player_intakes where id=p_id for update;
 if not found or not star_private.intake_access(p_id) then raise exception 'Player profile unavailable.';end if;
 if r.guardian_id is not null and r.player_user_id is not null then raise exception 'Both accounts are already linked.';end if;
 if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid account email.';end if;
 if lower(btrim(p_email))=(select lower(email) from auth.users where id=auth.uid()) then raise exception 'Use a separate account for the player and parent.';end if;
 role_name:=case when r.guardian_id is null then 'guardian' else 'player' end;
 update star_private.intake_invitations set used_at=now() where intake_id=p_id and used_at is null;
 code:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into star_private.intake_invitations(intake_id,token_hash,target_email,target_role,created_by) values(p_id,encode(extensions.digest(code,'sha256'),'hex'),lower(btrim(p_email)),role_name,auth.uid());return code;end;$$;

create function star_private.intake_claim(p_code text) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare inv star_private.intake_invitations;r public.player_intakes;begin perform star_private.intake_require_verified();
 if length(p_code)<>64 then raise exception 'Invalid or expired invitation.';end if;
 select * into inv from star_private.intake_invitations where token_hash=encode(extensions.digest(p_code,'sha256'),'hex') for update;
 if not found or inv.used_at is not null or inv.expires_at<now() or inv.target_email<>(select lower(email) from auth.users where id=auth.uid()) then raise exception 'Invalid or expired invitation. Sign in using the email the invitation was made for.';end if;
 select * into r from public.player_intakes where id=inv.intake_id for update;
 if auth.uid() in (r.creator_id,r.guardian_id,r.player_user_id) then raise exception 'Use the other person’s separate account.';end if;
 if inv.target_role='guardian' then
  if r.guardian_id is not null or not exists(select 1 from public.guardian_profiles where user_id=auth.uid()) then raise exception 'Complete your parent account first, or ask STAR about the existing link.';end if;
  update public.player_intakes set guardian_id=auth.uid(),version=version+1,updated_at=now() where id=r.id returning * into r;
 else
  if r.player_user_id is not null then raise exception 'A player account is already linked.';end if;
  update public.player_intakes set player_user_id=auth.uid(),version=version+1,updated_at=now() where id=r.id returning * into r;
 end if;
 update star_private.intake_invitations set used_at=now() where id=inv.id;return r;end;$$;

create function star_private.intake_review(p_id uuid,p_version int,p_confirm boolean) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin perform star_private.intake_require_verified();select * into r from public.player_intakes where id=p_id for update;
 if not found or r.guardian_id is distinct from auth.uid() or r.completed_at is null or r.player_user_id is null or r.version<>p_version or p_confirm is distinct from true then raise exception 'Link both accounts, finish the form and review the latest information as the parent / guardian.';end if;
 update public.player_intakes set guardian_reviewed_at=now(),guardian_reviewed_by=auth.uid(),consent_version='intake-2026-10-v1',version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;

create function star_private.intake_request(p_id uuid,p_version int) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin perform star_private.intake_require_verified();select * into r from public.player_intakes where id=p_id for update;
 if not found or not star_private.intake_access(p_id) or r.version<>p_version or r.guardian_reviewed_at is null or r.completed_at is null or r.guardian_id is null or r.player_user_id is null then raise exception 'Complete onboarding, link both accounts and obtain parent / guardian review first.';end if;
 if r.assessment_status not in ('not_requested','cancelled') then raise exception 'An assessment request already exists.';end if;
 update public.player_intakes set assessment_status='requested',assessment_requested_at=now(),assessment_starts_at=null,assessment_venue=null,assessment_message=null,version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;

create function star_private.intake_assessment(p_id uuid,p_version int,p_status text,p_starts timestamptz,p_venue text,p_message text) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin
 if auth.uid() is null or not star_private.is_staff_manager() then raise exception 'Staff manager access required.';end if;
 select * into r from public.player_intakes where id=p_id for update;
 if not found or r.version<>p_version or r.assessment_requested_at is null then raise exception 'Reload the assessment request.';end if;
 if p_status not in ('requested','confirmed','completed','cancelled') or length(coalesce(p_venue,''))>300 or length(coalesce(p_message,''))>2000 then raise exception 'Check assessment details.';end if;
 if p_status='confirmed' and (p_starts is null or p_starts<=now() or coalesce(btrim(p_venue),'')='' or r.guardian_reviewed_at is null or r.completed_at is null) then raise exception 'Confirm a future time, venue and current parent review.';end if;
 if p_status='completed' and (r.assessment_status<>'confirmed' or r.assessment_starts_at>now()) then raise exception 'Only a confirmed assessment that has started can be marked completed.';end if;
 update public.player_intakes set assessment_status=p_status,assessment_starts_at=case when p_status='confirmed' then p_starts else assessment_starts_at end,assessment_venue=case when p_status='confirmed' then btrim(p_venue) else assessment_venue end,assessment_message=nullif(btrim(p_message),''),version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;

-- Public RPCs are invokers. All privileged code stays in the non-exposed schema and checks the actor.
create function public.intake_create(p_role text) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_create(p_role)$$;
create function public.intake_save(p_id uuid,p_version int,p_first text,p_last text,p_dob date,p_details jsonb,p_photo text,p_complete boolean) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_save(p_id,p_version,p_first,p_last,p_dob,p_details,p_photo,p_complete)$$;
create function public.intake_invite(p_id uuid,p_email text) returns text language sql security invoker set search_path='' as $$select star_private.intake_invite(p_id,p_email)$$;
create function public.intake_claim(p_code text) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_claim(p_code)$$;
create function public.intake_review(p_id uuid,p_version int,p_confirm boolean) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_review(p_id,p_version,p_confirm)$$;
create function public.intake_request(p_id uuid,p_version int) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_request(p_id,p_version)$$;
create function public.intake_assessment(p_id uuid,p_version int,p_status text,p_starts timestamptz,p_venue text,p_message text) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_assessment(p_id,p_version,p_status,p_starts,p_venue,p_message)$$;
do $$declare f record;begin for f in select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','star_private') and p.proname in ('intake_create','intake_save','intake_invite','intake_claim','intake_review','intake_request','intake_assessment') loop execute format('revoke all on function %I.%I(%s) from public,anon',f.nspname,f.proname,f.args);execute format('grant execute on function %I.%I(%s) to authenticated',f.nspname,f.proname,f.args);end loop;end$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('player-intake-photos','player-intake-photos',false,5242880,array['image/jpeg']) on conflict(id) do nothing;
create function star_private.intake_photo_access(p_name text,p_staff boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.player_intakes i where i.id::text=split_part(p_name,'/',1) and star_private.intake_access(i.id,p_staff));$$;
revoke all on function star_private.intake_photo_access(text,boolean) from public,anon;
grant execute on function star_private.intake_photo_access(text,boolean) to authenticated;
create policy intake_photo_read on storage.objects for select to authenticated using(bucket_id='player-intake-photos' and star_private.intake_photo_access(name,true));
create policy intake_photo_insert on storage.objects for insert to authenticated with check(bucket_id='player-intake-photos' and star_private.intake_photo_access(name) and name~'^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$');
create policy intake_photo_delete on storage.objects for delete to authenticated using(bucket_id='player-intake-photos' and star_private.intake_photo_access(name) and not exists(select 1 from public.player_intakes i where i.photo_path=name));
