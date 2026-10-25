-- Original STAR badge artwork, with coach awards protected by the existing roster permissions.
create table public.achievement_badges (
 id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null,
 collection text not null,
 image_path text not null check (image_path = '/badges/' || id || '.png')
);
alter table public.achievement_badges enable row level security;
revoke all on public.achievement_badges from anon, authenticated;
grant select on public.achievement_badges to authenticated;
create policy badge_catalogue_read on public.achievement_badges for select to authenticated using (true);

insert into public.achievement_badges (id, title, collection, image_path) values
 ('1v1-guardian-legendary', '1v1 Guardian', 'Legendary', '/badges/1v1-guardian-legendary.png'),
 ('1v1-specialist-collection-2', '1v1 Specialist', 'Collection 2', '/badges/1v1-specialist-collection-2.png'),
 ('1v1-specialist-gold', '1v1 Specialist', 'Gold', '/badges/1v1-specialist-gold.png'),
 ('academic-excellence-collection-2', 'Academic Excellence', 'Collection 2', '/badges/academic-excellence-collection-2.png'),
 ('accuracy-collection-2', 'Accuracy', 'Collection 2', '/badges/accuracy-collection-2.png'),
 ('aerial-threat-collection-2', 'Aerial Threat', 'Collection 2', '/badges/aerial-threat-collection-2.png'),
 ('balance-collection-2', 'Balance', 'Collection 2', '/badges/balance-collection-2.png'),
 ('ball-control-collection-2', 'Ball Control', 'Collection 2', '/badges/ball-control-collection-2.png'),
 ('brave-heart-silver', 'Brave Heart', 'Silver', '/badges/brave-heart-silver.png'),
 ('breakthrough-silver', 'Breakthrough', 'Silver', '/badges/breakthrough-silver.png'),
 ('calm-under-pressure-collection-2', 'Calm Under Pressure', 'Collection 2', '/badges/calm-under-pressure-collection-2.png'),
 ('century-club-legendary', 'Century Club', 'Legendary', '/badges/century-club-legendary.png'),
 ('clinical-finisher-collection-2', 'Clinical Finisher', 'Collection 2', '/badges/clinical-finisher-collection-2.png'),
 ('coach-s-choice-bronze', 'Coach’s Choice', 'Bronze', '/badges/coach-s-choice-bronze.png'),
 ('coachability-champion-legendary', 'Coachability Champion', 'Legendary', '/badges/coachability-champion-legendary.png'),
 ('comeback-collection-2', 'Comeback', 'Collection 2', '/badges/comeback-collection-2.png'),
 ('comeback-kid-gold', 'Comeback Kid', 'Gold', '/badges/comeback-kid-gold.png'),
 ('commanding-keeper-gold', 'Commanding Keeper', 'Gold', '/badges/commanding-keeper-gold.png'),
 ('community-impact-collection-2', 'Community Impact', 'Collection 2', '/badges/community-impact-collection-2.png'),
 ('consistency-collection-2', 'Consistency', 'Collection 2', '/badges/consistency-collection-2.png'),
 ('creative-player-collection-2', 'Creative Player', 'Collection 2', '/badges/creative-player-collection-2.png'),
 ('decision-maker-gold', 'Decision Maker', 'Gold', '/badges/decision-maker-gold.png'),
 ('dedication-collection-2', 'Dedication', 'Collection 2', '/badges/dedication-collection-2.png'),
 ('defensive-rock-collection-2', 'Defensive Rock', 'Collection 2', '/badges/defensive-rock-collection-2.png'),
 ('distribution-collection-2', 'Distribution', 'Collection 2', '/badges/distribution-collection-2.png'),
 ('distribution-expert-platinum', 'Distribution Expert', 'Platinum', '/badges/distribution-expert-platinum.png'),
 ('eyes-up-bronze', 'Eyes Up', 'Bronze', '/badges/eyes-up-bronze.png'),
 ('finishing-specialist-legendary', 'Finishing Specialist', 'Legendary', '/badges/finishing-specialist-legendary.png'),
 ('first-steps-bronze', 'First Steps', 'Bronze', '/badges/first-steps-bronze.png'),
 ('first-touch-wizard-bronze', 'First Touch Wizard', 'Bronze', '/badges/first-touch-wizard-bronze.png'),
 ('fitness-hero-collection-2', 'Fitness Hero', 'Collection 2', '/badges/fitness-hero-collection-2.png'),
 ('game-iq-collection-2', 'Game IQ', 'Collection 2', '/badges/game-iq-collection-2.png'),
 ('game-reader-silver', 'Game Reader', 'Silver', '/badges/game-reader-silver.png'),
 ('goal-achieved-legendary', 'Goal Achieved', 'Legendary', '/badges/goal-achieved-legendary.png'),
 ('goal-setter-collection-2', 'Goal Setter', 'Collection 2', '/badges/goal-setter-collection-2.png'),
 ('independent-learner-platinum', 'Independent Learner', 'Platinum', '/badges/independent-learner-platinum.png'),
 ('lead-by-example-collection-2', 'Lead By Example', 'Collection 2', '/badges/lead-by-example-collection-2.png'),
 ('level-up-bronze', 'Level Up', 'Bronze', '/badges/level-up-bronze.png'),
 ('never-give-up-bronze', 'Never Give Up', 'Bronze', '/badges/never-give-up-bronze.png'),
 ('next-step-collection-2', 'Next Step', 'Collection 2', '/badges/next-step-collection-2.png'),
 ('on-your-way-gold', 'On Your Way', 'Gold', '/badges/on-your-way-gold.png'),
 ('opportunity-seeker-collection-2', 'Opportunity Seeker', 'Collection 2', '/badges/opportunity-seeker-collection-2.png'),
 ('overcomer-collection-2', 'Overcomer', 'Collection 2', '/badges/overcomer-collection-2.png'),
 ('pace-collection-2', 'Pace', 'Collection 2', '/badges/pace-collection-2.png'),
 ('personal-best-collection-2', 'Personal Best', 'Collection 2', '/badges/personal-best-collection-2.png'),
 ('player-of-the-month-silver', 'Player Of The Month', 'Silver', '/badges/player-of-the-month-silver.png'),
 ('positive-influence-gold', 'Positive Influence', 'Gold', '/badges/positive-influence-gold.png'),
 ('power-collection-2', 'Power', 'Collection 2', '/badges/power-collection-2.png'),
 ('practice-pays-off-gold', 'Practice Pays Off', 'Gold', '/badges/practice-pays-off-gold.png'),
 ('precision-passer-silver', 'Precision Passer', 'Silver', '/badges/precision-passer-silver.png'),
 ('problem-solver-collection-2', 'Problem Solver', 'Collection 2', '/badges/problem-solver-collection-2.png'),
 ('progress-maker-collection-2', 'Progress Maker', 'Collection 2', '/badges/progress-maker-collection-2.png'),
 ('reliability-collection-2', 'Reliability', 'Collection 2', '/badges/reliability-collection-2.png'),
 ('rising-star-platinum', 'Rising Star', 'Platinum', '/badges/rising-star-platinum.png'),
 ('safe-hands-bronze', 'Safe Hands', 'Bronze', '/badges/safe-hands-bronze.png'),
 ('set-piece-specialist-collection-2', 'Set Piece Specialist', 'Collection 2', '/badges/set-piece-specialist-collection-2.png'),
 ('shot-stopper-collection-2', 'Shot Stopper', 'Collection 2', '/badges/shot-stopper-collection-2.png'),
 ('shot-stopper-silver', 'Shot Stopper', 'Silver', '/badges/shot-stopper-silver.png'),
 ('skill-artist-gold', 'Skill Artist', 'Gold', '/badges/skill-artist-gold.png'),
 ('sportsmanship-collection-2', 'Sportsmanship', 'Collection 2', '/badges/sportsmanship-collection-2.png'),
 ('star-legend-legendary', 'STAR Legend', 'Legendary', '/badges/star-legend-legendary.png'),
 ('star-of-the-month-gold', 'STAR Of The Month', 'Gold', '/badges/star-of-the-month-gold.png'),
 ('star-regular-platinum', 'STAR Regular', 'Platinum', '/badges/star-regular-platinum.png'),
 ('tactical-player-collection-2', 'Tactical Player', 'Collection 2', '/badges/tactical-player-collection-2.png'),
 ('tactical-thinker-platinum', 'Tactical Thinker', 'Platinum', '/badges/tactical-thinker-platinum.png'),
 ('team-first-collection-2', 'Team First', 'Collection 2', '/badges/team-first-collection-2.png'),
 ('team-first-platinum', 'Team First', 'Platinum', '/badges/team-first-platinum.png'),
 ('two-footed-talent-platinum', 'Two Footed Talent', 'Platinum', '/badges/two-footed-talent-platinum.png'),
 ('versatile-player-collection-2', 'Versatile Player', 'Collection 2', '/badges/versatile-player-collection-2.png'),
 ('vision-collection-2', 'Vision', 'Collection 2', '/badges/vision-collection-2.png'),
 ('visionary-legendary', 'Visionary', 'Legendary', '/badges/visionary-legendary.png'),
 ('welcome-to-star-silver', 'Welcome to STAR', 'Silver', '/badges/welcome-to-star-silver.png');

