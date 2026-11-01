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
do $$declare pid uuid:=current_setting('star_test.player')::uuid;v jsonb:='{"skin":"light","hair":"brown","hairstyle":"ponytail","face":"oval","eyes":"brown","build":"standard","top":"base","bottoms":"base","socks":"none","boots":"none","accessory":"none"}';k text;begin
 insert into public.player_space_profiles(player_id,updated_by,builder_look) values(pid,auth.uid(),v);
 if not exists(select 1 from public.player_space_profiles where player_id=pid and builder_look=v) then raise exception 'Base look did not persist';end if;
 for k in select jsonb_object_keys(v) loop
  begin update public.player_space_profiles set builder_look=jsonb_set(v,array[k],'"forged"') where player_id=pid;raise exception 'Invalid % accepted',k;exception when check_violation then null;end;
 end loop;
 begin update public.player_space_profiles set builder_look=v||'{"extra":"forged"}' where player_id=pid;raise exception 'Extra key accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_look=v-'hair' where player_id=pid;raise exception 'Missing key accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_look=jsonb_set(v,'{boots}','"tiempo"') where player_id=pid;raise exception 'Locked boots accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_look=jsonb_set(v,'{top}','"gold-hoodie"') where player_id=pid;raise exception 'Locked hoodie accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_on_card=true where player_id=pid;raise exception 'Base outfit on card accepted';exception when check_violation then null;end;
 v:=v||'{"top":"star","bottoms":"shorts","boots":"starter"}';
 update public.player_space_profiles set builder_look=v,builder_on_card=true where player_id=pid;
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(pid,'My own player','diamond',array['hampton','my-player','fox','toone','shaw'],'my-player',auth.uid());
 if not exists(select 1 from public.player_squads where player_id=pid and captain='my-player') then raise exception 'Self captain failed';end if;
 begin update public.player_squads set footballers=array['my-player','williamson','fox','toone','shaw'] where player_id=pid;raise exception 'Self in goal accepted';exception when check_violation then null;end;
 begin update public.player_squads set footballers=array['hampton','my-player','my-player','toone','shaw'] where player_id=pid;raise exception 'Self duplicate accepted';exception when check_violation then null;end;
 begin update public.player_space_profiles set builder_on_card=false,builder_look=v||'{"top":"base"}' where player_id=pid;raise exception 'Undressed self in squad accepted';exception when check_violation then null;end;
 if exists(select 1 from public.player_space_profiles where player_id<>pid) then raise exception 'Other profile visible';end if;
end$$;
reset role;
insert into public.player_cosmetic_unlocks(player_id,cosmetic) select current_setting('star_test.player')::uuid,k from unnest(array['boot-ida-rise','boot-furon-pink','boot-tekela-white','boot-morelia-ruby','boot-superfly-pink','boot-absolute-2006','boot-total90-2004','boot-stadio-1990','boot-etrusco-1990','boot-tiempo','boot-copa','boot-mercurial','boot-predator','boot-future','boot-ultra','boot-phantom','boot-f50','avatar-captain','decoration-laurel']) k on conflict do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('star_test.guardian'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;b text;begin
 foreach b in array array['ida-rise','furon-pink','tekela-white','morelia-ruby','superfly-pink','absolute-2006','total90-2004','stadio-1990','etrusco-1990','tiempo','copa','mercurial','predator','future','ultra','phantom','f50'] loop
 update public.player_space_profiles set builder_look=jsonb_set(builder_look,'{boots}',to_jsonb(b)) where player_id=pid;
 if not exists(select 1 from public.player_space_profiles where player_id=pid and builder_look->>'boots'=b) then raise exception 'Earned boot did not persist';end if;
 end loop;
 update public.player_space_profiles set builder_look=builder_look||'{"top":"gold-hoodie","accessory":"gold-headband"}' where player_id=pid;
 update public.player_squads set formation='4-3-3',footballers=array['hampton','my-player','fox','bronze','greenwood','little','walsh','hasegawa','hemp','kelly','shaw'] where player_id=pid;
 if not exists(select 1 from public.player_squads where player_id=pid and cardinality(footballers)=11 and captain='my-player') then raise exception 'Own eleven failed';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('star_test.linked'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;begin
 if not exists(select 1 from public.player_space_profiles where player_id=pid and builder_on_card) then raise exception 'Linked profile inaccessible';end if;
 update public.player_space_profiles set builder_look=jsonb_set(builder_look,'{hair}','"ginger"'),updated_by=auth.uid() where player_id=pid;
 if not exists(select 1 from public.player_space_profiles where player_id=pid and builder_look->>'hair'='ginger') then raise exception 'Linked save failed';end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.other'),true);
do $$declare n integer;begin
 if exists(select 1 from public.player_space_profiles where player_id=current_setting('star_test.player')::uuid) then raise exception 'Cross-family profile visible';end if;
 update public.player_space_profiles set builder_on_card=false where player_id=current_setting('star_test.player')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'Cross-family write accepted';end if;
end$$;
reset role;
rollback;
