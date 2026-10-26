-- Coaching attendance rewards use the coach-maintained register, never practice
-- diary entries or client-supplied counts. Earned cosmetics remain unlocked.
alter table public.player_space_profiles add column hero_ball text not null default 'classic'
 check(hero_ball in ('classic','adidas-multicolour','mitre-yellow','adidas-womens','nike-yellow-orange','gold-90'));
grant update(hero_ball) on public.player_space_profiles to authenticated;
alter table public.player_cosmetic_unlocks drop constraint player_cosmetic_unlocks_cosmetic_check;
alter table public.player_cosmetic_unlocks add constraint player_cosmetic_unlocks_cosmetic_check
 check(cosmetic in ('avatar-captain','avatar-comet','avatar-shield','decoration-lightning','decoration-laurel','decoration-starburst','ball-nike-10','ball-gold-50'));
create index training_attendance_player_idx on public.training_attendance(player_id);

create function star_private.refresh_player_ball_rewards(target_player uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare attended integer;begin
 if auth.uid() is not null and not (star_private.can_use_player(target_player) or star_private.can_coach_player(target_player)) then raise exception 'No ball reward source access' using errcode='42501';end if;
 select count(*)::integer into attended from public.training_attendance a join public.training_sessions s on s.id=a.session_id
 where a.player_id=target_player and a.status in ('present','late') and s.ends_at<=now();
 insert into public.player_cosmetic_unlocks(player_id,cosmetic)
 select target_player,reward from (values('ball-nike-10',attended>=10),('ball-gold-50',attended>=50)) rewards(reward,earned)
 where earned on conflict do nothing;
 return attended;
end $$;
revoke all on function star_private.refresh_player_ball_rewards(uuid) from public,anon,authenticated;
create function star_private.player_ball_progress(target_player uuid) returns integer
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not star_private.can_use_player(target_player) then raise exception 'No player access' using errcode='42501';end if;
 return star_private.refresh_player_ball_rewards(target_player);
end $$;
revoke all on function star_private.player_ball_progress(uuid) from public,anon;
grant execute on function star_private.player_ball_progress(uuid) to authenticated;
create function public.player_ball_progress(target_player uuid) returns integer
language sql security invoker set search_path='' as $$select star_private.player_ball_progress(target_player)$$;
revoke all on function public.player_ball_progress(uuid) from public,anon;
grant execute on function public.player_ball_progress(uuid) to authenticated;

create function star_private.award_attendance_balls() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_table_schema<>'public' or tg_table_name<>'training_attendance' then raise exception 'Unsupported ball reward source';end if;
 perform star_private.refresh_player_ball_rewards(new.player_id);return new;
end $$;
revoke all on function star_private.award_attendance_balls() from public,anon,authenticated;
create trigger attendance_ball_rewards after insert or update of status,player_id,session_id on public.training_attendance for each row execute function star_private.award_attendance_balls();
create function star_private.refresh_rescheduled_ball_rewards() returns trigger language plpgsql security definer set search_path='' as $$declare pid uuid;begin
 if tg_table_schema<>'public' or tg_table_name<>'training_sessions' then raise exception 'Unsupported ball reward source';end if;
 for pid in select player_id from public.training_attendance where session_id=new.id loop perform star_private.refresh_player_ball_rewards(pid);end loop;
 return new;
end $$;
revoke all on function star_private.refresh_rescheduled_ball_rewards() from public,anon,authenticated;
create trigger rescheduled_ball_rewards after update of ends_at on public.training_sessions for each row when(old.ends_at is distinct from new.ends_at) execute function star_private.refresh_rescheduled_ball_rewards();
create function star_private.validate_player_ball() returns trigger language plpgsql security invoker set search_path='' as $$declare reward text;begin
 reward:=case new.hero_ball when 'nike-yellow-orange' then 'ball-nike-10' when 'gold-90' then 'ball-gold-50' else null end;
 if reward is not null and not exists(select 1 from public.player_cosmetic_unlocks where player_id=new.player_id and cosmetic=reward) then raise exception 'Attend more coaching sessions to unlock this ball' using errcode='23514';end if;
 return new;
end $$;
revoke all on function star_private.validate_player_ball() from public,anon,authenticated;
create trigger validate_player_ball before insert or update of hero_ball on public.player_space_profiles for each row execute function star_private.validate_player_ball();

create or replace function star_private.notify_player_update() returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid; category_name text; heading text; detail text; destination text; source text;
begin
 if tg_table_schema<>'public' then raise exception 'Unsupported notification source'; end if;
 if tg_table_name='player_training_feedback' then
  select a.player_id into pid from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=new.diary_id;
  category_name:='message';heading:='Your coach left practice feedback';detail:='Open your practice diary to read it.';destination:='training';source:='feedback:'||new.diary_id::text||':'||md5(new.feedback);
 elsif tg_table_name='player_space_messages' then
  if new.sender_role<>'coach' then return new; end if;
  pid:=new.player_id;category_name:='message';heading:='A new message from your coach';detail:='Your linked parent or guardian can read the conversation too.';destination:='messages';source:='message:'||new.id;
 elsif tg_table_name='player_coach_notes' then
  pid:=new.player_id;category_name:='message';heading:='Your weekly coach message is ready';detail:='Open your inbox to read this week’s encouragement and focus.';destination:='messages';source:='note:'||new.id||':'||md5(new.body);
 elsif tg_table_name='player_training_assignments' then
  pid:=new.player_id;category_name:='practice';heading:=case when tg_op='INSERT' then 'New coach-assigned practice' else 'Your practice plan was updated' end;detail:=new.title;destination:='training';source:='practice:'||new.id||':'||md5(to_jsonb(new)::text);
 elsif tg_table_name='family_session_schedule' then
  pid:=new.player_id;category_name:='session';heading:=case when tg_op='INSERT' then 'Your next session is ready' else 'Your session details changed' end;detail:=new.title;destination:='home';source:='session:'||new.id||':'||md5(to_jsonb(new)::text);
 elsif tg_table_name='player_goal_events' then
  pid:=new.player_id;category_name:='goal';heading:=case when new.kind='achieved' then 'A goal worth celebrating' else 'Your goals have an update' end;detail:=new.goal;destination:='journey';source:='goal:'||new.id;
 elsif tg_table_name='player_achievements' then
  pid:=new.player_id;category_name:='badge';heading:='Your coach recognised your progress';detail:=new.title;destination:='trophies';source:='award:'||new.id;
 elsif tg_table_name='player_cosmetic_unlocks' then
  pid:=new.player_id;category_name:='cosmetic';heading:='You unlocked a new extra';detail:='Find your new ball, avatar or decoration in Style my space.';destination:='home';source:='cosmetic:'||pid||':'||new.cosmetic;
 else raise exception 'Unsupported notification source'; end if;
 if auth.uid() is not null and not (star_private.can_use_player(pid) or star_private.can_coach_player(pid)) then raise exception 'No notification source access' using errcode='42501'; end if;
 insert into public.player_notifications(player_id,category,title,body,tab,source_key) values(pid,category_name,heading,detail,destination,source) on conflict do nothing;
 return new;
end $$;

-- Include existing completed attendance in milestone awards.
select star_private.refresh_player_ball_rewards(id) from public.coaching_players;