alter table public.player_achievements add column badge_id text references public.achievement_badges(id);
create unique index player_badge_once_per_day on public.player_achievements (player_id, badge_id, awarded_on) where badge_id is not null;
create index player_achievements_badge_idx on public.player_achievements (badge_id) where badge_id is not null;

-- Qualify the outer player ID: an approved link must match this achievement's player.
drop policy achievement_read on public.player_achievements;
create policy achievement_read on public.player_achievements for select to authenticated using (
 (select star_private.is_staff_manager())
 or ((select star_private.is_active_staff()) and exists (
   select 1 from public.coaching_assignments a
   where a.player_id = player_achievements.player_id and a.staff_user_id = (select auth.uid())
 ))
 or exists (
   select 1 from public.guardian_player_links l
   where l.player_id = player_achievements.player_id and l.guardian_id = (select auth.uid())
 )
);

drop policy achievement_staff_insert on public.player_achievements;
create policy achievement_staff_insert on public.player_achievements for insert to authenticated with check (
 awarded_by = (select auth.uid()) and (
  (select star_private.is_staff_manager())
  or ((select star_private.is_active_staff()) and exists (
    select 1 from public.coaching_assignments a
    where a.player_id = player_achievements.player_id and a.staff_user_id = (select auth.uid())
  ))
 )
);
-- Preserve existing text achievements and read/insert-only privileges. Families cannot award badges.
