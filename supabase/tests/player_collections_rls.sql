-- Only synthetic records. Real RLS and RPCs, rolled back in full.
begin;
create temp table collection_test(key text primary key,value text);
create temp table boot_options_test as select * from star_private.boot_challenge_options;
grant select on boot_options_test to authenticated;
grant select,insert on collection_test to authenticated;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'collections-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Collection','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 insert into collection_test values('guardian',g::text),('other',o::text),('player',p::text),('core',c::text),('other_core',other_player::text);
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(other_player,'Other five','diamond',array['hampton','williamson','hasegawa','toone','shaw'],'shaw',o);
 if has_table_privilege('anon','public.player_squads','SELECT') or has_function_privilege('anon','public.submit_boot_answer(uuid,text,text)','EXECUTE') or has_table_privilege('authenticated','star_private.boot_challenge_options','SELECT') or has_table_privilege('authenticated','star_private.boot_reward_catalogue','SELECT') then raise exception 'Unexpected public permissions';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from collection_test where key='guardian'),true);
do $$declare pid uuid:=(select value::uuid from collection_test where key='core');a record;r jsonb;theme_key text;n integer;begin
 insert into public.player_space_profiles(player_id,updated_by) values(pid,auth.uid()) on conflict do nothing;
 foreach theme_key in array array['floodlit','street','sunset','futsal','rainy','tunnel','graffiti','star-navy'] loop
  update public.player_space_profiles set theme=theme_key,updated_by=auth.uid() where player_id=pid;
  if not exists(select 1 from public.player_space_profiles where player_id=pid and theme=theme_key) then raise exception 'Free theme did not save';end if;
 end loop;
 begin update public.player_space_profiles set theme='passing-lanes' where player_id=pid;raise exception 'TEST FAILED earned background bypassed';exception when check_violation then null;end;
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(pid,' My five ','diamond',array['hampton','williamson','hasegawa','toone','shaw'],'williamson',auth.uid());
 if not exists(select 1 from public.player_squads where player_id=pid and name='My five') then raise exception 'Squad not saved';end if;
 update public.player_squads set name='My box',formation='box',captain='shaw',updated_by=auth.uid() where player_id=pid;
 begin update public.player_squads set footballers=array['hampton','williamson','hasegawa','toone','toone'] where player_id=pid;raise exception 'TEST FAILED duplicate squad';exception when check_violation then null;end;
 begin update public.player_squads set footballers=array['hampton','yamashita','hasegawa','toone','shaw'] where player_id=pid;raise exception 'TEST FAILED second goalkeeper';exception when check_violation then null;end;
 begin update public.player_squads set footballers=array['toone','williamson','hasegawa','james','shaw'] where player_id=pid;raise exception 'TEST FAILED missing goalkeeper';exception when check_violation then null;end;
 begin update public.player_squads set footballers=array['hampton','williamson','hasegawa','toone','forged'] where player_id=pid;raise exception 'TEST FAILED unknown player';exception when check_violation then null;end;
 begin update public.player_squads set footballers=array['hampton','williamson','hasegawa','toone',null] where player_id=pid;raise exception 'TEST FAILED null player';exception when check_violation then null;end;
 begin update public.player_squads set captain='james' where player_id=pid;raise exception 'TEST FAILED captain outside squad';exception when check_violation then null;end;
 begin update public.player_squads set player_id=(select value::uuid from collection_test where key='other_core') where player_id=pid;raise exception 'TEST FAILED player reassignment';exception when insufficient_privilege then null;end;
 begin insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values((select value::uuid from collection_test where key='other_core'),'Stolen','box',array['hampton','williamson','hasegawa','toone','shaw'],'shaw',auth.uid());raise exception 'TEST FAILED other family insert';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.player_squads where player_id<>pid) then raise exception 'Other squad visible';end if;
 update public.player_squads set name='Stolen' where player_id<>pid;
 get diagnostics n=row_count;if n<>0 then raise exception 'Other squad editable';end if;
 begin perform public.submit_boot_answer((select value::uuid from collection_test where key='other_core'),'touch-space','A');raise exception 'TEST FAILED other family answer';exception when insufficient_privilege then null;end;
 begin insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(pid,'mastery:boot:touch-space',auth.uid());raise exception 'TEST FAILED direct mastery';exception when insufficient_privilege then null;end;
 begin insert into public.player_cosmetic_unlocks(player_id,cosmetic) values(pid,'boot-tiempo');raise exception 'TEST FAILED direct boot';exception when insufficient_privilege then null;end;
 begin perform public.submit_boot_answer(pid,'forged','A');raise exception 'TEST FAILED forged answer';exception when invalid_parameter_value then null;end;
 select * into a from boot_options_test where not useful limit 1;
 r:=public.submit_boot_answer(pid,a.item,a.choice);
 if exists(select 1 from public.player_learning_progress where player_id=pid and lesson_id=a.marker) or exists(select 1 from public.player_cosmetic_unlocks where player_id=pid) then raise exception 'Wrong answer earned progress or boots';end if;
 perform public.submit_boot_answer(pid,'touch-space','A');perform public.submit_boot_answer(pid,'touch-weight','B');
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=pid) then raise exception 'Partial challenge unlocked pair';end if;
 r:=public.submit_boot_answer(pid,'touch-shield','C');
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid and cosmetic='boot-tiempo')<>1 then raise exception 'Completed challenge did not grant pair';end if;
 perform public.submit_boot_answer(pid,'touch-shield','C');
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid)<>1 then raise exception 'Replay duplicated boot';end if;
 if jsonb_array_length(r->'progress')<>3 or jsonb_array_length(r->'unlocks')<>1 then raise exception 'Response not complete';end if;
 if exists(select 1 from jsonb_array_elements(r->'progress') x where x->>'player_id'<>pid::text) then raise exception 'Response leaked another player';end if;
