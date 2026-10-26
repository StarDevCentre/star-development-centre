-- Appearance choices are optional cosmetic settings, available to all players.
-- Existing player/family profile policies continue to restrict record access.
alter table public.player_space_profiles
 add column hero_skin text not null default 'light' check(hero_skin in ('fair','light','medium','brown','deep')),
 add column hero_hair_colour text not null default 'blonde' check(hero_hair_colour in ('blonde','brown','black','ginger','silver')),
 add column hero_hair_type text not null default 'ponytail' check(hero_hair_type in ('ponytail','curls','coils','braids'));
grant update(hero_skin,hero_hair_colour,hero_hair_type) on public.player_space_profiles to authenticated;
