-- Preserve verified identity, family access, concurrency and separate consent. Defer enrolment extras.
create or replace function star_private.intake_save(p_id uuid,p_version integer,p_first text,p_last text,p_dob date,p_details jsonb,p_photo text,p_complete boolean)
returns public.player_intakes language plpgsql security definer set search_path='' as $$
declare r public.player_intakes;k text;v jsonb;required_keys text[]:=array['contact_name','relationship','contact_phone','contact_email','emergency_name','emergency_relationship','emergency_phone','support','medical','allergies','medication','injuries','emergency_plan','coaching_media','public_photos','public_video','public_name','availability'];
begin
 perform star_private.intake_require_verified();
 select * into r from public.player_intakes where id=p_id for update;
 if not found or not star_private.intake_access(p_id) then raise exception 'Player profile unavailable.';end if;
 if r.version<>p_version then raise exception 'This profile changed in another session. Reload before saving.';end if;
 if p_first is null or p_last is null or p_details is null or jsonb_typeof(p_details)<>'object' or octet_length(p_details::text)>40000 then raise exception 'Check the player details.';end if;
 if p_dob is not null and (p_dob>current_date or p_dob>current_date-interval '5 years' or p_dob<=current_date-interval '19 years') then raise exception 'Player must be aged 5–18.';end if;
 for k,v in select * from jsonb_each(p_details) loop if jsonb_typeof(v)<>'string' or length(v#>>'{}')>2000 then raise exception 'Keep each answer under 2,000 characters.';end if;end loop;
 foreach k in array array['coaching_media','public_photos','public_video','public_name'] loop if coalesce(p_details->>k,'') not in ('','Yes','No') then raise exception 'Check consent choices.';end if;end loop;
 if p_photo is not null and not exists(select 1 from storage.objects where bucket_id='player-intake-photos' and name=p_photo and split_part(name,'/',1)=p_id::text) then raise exception 'Upload the player photograph before saving.';end if;
 if p_complete then
  if length(btrim(p_first))<1 or length(btrim(p_last))<1 or p_dob is null then raise exception 'Complete the player name and date of birth.';end if;
  foreach k in array required_keys loop if coalesce(btrim(p_details->>k),'')='' then raise exception 'Complete all required sections before finishing.';end if;end loop;
  if p_details->>'medical'='Details below' and coalesce(btrim(p_details->>'medical_details'),'')='' then raise exception 'Add the relevant medical details.';end if;
 end if;
 update public.player_intakes set first_name=btrim(p_first),last_name=btrim(p_last),date_of_birth=p_dob,details=p_details,photo_path=p_photo,completed_at=case when p_complete then now() end,guardian_reviewed_at=null,guardian_reviewed_by=null,consent_version=null,version=version+1,updated_at=now() where id=p_id returning * into r;
 return r;
end;$$;
