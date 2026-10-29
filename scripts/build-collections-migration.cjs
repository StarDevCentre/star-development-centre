// Generate a new, versioned migration from the public static content. Never re-run an applied migration.
const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {bootChallenges,collectibleBoots,bootKey,bootMarker}=require('../lib/bootChallenges.ts');
const {squadRoster}=require('../lib/playerSquad.ts'),{illustratedScenes}=require('../lib/playerScenes.ts');
const q=s=>"'"+s.replaceAll("'","''")+"'",arr=a=>'array['+a.map(q).join(',')+']';
const previous=fs.readFileSync('supabase/migrations/20261029130000_learning_rewards.sql','utf8');
const allowed=previous.match(/add constraint player_cosmetic_unlocks_cosmetic_check check\(cosmetic in \(([^;]+)\)\);/)[1];
const free=['midnight','stadium','scrapbook',...illustratedScenes.map(s=>s.key)];
const options=bootChallenges.flatMap(c=>c.decisions.flatMap(d=>d.choices.map(a=>`(${q(d.id)},${q(a.id)},${q(bootMarker(d.id))},${a.useful})`)));
const rewards=collectibleBoots.map(b=>`(${q(b.challenge)},${arr(bootChallenges.find(c=>c.id===b.challenge).decisions.map(d=>bootMarker(d.id)))},${q(bootKey(b.id))})`);
const sql=`-- Free illustrated scenes, private family squads, server-validated boot rewards.
alter table public.player_space_profiles drop constraint player_space_profiles_theme_check;
alter table public.player_space_profiles add constraint player_space_profiles_theme_check check(theme in (${[...free,'passing-lanes','open-pitch','build-back','notebook'].map(q).join(',')}));
create or replace function star_private.validate_learning_look() returns trigger language plpgsql set search_path='' as $$
declare needed text;
begin
 foreach needed in array array[
  case when new.theme not in (${free.map(q).join(',')}) then 'theme-'||new.theme end,
  case when new.frame<>'none' then 'frame-'||new.frame end,
  case when new.hero_hair_type not in ('ponytail','curls','coils','braids') then 'hair-'||new.hero_hair_type end
 ] loop
  if needed is not null and not exists(select 1 from public.player_cosmetic_unlocks where player_id=new.player_id and cosmetic=needed) then raise exception 'Complete learning to unlock this look' using errcode='23514';end if;
 end loop;
 return new;
end $$;
revoke all on function star_private.validate_learning_look() from public,anon,authenticated;

create table public.player_squads(
 player_id uuid primary key references public.coaching_players(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 40),
 formation text not null check(formation in ('diamond','box')),
 footballers text[] not null check(cardinality(footballers)=5 and array_ndims(footballers)=1 and array_lower(footballers,1)=1),
 captain text not null,
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.player_squads enable row level security;
create policy squad_read on public.player_squads for select to authenticated using(star_private.can_use_player(player_id));
create policy squad_insert on public.player_squads for insert to authenticated with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
create policy squad_update on public.player_squads for update to authenticated using(star_private.can_use_player(player_id)) with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
revoke all on public.player_squads from public,anon,authenticated;
grant select,insert on public.player_squads to authenticated;
grant update(name,formation,footballers,captain,updated_by) on public.player_squads to authenticated;
create function star_private.validate_player_squad() returns trigger language plpgsql set search_path='' as $$
declare selected text;keepers text[]:=${arr(squadRoster.filter(p=>p.role==='Goalkeeper').map(p=>p.id))};roster text[]:=${arr(squadRoster.map(p=>p.id))};
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
revoke all on function star_private.validate_player_squad() from public,anon,authenticated;
create trigger validate_player_squad before insert or update on public.player_squads for each row execute function star_private.validate_player_squad();

alter table public.player_cosmetic_unlocks drop constraint player_cosmetic_unlocks_cosmetic_check;
alter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check check(cosmetic in (${allowed},${collectibleBoots.map(b=>q(bootKey(b.id))).join(',')}));
create table star_private.boot_challenge_options(item text not null,choice text not null,marker text not null,useful boolean not null,primary key(item,choice));
create table star_private.boot_reward_catalogue(challenge text primary key,requirements text[] not null,cosmetic text not null unique);
alter table star_private.boot_challenge_options enable row level security;
alter table star_private.boot_reward_catalogue enable row level security;
revoke all on star_private.boot_challenge_options,star_private.boot_reward_catalogue from public,anon,authenticated;
insert into star_private.boot_challenge_options(item,choice,marker,useful) values
${options.join(',\n')};
insert into star_private.boot_reward_catalogue(challenge,requirements,cosmetic) values
${rewards.join(',\n')};
-- Privileged only to record verified mastery and issue the fixed reward. No arbitrary writes.
create function public.submit_boot_answer(target_player uuid,item_id text,choice_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare answer star_private.boot_challenge_options%rowtype;reward record;
begin
 if auth.uid() is null or not star_private.can_use_player(target_player) then raise exception 'Player access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(target_player::text,0));
 select * into answer from star_private.boot_challenge_options where item=item_id and choice=choice_id;
 if not found then raise exception 'Choose an available boot challenge answer' using errcode='22023';end if;
 if answer.useful then insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(target_player,answer.marker,auth.uid()) on conflict do nothing;end if;
 for reward in select c.* from star_private.boot_reward_catalogue c where not exists(select 1 from unnest(c.requirements) needed(marker) where not exists(select 1 from public.player_learning_progress p where p.player_id=target_player and p.lesson_id=needed.marker)) loop
  insert into public.player_cosmetic_unlocks(player_id,cosmetic) values(target_player,reward.cosmetic) on conflict do nothing;
 end loop;
 return jsonb_build_object('progress',(select coalesce(jsonb_agg(jsonb_build_object('player_id',player_id,'lesson_id',lesson_id,'completed_at',completed_at)),'[]') from public.player_learning_progress where player_id=target_player),'unlocks',(select coalesce(jsonb_agg(to_jsonb(u)),'[]') from public.player_cosmetic_unlocks u where player_id=target_player));
end $$;
revoke all on function public.submit_boot_answer(uuid,text,text) from public,anon;
grant execute on function public.submit_boot_answer(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
`;
const path='supabase/migrations/20261029150000_player_collections.sql';
if(fs.existsSync(path)&&process.argv[2]!=='--replace')throw Error('Migration exists; do not overwrite applied migrations.');
fs.writeFileSync(path,sql);console.log(path);
