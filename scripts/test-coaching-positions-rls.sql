-- Runs only disposable fixtures, inside a transaction which always rolls back.
begin;
select set_config('star.test_manager',gen_random_uuid()::text,true),set_config('star.test_coach',gen_random_uuid()::text,true),set_config('star.test_guardian',gen_random_uuid()::text,true),set_config('star.test_player',gen_random_uuid()::text,true),set_config('star.test_other',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('star.test_manager')::uuid),(current_setting('star.test_coach')::uuid),(current_setting('star.test_guardian')::uuid);
insert into public.staff_members(user_id,role,active) values(current_setting('star.test_manager')::uuid,'manager',true),(current_setting('star.test_coach')::uuid,'coach',true);
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values
 (current_setting('star.test_player')::uuid,'Position','Test A','Development',true,current_setting('star.test_manager')::uuid,current_setting('star.test_manager')::uuid),
 (current_setting('star.test_other')::uuid,'Position','Test B','Development',true,current_setting('star.test_manager')::uuid,current_setting('star.test_manager')::uuid);
insert into public.coaching_assignments(player_id,staff_user_id) values(current_setting('star.test_player')::uuid,current_setting('star.test_coach')::uuid);
insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(current_setting('star.test_guardian')::uuid,current_setting('star.test_player')::uuid,current_setting('star.test_manager')::uuid);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.test_manager'),'role','authenticated')::text,true);
set local role authenticated;
insert into public.coaching_position_profiles(player_id,format,formation,main_position,secondary_position,coach_focus,updated_by) values
 (current_setting('star.test_player')::uuid,11,'4-3-3','rightWide','forward','First shared focus',current_setting('star.test_manager')::uuid),
 (current_setting('star.test_other')::uuid,11,'4-3-3','keeper',null,'Other player',current_setting('star.test_manager')::uuid);
select count(*) from public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,1);
update public.coaching_position_profiles set coach_focus='Unshared draft change',updated_by=current_setting('star.test_manager')::uuid where player_id=current_setting('star.test_player')::uuid and revision=1;
do $$ begin
 if (select revision from public.coaching_position_profiles where player_id=current_setting('star.test_player')::uuid)<>2 then raise exception 'Revision did not advance'; end if;
 if (select coach_focus from public.family_position_profiles where player_id=current_setting('star.test_player')::uuid)<>'First shared focus' then raise exception 'Draft leaked into family snapshot'; end if;
 begin perform public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,1); raise exception 'Stale revision accepted'; exception when serialization_failure then null; end;
 begin perform public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,null); raise exception 'Null revision accepted'; exception when serialization_failure then null; end;
 if star_private.position_profile_valid(9,'4-3-3','rightWide',null) or star_private.position_profile_valid(11,'4-3-3','rightWide','rightWide') or star_private.position_profile_valid(11,'4-3-3','wingBack',null) then raise exception 'Invalid roles or formation accepted'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.test_coach'),'role','authenticated')::text,true);
do $$ begin
 if (select count(*) from public.coaching_position_profiles where player_id in (current_setting('star.test_player')::uuid,current_setting('star.test_other')::uuid))<>1 then raise exception 'Coach roster scope failed'; end if;
 if (select count(*) from public.family_position_profiles where player_id=current_setting('star.test_player')::uuid)<>1 then raise exception 'Assigned coach cannot review family snapshot'; end if;
 update public.coaching_position_profiles set coach_focus='Coach draft',updated_by=current_setting('star.test_coach')::uuid where player_id=current_setting('star.test_player')::uuid and revision=2;
 if not found then raise exception 'Assigned coach cannot save'; end if;
 begin perform public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,3); raise exception 'Coach published without manager rights'; exception when insufficient_privilege then null; end;
 update public.coaching_position_profiles set coach_focus='Forbidden',updated_by=current_setting('star.test_coach')::uuid where player_id=current_setting('star.test_other')::uuid;
 if found then raise exception 'Coach changed another player'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.test_guardian'),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.coaching_position_profiles where player_id=current_setting('star.test_player')::uuid) then raise exception 'Guardian read internal draft'; end if;
 if (select count(*) from public.family_position_profiles where player_id=current_setting('star.test_player')::uuid)<>1 then raise exception 'Linked guardian cannot read snapshot'; end if;
 delete from public.family_position_profiles where player_id=current_setting('star.test_player')::uuid;
 if found then raise exception 'Guardian removed shared profile'; end if;
 begin insert into public.coaching_position_profiles(player_id,format,formation,main_position,updated_by) values(current_setting('star.test_player')::uuid,11,'4-3-3','keeper',current_setting('star.test_guardian')::uuid); raise exception 'Guardian wrote draft'; exception when insufficient_privilege then null; end;
 begin perform public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,3); raise exception 'Guardian published'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.guardian_player_links where guardian_id=current_setting('star.test_guardian')::uuid;
set local role authenticated;
do $$ begin if exists(select 1 from public.family_position_profiles where player_id=current_setting('star.test_player')::uuid) then raise exception 'Revoked guardian still reads snapshot'; end if; end $$;
reset role;
update public.staff_members set active=false where user_id=current_setting('star.test_coach')::uuid;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.test_coach'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin if exists(select 1 from public.coaching_position_profiles where player_id=current_setting('star.test_player')::uuid) then raise exception 'Inactive coach still reads draft'; end if; end $$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.family_position_profiles; raise exception 'Anonymous access granted'; exception when insufficient_privilege then null; end;
 begin perform public.publish_coaching_position_profile(current_setting('star.test_player')::uuid,3); raise exception 'Anonymous RPC access granted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Passed: manager publishing, locked revisions, draft isolation, assigned/unassigned/inactive coaches, linked/revoked guardians and anonymous denial. All test fixtures rolled back.' as result;
