-- Additive organisation portal. Existing family/staff policies are untouched.
create table public.star_organisations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160), kind text not null check(kind in ('school','club')), active boolean not null default true,
 referral_code uuid not null default gen_random_uuid() unique, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.star_organisation_members (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id) on delete cascade,
 email text not null check(email=lower(trim(email)) and length(email) between 3 and 254), display_name text not null check(length(display_name) between 2 and 100),
 user_id uuid references auth.users(id) on delete set null, active boolean not null default true, expires_at timestamptz not null default now()+interval '14 days', accepted_at timestamptz,
 invited_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organisation_id,email)
);
create index on public.star_organisation_members(user_id);
create table public.star_organisation_players (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id) on delete cascade, player_id uuid not null references public.coaching_players(id) on delete cascade,
 approved_by uuid references auth.users(id) on delete set null, approved_at timestamptz, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organisation_id,player_id)
);
create index on public.star_organisation_players(player_id);
create table public.star_organisation_referrals (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id), submitted_by uuid not null references auth.users(id), guardian_id uuid references auth.users(id),
 player_name text not null check(length(player_name) between 2 and 150), age_band text not null check(age_band in ('5–7','8–10','11–13','14–16','17–18')),
 guardian_name text not null check(length(guardian_name) between 2 and 100), guardian_email text not null check(length(guardian_email) between 3 and 254 and guardian_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'), reason text not null check(length(reason) between 10 and 2000),
 permission_confirmed boolean not null check(permission_confirmed), status text not null default 'submitted' check(status in ('submitted','reviewing','contacted','assessment_arranged','completed','closed')),
 response text not null default '' check(length(response)<=2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.star_organisation_referrals(organisation_id); create index on public.star_organisation_referrals(guardian_id);
create table public.star_organisation_requests (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id), submitted_by uuid not null references auth.users(id),
 service text not null check(service in ('school_taster','school_club','team_coaching','player_observation','bespoke')), details text not null check(length(details) between 10 and 2000),
 preferred_dates text not null check(length(preferred_dates) between 2 and 300), venue text not null check(length(venue) between 2 and 300),
 status text not null default 'requested' check(status in ('requested','discussing','confirmed','completed','declined')), response text not null default '' check(length(response)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.star_organisation_requests(organisation_id);
create table public.star_organisation_observations (
 id uuid primary key default gen_random_uuid(), link_id uuid not null references public.star_organisation_players(id) on delete cascade, submitted_by uuid not null references auth.users(id),
 observation text not null check(length(observation) between 10 and 2000), response text not null default '' check(length(response)<=2000), created_at timestamptz not null default now()
);
create index on public.star_organisation_observations(link_id);
create table public.star_organisation_updates (
 id uuid primary key default gen_random_uuid(), link_id uuid not null references public.star_organisation_players(id) on delete cascade, published_by uuid not null references auth.users(id),
 feedback text not null check(length(feedback) between 10 and 2000), suggested_support text not null default '' check(length(suggested_support)<=2000), created_at timestamptz not null default now()
);
create index on public.star_organisation_updates(link_id);
create table public.star_organisation_consent_events (
 id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.star_organisations(id), player_id uuid not null references public.coaching_players(id) on delete cascade,
 guardian_id uuid not null references auth.users(id), approved boolean not null, recorded_at timestamptz not null default now()
);
create index on public.star_organisation_consent_events(player_id);


create function star_private.org_member(p_org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.star_organisation_members m join public.star_organisations o on o.id=m.organisation_id join auth.users u on u.id=m.user_id
 where m.organisation_id=p_org and m.user_id=auth.uid() and m.active and o.active and m.accepted_at is not null and u.email_confirmed_at is not null and lower(u.email)=m.email)
$$;
create function star_private.org_link_active(p_link uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.star_organisation_players l join public.star_organisations o on o.id=l.organisation_id
 join public.guardian_player_links g on g.player_id=l.player_id and g.guardian_id=l.approved_by
 where l.id=p_link and l.approved_at is not null and o.active)
$$;
revoke all on function star_private.org_member(uuid),star_private.org_link_active(uuid) from public,anon,authenticated;

-- Private dispatcher validates live verified identity, organisation membership and consent at every read/write.
create function star_private.organisation_portal(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); verified_email text; manager boolean; org uuid; link uuid; rec uuid; result jsonb; text_value text; own_parent boolean;
begin
 select lower(email) into verified_email from auth.users where id=uid and email_confirmed_at is not null and coalesce(is_anonymous,false)=false;
 if uid is null or verified_email is null then raise exception 'Sign in with a verified email address.'; end if;
 manager:=star_private.is_staff_manager();
 if p_action='accept' then
  update public.star_organisation_members m set user_id=uid,accepted_at=coalesce(accepted_at,now()) from public.star_organisations o
  where o.id=m.organisation_id and o.active and m.active and m.email=verified_email and (m.user_id is null or m.user_id=uid) and (m.accepted_at is not null or m.expires_at>now());
  return jsonb_build_object('ok',true);
 elsif p_action='workspace' then
  select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'kind',o.kind,'referral_code',o.referral_code) order by o.name),'[]') into result from public.star_organisations o where star_private.org_member(o.id);
  return jsonb_build_object('organisations',result);
 elsif p_action='family' then
  return jsonb_build_object('links',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'organisation',o.name,'kind',o.kind,'active',o.active,'player_name',p.first_name||' '||p.last_name,'approved',star_private.org_link_active(l.id))) from public.star_organisation_players l join public.star_organisations o on o.id=l.organisation_id join public.coaching_players p on p.id=l.player_id where exists(select 1 from public.guardian_player_links g where g.player_id=l.player_id and g.guardian_id=uid)),'[]'),
   'referrals',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.star_organisation_referrals r where r.guardian_id=uid),'[]'));
 elsif p_action='referral_info' then
  return (select jsonb_build_object('id',id,'name',name,'kind',kind) from public.star_organisations where referral_code=(p_data->>'code')::uuid and active);
 elsif p_action='consent' then
  link:=(p_data->>'id')::uuid;
  perform 1 from public.star_organisation_players where id=link for update;
  if not exists(select 1 from public.star_organisation_players l join public.guardian_player_links g on g.player_id=l.player_id where l.id=link and g.guardian_id=uid) then raise exception 'Parent access required.'; end if;
  insert into public.star_organisation_consent_events(organisation_id,player_id,guardian_id,approved) select organisation_id,player_id,uid,(p_data->>'approve')::boolean from public.star_organisation_players where id=link;
  update public.star_organisation_players set approved_by=case when (p_data->>'approve')::boolean then uid else null end,approved_at=case when (p_data->>'approve')::boolean then now() else null end where id=link;
  return jsonb_build_object('ok',true);
 elsif p_action='manage' then
  if not manager then raise exception 'STAR management access required.'; end if;
  return jsonb_build_object('organisations',coalesce((select jsonb_agg(to_jsonb(o) order by name) from public.star_organisations o),'[]'),
   'members',coalesce((select jsonb_agg(to_jsonb(m) order by created_at desc) from public.star_organisation_members m),'[]'),
   'players',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',first_name||' '||last_name) order by first_name) from public.coaching_players),'[]'),
   'links',coalesce((select jsonb_agg(to_jsonb(l)||jsonb_build_object('player_name',p.first_name||' '||p.last_name,'approved',star_private.org_link_active(l.id))) from public.star_organisation_players l join public.coaching_players p on p.id=l.player_id),'[]'),
   'referrals',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_referrals r),'[]'),
   'requests',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_requests r),'[]'),
   'observations',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_observations r),'[]'),
   'updates',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_updates r),'[]'));
 elsif p_action='create_organisation' then
  if not manager then raise exception 'STAR management access required.'; end if;
  insert into public.star_organisations(name,kind,created_by) values(trim(p_data->>'name'),p_data->>'kind',uid) returning id into org;
  return jsonb_build_object('id',org);
 elsif p_action='organisation_active' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisations set active=(p_data->>'active')::boolean where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='invite' then
  if not manager then raise exception 'STAR management access required.'; end if;
  if trim(p_data->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
  insert into public.star_organisation_members(organisation_id,email,display_name,invited_by) values((p_data->>'organisation_id')::uuid,lower(trim(p_data->>'email')),trim(p_data->>'name'),uid)
  on conflict(organisation_id,email) do update set active=true,expires_at=now()+interval '14 days',display_name=excluded.display_name,invited_by=uid;
  return jsonb_build_object('ok',true);
 elsif p_action='revoke_member' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_members set active=false where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='link_player' then
  if not manager then raise exception 'STAR management access required.'; end if;
  insert into public.star_organisation_players(organisation_id,player_id,created_by) values((p_data->>'organisation_id')::uuid,(p_data->>'player_id')::uuid,uid) on conflict(organisation_id,player_id) do nothing;
  return jsonb_build_object('ok',true);
 elsif p_action='unlink_player' then
  if not manager then raise exception 'STAR management access required.'; end if;
  delete from public.star_organisation_players where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='publish_update' then
  if not manager then raise exception 'STAR management access required.'; end if;
  link:=(p_data->>'link_id')::uuid;
  if not star_private.org_link_active(link) then raise exception 'Current parent sharing permission is required.'; end if;
  insert into public.star_organisation_updates(link_id,published_by,feedback,suggested_support) values(link,uid,trim(p_data->>'feedback'),coalesce(trim(p_data->>'suggested_support'),''));
  return jsonb_build_object('ok',true);
 elsif p_action='review_referral' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_referrals set status=p_data->>'status',response=coalesce(trim(p_data->>'response'),''),updated_at=now() where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='review_request' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_requests set status=p_data->>'status',response=coalesce(trim(p_data->>'response'),''),updated_at=now() where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 elsif p_action='reply_observation' then
  if not manager then raise exception 'STAR management access required.'; end if;
  update public.star_organisation_observations set response=trim(p_data->>'response') where id=(p_data->>'id')::uuid;
  return jsonb_build_object('ok',true);
 end if;
 org:=(p_data->>'organisation_id')::uuid;
 own_parent:=p_action='parent_referral';
 if own_parent then
  select id into org from public.star_organisations where referral_code=(p_data->>'code')::uuid and active;
  if org is null then raise exception 'This referral link is unavailable.'; end if;
 elsif not star_private.org_member(org) then raise exception 'Active organisation access required.'; end if;
 if p_action='organisation' then
  return jsonb_build_object('players',coalesce((select jsonb_agg(jsonb_build_object('link_id',l.id,'name',p.first_name||' '||p.last_name,
    'goals',coalesce((select jsonb_agg(jsonb_build_object('goal',g.goal,'status',g.status)) from public.coaching_development_goals g where g.player_id=l.player_id and g.status='working_on'),'[]'),
    'attendance',coalesce((select jsonb_agg(jsonb_build_object('date',s.starts_at,'title',s.title,'status',a.status) order by s.starts_at desc) from public.training_attendance a join public.training_sessions s on s.id=a.session_id where a.player_id=l.player_id and s.starts_at>=now()-interval '90 days' and s.starts_at<=now()),'[]'),
    'updates',coalesce((select jsonb_agg(to_jsonb(u)-'published_by' order by u.created_at desc) from public.star_organisation_updates u where u.link_id=l.id),'[]')) order by p.first_name)
   from public.star_organisation_players l join public.coaching_players p on p.id=l.player_id where l.organisation_id=org and star_private.org_link_active(l.id)),'[]'),
   'referrals',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_referrals r where organisation_id=org),'[]'),
   'requests',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc) from public.star_organisation_requests r where organisation_id=org),'[]'),
   'observations',coalesce((select jsonb_agg(to_jsonb(r)-'submitted_by' order by r.created_at desc) from public.star_organisation_observations r join public.star_organisation_players l on l.id=r.link_id where l.organisation_id=org and star_private.org_link_active(l.id)),'[]'));
 elsif p_action in ('referral','parent_referral') then
  if p_data->>'permission' is distinct from 'true' then raise exception 'Parent permission must be confirmed.'; end if;
  insert into public.star_organisation_referrals(organisation_id,submitted_by,guardian_id,player_name,age_band,guardian_name,guardian_email,reason,permission_confirmed)
  values(org,uid,case when own_parent then uid else null end,trim(p_data->>'player_name'),p_data->>'age_band',trim(p_data->>'guardian_name'),case when own_parent then verified_email else lower(trim(p_data->>'guardian_email')) end,trim(p_data->>'reason'),true) returning id into rec;
  return jsonb_build_object('id',rec);
 elsif p_action='request' then
  text_value:=p_data->>'service';
  if not exists(select 1 from public.star_organisations where id=org and ((kind='school' and text_value in ('school_taster','school_club','player_observation','bespoke')) or (kind='club' and text_value in ('team_coaching','player_observation','bespoke')))) then raise exception 'Choose a service for your organisation.'; end if;
  insert into public.star_organisation_requests(organisation_id,submitted_by,service,details,preferred_dates,venue) values(org,uid,text_value,trim(p_data->>'details'),trim(p_data->>'preferred_dates'),trim(p_data->>'venue'));
  return jsonb_build_object('ok',true);
 elsif p_action='observation' then
  link:=(p_data->>'link_id')::uuid;
  if not exists(select 1 from public.star_organisation_players where id=link and organisation_id=org) or not star_private.org_link_active(link) then raise exception 'Current parent sharing permission is required.'; end if;
  insert into public.star_organisation_observations(link_id,submitted_by,observation) values(link,uid,trim(p_data->>'observation'));
  return jsonb_build_object('ok',true);
 else raise exception 'Unknown portal action.';
 end if;
end $$;
revoke all on function star_private.organisation_portal(text,jsonb) from public,anon;
grant execute on function star_private.organisation_portal(text,jsonb) to authenticated;
create function public.star_organisation_portal(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$ select star_private.organisation_portal(p_action,p_data) $$;
revoke all on function public.star_organisation_portal(text,jsonb) from public,anon;
grant execute on function public.star_organisation_portal(text,jsonb) to authenticated;

do $$ declare t text; begin
 foreach t in array array['star_organisations','star_organisation_members','star_organisation_players','star_organisation_referrals','star_organisation_requests','star_organisation_observations','star_organisation_updates','star_organisation_consent_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy management_read on public.%I for select to authenticated using ((select star_private.is_staff_manager()))',t);
 end loop;
end $$;
