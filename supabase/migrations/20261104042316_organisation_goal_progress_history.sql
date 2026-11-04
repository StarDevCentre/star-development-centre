create or replace function star_private.organisation_development(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();org uuid:=(p_data->>'organisation_id')::uuid;manager boolean;lid uuid;gid uuid;target uuid;item star_private.org_goal_suggestions;state text;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Sign in with a verified account.';end if;
 manager:=star_private.is_staff_manager();
 if not exists(select 1 from public.star_organisations where id=org and active) or not (manager or star_private.org_member(org)) then raise exception 'Current organisation access required.';end if;
 if p_action='workspace' then
  return jsonb_build_object(
   'groups',coalesce((select jsonb_agg(to_jsonb(g) order by g.name) from star_private.org_groups g where g.organisation_id=org and g.active),'[]'),
   'memberships',coalesce((select jsonb_agg(jsonb_build_object('group_id',m.group_id,'link_id',m.link_id)) from star_private.org_group_players m join star_private.org_groups g on g.id=m.group_id join public.star_organisation_players l on l.id=m.link_id where g.organisation_id=org and l.organisation_id=org and g.active and star_private.org_link_active(l.id)),'[]'),
   'players',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'name',p.first_name||' '||p.last_name,'goals',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'goal',d.goal,'status',d.status)) from public.coaching_development_goals d where d.player_id=l.player_id and (d.status='working_on' or exists(select 1 from star_private.org_goal_progress h where h.link_id=l.id and h.idp_goal_id=d.id))),'[]')) order by p.first_name,p.last_name) from public.star_organisation_players l join public.coaching_players p on p.id=l.player_id where l.organisation_id=org and star_private.org_link_active(l.id)),'[]'),
   'suggestions',coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at desc) from star_private.org_goal_suggestions s join public.star_organisation_players l on l.id=s.link_id where l.organisation_id=org and star_private.org_link_active(l.id)),'[]'),
   'progress',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from star_private.org_goal_progress n join public.star_organisation_players l on l.id=n.link_id where l.organisation_id=org and star_private.org_link_active(l.id)),'[]'));
 elsif p_action='create_group' then
  insert into star_private.org_groups(organisation_id,name,kind,created_by) values(org,trim(p_data->>'name'),p_data->>'kind',uid);
 elsif p_action in ('rename_group','archive_group','membership') then
  gid:=(p_data->>'group_id')::uuid;
  perform 1 from star_private.org_groups where id=gid and organisation_id=org and active for update;
  if not found then raise exception 'This group is unavailable.';end if;
  if p_action='rename_group' then update star_private.org_groups set name=trim(p_data->>'name') where id=gid;
  elsif p_action='archive_group' then update star_private.org_groups set active=false where id=gid;
  else
   lid:=(p_data->>'link_id')::uuid;
   perform 1 from public.star_organisation_players where id=lid and organisation_id=org for update;
   if not found or not star_private.org_link_active(lid) then raise exception 'Current parent sharing permission required.';end if;
   if (p_data->>'assigned')::boolean then insert into star_private.org_group_players values(gid,lid) on conflict do nothing;
   else delete from star_private.org_group_players where group_id=gid and link_id=lid;end if;
  end if;
 elsif p_action in ('suggest_goal','review_goal','progress') then
  lid:=(p_data->>'link_id')::uuid;
  perform 1 from public.star_organisation_players where id=lid and organisation_id=org for update;
  if not found or not star_private.org_link_active(lid) then raise exception 'Current parent sharing permission required.';end if;
  if p_action='suggest_goal' then insert into star_private.org_goal_suggestions(link_id,goal,submitted_by) values(lid,trim(p_data->>'goal'),uid);
  elsif p_action='review_goal' then
   if not manager then raise exception 'STAR management approval required.';end if;
   select * into item from star_private.org_goal_suggestions where id=(p_data->>'goal_id')::uuid and link_id=lid for update;
   if not found or item.revision is distinct from (p_data->>'revision')::bigint then raise exception 'This goal changed. Refresh before reviewing.';end if;
   state:=p_data->>'status';
   if not ((item.status='pending' and state in ('approved','declined')) or (item.status='approved' and state='completed')) then raise exception 'Choose a valid goal decision.';end if;
   update star_private.org_goal_suggestions set status=state,response=coalesce(trim(p_data->>'response'),''),reviewed_by=uid,revision=revision+1,updated_at=clock_timestamp() where id=item.id;
  else
   if p_data->>'goal_id' is not null then
    target:=(p_data->>'goal_id')::uuid;
    if not exists(select 1 from star_private.org_goal_suggestions where id=target and link_id=lid and status='approved') then raise exception 'Choose an approved goal for this player.';end if;
    insert into star_private.org_goal_progress(link_id,goal_id,note,submitted_by) values(lid,target,trim(p_data->>'note'),uid);
   else
    target:=(p_data->>'idp_goal_id')::uuid;
    if not exists(select 1 from public.coaching_development_goals d join public.star_organisation_players l on l.player_id=d.player_id where l.id=lid and d.id=target and d.status='working_on') then raise exception 'Choose a current shared STAR goal for this player.';end if;
    insert into star_private.org_goal_progress(link_id,idp_goal_id,note,submitted_by) values(lid,target,trim(p_data->>'note'),uid);
   end if;
  end if;
 else raise exception 'Unknown development action.';end if;
 return jsonb_build_object('ok',true);
end $$;
