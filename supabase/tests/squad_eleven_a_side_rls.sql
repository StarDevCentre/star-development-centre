-- Only synthetic fixtures, rolled back in full.
begin;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'squad-check-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Squad','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 perform set_config('star_test.guardian',g::text,true);perform set_config('star_test.other',o::text,true);perform set_config('star_test.linked',p::text,true);perform set_config('star_test.player',c::text,true);
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(other_player,'Other five','diamond',array['hampton','williamson','hasegawa','toone','shaw'],'shaw',o);
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('star_test.guardian'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;f text;n integer;
 five text[]:=array['hampton','williamson','hasegawa','toone','shaw'];
 eleven text[]:=array['hampton','williamson','fox','bronze','greenwood','little','walsh','hasegawa','hemp','kelly','shaw'];
begin
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(pid,'My five','diamond',five,'shaw',auth.uid());
 foreach f in array array['4-3-3','4-4-2','4-2-3-1'] loop
  update public.player_squads set name='My eleven',formation=f,footballers=eleven,captain='shaw',updated_by=auth.uid() where player_id=pid;
  if not exists(select 1 from public.player_squads where player_id=pid and formation=f and footballers=eleven and captain='shaw') then raise exception 'Eleven did not save';end if;
  begin update public.player_squads set footballers=eleven[1:10] where player_id=pid;raise exception 'Ten players accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=eleven||array['james'] where player_id=pid;raise exception 'Twelve players accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=eleven[1:10]||array['yamashita'] where player_id=pid;raise exception 'Keeper in final outfield slot accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=eleven[1:10]||array['fox'] where player_id=pid;raise exception 'Duplicate accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=eleven[1:10]||array['unknown'] where player_id=pid;raise exception 'Unknown player accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=eleven[1:10]||array[null] where player_id=pid;raise exception 'Null player accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=array['james']||eleven[2:11] where player_id=pid;raise exception 'No goalkeeper accepted';exception when check_violation then null;end;
  begin update public.player_squads set formation='diamond' where player_id=pid;raise exception 'Eleven in five-side formation accepted';exception when check_violation then null;end;
  begin update public.player_squads set footballers=five where player_id=pid;raise exception 'Five in eleven-side formation accepted';exception when check_violation then null;end;
  begin update public.player_squads set captain='james' where player_id=pid;raise exception 'Absent captain accepted';exception when check_violation then null;end;
 end loop;
 begin update public.player_squads set formation='forged' where player_id=pid;raise exception 'Unknown formation accepted';exception when check_violation then null;end;
 update public.player_squads set formation='box',footballers=five where player_id=pid;
 if not exists(select 1 from public.player_squads where player_id=pid and formation='box' and footballers=five) then raise exception 'Five-side compatibility lost';end if;
 update public.player_squads set formation='4-3-3',footballers=eleven where player_id=pid;
 if exists(select 1 from public.player_squads where player_id<>pid) then raise exception 'Cross-family squad visible';end if;
 update public.player_squads set name='Stolen' where player_id<>pid;get diagnostics n=row_count;if n<>0 then raise exception 'Cross-family squad writable';end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.linked'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;begin
 if not exists(select 1 from public.player_squads where player_id=pid) then raise exception 'Linked player lost access';end if;
 update public.player_squads set name='Linked eleven',updated_by=auth.uid() where player_id=pid;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.other'),true);
do $$begin
 if exists(select 1 from public.player_squads where player_id=current_setting('star_test.player')::uuid) then raise exception 'Linked squad leaked';end if;
 if not exists(select 1 from public.player_squads where name='Other five') then raise exception 'Other family squad changed';end if;
end$$;
reset role;
rollback;
select 'PASS: three eleven-a-side formations save; legacy five-a-side works; invalid squads rejected; linked access and family isolation preserved; all fixtures rolled back.' as result;
