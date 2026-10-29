-- Free illustrated scenes, private family squads, server-validated boot rewards.
alter table public.player_space_profiles drop constraint player_space_profiles_theme_check;
alter table public.player_space_profiles add constraint player_space_profiles_theme_check check(theme in ('midnight','stadium','scrapbook','floodlit','street','sunset','futsal','rainy','tunnel','graffiti','star-navy','passing-lanes','open-pitch','build-back','notebook'));
create or replace function star_private.validate_learning_look() returns trigger language plpgsql set search_path='' as $$
declare needed text;
begin
 foreach needed in array array[
  case when new.theme not in ('midnight','stadium','scrapbook','floodlit','street','sunset','futsal','rainy','tunnel','graffiti','star-navy') then 'theme-'||new.theme end,
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
declare selected text;keepers text[]:=array['hampton','yamashita','tullis-joyce'];roster text[]:=array['hampton','yamashita','tullis-joyce','williamson','fox','bronze','greenwood','le-tissier','little','cuthbert','hasegawa','toone','kirby','kendall','russo','james','shaw','terland','seike','daly'];
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
alter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check check(cosmetic in ('avatar-captain','avatar-comet','avatar-shield','decoration-lightning','decoration-laurel','decoration-starburst','ball-nike-10','ball-gold-50','learning-badge-pass','theme-passing-lanes','learning-badge-space','theme-open-pitch','learning-badge-next','frame-next-move','learning-badge-touch','decoration-touch-trail','learning-badge-defend','frame-hold-line','learning-badge-counter','decoration-breakaway','learning-badge-keeper-position','frame-between-posts','learning-badge-keeper-distribution','theme-build-back','learning-badge-football-foundations','theme-notebook','learning-badge-teamwork-trailblazers','frame-learning-crest','hair-high-bun','hair-double-braids','hair-half-up','hair-curly-ponytail','hair-twisted-bun','hair-short-crop','boot-tiempo','boot-copa','boot-mercurial','boot-predator','boot-future','boot-ultra','boot-phantom','boot-f50'));
create table star_private.boot_challenge_options(item text not null,choice text not null,marker text not null,useful boolean not null,primary key(item,choice));
create table star_private.boot_reward_catalogue(challenge text primary key,requirements text[] not null,cosmetic text not null unique);
alter table star_private.boot_challenge_options enable row level security;
alter table star_private.boot_reward_catalogue enable row level security;
revoke all on star_private.boot_challenge_options,star_private.boot_reward_catalogue from public,anon,authenticated;
insert into star_private.boot_challenge_options(item,choice,marker,useful) values
('touch-space','A','mastery:boot:touch-space',true),
('touch-space','B','mastery:boot:touch-space',false),
('touch-space','C','mastery:boot:touch-space',false),
('touch-weight','A','mastery:boot:touch-weight',false),
('touch-weight','B','mastery:boot:touch-weight',true),
('touch-weight','C','mastery:boot:touch-weight',false),
('touch-shield','A','mastery:boot:touch-shield',false),
('touch-shield','B','mastery:boot:touch-shield',false),
('touch-shield','C','mastery:boot:touch-shield',true),
('pass-route','A','mastery:boot:pass-route',false),
('pass-route','B','mastery:boot:pass-route',true),
('pass-route','C','mastery:boot:pass-route',false),
('pass-weight','A','mastery:boot:pass-weight',true),
('pass-weight','B','mastery:boot:pass-weight',false),
('pass-weight','C','mastery:boot:pass-weight',false),
('pass-support','A','mastery:boot:pass-support',false),
('pass-support','B','mastery:boot:pass-support',false),
('pass-support','C','mastery:boot:pass-support',true),
('dribble-close','A','mastery:boot:dribble-close',true),
('dribble-close','B','mastery:boot:dribble-close',false),
('dribble-close','C','mastery:boot:dribble-close',false),
('dribble-space','A','mastery:boot:dribble-space',false),
('dribble-space','B','mastery:boot:dribble-space',true),
('dribble-space','C','mastery:boot:dribble-space',false),
('dribble-exit','A','mastery:boot:dribble-exit',false),
('dribble-exit','B','mastery:boot:dribble-exit',false),
('dribble-exit','C','mastery:boot:dribble-exit',true),
('finish-look','A','mastery:boot:finish-look',false),
('finish-look','B','mastery:boot:finish-look',true),
('finish-look','C','mastery:boot:finish-look',false),
('finish-balance','A','mastery:boot:finish-balance',true),
('finish-balance','B','mastery:boot:finish-balance',false),
('finish-balance','C','mastery:boot:finish-balance',false),
('finish-choice','A','mastery:boot:finish-choice',false),
('finish-choice','B','mastery:boot:finish-choice',false),
('finish-choice','C','mastery:boot:finish-choice',true),
('defend-delay','A','mastery:boot:defend-delay',false),
('defend-delay','B','mastery:boot:defend-delay',true),
('defend-delay','C','mastery:boot:defend-delay',false),
('defend-guide','A','mastery:boot:defend-guide',true),
('defend-guide','B','mastery:boot:defend-guide',false),
('defend-guide','C','mastery:boot:defend-guide',false),
('defend-cover','A','mastery:boot:defend-cover',false),
('defend-cover','B','mastery:boot:defend-cover',false),
('defend-cover','C','mastery:boot:defend-cover',true),
('keeper-set','A','mastery:boot:keeper-set',true),
('keeper-set','B','mastery:boot:keeper-set',false),
('keeper-set','C','mastery:boot:keeper-set',false),
('keeper-angle','A','mastery:boot:keeper-angle',false),
('keeper-angle','B','mastery:boot:keeper-angle',true),
('keeper-angle','C','mastery:boot:keeper-angle',false),
('keeper-out','A','mastery:boot:keeper-out',false),
('keeper-out','B','mastery:boot:keeper-out',false),
('keeper-out','C','mastery:boot:keeper-out',true),
('scan-before','A','mastery:boot:scan-before',true),
('scan-before','B','mastery:boot:scan-before',false),
('scan-before','C','mastery:boot:scan-before',false),
('scan-change','A','mastery:boot:scan-change',false),
('scan-change','B','mastery:boot:scan-change',true),
('scan-change','C','mastery:boot:scan-change',false),
('scan-use','A','mastery:boot:scan-use',false),
('scan-use','B','mastery:boot:scan-use',false),
('scan-use','C','mastery:boot:scan-use',true),
('team-width','A','mastery:boot:team-width',false),
('team-width','B','mastery:boot:team-width',true),
('team-width','C','mastery:boot:team-width',false),
('team-support','A','mastery:boot:team-support',true),
('team-support','B','mastery:boot:team-support',false),
('team-support','C','mastery:boot:team-support',false),
('team-transition','A','mastery:boot:team-transition',false),
('team-transition','B','mastery:boot:team-transition',false),
('team-transition','C','mastery:boot:team-transition',true);
insert into star_private.boot_reward_catalogue(challenge,requirements,cosmetic) values
('first-touch',array['mastery:boot:touch-space','mastery:boot:touch-weight','mastery:boot:touch-shield'],'boot-tiempo'),
('passing',array['mastery:boot:pass-route','mastery:boot:pass-weight','mastery:boot:pass-support'],'boot-copa'),
('dribbling',array['mastery:boot:dribble-close','mastery:boot:dribble-space','mastery:boot:dribble-exit'],'boot-mercurial'),
('finishing',array['mastery:boot:finish-look','mastery:boot:finish-balance','mastery:boot:finish-choice'],'boot-predator'),
('defending',array['mastery:boot:defend-delay','mastery:boot:defend-guide','mastery:boot:defend-cover'],'boot-future'),
('goalkeeping',array['mastery:boot:keeper-set','mastery:boot:keeper-angle','mastery:boot:keeper-out'],'boot-ultra'),
('scanning',array['mastery:boot:scan-before','mastery:boot:scan-change','mastery:boot:scan-use'],'boot-phantom'),
('teamwork',array['mastery:boot:team-width','mastery:boot:team-support','mastery:boot:team-transition'],'boot-f50');
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
