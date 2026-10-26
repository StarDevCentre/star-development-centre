begin;
do $$ begin
 if has_function_privilege('anon','public.player_ball_progress(uuid)','EXECUTE') then raise exception 'Anonymous reward RPC executable';end if;
 if has_function_privilege('authenticated','star_private.refresh_player_ball_rewards(uuid)','EXECUTE') then raise exception 'Raw reward helper executable by clients';end if;
end $$;
create temp table ball_fixture as select gen_random_uuid() manager_id,gen_random_uuid() parent_id,gen_random_uuid() player_user_id,gen_random_uuid() other_id,gen_random_uuid() player_a,gen_random_uuid() player_b;
create temp table ball_sessions as select i,gen_random_uuid() id from generate_series(1,53) i;
grant select on ball_fixture,ball_sessions to authenticated;
grant select on ball_fixture to anon;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from ball_fixture cross join lateral unnest(array[manager_id,parent_id,player_user_id,other_id]) id;
insert into public.staff_members(user_id,role,active) select manager_id,'owner',true from ball_fixture;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_a,'Ball fixture','A','Other',true,manager_id,manager_id from ball_fixture union all select player_b,'Ball fixture','B','Other',true,manager_id,manager_id from ball_fixture;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select parent_id,player_a,manager_id from ball_fixture union all select other_id,player_b,manager_id from ball_fixture;
insert into public.player_account_links(user_id,player_id,approved_by) select player_user_id,player_a,parent_id from ball_fixture;
insert into public.training_sessions(id,title,programme,venue,created_by,starts_at,ends_at)
 select s.id,'Ball fixture '||s.i,'Other','Fixture pitch',t.manager_id,case when i=51 then now()+interval '1 hour' else now()-i*interval '1 day'-interval '1 hour' end,case when i=51 then now()+interval '2 hours' else now()-i*interval '1 day' end from ball_sessions s cross join ball_fixture t;
insert into public.training_attendance(session_id,player_id,status,recorded_by)
 select s.id,t.player_a,case when i=52 then 'absent' when i=53 then 'excused' else 'present' end,t.manager_id from ball_sessions s cross join ball_fixture t where i<=9 or i>=51;
insert into public.training_attendance(session_id,player_id,status,recorded_by)
 select s.id,t.player_b,'present',t.manager_id from ball_sessions s cross join ball_fixture t where i<=9 or i=51;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from ball_fixture;
insert into public.player_space_profiles(player_id,updated_by) select player_a,parent_id from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_a from ball_fixture))<>9 then raise exception 'Absent, excused or future attendance counted';end if;
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from ball_fixture) and cosmetic like 'ball-%') then raise exception 'Ball unlocked at nine sessions';end if;
 begin update public.player_space_profiles set hero_ball='nike-yellow-orange' where player_id=(select player_a from ball_fixture);raise exception 'Locked Nike accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set hero_ball='gold-90' where player_id=(select player_a from ball_fixture);raise exception 'Locked Gold accepted';exception when check_violation then null;end;
 begin insert into public.player_cosmetic_unlocks(player_id,cosmetic) select player_a,'ball-gold-50' from ball_fixture;raise exception 'Forged unlock accepted';exception when insufficient_privilege then null;end;
 begin insert into public.training_attendance(session_id,player_id,status,recorded_by) select s.id,t.player_a,'present',t.parent_id from ball_sessions s cross join ball_fixture t where i=10;raise exception 'Family fabricated attendance';exception when insufficient_privilege then null;end;
 begin perform public.player_ball_progress((select player_b from ball_fixture));raise exception 'Foreign attendance progress exposed';exception when insufficient_privilege then null;end;
 update public.player_space_profiles set hero_ball='adidas-womens' where player_id=(select player_a from ball_fixture);
 if not found then raise exception 'Free ball unavailable';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true) from ball_fixture;
insert into public.training_attendance(session_id,player_id,status,recorded_by) select s.id,t.player_a,'late',t.manager_id from ball_sessions s cross join ball_fixture t where i=10;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_a from ball_fixture))<>10 then raise exception 'Late session not counted';end if;
 if not exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from ball_fixture) and cosmetic='ball-nike-10') then raise exception 'Nike missing at ten';end if;
 update public.player_space_profiles set hero_ball='nike-yellow-orange' where player_id=(select player_a from ball_fixture);
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true) from ball_fixture;
insert into public.training_attendance(session_id,player_id,status,recorded_by) select s.id,t.player_a,'present',t.manager_id from ball_sessions s cross join ball_fixture t where i between 11 and 49;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_a from ball_fixture))<>49 then raise exception '49-session boundary incorrect';end if;
 begin update public.player_space_profiles set hero_ball='gold-90' where player_id=(select player_a from ball_fixture);raise exception 'Gold unlocked at forty-nine';exception when check_violation then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true) from ball_fixture;
insert into public.training_attendance(session_id,player_id,status,recorded_by) select s.id,t.player_a,'present',t.manager_id from ball_sessions s cross join ball_fixture t where i=50;
-- Re-marking one register row does not add a session.
update public.training_attendance set status='present',recorded_by=(select manager_id from ball_fixture) where player_id=(select player_a from ball_fixture) and session_id=(select id from ball_sessions where i=10);
select set_config('request.jwt.claims',jsonb_build_object('sub',player_user_id,'role','authenticated')::text,true) from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_a from ball_fixture))<>50 then raise exception 'Repeated register mark inflated count';end if;
 if not exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_a from ball_fixture) and cosmetic='ball-gold-50') then raise exception 'Gold missing at fifty';end if;
 update public.player_space_profiles set hero_ball='gold-90',updated_by=(select player_user_id from ball_fixture) where player_id=(select player_a from ball_fixture);
 if not found then raise exception 'Player could not choose earned ball';end if;
 begin update public.player_space_profiles set hero_ball='external-url' where player_id=(select player_a from ball_fixture);raise exception 'Invalid ball selector accepted';exception when check_violation then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true) from ball_fixture;
delete from public.training_attendance where player_id=(select player_a from ball_fixture) and session_id=(select id from ball_sessions where i=50);
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_a from ball_fixture))<>49 then raise exception 'Current count did not reflect corrected register';end if;
 update public.player_space_profiles set hero_ball='gold-90',updated_by=(select parent_id from ball_fixture) where player_id=(select player_a from ball_fixture);
 if not found then raise exception 'Earned reward did not remain available';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true) from ball_fixture;
update public.training_sessions set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=(select id from ball_sessions where i=51);
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true) from ball_fixture;
do $$ begin
 if public.player_ball_progress((select player_b from ball_fixture))<>10 then raise exception 'Completed rescheduled session not counted';end if;
 if not exists(select 1 from public.player_cosmetic_unlocks where player_id=(select player_b from ball_fixture) and cosmetic='ball-nike-10') then raise exception 'Rescheduled session reward missing';end if;
 if exists(select 1 from public.player_space_profiles where player_id=(select player_a from ball_fixture)) then raise exception 'Foreign saved ball exposed';end if;
end $$;
set local role anon;
do $$ begin
 begin perform public.player_ball_progress((select player_a from ball_fixture));raise exception 'Anonymous progress exposed';exception when insufficient_privilege then null;end;
end $$;
rollback;
