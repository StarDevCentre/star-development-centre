-- Card 40: Jamaica’s Reggae Girlz, qualification for France 2019, for players aged 11-18.
-- The answer key stays private; client JSON contains only options.
alter table star_private.football_history_answers
 drop constraint football_history_answers_card_id_check,
 add constraint football_history_answers_card_id_check
 check (card_id between 1 and 40 or card_id between 101 and 130);

insert into star_private.football_history_answers(card_id,answers)
values (40,array[0,1,2,0,1]);

create or replace function public.submit_football_history_quiz(target_player uuid, target_card smallint, choices integer[])
returns public.player_history_progress
language plpgsql security definer set search_path='' as $$
declare edition text;
begin
 edition:=public.football_history_edition(target_player);
 if target_card is null or not (
   (edition='sparks' and target_card between 101 and 130) or
   (edition='trailblazers' and target_card between 1 and 40)
 ) then
  raise exception 'Quiz is not in the player’s current edition' using errcode='42501';
 end if;
 return star_private.submit_football_history_quiz(target_player,target_card,choices);
end;
$$;
