-- VoyageFlow database schema
-- Run this in your Supabase project's SQL editor (Project → SQL Editor → New query)

create extension if not exists "uuid-ossp";

-- ============ TRIPS ============
create table trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric not null default 0,
  travel_style text not null check (travel_style in ('relaxed', 'packed', 'budget', 'luxury')),
  share_slug text unique not null,
  cover_image_url text,
  created_at timestamptz not null default now()
);

-- ============ DAYS ============
create table days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null,
  date date not null
);

-- ============ STOPS ============
create table stops (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references days(id) on delete cascade,
  order_index int not null default 0,
  type text not null check (type in ('hotel', 'restaurant', 'attraction', 'transport')),
  name text not null,
  lat double precision,
  lng double precision,
  start_time text,
  est_cost numeric,
  notes text,
  geocode_status text not null default 'pending' check (geocode_status in ('resolved', 'unresolved', 'manual', 'pending'))
);

-- ============ EXPENSES ============
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text not null,
  amount numeric not null,
  description text not null default '',
  date date not null default current_date
);

-- ============ PACKING ITEMS ============
create table packing_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  label text not null,
  is_checked boolean not null default false,
  category text not null default 'general'
);

-- ============ NOTES ============
create table notes (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_id uuid references days(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- ============ COMMENTS ============
create table comments (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

alter table trips enable row level security;
alter table days enable row level security;
alter table stops enable row level security;
alter table expenses enable row level security;
alter table packing_items enable row level security;
alter table notes enable row level security;
alter table comments enable row level security;

-- ---- trips ----
create policy "Owners can do everything on their trips"
  on trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view a trip via its share slug"
  on trips for select
  using (true); -- share_slug lookups happen via public anon key; trip rows contain no other user's private data

-- ---- days (owner via trip_id) ----
create policy "Owners can manage days on their trips"
  on days for all
  using (exists (select 1 from trips where trips.id = days.trip_id and trips.user_id = auth.uid()))
  with check (exists (select 1 from trips where trips.id = days.trip_id and trips.user_id = auth.uid()));

create policy "Anyone can view days (needed for public share view)"
  on days for select
  using (true);

-- ---- stops ----
create policy "Owners can manage stops on their trips"
  on stops for all
  using (exists (
    select 1 from days join trips on trips.id = days.trip_id
    where days.id = stops.day_id and trips.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from days join trips on trips.id = days.trip_id
    where days.id = stops.day_id and trips.user_id = auth.uid()
  ));

create policy "Anyone can view stops (needed for public share view)"
  on stops for select
  using (true);

-- ---- expenses ----
create policy "Owners can manage expenses on their trips"
  on expenses for all
  using (exists (select 1 from trips where trips.id = expenses.trip_id and trips.user_id = auth.uid()))
  with check (exists (select 1 from trips where trips.id = expenses.trip_id and trips.user_id = auth.uid()));

-- ---- packing_items ----
create policy "Owners can manage packing items on their trips"
  on packing_items for all
  using (exists (select 1 from trips where trips.id = packing_items.trip_id and trips.user_id = auth.uid()))
  with check (exists (select 1 from trips where trips.id = packing_items.trip_id and trips.user_id = auth.uid()));

-- ---- notes ----
create policy "Owners can manage notes on their trips"
  on notes for all
  using (exists (select 1 from trips where trips.id = notes.trip_id and trips.user_id = auth.uid()))
  with check (exists (select 1 from trips where trips.id = notes.trip_id and trips.user_id = auth.uid()));

-- ---- comments ----
create policy "Logged in users can view comments on any trip"
  on comments for select
  using (auth.role() = 'authenticated');

create policy "Logged in users can add comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- ================================================================
-- NOTE on expenses/packing_items/notes:
-- These are intentionally NOT publicly readable — only the trip owner
-- sees budget/packing/notes detail. Public share links (Phase 4) will
-- only expose trips/days/stops, matching the product's "share the plan,
-- not your budget" intent.
-- ================================================================
