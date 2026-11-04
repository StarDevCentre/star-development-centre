-- Synthetic accounts and records only. Every fixture is rolled back.
begin;
create temporary table portal_test_ctx(key text primary key,id uuid not null default gen_random_uuid());
insert into portal_test_ctx(key) values ('manager'),('member'),('other_member'),('parent'),('other_parent'),('unverified'),('expired'),('org'),('other_org'),('player'),('other_player'),('link'),('session');
grant select on portal_test_ctx to authenticated,anon;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) select id,'portal-check-'||id||'@example.invalid',case when key='unverified' then null else now() end,false from portal_test_ctx where key in ('manager','member','other_member','parent','other_parent','unverified','expired');
insert into public.staff_members(user_id,role,active) select id,'manager',true from portal_test_ctx where key='manager';
insert into public.guardian_profiles(user_id,display_name) select id,'Portal check parent' from portal_test_ctx where key in ('parent','other_parent');
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
select id,'Synthetic','Portal Check','Assessment',true,(select id from portal_test_ctx where key='manager'),(select id from portal_test_ctx where key='manager') from portal_test_ctx where key in ('player','other_player');
insert into public.guardian_player_links(guardian_id,player_id,approved_by) values ((select id from portal_test_ctx where key='parent'),(select id from portal_test_ctx where key='player'),(select id from portal_test_ctx where key='manager'));
insert into public.guardian_player_links(guardian_id,player_id,approved_by) values ((select id from portal_test_ctx where key='other_parent'),(select id from portal_test_ctx where key='other_player'),(select id from portal_test_ctx where key='manager'));
insert into public.star_organisations(id,name,kind,created_by) select id,'Synthetic '||key,case when key='org' then 'school' else 'club' end,(select id from portal_test_ctx where key='manager') from portal_test_ctx where key in ('org','other_org');
insert into public.star_organisation_members(organisation_id,email,display_name,invited_by,expires_at)
select (select id from portal_test_ctx where key=case when t.key='other_member' then 'other_org' else 'org' end),'portal-check-'||t.id||'@example.invalid','Synthetic staff',(select id from portal_test_ctx where key='manager'),case when t.key='expired' then now()-interval '1 day' else now()+interval '1 day' end from portal_test_ctx t where t.key in ('member','other_member','unverified','expired');
insert into public.star_organisation_players(id,organisation_id,player_id,created_by) values((select id from portal_test_ctx where key='link'),(select id from portal_test_ctx where key='org'),(select id from portal_test_ctx where key='player'),(select id from portal_test_ctx where key='manager'));
insert into public.coaching_development_goals(player_id,goal,created_by) values((select id from portal_test_ctx where key='player'),'Scan before receiving',(select id from portal_test_ctx where key='manager'));
insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by) values((select id from portal_test_ctx where key='session'),'Synthetic session','Other',now()-interval '1 day',now()-interval '23 hours','Test venue',(select id from portal_test_ctx where key='manager'));
insert into public.training_session_participants(session_id,player_id) values((select id from portal_test_ctx where key='session'),(select id from portal_test_ctx where key='player'));
insert into public.training_attendance(session_id,player_id,status,recorded_by) values((select id from portal_test_ctx where key='session'),(select id from portal_test_ctx where key='player'),'present',(select id from portal_test_ctx where key='manager'));


