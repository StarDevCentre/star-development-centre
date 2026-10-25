-- Run against a database with the badge migration applied.
-- Every fixture is created inside a transaction and rolled back; no real awards are changed.
begin;

-- All fixtures and schema changes in this validation run are rolled back.
create temp table badge_test_ids as select gen_random_uuid() as owner_id, gen_random_uuid() as coach_id, gen_random_uuid() as family_id, gen_random_uuid() as other_id, gen_random_uuid() as inactive_id, gen_random_uuid() as player_a, gen_random_uuid() as player_b;
grant select on badge_test_ids to authenticated;
insert into auth.users (id,aud,role) select id,'authenticated','authenticated' from badge_test_ids cross join lateral unnest(array[owner_id,coach_id,family_id,other_id,inactive_id]) id;
insert into public.staff_members (user_id,role,active) select owner_id,'owner',true from badge_test_ids union all select coach_id,'coach',true from badge_test_ids union all select inactive_id,'coach',false from badge_test_ids;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_a,'Badge test','A','Other',true,owner_id,owner_id from badge_test_ids union all select player_b,'Badge test','B','Other',true,owner_id,owner_id from badge_test_ids;
insert into public.coaching_assignments(player_id,staff_user_id) select player_a,coach_id from badge_test_ids union all select player_a,inactive_id from badge_test_ids;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select family_id,player_a,owner_id from badge_test_ids;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from badge_test_ids;
insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'First Steps','Validation fixture',owner_id,'first-steps-bronze' from badge_test_ids union all select player_b,'First Steps','Validation fixture',owner_id,'first-steps-bronze' from badge_test_ids;
do $$ begin
 if (select count(*) from public.achievement_badges) <> 72 then raise exception 'Catalogue count incorrect'; end if;
 if (select count(*) from public.player_achievements where player_id in (select player_a from badge_test_ids union select player_b from badge_test_ids)) <> 2 then raise exception 'Owner access failed'; end if;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'First Steps','Duplicate fixture',owner_id,'first-steps-bronze' from badge_test_ids;
  raise exception 'Duplicate award was accepted';
 exception when unique_violation then null; end;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'Invalid badge','Invalid fixture',owner_id,'missing-badge' from badge_test_ids;
  raise exception 'Unknown badge was accepted';
 exception when foreign_key_violation then null; end;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true) from badge_test_ids;
do $$ begin
 if (select count(*) from public.player_achievements where player_id in (select player_a from badge_test_ids union select player_b from badge_test_ids)) <> 1 then raise exception 'Coach read scope failed'; end if;
 insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'Eyes Up','Assigned coach fixture',coach_id,'eyes-up-bronze' from badge_test_ids;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_b,'Eyes Up','Unassigned fixture',coach_id,'eyes-up-bronze' from badge_test_ids;
  raise exception 'Unassigned coach award was accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'Safe Hands','Spoofed issuer fixture',owner_id,'safe-hands-bronze' from badge_test_ids;
  raise exception 'Spoofed issuer was accepted';
 exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',family_id,'role','authenticated')::text,true) from badge_test_ids;
do $$ begin
 if (select count(*) from public.player_achievements where player_id in (select player_a from badge_test_ids union select player_b from badge_test_ids)) <> 2 then raise exception 'Family read leaked or hid a player'; end if;
 if exists(select 1 from public.player_achievements where player_id=(select player_b from badge_test_ids)) then raise exception 'Family could read unrelated player'; end if;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'Safe Hands','Family award fixture',family_id,'safe-hands-bronze' from badge_test_ids;
  raise exception 'Family could award a badge';
 exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) from badge_test_ids;
do $$ begin
 if exists(select 1 from public.player_achievements where player_id in (select player_a from badge_test_ids union select player_b from badge_test_ids)) then raise exception 'Unlinked user access failed'; end if;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',inactive_id,'role','authenticated')::text,true) from badge_test_ids;
do $$ begin
 if exists(select 1 from public.player_achievements where player_id in (select player_a from badge_test_ids union select player_b from badge_test_ids)) then raise exception 'Inactive coach read access failed'; end if;
 begin
  insert into public.player_achievements(player_id,title,description,awarded_by,badge_id) select player_a,'Safe Hands','Inactive award fixture',inactive_id,'safe-hands-bronze' from badge_test_ids;
  raise exception 'Inactive coach could award a badge';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: catalogue, owner award, assigned coach award, duplicate prevention, valid badges, issuer identity, family isolation, family read-only, unlinked user and inactive coach' as result;
rollback;
