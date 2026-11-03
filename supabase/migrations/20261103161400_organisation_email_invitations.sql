-- Individual emailed organisation invitations. Auth owns single-use email tokens.
alter table public.star_organisation_members
 add column email_attempted_at timestamptz,
 add column email_sent_at timestamptz,
 add column email_status text not null default 'not_sent' check (email_status in ('not_sent','sending','sent','failed')),
 add column email_attempt_id uuid;

create or replace function star_private.prepare_org_invitation(p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); org uuid; address text; member public.star_organisation_members; attempt uuid:=gen_random_uuid();
begin
 if uid is null or not star_private.is_staff_manager() or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'STAR management access required.'; end if;
 org:=(p_data->>'organisation_id')::uuid; address:=lower(trim(p_data->>'email'));
 if address is null or length(address)>254 or address !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
 if length(trim(coalesce(p_data->>'name','')))<1 or length(trim(p_data->>'name'))>100 then raise exception 'Enter the staff member''s name (up to 100 characters).'; end if;
 -- Serialise sends by each manager, including simultaneous requests from different tabs.
 perform 1 from public.staff_members where user_id=uid for update;
 if (select count(*) from public.star_organisation_members where invited_by=uid and email_attempted_at>now()-interval '5 minutes')>=20 then raise exception 'Please wait a few minutes before sending more invitations.'; end if;
 perform 1 from public.star_organisations where id=org and active for update;
 if not found then raise exception 'Choose an active organisation.'; end if;
 select * into member from public.star_organisation_members where organisation_id=org and email=address for update;
 if member.accepted_at is not null then raise exception 'This invitation has already been accepted. Restore access instead if it was revoked.'; end if;
 if member.email_attempted_at>now()-interval '60 seconds' then raise exception 'Please wait at least 60 seconds before resending this invitation.'; end if;
 insert into public.star_organisation_members(organisation_id,email,display_name,invited_by,email_attempted_at,email_status,email_attempt_id)
 values(org,address,trim(p_data->>'name'),uid,now(),'sending',attempt)
 on conflict(organisation_id,email) do update set active=true,expires_at=now()+interval '14 days',display_name=excluded.display_name,invited_by=uid,email_attempted_at=now(),email_status='sending',email_attempt_id=attempt
 returning * into member;
 return jsonb_build_object('id',member.id,'attempt_id',attempt,'email',member.email,
 'existing_account',exists(select 1 from auth.users where lower(email)=address and email_confirmed_at is not null));
end $$;
revoke all on function star_private.prepare_org_invitation(jsonb) from public,anon;
grant execute on function star_private.prepare_org_invitation(jsonb) to authenticated;

create or replace function public.star_prepare_organisation_invitation(p_data jsonb)
returns jsonb language sql set search_path='' as $$ select star_private.prepare_org_invitation(p_data) $$;
revoke all on function public.star_prepare_organisation_invitation(jsonb) from public,anon;
grant execute on function public.star_prepare_organisation_invitation(jsonb) to authenticated;

create or replace function star_private.finish_org_invitation(p_id uuid,p_attempt uuid,p_sent boolean)
returns void language sql security definer set search_path='' as $$
 update public.star_organisation_members set email_status=case when p_sent then 'sent' else 'failed' end,
 email_sent_at=case when p_sent then now() else email_sent_at end where id=p_id and email_attempt_id=p_attempt
