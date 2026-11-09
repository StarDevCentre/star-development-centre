-- Guest-only festival bookings. Public users cannot query, list or modify child records.
-- Review on an isolated database before applying to production.
-- Run with the project's migration tooling; never expose the service role key to the browser.

create table if not exists public.star_festival_bookings (
 id uuid primary key default gen_random_uuid(),
 event_slug text not null default 'christmas-football-festival-2026'
    check (event_slug = 'christmas-football-festival-2026'),
 seat_number smallint not null check (seat_number between 1 and 36),
 status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
 ticket_price_pence integer not null check (ticket_price_pence in (1000,1500)),
 guardian_first_name text not null check (length(trim(guardian_first_name)) between 2 and 80),
 guardian_last_name text not null check (length(trim(guardian_last_name)) between 2 and 80),
 guardian_email text not null check (length(guardian_email) between 5 and 254),
 guardian_phone text not null check (length(guardian_phone) between 7 and 40),
 guardian_relationship text not null check (length(trim(guardian_relationship)) between 2 and 80),
 player_first_name text not null check (length(trim(player_first_name)) between 2 and 80),
 player_last_name text not null check (length(trim(player_last_name)) between 2 and 80),
 player_dob date not null check (player_dob between date '2009-12-22' and date '2021-12-21'),
 player_club text check (length(player_club) <= 120),
 player_photo_path text check (player_photo_path is null or player_photo_path ~ '^christmas-2026/[0-9a-f-]{36}\.jpg$'),
 emergency_name text not null check (length(trim(emergency_name)) between 2 and 160),
 emergency_relationship text not null check (length(trim(emergency_relationship)) between 2 and 80),
 emergency_phone text not null check (length(emergency_phone) between 7 and 40),
 medical_status text not null check (medical_status in ('none_known','details')),
 medical_conditions text not null default '' check (length(medical_conditions) <= 1200),
 allergies text not null default '' check (length(allergies) <= 800),
 medication text not null default '' check (length(medication) <= 800),
 emergency_plan text not null default '' check (length(emergency_plan) <= 1200),
 support_notes text not null default '' check (length(support_notes) <= 800),
 guardian_authority_confirmed boolean not null check (guardian_authority_confirmed = true),
 health_processing_consent boolean not null check (health_processing_consent = true),
 privacy_acknowledged boolean not null check (privacy_acknowledged = true),
 event_media_consent boolean not null default false,
 consent_version text not null default '2026-11-festival-v1',
 consent_recorded_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint festival_medical_details_if_selected check (medical_status='none_known' or length(trim(medical_conditions || allergies || medication || emergency_plan))>0),
 constraint festival_ticket_matches_seat check ((seat_number<=12 and ticket_price_pence=1000) or (seat_number>12 and ticket_price_pence=1500))
);
comment on table public.star_festival_bookings is 'Restricted child event bookings including special-category health data; never expose publicly or email medical details.';
create unique index if not exists star_festival_active_seat on public.star_festival_bookings(event_slug, seat_number) where status in ('pending','confirmed');
create unique index if not exists star_festival_active_child on public.star_festival_bookings(event_slug, lower(guardian_email), lower(player_first_name), player_dob) where status in ('pending','confirmed');
create index if not exists star_festival_bookings_status on public.star_festival_bookings(status,created_at desc);

alter table public.star_festival_bookings enable row level security;
revoke all on public.star_festival_bookings from public,anon,authenticated;
grant select,update on public.star_festival_bookings to authenticated;

create policy "Only active owners and managers see festival bookings"
 on public.star_festival_bookings for select to authenticated
 using (exists (
   select 1 from public.staff_members s
   where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
 ));
create policy "Only active owners and managers update festival status"
 on public.star_festival_bookings for update to authenticated
 using (exists (
   select 1 from public.staff_members s
   where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
 ))
 with check (exists (
   select 1 from public.staff_members s
   where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
 ));

-- Identification photos must remain private, served only with short-lived signed URLs to authorised staff.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('star-festival-photos','star-festival-photos',false,1024000,array['image/jpeg'])
on conflict (id) do nothing;
create policy "Active STAR managers may read private festival photos"
 on storage.objects for select to authenticated
 using (
   bucket_id='star-festival-photos'
   and exists (
     select 1 from public.staff_members s
     where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
   )
 );
-- No anon or authenticated insert/update/delete photo policies:
-- the Edge Function writes on the trusted server using the service role only.
