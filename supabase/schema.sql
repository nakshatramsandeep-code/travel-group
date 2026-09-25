-- Run this once in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists trips (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  group_size    int not null check (group_size > 0),
  deadline      timestamptz not null,
  member_names  text[] not null,
  share_token   text unique not null,
  admin_token   text unique not null,
  status        text not null default 'collecting'
                  check (status in ('collecting', 'options_generated', 'locked')),
  locked_option_id uuid,
  locked_at     timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists submissions (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references trips(id) on delete cascade,
  member_name       text not null,
  budget_min        int not null check (budget_min >= 0),
  budget_max        int not null check (budget_max >= budget_min),
  date_ranges       jsonb not null,
  destination_types text[] not null,
  hard_nos          text[] not null default '{}',
  hard_no_notes     text not null default '',
  submitted_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (trip_id, member_name)
);

create table if not exists options (
  id                    uuid primary key default gen_random_uuid(),
  trip_id               uuid not null references trips(id) on delete cascade,
  rank                  int not null,
  destination           text not null,
  dates                 jsonb not null,
  est_cost_per_person   jsonb not null,
  fit_scores            jsonb not null,
  tradeoffs             text not null,
  itinerary             jsonb not null default '[]',
  generated_at          timestamptz not null default now()
);

create table if not exists votes (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id) on delete cascade,
  member_name   text not null,
  option_id     uuid not null references options(id) on delete cascade,
  voted_at      timestamptz not null default now(),
  unique (trip_id, member_name)
);

alter table trips
  add constraint trips_locked_option_fk
  foreign key (locked_option_id) references options(id);

create index if not exists submissions_trip_id_idx on submissions(trip_id);
create index if not exists options_trip_id_idx on options(trip_id);
create index if not exists votes_trip_id_idx on votes(trip_id);

-- RLS: enabled with permissive policies since there is no auth layer.
-- All real gatekeeping (deadline checks, lock checks, token checks) happens
-- in the Next.js API routes using the service-level anon key on the server.
alter table trips enable row level security;
alter table submissions enable row level security;
alter table options enable row level security;
alter table votes enable row level security;

create policy "allow all trips" on trips for all using (true) with check (true);
create policy "allow all submissions" on submissions for all using (true) with check (true);
create policy "allow all options" on options for all using (true) with check (true);
create policy "allow all votes" on votes for all using (true) with check (true);
