begin;
create temp table space_test_ids as select gen_random_uuid() owner_id,gen_random_uuid() coach_id,gen_random_uuid() family_id,gen_random_uuid() other_id,gen_random_uuid() player_a,gen_random_uuid() player_b,gen_random_uuid() goal_a,gen_random_uuid() goal_b,gen_random_uuid() task_a,gen_random_uuid() task_b;
grant select on space_test_ids to authenticated;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from space_test_ids cross join lateral unnest(array[owner_id,coach_id,family_id,other_id]) id;
insert into public.staff_members(user_id,role,active) select owner_id,'owner',true from space_test_ids union all select coach_id,'coach',true from space_test_ids;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_a,'Space fixture','A','Other',true,owner_id,owner_id from space_test_ids union all select player_b,'Space fixture','B','Other',true,owner_id,owner_id from space_test_ids;
insert into public.coaching_assignments(player_id,staff_user_id) select player_a,coach_id from space_test_ids;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select family_id,player_a,owner_id from space_test_ids;
insert into public.coaching_development_goals(id,player_id,goal,created_by) select goal_a,player_a,'Goal A',owner_id from space_test_ids union all select goal_b,player_b,'Goal B',owner_id from space_test_ids;
insert into public.player_training_assignments(id,player_id,goal_id,title,instructions,created_by) select task_a,player_a,goal_a,'Task A','Fixture instructions A',owner_id from space_test_ids union all select task_b,player_b,goal_b,'Task B','Fixture instructions B',owner_id from space_test_ids;
insert into public.player_space_profiles(player_id,shirt_name,updated_by) select player_b,'PLAYER B',other_id from space_test_ids;
insert into public.player_achievements(player_id,title,description,badge_id,awarded_by) select player_a,'First Steps','Fixture reward','first-steps-bronze',owner_id from space_test_ids union all select player_b,'First Steps','Fixture reward','first-steps-bronze',owner_id from space_test_ids;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',family_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 insert into public.player_space_profiles(player_id,updated_by,theme) select player_a,family_id,'stadium' from space_test_ids;
 if not exists(select 1 from public.player_space_profiles where player_id=(select player_a from space_test_ids) and theme='stadium') then raise exception 'Theme save/read failed'; end if;
 if not exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from space_test_ids) and cosmetic='avatar-captain') then raise exception 'First badge did not unlock Captain'; end if;
 begin
  update public.player_space_profiles set icon='comet' where player_id=(select player_a from space_test_ids);
  raise exception 'Locked avatar was accepted';
 exception when check_violation then null; end;
 begin
  update public.player_space_profiles set decoration='starburst' where player_id=(select player_a from space_test_ids);
  raise exception 'Locked decoration was accepted';
 exception when check_violation then null; end;
 begin
  insert into public.player_cosmetic_unlocks(player_id,cosmetic) select player_a,'avatar-comet' from space_test_ids;
  raise exception 'Family directly granted a reward';
 exception when insufficient_privilege then null; end;
 begin
  perform star_private.refresh_player_cosmetics(player_a) from space_test_ids;
  raise exception 'Private award helper callable by client';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_goal_events(player_id,source_id,source,kind,goal) select player_a,goal_a,'personal','achieved','Fabricated history' from space_test_ids;
  raise exception 'Client fabricated timeline history';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,confidence,enjoyment) select task_a,family_id,current_date,15,'Invalid rating fixture',6,4 from space_test_ids;
  raise exception 'Invalid confidence was accepted';
 exception when check_violation then null; end;
 insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,confidence,enjoyment) select task_a,family_id,(now() at time zone 'Europe/London')::date,15,'First rated practice',2,4 from space_test_ids;
 insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,confidence,enjoyment) select task_a,family_id,(now() at time zone 'Europe/London')::date-1,15,'Second rated practice',4,5 from space_test_ids;
 insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection) select task_a,family_id,(now() at time zone 'Europe/London')::date-2,0,'Unrated entry with no practice minutes' from space_test_ids;
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from space_test_ids) and cosmetic='avatar-comet') then raise exception 'Zero-minute day unlocked an avatar'; end if;
 insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,confidence,enjoyment) select task_a,family_id,(now() at time zone 'Europe/London')::date-2,10,'Third real practice day',5,4 from space_test_ids;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=(select player_a from space_test_ids) and cosmetic in ('avatar-comet','decoration-lightning'))<>2 then raise exception 'Three practice days did not unlock cosmetics'; end if;
 update public.player_space_profiles set icon='comet',decoration='lightning' where player_id=(select player_a from space_test_ids);
 if not exists(select 1 from public.player_training_diary where assignment_id=(select task_a from space_test_ids) and confidence=2 and enjoyment=4) then raise exception 'Ratings save/read failed'; end if;
 if not exists(select 1 from public.player_training_diary where assignment_id=(select task_a from space_test_ids) and confidence is null and enjoyment is null) then raise exception 'Optional unrated diary entry failed'; end if;
 insert into public.player_personal_goals(player_id,goal,created_by) select player_a,'A personal milestone',family_id from space_test_ids;
 update public.player_personal_goals set status='achieved' where player_id=(select player_a from space_test_ids);
 update public.player_personal_goals set status='active' where player_id=(select player_a from space_test_ids);
 if (select count(*) from public.player_goal_events where player_id=(select player_a from space_test_ids) and source='personal' and kind in ('set','achieved','reopened'))<>3 then raise exception 'Goal history was not preserved'; end if;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=(select player_a from space_test_ids) and cosmetic in ('avatar-shield','decoration-starburst'))<>2 then raise exception 'Goal cosmetics disappeared after reopening'; end if;
 update public.player_space_profiles set icon='shield',decoration='starburst' where player_id=(select player_a from space_test_ids);
 if exists(select 1 from public.player_goal_events where player_id=(select player_b from space_test_ids)) or exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_b from space_test_ids)) then raise exception 'Other player history or rewards exposed'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 if exists(select 1 from public.player_training_diary where assignment_id=(select task_a from space_test_ids)) then raise exception 'Unlinked user read ratings'; end if;
 if exists(select 1 from public.player_goal_events where player_id=(select player_a from space_test_ids)) or exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from space_test_ids)) then raise exception 'Unlinked user read progress'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 update public.player_training_assignments set coaching_points='Look up before the pass. Try both feet.' where id=(select task_a from space_test_ids);
 if not exists(select 1 from public.player_training_assignments where id=(select task_a from space_test_ids) and coaching_points is not null) then raise exception 'Coach key-point save failed'; end if;
 begin
  update public.player_training_assignments set coaching_points=repeat('x',1501) where id=(select task_a from space_test_ids);
  raise exception 'Oversized coaching points accepted';
 exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 update public.coaching_development_goals set status='achieved' where id=(select goal_a from space_test_ids);
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',family_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 if not exists(select 1 from public.player_goal_events where player_id=(select player_a from space_test_ids) and source='coach' and kind='achieved') then raise exception 'Coach goal completion did not reach family timeline'; end if;
end $$;
reset role;
select 'PASS: optional ratings, rating validation and isolation, written coaching points, theme persistence, real milestone unlocks, locked choice enforcement, permanent rewards, immutable goal timeline and private helper access' as result;
rollback;
