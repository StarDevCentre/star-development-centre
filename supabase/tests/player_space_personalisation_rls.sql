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
 if (select count(*) from public.player_training_assignments where id in (select task_a from space_test_ids union select task_b from space_test_ids)) <> 1 then raise exception 'Family assignment isolation failed'; end if;
 if (select count(*) from public.coaching_development_goals where id in (select goal_a from space_test_ids union select goal_b from space_test_ids)) <> 1 then raise exception 'Family goal isolation failed'; end if;
 insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection) select task_a,family_id,(now() at time zone 'Europe/London')::date,15,'I kept my first touch close.' from space_test_ids;
 if (select count(*) from public.player_training_diary where assignment_id=(select task_a from space_test_ids)) <> 1 then raise exception 'Diary read after save failed'; end if;
 begin
  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection) select task_b,family_id,current_date,15,'Unlinked task fixture' from space_test_ids;
  raise exception 'Unlinked diary write accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection) select task_a,other_id,current_date,15,'Spoofed guardian fixture' from space_test_ids;
  raise exception 'Spoofed diary writer accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 if exists(select 1 from public.player_training_assignments where id in (select task_a from space_test_ids union select task_b from space_test_ids)) then raise exception 'Unlinked user read assignments'; end if;
 if exists(select 1 from public.player_training_diary where assignment_id=(select task_a from space_test_ids)) then raise exception 'Unlinked user read diary'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 if (select count(*) from public.coaching_development_goals where id in (select goal_a from space_test_ids union select goal_b from space_test_ids)) <> 1 then raise exception 'Assigned coach goal read scope failed'; end if;
 begin
  insert into public.coaching_development_goals(player_id,goal,created_by) select player_b,'Unassigned fixture',coach_id from space_test_ids;
  raise exception 'Unassigned coach wrote goal';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 begin
  insert into public.player_training_assignments(player_id,goal_id,title,instructions,created_by) select player_a,goal_b,'Mismatch fixture','A goal belonging to a different player',owner_id from space_test_ids;
  raise exception 'Mismatched player goal accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',family_id,'role','authenticated')::text,true) from space_test_ids;
do $$ declare allowed boolean; expression text; path_a text; path_b text; begin
 insert into public.player_space_profiles(player_id,shirt_name,shirt_number,ambition,updated_by) select player_a,'ACE',7,'Play with confidence',family_id from space_test_ids;
 update public.player_space_profiles set cabinet_lights=false where player_id=(select player_a from space_test_ids);
 if not exists(select 1 from public.player_space_profiles where player_id=(select player_a from space_test_ids) and shirt_number=7 and not cabinet_lights) then raise exception 'Profile save/read failed'; end if;
 if exists(select 1 from public.player_space_profiles where player_id=(select player_b from space_test_ids)) then raise exception 'Another player profile was exposed'; end if;
 begin
  insert into public.player_space_profiles(player_id,updated_by) select player_b,family_id from space_test_ids;
  raise exception 'Unlinked profile write accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.player_space_profiles set player_id=(select player_b from space_test_ids) where player_id=(select player_a from space_test_ids);
  raise exception 'Profile reassignment accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.player_space_profiles set photo_path=(select player_b::text||'/'||gen_random_uuid()::text||'.jpg' from space_test_ids) where player_id=(select player_a from space_test_ids);
  raise exception 'Different player photo path accepted';
 exception when check_violation then null; end;
 insert into public.player_personal_goals(player_id,goal,created_by) select player_a,'Try my weaker foot',family_id from space_test_ids;
 update public.player_personal_goals set status='achieved' where player_id=(select player_a from space_test_ids);
 if not exists(select 1 from public.player_personal_goals where player_id=(select player_a from space_test_ids) and status='achieved') then raise exception 'Personal goal update failed'; end if;
 begin
  insert into public.player_personal_goals(player_id,goal,created_by) select player_b,'Unlinked goal',family_id from space_test_ids;
  raise exception 'Unlinked personal goal accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_personal_goals(player_id,goal,created_by) select player_a,'Spoofed author',other_id from space_test_ids;
  raise exception 'Spoofed personal goal author accepted';
 exception when insufficient_privilege then null; end;
 insert into public.player_award_receipts(guardian_id,achievement_id) select t.family_id,a.id from space_test_ids t join public.player_achievements a on a.player_id=t.player_a;
 if (select count(*) from public.player_award_receipts where guardian_id=(select family_id from space_test_ids))<>1 then raise exception 'Award receipt save/read failed'; end if;
 -- Use the existing other player's award ID via a temporary fixture lookup, not a row hidden by RLS.
 begin
  insert into public.player_award_receipts(guardian_id,achievement_id) select (select other_id from space_test_ids),achievement_id from public.player_award_receipts where guardian_id=(select family_id from space_test_ids);
  raise exception 'Spoofed reward recipient accepted';
 exception when insufficient_privilege then null; end;
 -- Evaluate the installed storage policy against hypothetical paths, without writing storage metadata.
 select pg_get_expr(polwithcheck,polrelid) into expression from pg_policy where polname='player_photo_insert' and polrelid='storage.objects'::regclass;
 select player_a::text||'/'||gen_random_uuid()::text||'.jpg',player_b::text||'/'||gen_random_uuid()::text||'.jpg' into path_a,path_b from space_test_ids;
 execute format('select (%s) from (values ($1::text,$2::text)) objects(bucket_id,name)',expression) into allowed using 'player-card-photos',path_a;
 if allowed is distinct from true then raise exception 'Family photo upload policy rejected own folder'; end if;
 execute format('select (%s) from (values ($1::text,$2::text)) objects(bucket_id,name)',expression) into allowed using 'player-card-photos',path_b;
 if allowed is distinct from false then raise exception 'Family photo upload policy allowed other folder'; end if;
 execute format('select (%s) from (values ($1::text,$2::text)) objects(bucket_id,name)',expression) into allowed using 'player-card-photos',replace(path_a,'.jpg','.svg');
 if allowed is distinct from false then raise exception 'Photo upload accepted non-JPEG path'; end if;
 select pg_get_expr(polqual,polrelid) into expression from pg_policy where polname='player_photo_read' and polrelid='storage.objects'::regclass;
 execute format('select (%s) from (values ($1::text,$2::text)) objects(bucket_id,name)',expression) into allowed using 'player-card-photos',path_b;
 if allowed is distinct from false then raise exception 'Photo read allowed other family folder'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from space_test_ids;
