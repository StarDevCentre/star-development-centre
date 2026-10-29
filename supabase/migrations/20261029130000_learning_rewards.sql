-- Fixed learning catalogues are private. Only verified answers may create mastery/rewards.
create table star_private.learning_options(item text not null,choice text not null,marker text not null,useful boolean not null,activity text not null,primary key(item,choice));
create table star_private.learning_reward_catalogue(activity text primary key,requirements text[] not null,cosmetic text not null);
revoke all on star_private.learning_options,star_private.learning_reward_catalogue from public,anon,authenticated;
insert into star_private.learning_options values ('pass-wide','A','mastery:pass-wide',true,'pass'),
('pass-wide','B','mastery:pass-wide',false,'pass'),
('pass-wide','C','mastery:pass-wide',true,'pass'),
('pass-switch','A','mastery:pass-switch',false,'pass'),
('pass-switch','B','mastery:pass-switch',true,'pass'),
('pass-switch','C','mastery:pass-switch',false,'pass'),
('pass-gap','A','mastery:pass-gap',true,'pass'),
('pass-gap','B','mastery:pass-gap',false,'pass'),
('pass-gap','C','mastery:pass-gap',true,'pass'),
('pass-reset','A','mastery:pass-reset',false,'pass'),
('pass-reset','B','mastery:pass-reset',true,'pass'),
('pass-reset','C','mastery:pass-reset',false,'pass'),
('pass-pressure','A','mastery:pass-pressure',true,'pass'),
('pass-pressure','B','mastery:pass-pressure',false,'pass'),
('pass-pressure','C','mastery:pass-pressure',true,'pass'),
('pass-combination','A','mastery:pass-combination',true,'pass'),
('pass-combination','B','mastery:pass-combination',false,'pass'),
('pass-combination','C','mastery:pass-combination',true,'pass'),
('space-angle','A','mastery:space-angle',true,'space'),
('space-angle','B','mastery:space-angle',false,'space'),
('space-angle','C','mastery:space-angle',true,'space'),
('space-width','A','mastery:space-width',true,'space'),
('space-width','B','mastery:space-width',false,'space'),
('space-width','C','mastery:space-width',true,'space'),
('space-distance','A','mastery:space-distance',true,'space'),
('space-distance','B','mastery:space-distance',false,'space'),
('space-distance','C','mastery:space-distance',true,'space'),
('space-behind','A','mastery:space-behind',true,'space'),
('space-behind','B','mastery:space-behind',false,'space'),
('space-behind','C','mastery:space-behind',true,'space'),
('space-pocket','A','mastery:space-pocket',true,'space'),
('space-pocket','B','mastery:space-pocket',false,'space'),
('space-pocket','C','mastery:space-pocket',true,'space'),
('space-after-pass','A','mastery:space-after-pass',true,'space'),
('space-after-pass','B','mastery:space-after-pass',false,'space'),
('space-after-pass','C','mastery:space-after-pass',true,'space'),
('next-carry','A','mastery:next-carry',true,'next'),
('next-carry','B','mastery:next-carry',true,'next'),
('next-carry','C','mastery:next-carry',false,'next'),
('next-pressure','A','mastery:next-pressure',true,'next'),
('next-pressure','B','mastery:next-pressure',false,'next'),
('next-pressure','C','mastery:next-pressure',false,'next'),
('next-square','A','mastery:next-square',false,'next'),
('next-square','B','mastery:next-square',true,'next'),
('next-square','C','mastery:next-square',true,'next'),
('next-finish','A','mastery:next-finish',true,'next'),
('next-finish','B','mastery:next-finish',true,'next'),
('next-finish','C','mastery:next-finish',false,'next'),
('next-protect','A','mastery:next-protect',true,'next'),
('next-protect','B','mastery:next-protect',true,'next'),
('next-protect','C','mastery:next-protect',false,'next'),
('next-reset','A','mastery:next-reset',false,'next'),
('next-reset','B','mastery:next-reset',true,'next'),
('next-reset','C','mastery:next-reset',true,'next'),
('touch-away','A','mastery:touch-away',true,'touch'),
('touch-away','B','mastery:touch-away',false,'touch'),
('touch-away','C','mastery:touch-away',true,'touch'),
('touch-open','A','mastery:touch-open',true,'touch'),
('touch-open','B','mastery:touch-open',true,'touch'),
('touch-open','C','mastery:touch-open',false,'touch'),
('touch-control','A','mastery:touch-control',true,'touch'),
('touch-control','B','mastery:touch-control',false,'touch'),
('touch-control','C','mastery:touch-control',true,'touch'),
('touch-line','A','mastery:touch-line',true,'touch'),
('touch-line','B','mastery:touch-line',false,'touch'),
('touch-line','C','mastery:touch-line',true,'touch'),
('touch-settle','A','mastery:touch-settle',true,'touch'),
('touch-settle','B','mastery:touch-settle',false,'touch'),
('touch-settle','C','mastery:touch-settle',true,'touch'),
('touch-connect','A','mastery:touch-connect',true,'touch'),
('touch-connect','B','mastery:touch-connect',false,'touch'),
('touch-connect','C','mastery:touch-connect',true,'touch'),
('defend-delay','A','mastery:defend-delay',true,'defend'),
('defend-delay','B','mastery:defend-delay',false,'defend'),
('defend-delay','C','mastery:defend-delay',false,'defend'),
('defend-wide','A','mastery:defend-wide',true,'defend'),
('defend-wide','B','mastery:defend-wide',false,'defend'),
('defend-wide','C','mastery:defend-wide',false,'defend'),
('defend-cover','A','mastery:defend-cover',false,'defend'),
('defend-cover','B','mastery:defend-cover',true,'defend'),
('defend-cover','C','mastery:defend-cover',false,'defend'),
('defend-runner','A','mastery:defend-runner',true,'defend'),
('defend-runner','B','mastery:defend-runner',false,'defend'),
('defend-runner','C','mastery:defend-runner',false,'defend'),
('defend-recover','A','mastery:defend-recover',true,'defend'),
('defend-recover','B','mastery:defend-recover',false,'defend'),
('defend-recover','C','mastery:defend-recover',false,'defend'),
('defend-cutback','A','mastery:defend-cutback',false,'defend'),
('defend-cutback','B','mastery:defend-cutback',false,'defend'),
('defend-cutback','C','mastery:defend-cutback',true,'defend'),
('counter-wide','A','mastery:counter-wide',true,'counter'),
('counter-wide','B','mastery:counter-wide',true,'counter'),
('counter-wide','C','mastery:counter-wide',false,'counter'),
('counter-far-side','A','mastery:counter-far-side',false,'counter'),
('counter-far-side','B','mastery:counter-far-side',true,'counter'),
('counter-far-side','C','mastery:counter-far-side',true,'counter'),
('counter-two-one','A','mastery:counter-two-one',true,'counter'),
('counter-two-one','B','mastery:counter-two-one',false,'counter'),
('counter-two-one','C','mastery:counter-two-one',true,'counter'),
('counter-release','A','mastery:counter-release',true,'counter'),
('counter-release','B','mastery:counter-release',false,'counter'),
('counter-release','C','mastery:counter-release',true,'counter'),
('counter-reset','A','mastery:counter-reset',true,'counter'),
('counter-reset','B','mastery:counter-reset',true,'counter'),
('counter-reset','C','mastery:counter-reset',false,'counter'),
('counter-carry','A','mastery:counter-carry',false,'counter'),
('counter-carry','B','mastery:counter-carry',true,'counter'),
('counter-carry','C','mastery:counter-carry',true,'counter'),
('keeper-position-central','A','mastery:keeper-position-central',true,'keeper-position'),
('keeper-position-central','B','mastery:keeper-position-central',false,'keeper-position'),
('keeper-position-central','C','mastery:keeper-position-central',false,'keeper-position'),
('keeper-position-high-side','A','mastery:keeper-position-high-side',true,'keeper-position'),
('keeper-position-high-side','B','mastery:keeper-position-high-side',false,'keeper-position'),
('keeper-position-high-side','C','mastery:keeper-position-high-side',false,'keeper-position'),
('keeper-position-low-side','A','mastery:keeper-position-low-side',false,'keeper-position'),
('keeper-position-low-side','B','mastery:keeper-position-low-side',false,'keeper-position'),
('keeper-position-low-side','C','mastery:keeper-position-low-side',true,'keeper-position'),
('keeper-position-recover','A','mastery:keeper-position-recover',false,'keeper-position'),
('keeper-position-recover','B','mastery:keeper-position-recover',true,'keeper-position'),
('keeper-position-recover','C','mastery:keeper-position-recover',false,'keeper-position'),
('keeper-position-support','A','mastery:keeper-position-support',true,'keeper-position'),
('keeper-position-support','B','mastery:keeper-position-support',false,'keeper-position'),
('keeper-position-support','C','mastery:keeper-position-support',false,'keeper-position'),
('keeper-position-set','A','mastery:keeper-position-set',false,'keeper-position'),
('keeper-position-set','B','mastery:keeper-position-set',false,'keeper-position'),
('keeper-position-set','C','mastery:keeper-position-set',true,'keeper-position'),
('keeper-out-wide','A','mastery:keeper-out-wide',true,'keeper-distribution'),
('keeper-out-wide','B','mastery:keeper-out-wide',false,'keeper-distribution'),
('keeper-out-wide','C','mastery:keeper-out-wide',true,'keeper-distribution'),
('keeper-out-pressure','A','mastery:keeper-out-pressure',false,'keeper-distribution'),
('keeper-out-pressure','B','mastery:keeper-out-pressure',true,'keeper-distribution'),
('keeper-out-pressure','C','mastery:keeper-out-pressure',false,'keeper-distribution'),
('keeper-out-switch','A','mastery:keeper-out-switch',false,'keeper-distribution'),
('keeper-out-switch','B','mastery:keeper-out-switch',false,'keeper-distribution'),
('keeper-out-switch','C','mastery:keeper-out-switch',true,'keeper-distribution'),
('keeper-out-return','A','mastery:keeper-out-return',true,'keeper-distribution'),
('keeper-out-return','B','mastery:keeper-out-return',true,'keeper-distribution'),
('keeper-out-return','C','mastery:keeper-out-return',false,'keeper-distribution'),
('keeper-out-carry','A','mastery:keeper-out-carry',true,'keeper-distribution'),
('keeper-out-carry','B','mastery:keeper-out-carry',true,'keeper-distribution'),
('keeper-out-carry','C','mastery:keeper-out-carry',false,'keeper-distribution'),
('keeper-out-over','A','mastery:keeper-out-over',false,'keeper-distribution'),
('keeper-out-over','B','mastery:keeper-out-over',false,'keeper-distribution'),
('keeper-out-over','C','mastery:keeper-out-over',true,'keeper-distribution'),
('keeper-support','0','quiz:keeper-support',true,'football-foundations'),
('keeper-support','1','quiz:keeper-support',false,'football-foundations'),
('keeper-support','2','quiz:keeper-support',false,'football-foundations'),
('keeper-support','3','quiz:keeper-support',false,'football-foundations'),
('defensive-connection','0','quiz:defensive-connection',false,'football-foundations'),
('defensive-connection','1','quiz:defensive-connection',true,'football-foundations'),
('defensive-connection','2','quiz:defensive-connection',false,'football-foundations'),
('defensive-connection','3','quiz:defensive-connection',false,'football-foundations'),
('forward-first-touch','0','quiz:forward-first-touch',false,'football-foundations'),
('forward-first-touch','1','quiz:forward-first-touch',false,'football-foundations'),
('forward-first-touch','2','quiz:forward-first-touch',true,'football-foundations'),
('forward-first-touch','3','quiz:forward-first-touch',false,'football-foundations'),
('six-protect-and-connect','0','quiz:six-protect-and-connect',false,'teamwork-trailblazers'),
('six-protect-and-connect','1','quiz:six-protect-and-connect',false,'teamwork-trailblazers'),
('six-protect-and-connect','2','quiz:six-protect-and-connect',false,'teamwork-trailblazers'),
('six-protect-and-connect','3','quiz:six-protect-and-connect',true,'teamwork-trailblazers'),
('scan-information','0','quiz:scan-information',true,'football-foundations'),
('scan-information','1','quiz:scan-information',false,'football-foundations'),
('scan-information','2','quiz:scan-information',false,'football-foundations'),
('scan-information','3','quiz:scan-information',false,'football-foundations'),
('after-the-pass','0','quiz:after-the-pass',false,'football-foundations'),
('after-the-pass','1','quiz:after-the-pass',true,'football-foundations'),
('after-the-pass','2','quiz:after-the-pass',false,'football-foundations'),
('after-the-pass','3','quiz:after-the-pass',false,'football-foundations'),
('press-and-cover','0','quiz:press-and-cover',false,'teamwork-trailblazers'),
('press-and-cover','1','quiz:press-and-cover',false,'teamwork-trailblazers'),
('press-and-cover','2','quiz:press-and-cover',true,'teamwork-trailblazers'),
('press-and-cover','3','quiz:press-and-cover',false,'teamwork-trailblazers'),
('earps-2023-award','0','quiz:earps-2023-award',false,'teamwork-trailblazers'),
('earps-2023-award','1','quiz:earps-2023-award',false,'teamwork-trailblazers'),
('earps-2023-award','2','quiz:earps-2023-award',false,'teamwork-trailblazers'),
('earps-2023-award','3','quiz:earps-2023-award',true,'teamwork-trailblazers'),
('williamson-euro-captain','0','quiz:williamson-euro-captain',true,'teamwork-trailblazers'),
('williamson-euro-captain','1','quiz:williamson-euro-captain',false,'teamwork-trailblazers'),
('williamson-euro-captain','2','quiz:williamson-euro-captain',false,'teamwork-trailblazers'),
('williamson-euro-captain','3','quiz:williamson-euro-captain',false,'teamwork-trailblazers'),
('shaw-helps-jamaica','0','quiz:shaw-helps-jamaica',false,'teamwork-trailblazers'),
('shaw-helps-jamaica','1','quiz:shaw-helps-jamaica',true,'teamwork-trailblazers'),
('shaw-helps-jamaica','2','quiz:shaw-helps-jamaica',false,'teamwork-trailblazers'),
('shaw-helps-jamaica','3','quiz:shaw-helps-jamaica',false,'teamwork-trailblazers');
insert into star_private.learning_reward_catalogue values ('pass',array['mastery:pass-wide','mastery:pass-switch','mastery:pass-gap','mastery:pass-reset','mastery:pass-pressure','mastery:pass-combination'],'theme-passing-lanes'),
('space',array['mastery:space-angle','mastery:space-width','mastery:space-distance','mastery:space-behind','mastery:space-pocket','mastery:space-after-pass'],'theme-open-pitch'),
('next',array['mastery:next-carry','mastery:next-pressure','mastery:next-square','mastery:next-finish','mastery:next-protect','mastery:next-reset'],'frame-next-move'),
('touch',array['mastery:touch-away','mastery:touch-open','mastery:touch-control','mastery:touch-line','mastery:touch-settle','mastery:touch-connect'],'decoration-touch-trail'),
('defend',array['mastery:defend-delay','mastery:defend-wide','mastery:defend-cover','mastery:defend-runner','mastery:defend-recover','mastery:defend-cutback'],'frame-hold-line'),
('counter',array['mastery:counter-wide','mastery:counter-far-side','mastery:counter-two-one','mastery:counter-release','mastery:counter-reset','mastery:counter-carry'],'decoration-breakaway'),
('keeper-position',array['mastery:keeper-position-central','mastery:keeper-position-high-side','mastery:keeper-position-low-side','mastery:keeper-position-recover','mastery:keeper-position-support','mastery:keeper-position-set'],'frame-between-posts'),
('keeper-distribution',array['mastery:keeper-out-wide','mastery:keeper-out-pressure','mastery:keeper-out-switch','mastery:keeper-out-return','mastery:keeper-out-carry','mastery:keeper-out-over'],'theme-build-back'),
('football-foundations',array['quiz:keeper-support','quiz:defensive-connection','quiz:forward-first-touch','quiz:scan-information','quiz:after-the-pass'],'theme-notebook'),
('teamwork-trailblazers',array['quiz:six-protect-and-connect','quiz:press-and-cover','quiz:earps-2023-award','quiz:williamson-euro-captain','quiz:shaw-helps-jamaica'],'frame-learning-crest');
alter table public.player_cosmetic_unlocks drop constraint player_cosmetic_unlocks_cosmetic_check;
alter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check check(cosmetic in ('avatar-captain','avatar-comet','avatar-shield','decoration-lightning','decoration-laurel','decoration-starburst','ball-nike-10','ball-gold-50','learning-badge-pass','theme-passing-lanes','learning-badge-space','theme-open-pitch','learning-badge-next','frame-next-move','learning-badge-touch','decoration-touch-trail','learning-badge-defend','frame-hold-line','learning-badge-counter','decoration-breakaway','learning-badge-keeper-position','frame-between-posts','learning-badge-keeper-distribution','theme-build-back','learning-badge-football-foundations','theme-notebook','learning-badge-teamwork-trailblazers','frame-learning-crest','hair-high-bun','hair-double-braids','hair-half-up','hair-curly-ponytail','hair-twisted-bun','hair-short-crop'));
alter table public.player_space_profiles add column frame text not null default 'none' check(frame in ('none','next-move','hold-line','between-posts','learning-crest'));
alter table public.player_space_profiles drop constraint player_space_profiles_theme_check;
alter table public.player_space_profiles add constraint player_space_profiles_theme_check check(theme in ('midnight','stadium','scrapbook','passing-lanes','open-pitch','build-back','notebook'));
alter table public.player_space_profiles drop constraint player_space_profiles_decoration_check;
alter table public.player_space_profiles add constraint player_space_profiles_decoration_check check(decoration in ('none','lightning','laurel','starburst','touch-trail','breakaway'));
alter table public.player_space_profiles drop constraint player_space_profiles_hero_hair_type_check;
alter table public.player_space_profiles add constraint player_space_profiles_hero_hair_type_check check(hero_hair_type in ('ponytail','curls','coils','braids','high-bun','double-braids','half-up','curly-ponytail','twisted-bun','short-crop'));
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
 if hairstyle is null or hairstyle not in ('high-bun','double-braids','half-up','curly-ponytail','twisted-bun','short-crop') then raise exception 'Choose an available hairstyle' using errcode='22023';end if;
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
