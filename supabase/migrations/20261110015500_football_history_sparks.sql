-- Keep existing Trailblazers awards. Sparks has its own IDs in the same ledger.
alter table star_private.football_history_answers
 drop constraint football_history_answers_card_id_check,
 add constraint football_history_answers_card_id_check
 check (card_id between 1 and 30 or card_id between 101 and 130);

insert into star_private.football_history_answers(card_id,answers) values
 (101,array[0,0,2,2,2]),
 (102,array[0,0,2,0,0]),
 (103,array[2,1,1,2,0]),
 (104,array[1,0,1,2,2]),
 (105,array[1,1,0,2,2]),
 (106,array[0,2,2,0,0]),
 (107,array[2,2,0,2,1]),
 (108,array[2,2,0,2,1]),
 (109,array[0,1,2,1,0]),
 (110,array[2,2,2,1,0]),
 (111,array[0,1,0,1,0]),
 (112,array[2,1,1,0,2]),
 (113,array[1,1,0,0,1]),
 (114,array[0,2,0,1,1]),
 (115,array[2,0,1,2,0]),
 (116,array[1,2,0,1,1]),
 (117,array[1,1,2,2,2]),
 (118,array[0,0,1,1,2]),
 (119,array[0,0,2,2,2]),
 (120,array[2,0,1,1,1]),
 (121,array[2,2,1,1,0]),
 (122,array[1,1,0,1,0]),
 (123,array[2,0,2,2,1]),
 (124,array[2,2,2,0,2]),
 (125,array[1,2,2,1,0]),
 (126,array[2,0,2,1,1]),
 (127,array[1,1,2,1,2]),
 (128,array[2,1,0,2,2]),
 (129,array[1,2,2,2,1]),
 (130,array[2,0,1,0,0]);

-- Return an edition only, never the date of birth. Match booking's London age calculation.
create function public.football_history_edition(target_player uuid)
returns text language plpgsql stable security definer set search_path='' as $$
declare
 birth date;
 years integer;
begin
 if target_player is null or auth.uid() is null or star_private.can_use_player(target_player) is not true then
  raise exception 'Player access required' using errcode='42501';
 end if;
 birth:=star_private.booking_dob(target_player);
 years:=extract(year from age((now() at time zone 'Europe/London')::date,birth));
 return case when birth is null or birth>(now() at time zone 'Europe/London')::date then 'unknown'
             when years<5 then 'under-five'
             when years<11 then 'sparks' else 'trailblazers' end;
end;
$$;
revoke all on function public.football_history_edition(uuid) from public, anon, authenticated;
grant execute on function public.football_history_edition(uuid) to authenticated;

-- Preserve the existing atomic marking, cooldown and idempotent award implementation.
alter function public.submit_football_history_quiz(uuid,smallint,integer[]) set schema star_private;
revoke all on function star_private.submit_football_history_quiz(uuid,smallint,integer[]) from public, anon, authenticated;

create function public.submit_football_history_quiz(target_player uuid, target_card smallint, choices integer[])
returns public.player_history_progress
language plpgsql security definer set search_path='' as $$
declare edition text;
begin
 edition:=public.football_history_edition(target_player);
 if target_card is null or not (
   (edition='sparks' and target_card between 101 and 130) or
   (edition='trailblazers' and target_card between 1 and 30)
 ) then
  raise exception 'Quiz is not in the player’s current edition' using errcode='42501';
 end if;
 return star_private.submit_football_history_quiz(target_player,target_card,choices);
end;
$$;
revoke all on function public.submit_football_history_quiz(uuid,smallint,integer[]) from public, anon, authenticated;
grant execute on function public.submit_football_history_quiz(uuid,smallint,integer[]) to authenticated;