do $$ declare changed integer; begin
 insert into public.player_training_assignments(player_id,title,instructions,created_by,week_start,practice_day,suggested_minutes,equipment,is_optional) select player_a,'Weekly coach practice','Use a safe practice space',coach_id,date_trunc('week',current_date)::date,2,15,'Ball',false from space_test_ids;
 update public.player_training_assignments set is_optional=true where player_id=(select player_a from space_test_ids) and title='Weekly coach practice';
 if not exists(select 1 from public.player_training_assignments where player_id=(select player_a from space_test_ids) and title='Weekly coach practice' and is_optional) then raise exception 'Coach plan edit failed'; end if;
 begin
  insert into public.player_training_assignments(player_id,title,instructions,created_by) select player_b,'Unassigned plan','Must be denied',coach_id from space_test_ids;
  raise exception 'Coach assigned practice to unrelated player';
 exception when insufficient_privilege then null; end;
 begin
  update public.player_training_assignments set goal_id=(select goal_b from space_test_ids) where id=(select task_a from space_test_ids);
  raise exception 'Coach plan linked a different child goal';
 exception when insufficient_privilege then null; end;
 if not exists(select 1 from public.player_personal_goals where player_id=(select player_a from space_test_ids)) then raise exception 'Assigned coach cannot read personal goals'; end if;
 update public.player_personal_goals set goal='Coach overwrite' where player_id=(select player_a from space_test_ids);
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Coach overwrote player-owned goal'; end if;
 if exists(select 1 from public.player_space_profiles where player_id=(select player_a from space_test_ids)) then raise exception 'Coach read family-only profile'; end if;
 insert into public.player_training_feedback(diary_id,feedback,reviewed_by) select d.id,'Good practice fixture',t.coach_id from public.player_training_diary d join space_test_ids t on d.assignment_id=t.task_a;
 if not exists(select 1 from public.player_training_feedback f join public.player_training_diary d on d.id=f.diary_id where d.assignment_id=(select task_a from space_test_ids)) then raise exception 'Assigned coach feedback failed'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) from space_test_ids;
do $$ begin
 if exists(select 1 from public.player_personal_goals where player_id=(select player_a from space_test_ids)) then raise exception 'Other family read personal goals'; end if;
 if exists(select 1 from public.player_award_receipts where guardian_id=(select family_id from space_test_ids)) then raise exception 'Other family read reward receipts'; end if;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from storage.buckets where id='player-card-photos' and not public and file_size_limit=1048576 and allowed_mime_types=array['image/jpeg']) then raise exception 'Photo bucket is not private/restricted'; end if;
end $$;
select 'PASS: family profile and goal persistence, lighting, identity and child isolation, award receipts, private photo policy paths, coach weekly/optional plans and feedback, read-only player goals' as result;
rollback;
