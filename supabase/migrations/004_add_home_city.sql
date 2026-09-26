-- Run this once in the Supabase SQL editor. Adds each person's home city
-- so the Oracle can factor in travel distance/duration when picking a
-- destination.

alter table submissions
  add column if not exists home_city text not null default '';
