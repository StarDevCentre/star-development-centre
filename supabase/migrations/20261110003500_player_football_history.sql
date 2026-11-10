-- The private answer key and the account-scoped award are independent of other learning rewards.
create table star_private.football_history_answers (
 card_id smallint primary key check (card_id between 1 and 30),
 answers integer[] not null check (cardinality(answers) = 5)
);
revoke all on star_private.football_history_answers from public, anon, authenticated;
insert into star_private.football_history_answers (card_id, answers) values
 (1,array[2,0,2,0,1]),
 (2,array[2,0,0,2,2]),
 (3,array[0,1,1,2,0]),
 (4,array[1,0,0,2,0]),
 (5,array[1,2,1,1,2]),
 (6,array[1,0,1,1,1]),
 (7,array[1,1,1,1,0]),
 (8,array[1,1,2,0,2]),
 (9,array[2,2,2,0,1]),
 (10,array[0,2,1,2,2]),
 (11,array[0,1,1,1,1]),
 (12,array[1,2,2,2,0]),
 (13,array[0,2,2,1,2]),
 (14,array[2,1,0,2,0]),
 (15,array[0,0,0,0,2]),
 (16,array[0,0,0,0,1]),
 (17,array[1,2,0,1,2]),
 (18,array[0,2,2,0,0]),
 (19,array[0,1,0,1,1]),
 (20,array[1,0,0,0,1]),
 (21,array[1,1,0,2,2]),
 (22,array[2,1,2,0,2]),
 (23,array[0,2,1,2,0]),
 (24,array[2,0,0,1,1]),
 (25,array[2,2,2,2,0]),
 (26,array[0,1,1,0,1]),
 (27,array[0,1,1,2,2]),
 (28,array[1,2,2,2,2]),
 (29,array[2,0,1,2,1]),
 (30,array[1,1,0,2,2]);

create table public.player_history_progress (
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 card_id smallint not null references star_private.football_history_answers(card_id),
 score smallint not null check (score between 0 and 5),
 retry_at timestamptz,
 earned_at timestamptz,
 primary key (player_id, card_id),
 check ((score = 5 and earned_at is not null and retry_at is null)
     or (score < 5 and earned_at is null and retry_at is not null))
);
alter table public.player_history_progress enable row level security;
revoke all on public.player_history_progress from public, anon, authenticated;
grant select on public.player_history_progress to authenticated;
create policy history_progress_read on public.player_history_progress for select to authenticated
 using (star_private.can_use_player(player_id));

create function public.submit_football_history_quiz(target_player uuid, target_card smallint, choices integer[])
returns public.player_history_progress
language plpgsql security definer set search_path='' as $$
declare
 answer_key integer[];
 progress public.player_history_progress;
 mark smallint;
 attempted_at timestamptz;
begin
 if target_player is null or auth.uid() is null or star_private.can_use_player(target_player) is not true then
  raise exception 'Player access required' using errcode='42501';
 end if;
 if choices is null or array_ndims(choices) is distinct from 1
   or array_lower(choices,1) is distinct from 1 or cardinality(choices) <> 5
   or exists(select 1 from unnest(choices) as option_index where option_index is null or option_index not between 0 and 2) then
  raise exception 'Choose one answer for each of the five questions' using errcode='22023';
 end if;
 select answers into answer_key from star_private.football_history_answers where card_id=target_card;
 if not found then raise exception 'Unknown history card' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('football-history:'||target_player::text||':'||target_card::text,0));
 attempted_at := clock_timestamp();
 select * into progress from public.player_history_progress where player_id=target_player and card_id=target_card;
 if progress.earned_at is not null or progress.retry_at > attempted_at then return progress; end if;

 select count(*) into mark from generate_series(1,5) as answer_no where choices[answer_no]=answer_key[answer_no];
 insert into public.player_history_progress(player_id,card_id,score,retry_at,earned_at)
 values (target_player,target_card,mark,
   case when mark<5 then attempted_at+interval '20 minutes' end,
   case when mark=5 then attempted_at end)
 on conflict(player_id,card_id) do update
 set score=excluded.score,retry_at=excluded.retry_at,earned_at=excluded.earned_at
 returning * into progress;
 return progress;
end;
$$;
revoke all on function public.submit_football_history_quiz(uuid,smallint,integer[]) from public, anon, authenticated;
grant execute on function public.submit_football_history_quiz(uuid,smallint,integer[]) to authenticated;
