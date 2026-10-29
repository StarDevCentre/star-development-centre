-- Synthetic users only, all writes rolled back. Exercises real RLS, RPCs and equip triggers.
begin;
create temp table learning_test(key text primary key,value text);
create temp table learning_options_test as select * from star_private.learning_options;
grant select on learning_options_test to authenticated;
grant select,insert on learning_test to authenticated;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'learning-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Learning','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 insert into learning_test values('guardian',g::text),('other',o::text),('player',p::text),('core',c::text),('other_core',other_player::text);
 if has_function_privilege('anon','public.submit_learning_answer(uuid,text,text)','EXECUTE') or has_function_privilege('anon','public.unlock_learning_hairstyle(uuid,text)','EXECUTE') or has_table_privilege('authenticated','star_private.learning_options','SELECT') then raise exception 'Unexpected public permissions';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from learning_test where key='guardian'),true);
do $$declare pid uuid:=(select value::uuid from learning_test where key='core');a record;before_count integer;r jsonb;begin
 begin perform public.submit_learning_answer((select value::uuid from learning_test where key='other_core'),'pass-1','A');raise exception 'TEST FAILED cross family answer';exception when insufficient_privilege then null;end;
 begin perform public.unlock_learning_hairstyle((select value::uuid from learning_test where key='other_core'),'high-bun');raise exception 'TEST FAILED cross family claim';exception when insufficient_privilege then null;end;
 begin insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(pid,'mastery:forged',auth.uid());raise exception 'TEST FAILED forged mastery';exception when insufficient_privilege then null;end;
 begin insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(pid,'quiz:keeper-support',auth.uid());raise exception 'TEST FAILED direct quiz';exception when insufficient_privilege then null;end;
 begin insert into public.player_cosmetic_unlocks(player_id,cosmetic) values(pid,'hair-high-bun');raise exception 'TEST FAILED direct reward';exception when insufficient_privilege then null;end;
 insert into public.player_space_profiles(player_id,updated_by) values(pid,auth.uid()) on conflict do nothing;
 begin update public.player_space_profiles set frame='next-move' where player_id=pid;raise exception 'TEST FAILED locked frame';exception when check_violation then null;end;
 begin update public.player_space_profiles set theme='passing-lanes' where player_id=pid;raise exception 'TEST FAILED locked theme';exception when check_violation then null;end;
 begin update public.player_space_profiles set hero_hair_type='high-bun' where player_id=pid;raise exception 'TEST FAILED locked hair';exception when check_violation then null;end;
 begin perform public.unlock_learning_hairstyle(pid,'high-bun');raise exception 'TEST FAILED unearned hair';exception when check_violation then null;end;
 begin perform public.submit_learning_answer(pid,'forged','A');raise exception 'TEST FAILED invalid answer';exception when invalid_parameter_value then null;end;
 select * into a from learning_options_test where activity='pass' and not useful limit 1;
 r:=public.submit_learning_answer(pid,a.item,a.choice);
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=pid and cosmetic like 'learning-badge-%') or exists(select 1 from public.player_learning_progress where player_id=pid and lesson_id=a.marker) then raise exception 'Wrong answer granted mastery/reward';end if;
 for a in select distinct on(item) * from learning_options_test where activity='pass' and useful order by item,choice loop r:=public.submit_learning_answer(pid,a.item,a.choice);end loop;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid and cosmetic in ('learning-badge-pass','theme-passing-lanes'))<>2 then raise exception 'Game did not grant badge and extra';end if;
 perform public.unlock_learning_hairstyle(pid,'high-bun');perform public.unlock_learning_hairstyle(pid,'high-bun');
 begin perform public.unlock_learning_hairstyle(pid,'half-up');raise exception 'TEST FAILED one completion spent twice';exception when check_violation then null;end;
 update public.player_space_profiles set theme='passing-lanes',hero_hair_type='high-bun' where player_id=pid;
 delete from public.player_learning_progress where player_id=pid and lesson_id like 'mastery:%';
 if (select count(*) from public.player_learning_progress where player_id=pid and lesson_id like 'mastery:%')<>6 then raise exception 'Mastery could be deleted';end if;
 select count(*) into before_count from public.player_cosmetic_unlocks where player_id=pid;
 r:=public.submit_learning_answer(pid,a.item,a.choice);
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid)<>before_count then raise exception 'Replay duplicated rewards';end if;
 if jsonb_array_length(r->'unlocks')<3 or jsonb_array_length(r->'progress')<6 then raise exception 'RPC response missing confirmed records';end if;
end$$;
-- Linked player can continue the same saved learning.
select set_config('request.jwt.claim.sub',(select value from learning_test where key='player'),true);
do $$declare pid uuid:=(select value::uuid from learning_test where key='core');a record;h text;begin
 for a in select distinct on(item) * from learning_options_test where useful order by item,choice loop perform public.submit_learning_answer(pid,a.item,a.choice);end loop;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid and cosmetic like 'learning-badge-%')<>10 then raise exception 'Not all ten badges earned';end if;
 foreach h in array array['double-braids','half-up','curly-ponytail','twisted-bun','short-crop'] loop perform public.unlock_learning_hairstyle(pid,h);end loop;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid and cosmetic like 'hair-%')<>6 then raise exception 'Expected six hairstyles';end if;
 update public.player_space_profiles set updated_by=auth.uid(),frame='between-posts',decoration='breakaway',hero_hair_type='short-crop' where player_id=pid;
 if exists(select 1 from public.player_cosmetic_unlocks where player_id<>pid) then raise exception 'Other family rewards leaked';end if;
end$$;
select set_config('request.jwt.claim.sub',(select value from learning_test where key='other'),true);
do $$declare pid uuid:=(select value::uuid from learning_test where key='core');begin
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=pid) or exists(select 1 from public.player_learning_progress where player_id=pid) then raise exception 'Other family can read learning';end if;
 begin perform public.submit_learning_answer(pid,'keeper-support','0');raise exception 'TEST FAILED other family continue';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: real family/player RLS; wrong/correct answers; 10 rewards; replay idempotency; direct reward/mastery blocked; locked/equipped looks; 6 permanent hair choices; cross-family isolation. All fixtures rolled back.' as result;
