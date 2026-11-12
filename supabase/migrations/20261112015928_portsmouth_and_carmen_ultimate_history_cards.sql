-- Ultimate Challenges UC07 and UC08: Portsmouth buswomen and Carmen Pomies.
alter table star_private.football_history_answers
 drop constraint football_history_answers_card_id_check,
 drop constraint football_history_answers_answers_check;
alter table star_private.football_history_answers
 add constraint football_history_answers_card_id_check check (card_id between 1 and 49 or card_id between 101 and 130),
 add constraint football_history_answers_answers_check check (cardinality(answers)=case when card_id in (42,43,44,45,46,47,48,49) then 7 else 5 end);
insert into star_private.football_history_answers(card_id,answers) values
 (48,array[2,0,3,1,2,0,3]),
 (49,array[1,2,0,3,1,2,0]);

alter table public.player_history_progress
 drop constraint player_history_progress_score_check,
 drop constraint player_history_progress_check;
alter table public.player_history_progress
 add constraint player_history_progress_score_check check (score between 0 and case when card_id in (42,43,44,45,46,47,48,49) then 7 else 5 end),
 add constraint player_history_progress_check check (
  (score=case when card_id in (42,43,44,45,46,47,48,49) then 7 else 5 end and earned_at is not null and retry_at is null)
  or (score<case when card_id in (42,43,44,45,46,47,48,49) then 7 else 5 end and earned_at is null and retry_at is not null)
 );

create or replace function star_private.submit_football_history_quiz(target_player uuid,target_card smallint,choices integer[])
returns public.player_history_progress language plpgsql security definer set search_path='' as $$
declare answer_key integer[]; progress public.player_history_progress; mark smallint; attempted_at timestamptz; total integer; max_option integer;
begin
 if target_player is null or auth.uid() is null or star_private.can_use_player(target_player) is not true then
  raise exception 'Player access required' using errcode='42501';
 end if;
 select answers into answer_key from star_private.football_history_answers where card_id=target_card;
 if not found then raise exception 'Unknown history card' using errcode='22023'; end if;
 total:=cardinality(answer_key);
 max_option:=case when target_card in (42,43,44,45,46,47,48,49) then 3 else 2 end;
 if choices is null or array_ndims(choices) is distinct from 1
  or array_lower(choices,1) is distinct from 1 or cardinality(choices)<>total
  or exists(select 1 from unnest(choices) as option_index where option_index is null or option_index not between 0 and max_option) then
  raise exception 'Choose one valid answer for each of the % questions',total using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('football-history:'||target_player::text||':'||target_card::text,0));
 attempted_at:=clock_timestamp();
 select * into progress from public.player_history_progress where player_id=target_player and card_id=target_card;
 if progress.earned_at is not null or progress.retry_at>attempted_at then return progress; end if;
 select count(*) into mark from generate_series(1,total) as answer_no where choices[answer_no]=answer_key[answer_no];
 insert into public.player_history_progress(player_id,card_id,score,retry_at,earned_at)
 values(target_player,target_card,mark,
  case when mark<total then attempted_at+interval '20 minutes' end,
  case when mark=total then attempted_at end)
 on conflict(player_id,card_id) do update
 set score=excluded.score,retry_at=excluded.retry_at,earned_at=excluded.earned_at returning * into progress;
 return progress;
end;
$$;

create or replace function public.submit_football_history_quiz(target_player uuid, target_card smallint, choices integer[])
returns public.player_history_progress
language plpgsql security definer set search_path='' as $$
declare edition text;
begin
 edition:=public.football_history_edition(target_player);
 if target_card is null or not (
   (edition='sparks' and target_card between 101 and 130) or
   (edition='trailblazers' and target_card between 1 and 49)
 ) then
  raise exception 'Quiz is not in the player’s current edition' using errcode='42501';
 end if;
 return star_private.submit_football_history_quiz(target_player,target_card,choices);
end;
$$;

