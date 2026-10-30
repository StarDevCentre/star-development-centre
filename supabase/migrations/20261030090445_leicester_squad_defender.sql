-- Add Leicester defender Asmita Ale to eligible squads; existing permissions and checks unchanged.
create or replace function star_private.validate_player_squad() returns trigger language plpgsql set search_path='' as $$
declare selected text;keepers text[]:=array['brosnan','kop','roebuck','hampton','yamashita','tullis-joyce','sophie-baggaley','chiamaka-nnadozie','sophie-whitehouse','shae-yanez','khiara-keating','mary-earps','constance-picaud'];roster text[]:=array['hemp','blindkilde','kelly','caldentey','walsh','carpenter','fisk','brosnan','koga','stanway','kop','roebuck','asllani','godfrey','tierney','goodwin','hampton','yamashita','tullis-joyce','williamson','fox','bronze','greenwood','le-tissier','little','cuthbert','hasegawa','toone','kirby','kendall','russo','james','shaw','terland','seike','daly','anna-patten','lynn-wilms','missy-bo-kearns','sophie-baggaley','millie-turner','neve-herron','lisa-naalsund','lily-crosthwaite','veatriki-sarri','chiamaka-nnadozie','marisa-olislagers','maisie-symonds','madison-haley','sophie-whitehouse','ellie-mason','kiera-skeels','jodie-hutton','lucy-fitzgerald','gillian-kenney','shae-yanez','allyson-swaby','aimee-everett','annabel-blanchard','ashleigh-weerden','bethany-england','ruby-mace','mayumi-pacheco','clare-wheeler','yuka-momiki','ornella-vignola','khiara-keating','jenna-clark','fuka-nagano','ceri-holland','beata-olsson','mary-earps','maria-leon','alexia-putellas','kadidiatou-diani','anna-sandberg','jessica-park','amanda-nilden','olivia-holdt','jessica-naz','cathinka-tandberg','constance-picaud','estelle-cascarino','ffion-morgan','katie-zelem','riko-ueki','ebony-salmon','asmita-ale'];
begin
 if tg_op='UPDATE' and new.player_id<>old.player_id then raise exception 'A squad stays with its player' using errcode='23514';end if;
 if cardinality(new.footballers)<>5 or (select count(distinct p) from unnest(new.footballers) p)<>5 then raise exception 'Choose five different players' using errcode='23514';end if;
 foreach selected in array new.footballers loop
  if selected is null or not(selected=any(roster)) then raise exception 'Choose a player from the roster' using errcode='23514';end if;
 end loop;
 if not(new.footballers[1]=any(keepers)) or exists(select 1 from unnest(new.footballers[2:5]) p where p=any(keepers)) then raise exception 'Choose one goalkeeper and four outfield players' using errcode='23514';end if;
 if not(new.captain=any(new.footballers)) then raise exception 'Choose a captain from your squad' using errcode='23514';end if;
 new.name:=btrim(new.name);new.updated_at:=now();return new;
end $$;
notify pgrst,'reload schema';
