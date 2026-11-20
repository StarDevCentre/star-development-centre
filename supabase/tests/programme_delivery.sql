-- Disposable fixtures only. Exercise the same public functions called by the portals.
begin;
do $$
declare
  manager uuid:=gen_random_uuid(); coach uuid:=gen_random_uuid(); guardian uuid:=gen_random_uuid(); other uuid:=gen_random_uuid();
  player uuid:=gen_random_uuid(); ad_hoc uuid:=gen_random_uuid(); other_player uuid:=gen_random_uuid();
  plan uuid:=gen_random_uuid(); block uuid:=gen_random_uuid(); prestige uuid:=gen_random_uuid(); failed_block uuid:=gen_random_uuid();
  first_session uuid; family_booking uuid; sid uuid; family_id uuid; practice uuid; historic uuid; intake uuid;
  monday date:=(date_trunc('week',now() at time zone 'Europe/London')+interval '14 days')::date;
  weeks text[]; adjusted text[]; more_weeks text[]; schedule_before jsonb; old_start timestamptz; new_start timestamptz;
  start_time timestamptz; results jsonb; pack jsonb; idx integer;
begin
  insert into auth.users(id,email,email_confirmed_at,is_anonymous)
    select id,id::text||'@example.invalid',now(),false from unnest(array[manager,coach,guardian,other]) id;
  perform set_config('request.jwt.claim.sub',manager::text,true);
  insert into public.staff_members(user_id,role,active) values(manager,'owner',true),(coach,'coach',true);
  insert into star_private.member_pack_team values(coach);
  insert into public.guardian_profiles(user_id,display_name) values(guardian,'Fixture family'),(other,'Different family');
  insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
    values(player,'Fixture','Programme','1-to-1',true,manager,manager),(ad_hoc,'Fixture','Ad hoc','1-to-1',true,manager,manager),
      (other_player,'Different','Player','Prestige',true,manager,manager);
  insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(guardian,player,manager),(guardian,ad_hoc,manager),(other,other_player,manager);
  insert into public.coaching_assignments(player_id,staff_user_id) values(player,coach);
  insert into public.staff_session_plans(id,created_by,title,plan) values(plan,manager,'Programme fixture','{"target":60,"activities":[]}');
  select array_agg((monday+7*n)::text||'T12:00' order by n) into weeks from generate_series(0,15) n;
  select array_agg((monday+7*n+1)::text||'T15:00' order by n) into more_weeks from generate_series(0,23) n;
  assert (select count(*) from public.star_preview_programme_block(player,coach,'Flyers',weeks) where issue is null)=16;
  adjusted:=weeks; adjusted[4]:=weeks[3];
  assert exists(select 1 from public.star_preview_programme_block(player,coach,'Flyers',adjusted) where week=4 and issue is not null);
  begin
    perform public.star_book_programme_block(failed_block,player,coach,'Flyers','Test ground',adjusted,plan);
    raise exception 'Fixture accepted a colliding week' using errcode='ZX001';
  exception when raise_exception then null; end;
  assert not exists(select 1 from star_private.player_programme_blocks where id=failed_block);
  assert not exists(select 1 from public.training_sessions where title='STAR Flyers · week 1 of 16');
  weeks[4]:=(monday+22)::text||'T12:00';
  first_session:=public.star_book_programme_block(block,player,coach,'Flyers','Test ground',weeks,plan);
  assert public.star_book_programme_block(block,player,coach,'Flyers','Test ground',weeks,plan)=first_session;
  assert (select count(*) from star_private.programme_weeks where block_id=block)=16;
  assert (select count(*) from star_private.programme_weeks w join public.training_session_participants r on r.session_id=w.session_id
    join public.family_session_schedule f on f.source_session_id=w.session_id and f.player_id=r.player_id
    join public.training_sessions s on s.id=w.session_id where w.block_id=block and r.player_id=player
       and s.ends_at-s.starts_at=interval '60 minutes' and (s.starts_at at time zone 'Europe/London')::time=time '12:00')=16;
  assert (select count(*) from star_private.programme_weeks w join public.staff_session_plan_links l on l.training_session_id=w.session_id
    where w.block_id=block and l.created_by=coach)=16;
  assert (select count(*) from public.parent_notifications where user_id=guardian and category='session')=1,'One new block alert per family';
  assert (select count(*) from public.star_preview_programme_block(player,coach,'Flyers',weeks) where issue is not null)=16;
  perform public.star_book_programme_block(prestige,other_player,manager,'Prestige','Second ground',more_weeks,null);
  assert (select count(*) from star_private.programme_weeks w join public.training_sessions s on s.id=w.session_id
    where w.block_id=prestige and s.ends_at-s.starts_at=interval '90 minutes')=24;
  select f.id,f.starts_at into family_booking,old_start from public.family_session_schedule f where f.source_session_id=first_session;
  select jsonb_agg(to_jsonb(f) order by f.id) into schedule_before from public.family_session_schedule f where f.player_id=player and f.id<>family_booking;
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  assert family_booking=any(public.star_movable_player_bookings(player));
  assert cardinality(public.star_movable_player_bookings(other_player))=0;
  select s.starts_at into new_start from public.star_player_move_slots(family_booking,monday+2) s order by s.starts_at limit 1;
  assert new_start is not null and public.star_move_player_booking(family_booking,old_start,new_start)=new_start;
  assert (select jsonb_agg(to_jsonb(f) order by f.id) from public.family_session_schedule f where f.player_id=player and f.id<>family_booking)=schedule_before;
  assert public.star_member_pack_queue() is null and public.star_family_member_pack(other_player) is null;
  assert public.star_family_member_pack(player)->>'status'='due';
  assert public.star_family_member_pack(ad_hoc) is null;

  perform set_config('request.jwt.claim.sub',manager::text,true);
  insert into public.player_intakes(id,creator_id,guardian_id,portal_player_id,first_name,last_name,date_of_birth,details)
    values(gen_random_uuid(),guardian,guardian,player,'Fixture','Programme','2014-04-01','{"learning":"Show me a demo","settling_in":"Give me a minute","medical":"excluded-fixture","training_top_size":"Need help with sizing"}') returning id into intake;
  insert into public.player_session_preparation(session_id,player_id,help_request,updated_by) values(family_booking,player,'Please practise turns',guardian);
  assert not exists(select 1 from public.star_session_player_cues(first_session) where learning is not null);
  update public.player_intakes set completed_at=now(),guardian_reviewed_at=now() where id=intake;
  select to_jsonb(c) into results from public.star_session_player_cues(first_session) c;
  assert results->>'learning'='Show me a demo' and results->>'help_request'='Please practise turns' and (results->>'current_request')::boolean;
  assert results::text not like '%excluded-fixture%';
  select session_id into sid from star_private.programme_weeks where block_id=block and week=3;
  assert exists(select 1 from public.star_session_player_cues(sid) where help_request='Please practise turns' and not current_request);
  select to_jsonb(t) into pack from star_private.pack_tasks(player) t;
  assert pack->>'reason'='Flyers' and pack->>'shirt_size' is null;
  begin
    perform public.star_manage_member_pack(player,0,'ready',coach,'Need help with sizing');
    raise exception 'Sizing was bypassed' using errcode='ZX001';
  exception when raise_exception then null; end;
  update public.player_intakes set details=jsonb_set(details,'{training_top_size}','"Youth L"') where id=intake;
  assert (select shirt_size from star_private.pack_tasks(player))='Youth L';
  assert public.star_manage_member_pack(player,0,'due',coach,'Youth L')=1;
  begin
    perform public.star_manage_member_pack(player,0,'ready',coach,'Youth L');
    raise exception 'Stale edit overwritten' using errcode='ZX001';
  exception when raise_exception then null; end;
  perform set_config('request.jwt.claim.sub',coach::text,true);
  assert public.star_manage_member_pack(player,1,'ready',coach,'Youth L')=2;
  assert public.star_manage_member_pack(player,1,'ready',coach,'Youth L')=2;
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  pack:=public.star_family_member_pack(player);
  assert pack->>'status'='ready' and not (pack ?| array['owner_id','shirt_size','reason','player_name']);
  perform set_config('request.jwt.claim.sub',manager::text,true);
  assert public.star_manage_member_pack(player,2,'handed',coach,'Youth L')=3;

  for idx in 1..8 loop
    sid:=gen_random_uuid(); start_time:=now()-make_interval(days=>90+idx);
    insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
      values(sid,'Attendance fixture',case when idx=7 then 'Sparks' else '1-to-1' end,start_time,start_time+interval '1 hour','Test ground',manager);
    insert into public.training_session_participants(session_id,player_id,added_by) values(sid,ad_hoc,manager);
    if idx=8 then
      insert into star_private.booking_sessions(session_id,service_id,coach_id,capacity,enabled,created_by) values(sid,'one_to_one',manager,1,false,manager);
      update public.training_sessions set cancelled_at=now() where id=sid;
    end if;
    insert into public.training_attendance(session_id,player_id,status,recorded_by) values(sid,ad_hoc,
      case when idx=4 then 'late' when idx=5 then 'absent' when idx=6 then 'excused' else 'present' end,manager);
  end loop;
  assert not exists(select 1 from star_private.pack_tasks(ad_hoc));
  assert (select count(*) from public.star_player_session_records(ad_hoc))=7;
  sid:=gen_random_uuid(); start_time:=now()-interval '110 days';
  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
    values(sid,'Fifth attended individual session','1-to-1',start_time,start_time+interval '1 hour','Test ground',manager);
  insert into public.training_session_participants(session_id,player_id,added_by) values(sid,ad_hoc,manager);
  insert into public.training_attendance(session_id,player_id,status,recorded_by) values(sid,ad_hoc,'present',manager);
  assert (select count(*) from star_private.pack_tasks(ad_hoc) where status='due')=1;
  update public.training_attendance set status='excused' where session_id=sid and player_id=ad_hoc;
  assert not exists(select 1 from star_private.pack_tasks(ad_hoc)),'Correction before fulfillment removes the due task';

  historic:=gen_random_uuid();
  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
    values(historic,'Retrospective fixture','Other','2024-07-08 14:00Z','2024-07-08 15:00Z','Test ground',manager);
  insert into public.coaching_observations(player_id,session_id,stage,category,observation,recorded_by,recorded_at)
    values(player,historic,'Observe','Technical','Recorded much later',manager,'2025-01-29'),
      (player,null,'Observe','Technical','Start of July UK time',manager,'2024-06-30 23:00Z'),
      (player,null,'Observe','Technical','Start of August UK time',manager,'2024-07-31 23:00Z'),
      (other_player,null,'Observe','Technical','Different player',manager,'2024-07-15');
  insert into public.coaching_observations(player_id,stage,category,observation,recorded_by,recorded_at)
    select player,'Observe','Technical','Later observation',manager,'2025-01-01'::timestamptz+n*interval '1 minute' from generate_series(1,210) n;
  insert into public.player_training_assignments(player_id,title,instructions,created_by) values(player,'Practice fixture','Practise turns',manager) returning id into practice;
  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection)
    select practice,guardian,'2025-01-01'::date+n,10,'Later practice' from generate_series(1,85) n;
  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection)
    values(practice,guardian,'2024-07-10',10,'July practice');
  results:=public.star_monthly_evidence(player,'2024-07-01');
  assert jsonb_array_length(results->'observations')=2 and jsonb_array_length(results->'reflections')=1;
  assert results::text like '%Recorded much later%' and results::text not like '%Different player%';
  assert jsonb_array_length(public.star_monthly_evidence(player,'2025-01-01')->'observations')=210;
  perform set_config('request.jwt.claim.sub',other::text,true);
  assert not exists(select 1 from public.star_player_session_records(player));
  assert not exists(select 1 from public.star_session_player_cues(first_session));
  assert public.star_family_member_pack(player) is null;
  assert not has_function_privilege('anon','public.star_manage_member_pack(uuid,integer,text,uuid,text)','EXECUTE');
  assert not has_function_privilege('authenticated','star_private.pack_tasks(uuid)','EXECUTE');
end $$;
rollback;