end$$;
-- New roster entries work through the same RLS and trigger.
do $$declare pid uuid:=(select value::uuid from collection_test where key='core');keeper text;begin
 foreach keeper in array array['brosnan','kop','roebuck'] loop
  update public.player_squads set footballers=array[keeper,'hemp','stanway','asllani','goodwin'],captain='hemp',updated_by=auth.uid() where player_id=pid;
  begin update public.player_squads set footballers=array['hampton',keeper,'stanway','asllani','goodwin'] where player_id=pid;raise exception 'TEST FAILED new second goalkeeper';exception when check_violation then null;end;
 end loop;
 update public.player_squads set footballers=array['hampton','williamson','hasegawa','toone','shaw'],captain='shaw',updated_by=auth.uid() where player_id=pid;
end$$;
-- A linked player continues the same private squad and permanent challenge progress.
select set_config('request.jwt.claim.sub',(select value from collection_test where key='player'),true);
do $$declare pid uuid:=(select value::uuid from collection_test where key='core');a record;begin
 if not exists(select 1 from public.player_squads where player_id=pid and name='My box' and captain='shaw') then raise exception 'Linked player cannot read saved squad';end if;
 update public.player_squads set name='Our five',formation='diamond',updated_by=auth.uid() where player_id=pid;
 for a in select * from boot_options_test where useful loop perform public.submit_boot_answer(pid,a.item,a.choice);end loop;
 if (select count(*) from public.player_cosmetic_unlocks where player_id=pid and cosmetic like 'boot-%')<>17 then raise exception 'Not all 17 boots earned';end if;
 if exists(select 1 from public.player_cosmetic_unlocks where player_id=pid and cosmetic not like 'boot-%') then raise exception 'Boots granted unrelated rewards';end if;
 if (select count(*) from public.player_learning_progress where player_id=pid and lesson_id like 'mastery:boot:%')<>51 then raise exception 'Expected 51 permanent decisions';end if;
 delete from public.player_learning_progress where player_id=pid and lesson_id like 'mastery:boot:%';
 if (select count(*) from public.player_learning_progress where player_id=pid and lesson_id like 'mastery:boot:%')<>51 then raise exception 'Boot mastery could be removed';end if;
 begin perform public.unlock_learning_hairstyle(pid,'high-bun');raise exception 'TEST FAILED boot earned hairstyle entitlement';exception when check_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub',(select value from collection_test where key='other'),true);
do $$declare pid uuid:=(select value::uuid from collection_test where key='core');begin
 if exists(select 1 from public.player_squads where player_id=pid) or exists(select 1 from public.player_cosmetic_unlocks where player_id=pid) or exists(select 1 from public.player_learning_progress where player_id=pid) then raise exception 'Cross-family data visible';end if;
 if not exists(select 1 from public.player_squads where name='Other five') then raise exception 'Other family squad was changed';end if;
 begin perform public.submit_boot_answer(pid,'touch-space','A');raise exception 'TEST FAILED other family continue';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: eight free backgrounds; validated private squads; linked account continuity; 51 verified decisions; 17 permanent boots; no duplicate or unrelated rewards; family isolation. All synthetic fixtures rolled back.' as result;
