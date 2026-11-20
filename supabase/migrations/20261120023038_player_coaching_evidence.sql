create function public.star_player_session_records(p_player uuid)
returns table(id uuid,title text,programme text,starts_at timestamptz,ends_at timestamptz,venue text,attendance_status text)
language sql stable security invoker set search_path='' as $$
  select s.id,s.title,s.programme,s.starts_at,s.ends_at,s.venue,a.status
  from public.training_session_participants r
  join public.training_sessions s on s.id=r.session_id
  left join public.training_attendance a on a.session_id=r.session_id and a.player_id=r.player_id
  where r.player_id=p_player and s.cancelled_at is null and star_private.can_coach_player(p_player)
$$;

create function public.star_monthly_evidence(p_player uuid,p_month date) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare
  first_day date:=date_trunc('month',p_month::timestamp)::date;
  next_month date:=(first_day+interval '1 month')::date;
  starts timestamptz:=first_day::timestamp at time zone 'Europe/London';
  ends timestamptz:=next_month::timestamp at time zone 'Europe/London';
begin
  if not star_private.can_coach_player(p_player) then raise exception 'Coaching access required.' using errcode='42501'; end if;
  return jsonb_build_object(
    'observations',coalesce((
      select jsonb_agg(jsonb_build_object('id',o.id,'category',o.category,'observation',o.observation,
        'next_action',o.next_action,'recorded_at',o.recorded_at,'training_sessions',jsonb_build_object('starts_at',s.starts_at))
        order by coalesce(s.starts_at,o.recorded_at) desc,o.id)
      from public.coaching_observations o left join public.training_sessions s on s.id=o.session_id
      where o.player_id=p_player and coalesce(s.starts_at,o.recorded_at)>=starts and coalesce(s.starts_at,o.recorded_at)<ends
    ),'[]'::jsonb),
    'reflections',coalesce((
      select jsonb_agg(jsonb_build_object('id',d.id,'practice_date',d.practice_date,'reflection',d.reflection,
        'player_training_assignments',jsonb_build_object('title',a.title)) order by d.practice_date desc,d.id)
      from public.player_training_assignments a join public.player_training_diary d on d.assignment_id=a.id
      where a.player_id=p_player and d.practice_date>=first_day and d.practice_date<next_month
    ),'[]'::jsonb)
  );
end $$;

-- Coaching staff receive only the reviewed coaching cues for the actual register.
create function star_private.session_player_cues(p_session uuid)
returns table(player_id uuid,learning text,settling_in text,help_request text,help_session_at timestamptz,current_request boolean)
language sql stable security definer set search_path='' as $$
  select r.player_id,i.details->>'learning',i.details->>'settling_in',h.help_request,h.starts_at,h.source_session_id=p_session
  from public.training_session_participants r
  join public.training_sessions s on s.id=r.session_id
  left join public.player_intakes i on i.portal_player_id=r.player_id and i.completed_at is not null and i.guardian_reviewed_at is not null
  left join lateral (
    select q.help_request,f.starts_at,f.source_session_id
    from public.player_session_preparation q join public.family_session_schedule f on f.id=q.session_id and f.player_id=q.player_id
    where q.player_id=r.player_id and btrim(q.help_request)<>'' and (f.source_session_id=s.id or f.starts_at<s.starts_at)
    order by (f.source_session_id=s.id) desc nulls last,q.updated_at desc,q.session_id limit 1
  ) h on true
  where r.session_id=p_session and s.cancelled_at is null and star_private.can_coach_player(r.player_id)
$$;
create function public.star_session_player_cues(p_session uuid)
returns table(player_id uuid,learning text,settling_in text,help_request text,help_session_at timestamptz,current_request boolean)
language sql stable security invoker set search_path='' as $$ select * from star_private.session_player_cues(p_session) $$;
revoke all on function public.star_player_session_records(uuid), public.star_monthly_evidence(uuid,date),
  star_private.session_player_cues(uuid), public.star_session_player_cues(uuid) from public,anon;
grant execute on function public.star_player_session_records(uuid), public.star_monthly_evidence(uuid,date),
  star_private.session_player_cues(uuid), public.star_session_player_cues(uuid) to authenticated;
