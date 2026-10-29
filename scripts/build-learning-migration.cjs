const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {footballActivities}=require('../lib/playerActivities.ts'),{quizQuestions}=require('../lib/playerLearning.ts'),{learningRewards,learningHairstyles,learningRequirements,extraKey}=require('../lib/learningRewards.ts');
const q=s=>"'"+s.replaceAll("'","''")+"'";
const options=footballActivities.flatMap(a=>a.scenarios.flatMap(s=>s.choices.map(c=>[s.id,c.id,'mastery:'+s.id,c.outcome!=='look-again',a.id]))).concat(quizQuestions.flatMap(v=>v.options.map((_,i)=>[v.id,String(i),'quiz:'+v.id,i===v.answer,learningRewards.find(r=>learningRequirements(r.id).includes('quiz:'+v.id)).id])));
const old=['avatar-captain','avatar-comet','avatar-shield','decoration-lightning','decoration-laurel','decoration-starburst','ball-nike-10','ball-gold-50'];
const keys=[...old,...learningRewards.flatMap(r=>['learning-badge-'+r.id,extraKey(r)]),...learningHairstyles.map(h=>'hair-'+h.key)];
const sql=`-- Fixed learning catalogues are private. Only verified answers may create mastery/rewards.
create table star_private.learning_options(item text not null,choice text not null,marker text not null,useful boolean not null,activity text not null,primary key(item,choice));
create table star_private.learning_reward_catalogue(activity text primary key,requirements text[] not null,cosmetic text not null);
revoke all on star_private.learning_options,star_private.learning_reward_catalogue from public,anon,authenticated;
insert into star_private.learning_options values ${options.map(o=>'('+o.map(v=>typeof v==='boolean'?String(v):q(v)).join(',')+')').join(',\n')};
insert into star_private.learning_reward_catalogue values ${learningRewards.map(r=>'('+q(r.id)+',array['+learningRequirements(r.id).map(q).join(',')+'],'+q(extraKey(r))+')').join(',\n')};
alter table public.player_cosmetic_unlocks drop constraint player_cosmetic_unlocks_cosmetic_check;
alter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check check(cosmetic in (${keys.map(q).join(',')}));
alter table public.player_space_profiles add column frame text not null default 'none' check(frame in ('none','next-move','hold-line','between-posts','learning-crest'));
alter table public.player_space_profiles drop constraint player_space_profiles_theme_check;
alter table public.player_space_profiles add constraint player_space_profiles_theme_check check(theme in ('midnight','stadium','scrapbook','passing-lanes','open-pitch','build-back','notebook'));
alter table public.player_space_profiles drop constraint player_space_profiles_decoration_check;
alter table public.player_space_profiles add constraint player_space_profiles_decoration_check check(decoration in ('none','lightning','laurel','starburst','touch-trail','breakaway'));
alter table public.player_space_profiles drop constraint player_space_profiles_hero_hair_type_check;
alter table public.player_space_profiles add constraint player_space_profiles_hero_hair_type_check check(hero_hair_type in ('ponytail','curls','coils','braids',${learningHairstyles.map(h=>q(h.key)).join(',')}));
-- Direct client writes remain available for guides, exploration and favourites only.
alter policy learning_insert on public.player_learning_progress with check(star_private.can_use_player(player_id) and completed_by=(select auth.uid()) and lesson_id not like 'mastery:%' and lesson_id not like 'quiz:%');
alter policy learning_reset on public.player_learning_progress using(star_private.can_use_player(player_id) and lesson_id not like 'mastery:%' and lesson_id not like 'quiz:%');
create function star_private.grant_learning_rewards(target_player uuid) returns void language plpgsql security definer set search_path='' as $$
declare reward record;
begin
 for reward in select c.* from star_private.learning_reward_catalogue c where not exists(select 1 from unnest(c.requirements) as needed(marker) where not exists(select 1 from public.player_learning_progress p where p.player_id=target_player and p.lesson_id=needed.marker)) loop
  insert into public.player_cosmetic_unlocks(player_id,cosmetic) values(target_player,'learning-badge-'||reward.activity),(target_player,reward.cosmetic) on conflict do nothing;
 end loop;
end $$;
revoke all on function star_private.grant_learning_rewards(uuid) from public,anon,authenticated;
create function public.submit_learning_answer(target_player uuid,item_id text,choice_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare answer star_private.learning_options%rowtype;
begin
 if auth.uid() is null or not star_private.can_use_player(target_player) then raise exception 'Player access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(target_player::text,0));
 select * into answer from star_private.learning_options where item=item_id and choice=choice_id;
 if not found then raise exception 'Choose an available answer' using errcode='22023';end if;
 if answer.marker like 'mastery:%' then
  insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(target_player,'activity:'||item_id,auth.uid()) on conflict do nothing;
 end if;
 if answer.useful then
  insert into public.player_learning_progress(player_id,lesson_id,completed_by) values(target_player,answer.marker,auth.uid()) on conflict do nothing;
 end if;
 perform star_private.grant_learning_rewards(target_player);
 return jsonb_build_object('progress',(select coalesce(jsonb_agg(jsonb_build_object('player_id',player_id,'lesson_id',lesson_id,'completed_at',completed_at)),'[]') from public.player_learning_progress where player_id=target_player),'unlocks',(select coalesce(jsonb_agg(to_jsonb(u)),'[]') from public.player_cosmetic_unlocks u where player_id=target_player));
end $$;
revoke all on function public.submit_learning_answer(uuid,text,text) from public,anon;
grant execute on function public.submit_learning_answer(uuid,text,text) to authenticated;
create function public.unlock_learning_hairstyle(target_player uuid,hairstyle text) returns setof public.player_cosmetic_unlocks language plpgsql security definer set search_path='' as $$
declare earned integer;claimed integer;
begin
 if auth.uid() is null or not star_private.can_use_player(target_player) then raise exception 'Player access required' using errcode='42501';end if;
 if hairstyle is null or hairstyle not in (${learningHairstyles.map(h=>q(h.key)).join(',')}) then raise exception 'Choose an available hairstyle' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(target_player::text,0));
 select count(*) into earned from public.player_cosmetic_unlocks where player_id=target_player and cosmetic like 'learning-badge-%';
 select count(*) into claimed from public.player_cosmetic_unlocks where player_id=target_player and cosmetic like 'hair-%';
 if not exists(select 1 from public.player_cosmetic_unlocks where player_id=target_player and cosmetic='hair-'||hairstyle) then
  if claimed>=least(earned,6) then raise exception 'Complete another different game or quiz round to choose a hairstyle' using errcode='23514';end if;
  insert into public.player_cosmetic_unlocks(player_id,cosmetic) values(target_player,'hair-'||hairstyle);
 end if;
 return query select * from public.player_cosmetic_unlocks where player_id=target_player;
end $$;
revoke all on function public.unlock_learning_hairstyle(uuid,text) from public,anon;
grant execute on function public.unlock_learning_hairstyle(uuid,text) to authenticated;
create function star_private.validate_learning_look() returns trigger language plpgsql set search_path='' as $$
declare needed text;
begin
 foreach needed in array array[
  case when new.theme not in ('midnight','stadium','scrapbook') then 'theme-'||new.theme end,
  case when new.frame<>'none' then 'frame-'||new.frame end,
  case when new.hero_hair_type not in ('ponytail','curls','coils','braids') then 'hair-'||new.hero_hair_type end
 ] loop
  if needed is not null and not exists(select 1 from public.player_cosmetic_unlocks where player_id=new.player_id and cosmetic=needed) then raise exception 'Complete learning to unlock this look' using errcode='23514';end if;
 end loop;
 return new;
end $$;
revoke all on function star_private.validate_learning_look() from public,anon,authenticated;
create trigger validate_learning_look before insert or update of theme,frame,hero_hair_type on public.player_space_profiles for each row execute function star_private.validate_learning_look();
-- Previously recorded correct quiz answers remain valid; exploration is never treated as mastery.
do $$ declare p record;begin for p in select distinct player_id from public.player_learning_progress where lesson_id like 'quiz:%' loop perform star_private.grant_learning_rewards(p.player_id);end loop;end $$;
`;
fs.writeFileSync('supabase/migrations/20261029130000_learning_rewards.sql',sql);
