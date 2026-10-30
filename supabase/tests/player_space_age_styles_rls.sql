-- Synthetic users only. Every record and presentation change rolls back.
begin;
create temp table age_style_test(key text primary key,value text);
grant select on age_style_test to authenticated,anon;
do $$declare g uuid:=gen_random_uuid();p uuid:=gen_random_uuid();o uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'age-style-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,p,o,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Style','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 insert into public.player_space_profiles(player_id,updated_by,shirt_name,ambition,experience) values(c,g,'MY SHIRT','My saved ambition','junior');
 if (select experience from public.player_space_profiles where player_id=c)<>'teenagers' then raise exception 'Legacy junior preference was not retained as teenagers';end if;
 update public.player_space_profiles set experience='senior' where player_id=c;
 if (select experience from public.player_space_profiles where player_id=c)<>'teenagers' then raise exception 'Legacy senior preference was not converted';end if;
 insert into public.player_personal_goals(player_id,goal,status,created_by) values(c,'My saved goal','active',g);
 insert into public.player_achievements(player_id,title,description,awarded_on,awarded_by) values(c,'My saved award','Still mine',current_date,s);
 insert into age_style_test values('guardian',g::text),('player',p::text),('other',o::text),('core',c::text);
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from age_style_test where key='guardian'),true);
do $$declare pid uuid:=(select value::uuid from age_style_test where key='core');begin
 update public.player_space_profiles set experience='children',updated_by=auth.uid() where player_id=pid;
 if not found then raise exception 'Family could not select children';end if;
 if (select shirt_name||':'||ambition from public.player_space_profiles where player_id=pid)<>'MY SHIRT:My saved ambition' then raise exception 'Style switch changed profile fields';end if;
 if (select count(*) from public.player_personal_goals where player_id=pid)<>1 or (select count(*) from public.player_achievements where player_id=pid)<>1 then raise exception 'Style switch changed progress';end if;
 begin update public.player_space_profiles set experience='unknown',updated_by=auth.uid() where player_id=pid;raise exception 'Unknown style was accepted';exception when check_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub',(select value from age_style_test where key='player'),true);
do $$declare pid uuid:=(select value::uuid from age_style_test where key='core');begin
 if (select experience from public.player_space_profiles where player_id=pid)<>'children' then raise exception 'Linked player cannot read saved style';end if;
 update public.player_space_profiles set experience='teenagers',updated_by=auth.uid() where player_id=pid;
 if not found then raise exception 'Linked player could not change style';end if;
end$$;
select set_config('request.jwt.claim.sub',(select value from age_style_test where key='other'),true);
do $$declare pid uuid:=(select value::uuid from age_style_test where key='core');begin
 if exists(select 1 from public.player_space_profiles where player_id=pid) then raise exception 'Other family could read profile';end if;
 update public.player_space_profiles set experience='children',updated_by=auth.uid() where player_id=pid;
 if found then raise exception 'Other family could change style';end if;
end$$;
reset role;
do $$begin
 if not (select relrowsecurity from pg_class where oid='public.player_space_profiles'::regclass) then raise exception 'RLS was disabled';end if;
 if has_function_privilege('anon','star_private.normalize_player_experience()','EXECUTE') or has_function_privilege('authenticated','star_private.normalize_player_experience()','EXECUTE') then raise exception 'Trigger function exposed';end if;
 if pg_get_functiondef('star_private.connect_intake_portal()'::regprocedure) not like '%interval ''12 years'' then ''teenagers'' else ''children''%' then raise exception 'Onboarding age bands incorrect';end if;
end$$;
select 'Age styles, progress preservation, legacy compatibility and family isolation passed' as result;
rollback;