create temp table register_counts as select (select count(*) from auth.users) users,(select count(*) from public.coaching_players) players,(select count(*) from public.star_organisation_players) links;
create function pg_temp.ok(b boolean) returns void language plpgsql as $$begin if b is distinct from true then raise exception 'Register check failed';end if;end$$;
create function pg_temp.register_denied(a text,d jsonb) returns void language plpgsql as $$begin begin perform public.star_organisation_register(a,d);exception when others then return;end;raise exception 'Unexpected register access: %',a;end$$;
create function pg_temp.development_denied(a text,d jsonb) returns void language plpgsql as $$begin begin perform public.star_organisation_development(a,d);exception when others then return;end;raise exception 'Unexpected development access: %',a;end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='member'),true);
select public.star_organisation_portal('accept');
do $$declare b jsonb:=jsonb_build_object('organisation_id',(select id from portal_test_ctx where key='org'));w jsonb;g uuid;g2 uuid;e uuid;begin
 perform public.star_organisation_development('create_group',b||'{"name":"Synthetic register group","kind":"team"}');
 perform public.star_organisation_development('create_group',b||'{"name":"Synthetic year group","kind":"year_group"}');
 w:=public.star_organisation_development('workspace',b);g:=(w->'groups'->0->>'id')::uuid;g2:=(w->'groups'->1->>'id')::uuid;
 perform pg_temp.ok(jsonb_array_length(w->'players')=0);
 perform public.star_organisation_register('add_name',b||jsonb_build_object('group_id',g,'name','Synthetic Portal Check'));
 w:=public.star_organisation_register('workspace',b);e:=(w->'register_entries'->0->>'id')::uuid;
 perform pg_temp.ok(jsonb_array_length(w->'register_entries')=1 and jsonb_array_length(w->'register_memberships')=1);
 perform pg_temp.ok(e<>(select id from portal_test_ctx where key='player') and e<>(select id from portal_test_ctx where key='link'));
 perform public.star_organisation_register('rename_name',b||jsonb_build_object('entry_id',e,'name','Corrected Register Name'));
 perform public.star_organisation_register('name_membership',b||jsonb_build_object('entry_id',e,'group_id',g2,'assigned',true));
 perform public.star_organisation_register('name_membership',b||jsonb_build_object('entry_id',e,'group_id',g2,'assigned',true));
 w:=public.star_organisation_register('workspace',b);perform pg_temp.ok(jsonb_array_length(w->'register_memberships')=2 and w->'register_entries'->0->>'name'='Corrected Register Name');
 perform pg_temp.development_denied('suggest_goal',b||jsonb_build_object('link_id',e,'goal','A name only entry must not have goals'));
 perform pg_temp.development_denied('progress',b||jsonb_build_object('link_id',e,'note','A name only entry must not have notes'));
 perform pg_temp.register_denied('add_name',b||jsonb_build_object('group_id',gen_random_uuid(),'name','Invalid group'));
 perform public.star_organisation_register('name_membership',b||jsonb_build_object('entry_id',e,'group_id',g,'assigned',false));
 perform pg_temp.ok(jsonb_array_length(public.star_organisation_register('workspace',b)->'register_memberships')=1);
 perform set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='other_member'),true);perform public.star_organisation_portal('accept');
 perform pg_temp.register_denied('workspace',b);perform pg_temp.register_denied('rename_name',b||jsonb_build_object('entry_id',e,'name','Cross organisation rename'));
 perform pg_temp.register_denied('name_membership',jsonb_build_object('organisation_id',(select id from portal_test_ctx where key='other_org'),'entry_id',e,'group_id',g,'assigned',true));
 perform pg_temp.register_denied('add_name',jsonb_build_object('organisation_id',(select id from portal_test_ctx where key='other_org'),'group_id',g,'name','Cross organisation group'));
 perform set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='unverified'),true);perform pg_temp.register_denied('workspace',b);
 perform set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='parent'),true);perform pg_temp.register_denied('workspace',b);
 perform set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='manager'),true);perform pg_temp.ok(jsonb_array_length(public.star_organisation_register('workspace',b)->'register_entries')=1);
 perform set_config('request.jwt.claim.sub',(select id::text from portal_test_ctx where key='member'),true);
 perform public.star_organisation_register('delete_name',b||jsonb_build_object('entry_id',e));
 w:=public.star_organisation_register('workspace',b);perform pg_temp.ok(jsonb_array_length(w->'register_entries')=0 and jsonb_array_length(w->'register_memberships')=0);
end$$;
reset role;
do $$declare c record;begin select * into c from register_counts;perform pg_temp.ok(c.users=(select count(*) from auth.users) and c.players=(select count(*) from public.coaching_players) and c.links=(select count(*) from public.star_organisation_players));perform pg_temp.ok(not has_table_privilege('authenticated','star_private.org_register_entries','select') and not has_function_privilege('anon','public.star_organisation_register(text,jsonb)','execute'));end$$;
select 'Name-only register checks passed; no accounts or player links created' as result;
rollback;
