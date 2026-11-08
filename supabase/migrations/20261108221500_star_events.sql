-- STAR Events: independent public event calendar.
-- Drafts are visible only to active owner/manager staff. No child or family data is stored here.
-- Apply this migration before using the new Events manager. Do not run on production during PR review.

create table if not exists public.star_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title text not null check (length(trim(title)) between 4 and 140),
  summary text not null check (length(trim(summary)) between 12 and 300),
  description text not null check (length(trim(description)) between 20 and 10000),
  category text not null check (category in ('Holiday camps','Skills clinics','Open days','Tournaments','Community events')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue_name text not null check (length(trim(venue_name)) between 3 and 150),
  venue_address text,
  minimum_age smallint check (minimum_age between 3 and 18),
  maximum_age smallint check (maximum_age between 3 and 18),
  price_pence integer check (price_pence >= 0),
  capacity integer check (capacity between 1 and 1000),
  registration_url text check (registration_url is null or registration_url ~ '^https://[^[:space:]]+$'),
  image_url text check (image_url is null or image_url ~ '^https://[^[:space:]]+$'),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint star_event_dates_valid check (ends_at > starts_at),
  constraint star_event_age_range_valid check (minimum_age is null or maximum_age is null or minimum_age <= maximum_age)
);

create index if not exists star_events_public_date_idx on public.star_events (status,starts_at);

alter table public.star_events enable row level security;
grant select on public.star_events to anon,authenticated;
grant insert,update,delete on public.star_events to authenticated;

create policy "STAR public events and authorised managers can read"
on public.star_events for select to anon,authenticated
using (
  status in ('published','cancelled')
  or exists (
    select 1 from public.staff_members s
    where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
  )
);

create policy "STAR managers create events"
on public.star_events for insert to authenticated
with check (
  exists (
    select 1 from public.staff_members s
    where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
  )
);

create policy "STAR managers update events"
on public.star_events for update to authenticated
using (
  exists (
    select 1 from public.staff_members s
    where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
  )
)
with check (
  exists (
    select 1 from public.staff_members s
    where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
  )
);

create policy "STAR managers delete events"
on public.star_events for delete to authenticated
using (
  exists (
    select 1 from public.staff_members s
    where s.user_id=(select auth.uid()) and s.active=true and s.role in ('owner','manager')
  )
);
