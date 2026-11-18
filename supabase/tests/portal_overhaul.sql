-- Synthetic data for a disposable database. All fixtures and notifications roll back.
begin;
do $$
declare
  staff uuid:=gen_random_uuid();
  second_coach uuid:=gen_random_uuid();
  guardian uuid:=gen_random_uuid();
  stranger uuid:=gen_random_uuid();
  player_user uuid:=gen_random_uuid();
  player uuid:=gen_random_uuid();
  spark uuid:=gen_random_uuid();
  session uuid:=gen_random_uuid();
  booking uuid;
  direct_booking uuid;
  direct_session uuid;
  revision uuid;
  old_revision uuid;
  plan uuid:=gen_random_uuid();
  message uuid:=gen_random_uuid();
  assignment uuid:=gen_random_uuid();
  check_in uuid;
  monday date:=(date_trunc('week',now() at time zone 'Europe/London')+interval '14 days')::date;
  start_time timestamptz:=(monday+time '10:00') at time zone 'Europe/London';
  next_time timestamptz:=(monday+time '12:00') at time zone 'Europe/London';
  blocked_time timestamptz:=(monday+time '14:00') at time zone 'Europe/London';
  past uuid:=gen_random_uuid();
  spark_date uuid:=gen_random_uuid();
  next_spark_date uuid:=gen_random_uuid();
  created uuid;
  details jsonb;
  finished timestamptz;