$$;
revoke all on function star_private.finish_org_invitation(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function star_private.finish_org_invitation(uuid,uuid,boolean) to service_role;
create or replace function public.star_finish_organisation_invitation(p_id uuid,p_attempt uuid,p_sent boolean)
returns void language sql set search_path='' as $$ select star_private.finish_org_invitation(p_id,p_attempt,p_sent) $$;
revoke all on function public.star_finish_organisation_invitation(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.star_finish_organisation_invitation(uuid,uuid,boolean) to service_role;

CREATE OR REPLACE FUNCTION star_private.organisation_portal(p_action text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid:=auth.uid(); manager boolean; org uuid; result jsonb; r public.star_organisation_referrals; assigned uuid; attended timestamptz; stamp timestamptz;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager();
 if p_action='invite' then
  raise exception 'Use Send invitation email to invite a staff member.';
 elsif p_action='restore_member' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_members m set active=true from public.star_organisations o where m.id=(p_data->>'id')::uuid and m.accepted_at is not null and o.id=m.organisation_id and o.active;
  if not found then raise exception 'An accepted account and active organisation are required.'; end if;
  return jsonb_build_object('ok',true);
 elsif p_action='referral_tasks' then
  if not exists(select 1 from public.staff_members where user_id=uid and active) then raise exception 'STAR staff access required.'; end if;
  perform star_private.refresh_org_referral_alerts();
  return jsonb_build_object('referrals',coalesce((select jsonb_agg(to_jsonb(f)||jsonb_build_object('organisation_name',o.name) order by f.contact_due_at)
    from public.star_organisation_referrals f join public.star_organisations o on o.id=f.organisation_id where o.active and f.contacted_at is null and f.status<>'closed' and (manager or f.assigned_to=uid)),'[]'),
   'alerts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'referral_id',a.referral_id,'kind',a.kind,'created_at',a.created_at,'organisation_name',o.name,'player_name',f.player_name) order by a.created_at desc)
    from public.star_organisation_alerts a join public.star_organisation_referrals f on f.id=a.referral_id join public.star_organisations o on o.id=f.organisation_id
    where a.recipient_id=uid and a.read_at is null and o.active and f.contacted_at is null and f.status<>'closed'),'[]'));
 elsif p_action='read_referral_alert' then
  update public.star_organisation_alerts set read_at=now() where id=(p_data->>'id')::uuid and recipient_id=uid and exists(select 1 from public.staff_members where user_id=uid and active);
  return jsonb_build_object('ok',true);
 elsif p_action='save_branding' then
  if not manager then raise exception 'STAR management access required.'; end if;
  org:=(p_data->>'organisation_id')::uuid; assigned:=nullif(p_data->>'referral_assignee','')::uuid;
  if assigned is not null and not exists(select 1 from public.staff_members where user_id=assigned and active) then raise exception 'Choose an active STAR staff member.'; end if;
  if coalesce(p_data->>'logo_path','')<>'' and not exists(select 1 from storage.objects where bucket_id='organisation-branding' and name=p_data->>'logo_path' and (storage.foldername(name))[1]=org::text) then raise exception 'Upload a logo for this organisation first.'; end if;
  update public.star_organisations set brand_colour=p_data->>'brand_colour',logo_path=coalesce(p_data->>'logo_path',''),welcome_text=trim(coalesce(p_data->>'welcome_text','')),referral_assignee=assigned where id=org;
  if not found then raise exception 'Organisation not found.'; end if;
  return jsonb_build_object('ok',true);
 elsif p_action in ('referral_followup','record_first_attendance') then
  select * into r from public.star_organisation_referrals where id=(p_data->>'id')::uuid for update;
  if r.id is null then raise exception 'Referral not found.'; end if;
  if not manager and not coalesce((r.assigned_to=uid and exists(select 1 from public.staff_members where user_id=uid and active)),false) then raise exception 'Referral assignment or STAR management access required.'; end if;
  if nullif(p_data->>'expected_updated_at','')::timestamptz is distinct from r.updated_at then raise exception 'This referral has changed. Refresh before saving.'; end if;
  if p_action='record_first_attendance' then
   attended:=nullif(p_data->>'attended_at','')::timestamptz;
   if attended is null or attended<r.created_at or attended>now() then raise exception 'Choose the actual session time, after referral and no later than now.'; end if;
   if r.first_attended_at is null then update public.star_organisation_referrals set first_attended_at=attended,updated_at=clock_timestamp() where id=r.id; end if;
  else
   assigned:=case when manager then nullif(p_data->>'assigned_to','')::uuid else r.assigned_to end;
   if assigned is null or not exists(select 1 from public.staff_members where user_id=assigned and active) then raise exception 'Choose an active STAR staff member.'; end if;
   stamp:=case when p_data->>'contacted'='true' or p_data->>'status'='contacted' then coalesce(r.contacted_at,now()) else r.contacted_at end;
   update public.star_organisation_referrals set assigned_to=assigned,status=p_data->>'status',response=trim(coalesce(p_data->>'response','')),contacted_at=stamp,updated_at=clock_timestamp() where id=r.id;
   if assigned is distinct from r.assigned_to and stamp is null then insert into public.star_organisation_alerts(recipient_id,referral_id,kind) values(assigned,r.id,'new_referral') on conflict do nothing; end if;
  end if;
  return jsonb_build_object('ok',true);
 elsif p_action='review_referral' then
  -- Compatibility for already-open clients, preserving the contact milestone.
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_referrals set status=p_data->>'status',response=trim(coalesce(p_data->>'response','')),contacted_at=case when p_data->>'status'='contacted' then coalesce(contacted_at,now()) else contacted_at end,updated_at=clock_timestamp() where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 end if;
 result:=star_private.organisation_portal_base(p_action,p_data);
 if p_action='manage' then
  result:=result||jsonb_build_object('staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),u.email),'role',s.role) order by u.email) from public.staff_members s join auth.users u on u.id=s.user_id where s.active),'[]'));
 elsif p_action='workspace' then
  result:=jsonb_build_object('organisations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'kind',o.kind,'referral_code',o.referral_code,'brand_colour',o.brand_colour,'logo_path',o.logo_path,'welcome_text',o.welcome_text) order by o.name) from public.star_organisations o where star_private.org_member(o.id)),'[]'));
 elsif p_action='referral_info' and result is not null then
  result:=result||star_private.org_referral_brand((p_data->>'code')::uuid);
 elsif p_action='organisation' then
  org:=(p_data->>'organisation_id')::uuid;
  result:=result||jsonb_build_object('summary',jsonb_build_object('referrals',(select count(*) from public.star_organisation_referrals where organisation_id=org),'contacted',(select count(*) from public.star_organisation_referrals where organisation_id=org and contacted_at is not null),'first_attended',(select count(*) from public.star_organisation_referrals where organisation_id=org and first_attended_at is not null),'sessions_delivered',(select count(*) from public.star_organisation_requests where organisation_id=org and status='completed')));
  -- Organisation staff can see milestones, never STAR's internal assignment or task deadlines.
  result:=jsonb_set(result,'{referrals}',coalesce((select jsonb_agg(value-'assigned_to'-'contact_due_at') from jsonb_array_elements(result->'referrals')),'[]'));
 elsif p_action='family' then
  result:=jsonb_set(result,'{referrals}',coalesce((select jsonb_agg(value-'assigned_to'-'contact_due_at') from jsonb_array_elements(result->'referrals')),'[]'));
 end if;
 return result;
end $function$
