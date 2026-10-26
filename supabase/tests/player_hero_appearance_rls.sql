begin;
create temp table hero_fixture as select gen_random_uuid() manager_id,gen_random_uuid() parent_id,gen_random_uuid() player_user_id,gen_random_uuid() stranger_id,gen_random_uuid() player_a,gen_random_uuid() player_b;
grant select on hero_fixture to authenticated;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from hero_fixture cross join lateral unnest(array[manager_id,parent_id,player_user_id,stranger_id]) id;
insert into public.staff_members(user_id,role,active) select manager_id,'owner',true from hero_fixture;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_a,'Hero fixture','A','Other',true,manager_id,manager_id from hero_fixture union all select player_b,'Hero fixture','B','Other',true,manager_id,manager_id from hero_fixture;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select parent_id,player_a,manager_id from hero_fixture;
insert into public.player_account_links(user_id,player_id,approved_by) select player_user_id,player_a,parent_id from hero_fixture;
insert into public.player_space_profiles(player_id,updated_by) select player_b,stranger_id from hero_fixture;
do $$ begin
 if not exists(select 1 from public.player_space_profiles where player_id=(select player_b from hero_fixture) and hero_skin='light' and hero_hair_colour='blonde' and hero_hair_type='ponytail') then raise exception 'Default hero changed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from hero_fixture;
insert into public.player_space_profiles(player_id,updated_by,hero_skin,hero_hair_colour,hero_hair_type) select player_a,parent_id,'deep','black','coils' from hero_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',player_user_id,'role','authenticated')::text,true) from hero_fixture;
do $$ begin
 if not exists(select 1 from public.player_space_profiles where player_id=(select player_a from hero_fixture) and hero_skin='deep' and hero_hair_colour='black' and hero_hair_type='coils') then raise exception 'Player cannot read saved appearance';end if;
 update public.player_space_profiles set hero_skin='medium',hero_hair_colour='ginger',hero_hair_type='braids',updated_by=(select player_user_id from hero_fixture) where player_id=(select player_a from hero_fixture);
 if not found then raise exception 'Player cannot save appearance';end if;
 begin
  update public.player_space_profiles set hero_hair_type='arbitrary-path' where player_id=(select player_a from hero_fixture);
  raise exception 'Invalid hairstyle accepted';
 exception when check_violation then null;end;
 begin
  update public.player_space_profiles set hero_skin='invalid' where player_id=(select player_a from hero_fixture);
  raise exception 'Invalid skin tone accepted';
 exception when check_violation then null;end;
 begin
  update public.player_space_profiles set hero_hair_colour='invalid' where player_id=(select player_a from hero_fixture);
  raise exception 'Invalid hair colour accepted';
 exception when check_violation then null;end;
 update public.player_space_profiles set hero_skin='fair' where player_id=(select player_b from hero_fixture);
 if found then raise exception 'Player changed another character';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',parent_id,'role','authenticated')::text,true) from hero_fixture;
do $$ begin
 if not exists(select 1 from public.player_space_profiles where player_id=(select player_a from hero_fixture) and hero_skin='medium' and hero_hair_colour='ginger' and hero_hair_type='braids') then raise exception 'Family cannot read player changes';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',stranger_id,'role','authenticated')::text,true) from hero_fixture;
do $$ begin
 if exists(select 1 from public.player_space_profiles where player_id in (select player_a from hero_fixture union select player_b from hero_fixture)) then raise exception 'Unlinked reader saw appearance';end if;
 update public.player_space_profiles set hero_hair_colour='silver' where player_id=(select player_a from hero_fixture);
 if found then raise exception 'Unlinked writer changed appearance';end if;
end $$;
rollback;
