-- A parent can complete onboarding without a separate player login.
create or replace function star_private.intake_review(p_id uuid,p_version int,p_confirm boolean) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin perform star_private.intake_require_verified();select * into r from public.player_intakes where id=p_id for update;
 if not found or r.guardian_id is distinct from auth.uid() or r.completed_at is null or r.version<>p_version or p_confirm is distinct from true then raise exception 'Finish the form and confirm the latest information as the parent / guardian.';end if;
 update public.player_intakes set guardian_reviewed_at=now(),guardian_reviewed_by=auth.uid(),consent_version='intake-2026-10-v1',version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;
create or replace function star_private.intake_request(p_id uuid,p_version int) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin perform star_private.intake_require_verified();select * into r from public.player_intakes where id=p_id for update;
 if not found or not star_private.intake_access(p_id) or r.version<>p_version or r.guardian_reviewed_at is null or r.completed_at is null or r.guardian_id is null then raise exception 'Complete the form and obtain parent / guardian confirmation first.';end if;
 if r.assessment_status not in ('not_requested','cancelled') then raise exception 'An assessment request already exists.';end if;
 update public.player_intakes set assessment_status='requested',assessment_requested_at=now(),assessment_starts_at=null,assessment_venue=null,assessment_message=null,version=version+1,updated_at=now() where id=p_id returning * into r;return r;end;$$;
-- Save, validate, record parent confirmation and request the assessment atomically.
create function star_private.intake_submit(p_id uuid,p_version int,p_first text,p_last text,p_dob date,p_details jsonb,p_photo text,p_confirm boolean) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare r public.player_intakes;begin
 perform star_private.intake_require_verified();
 select * into r from public.player_intakes where id=p_id for update;
 if not found or r.guardian_id is distinct from auth.uid() or p_confirm is distinct from true then raise exception 'Only the player’s parent / guardian can confirm and submit this request.';end if;
 r:=star_private.intake_save(p_id,p_version,p_first,p_last,p_dob,p_details,p_photo,true);
 r:=star_private.intake_review(r.id,r.version,true);
 if r.assessment_status in ('not_requested','cancelled') then r:=star_private.intake_request(r.id,r.version);end if;
 return r;
 end;$$;
create function public.intake_submit(p_id uuid,p_version int,p_first text,p_last text,p_dob date,p_details jsonb,p_photo text,p_confirm boolean) returns public.player_intakes language sql security invoker set search_path='' as $$select star_private.intake_submit(p_id,p_version,p_first,p_last,p_dob,p_details,p_photo,p_confirm)$$;
revoke all on function star_private.intake_submit(uuid,int,text,text,date,jsonb,text,boolean) from public,anon;
revoke all on function public.intake_submit(uuid,int,text,text,date,jsonb,text,boolean) from public,anon;
grant execute on function star_private.intake_submit(uuid,int,text,text,date,jsonb,text,boolean) to authenticated;
grant execute on function public.intake_submit(uuid,int,text,text,date,jsonb,text,boolean) to authenticated;