begin
  insert into auth.users(id,email,email_confirmed_at,is_anonymous)
  select id,id::text||'@example.invalid',now(),false from unnest(array[staff,second_coach,guardian,stranger,player_user]) id;
  insert into public.staff_members(user_id,role,active) values(staff,'owner',true),(second_coach,'coach',true);
  perform set_config('request.jwt.claim.sub',staff::text,true);
  insert into public.guardian_profiles(user_id,display_name) values(guardian,'Fixture guardian'),(stranger,'Fixture stranger');
  insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
  values(player,'Fixture','Individual','1-to-1',true,staff,staff),(spark,'Fixture','Sparks','Sparks',true,staff,staff);
  insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(guardian,player,staff),(guardian,spark,staff);
  insert into public.player_intakes(creator_id,guardian_id,first_name,last_name,date_of_birth,portal_player_id)
  values(guardian,guardian,'Fixture','Individual',(monday-interval '13 years')::date,player),
    (guardian,guardian,'Fixture','Sparks',(monday-interval '6 years')::date,spark);
  insert into public.player_account_links(user_id,player_id,approved_by) values(player_user,player,guardian);

  created:=public.star_staff_book_player(session,player,'1-to-1',start_time,'Fixture field','First touch');
  assert created=session,'Booking returned the calendar ID';
  assert public.star_staff_book_player(session,player,'1-to-1',start_time,'Fixture field','First touch')=session,'Booking retry keeps its ID';
  assert (select count(*) from public.training_session_participants where session_id=session and player_id=player)=1,'One register entry';
  select id,venue_version into booking,revision from public.family_session_schedule where source_session_id=session;
  assert booking is not null,'One shared projection for both portals';

  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
  values(gen_random_uuid(),'Blocked fixture','Other',blocked_time,blocked_time+interval '1 hour','Fixture field',staff);
  begin
    insert into public.training_attendance(session_id,player_id,status,recorded_by) values(session,player,'present',staff);
    raise exception 'TEST: Future attendance was recorded';
  exception when raise_exception then
    if sqlerrm like 'TEST:%' then raise;end if;
  end;

  perform set_config('request.jwt.claim.sub',stranger::text,true);
  assert not exists(select 1 from public.star_player_move_slots(booking,monday)),'An unrelated parent sees no appointment availability';
  begin
    perform public.star_open_player_venue(booking,revision);
    raise exception 'TEST: An unrelated account marked the venue opened';
  exception when raise_exception then
    if sqlerrm like 'TEST:%' then raise;end if;
  end;

  perform set_config('request.jwt.claim.sub',guardian::text,true);
  assert not exists(select 1 from public.star_player_move_slots(booking,monday) where starts_at=blocked_time),'Occupied slots cannot be selected';
  begin
    perform public.star_move_player_booking(booking,start_time,blocked_time);
    raise exception 'TEST: Occupied slot accepted';
  exception when raise_exception then
    if sqlerrm like 'TEST:%' then raise;end if;
  end;
  assert (select starts_at from public.training_sessions where id=session)=start_time,'Failed move keeps the original time';
  assert public.star_move_player_booking(booking,start_time,next_time)=next_time,'Linked guardian moves directly';
  assert (select starts_at from public.family_session_schedule where id=booking)=next_time,'Move updates the same projection';
  assert (select count(*) from star_private.booking_moves where session_id=session)=1,'One successful move';
  assert public.star_move_player_booking(booking,start_time,next_time)=next_time,'Move retry is safe';
  assert (select count(*) from star_private.booking_moves where session_id=session)=1,'Retry produces no extra move';
  assert public.star_open_player_venue(booking,revision) is not null,'Guardian opened the actual venue';

  perform set_config('request.jwt.claim.sub',staff::text,true);
  assert (select count(*) from public.star_session_venue_openings(session) where opened_at is not null)=1,'Coach sees the real venue open';
  old_revision:=revision;
  update public.training_sessions set venue='Updated fixture field' where id=session;
  select venue_version into revision from public.family_session_schedule where id=booking;
  assert revision<>old_revision,'New venue has its own version';
  assert (select count(*) from public.star_session_venue_openings(session) where opened_at is not null)=0,'Old open does not confirm a changed venue';
  assert public.star_save_session_plan(plan,session,'Fixture plan','{"target":60,"activities":[]}',null)=plan,'Plan saved to the booking';
  assert exists(select 1 from public.staff_session_plan_links where training_session_id=session and plan_id=plan),'New plan link saved together';

  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
  values(past,'Finished fixture','Other',now()-interval '2 days',now()-interval '2 days'+interval '1 hour','Fixture field',staff);
  insert into public.training_session_participants(session_id,player_id,added_by) values(past,player,staff);
  finished:=public.star_complete_training_session(past,
    jsonb_build_array(jsonb_build_object('player_id',player,'status','present')),
    jsonb_build_array(jsonb_build_object('player_id',player,'category','Technical','observation','First touch into space.')));
  assert (select completed_at from public.training_sessions where id=past)=finished,'Completion persisted';
  assert (select count(*) from public.coaching_observations where session_id=past)=1,'Write-up saved once';
  perform public.star_complete_training_session(past,'[]','[]');
  assert (select count(*) from public.coaching_observations where session_id=past)=1,'Finish retry writes no duplicate notes';

  insert into public.player_space_messages(id,player_id,sender_id,sender_role,body)
  values(message,player,staff,'coach','Fixture shared message.');
  insert into public.player_training_assignments(id,player_id,title,instructions,created_by)
  values(assignment,player,'Fixture practice','Practise first touch into space.',staff);
  perform set_config('request.jwt.claim.sub',player_user::text,true);
  check_in:=public.star_try_home_practice(assignment);
  assert public.star_try_home_practice(assignment,'I tried taking a touch away from the cone.')=check_in,'Reflection updates the same quick check-in';
  assert public.star_mark_shared_chat_read(player,array[message])=1,'Player reads shared conversation';
  assert public.star_mark_shared_chat_read(player,array[message])=0,'Repeat read is idempotent';
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  assert public.star_count_shared_chat_unread()=1,'Guardian has a separate unread state';
  assert exists(select 1 from public.parent_notifications where user_id=guardian and source_id=message),'Existing parent update path is used';

  -- Coach-separated group scheduling and the same existing order and roster model.
  perform set_config('request.jwt.claim.sub',staff::text,true);
  insert into star_private.booking_coaches(coach_id,coach_name,parent_venue,enabled,services)
  values(staff,'Fixture coach','Fixture field',true,array['one_to_one']::text[]),
    (second_coach,'Second coach','Fixture field',true,array['one_to_one']::text[]);
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  details:=public.star_direct_booking('book',jsonb_build_object('player_id',player,'service_id','one_to_one',
    'coach_id',staff,'dates',jsonb_build_array(monday::text||'T10:00'),'client_id',gen_random_uuid()));
  select f.id,f.source_session_id into direct_booking,direct_session from public.family_session_schedule f
  join star_private.booking_places p on p.session_id=f.source_session_id and p.player_id=f.player_id
  where p.order_id=(details->>'order_id')::uuid;
  assert direct_session is not null,'Native direct booking created';
  assert public.star_move_player_booking(direct_booking,start_time,(monday+time '16:45') at time zone 'Europe/London')
    =(monday+time '16:45') at time zone 'Europe/London','Guarded direct booking moves in place';
  assert exists(select 1 from star_private.booking_places p where p.session_id=direct_session and p.order_id=(details->>'order_id')::uuid),'The original direct order stays joined';
  perform set_config('request.jwt.claim.sub',staff::text,true);

  insert into star_private.booking_sessions(session_id,service_id,coach_id,capacity,enabled,created_by)
  values(spark_date,'sparks_5_7',second_coach,10,true,staff);
  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
  values(spark_date,'STAR Sparks · ages 5–7','Sparks',(monday+time '15:45') at time zone 'Europe/London',
    (monday+time '16:45') at time zone 'Europe/London','Fixture pitch',staff);
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  details:=public.star_direct_booking('book',jsonb_build_object('player_id',spark,'service_id','sparks_5_7','session_id',spark_date,'weekly_sparks',true,'client_id',gen_random_uuid()));
  assert (details->>'confirmed')::boolean,'Weekly Sparks place secured via normal booking';
  perform set_config('request.jwt.claim.sub',staff::text,true);
  insert into star_private.booking_sessions(session_id,service_id,coach_id,capacity,enabled,created_by)
  values(next_spark_date,'sparks_5_7',second_coach,10,true,staff);
  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
  values(next_spark_date,'STAR Sparks · ages 5–7','Sparks',((monday+7)+time '15:45') at time zone 'Europe/London',
    ((monday+7)+time '16:45') at time zone 'Europe/London','Fixture pitch',staff);
  assert exists(select 1 from public.training_session_participants where session_id=next_spark_date and player_id=spark),'Later release reserves the weekly place';
  perform set_config('request.jwt.claim.sub',guardian::text,true);
  perform public.star_sparks_membership(spark,'absence',spark_date);
  assert (select status from public.training_attendance where session_id=spark_date and player_id=spark)='excused','Single absence is recorded as excused';
  assert (select count(*) from star_private.booking_places where player_id=spark and cancelled_at is null)=2,'Absence leaves the weekly place intact';
  perform public.star_sparks_membership(spark,'end');
  assert not exists(select 1 from star_private.booking_places where player_id=spark and cancelled_at is null),'Ending weekly place cancels upcoming dates';
  assert not exists(select 1 from public.family_session_schedule where player_id=spark),'Cancelled group dates leave the family schedule';
end $$;
rollback;
