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
do $$declare pid uuid:=current_setting('star_test.player')::uuid;v jsonb:='{"skin":"light","hair":"brown","hairstyle":"ponytail","face":"oval","eyes":"brown","build":"slim","top":"ellesse-pink-sweatshirt","bottoms":"ellesse-pink-joggers","socks":"white","boots":"starter","accessory":"none"}';begin
 insert into public.player_space_profiles(player_id,updated_by,builder_look,builder_on_card) values(pid,auth.uid(),v,true);
 if not exists(select 1 from public.player_space_profiles where player_id=pid and builder_look=v and builder_on_card) then raise exception 'Ellesse set did not save';end if;
 update public.player_space_profiles set builder_look=jsonb_set(v,'{top}','"nike-pro-crop"') where player_id=pid;
 update public.player_space_profiles set builder_look=jsonb_set(v,'{bottoms}','"nike-pro-shorts"') where player_id=pid;
 begin update public.player_space_profiles set builder_look=jsonb_set(v,'{top}','"unapproved-top"') where player_id=pid;raise exception 'Unknown item accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_look=jsonb_set(v,'{top}','"gold-hoodie"') where player_id=pid;raise exception 'Locked gold item accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_look=jsonb_set(v,'{boots}','"tiempo"') where player_id=pid;raise exception 'Locked boots accepted';exception when check_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.linked'),true);
do $$begin
 update public.player_space_profiles set updated_by=auth.uid(),builder_look=jsonb_set(builder_look,'{bottoms}','"ellesse-pink-joggers"') where player_id=current_setting('star_test.player')::uuid;
 if not found then raise exception 'Linked player cannot save';end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.other'),true);
do $$begin
 if exists(select 1 from public.player_space_profiles where player_id=current_setting('star_test.player')::uuid) then raise exception 'Other family can read';end if;
 update public.player_space_profiles set builder_on_card=false where player_id=current_setting('star_test.player')::uuid;
 if found then raise exception 'Other family can edit';end if;
end$$;
reset role;
rollback;
select 'Ellesse saves, mixing, entitlements and family isolation passed; all fixtures rolled back' as result;
