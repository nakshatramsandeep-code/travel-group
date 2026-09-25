-- Run this once in the Supabase SQL editor if your project was created
-- before the itinerary/images feature was added.

alter table options
  add column if not exists itinerary jsonb not null default '[]',
  add column if not exists images jsonb not null default '[]';
