-- Run this once in the Supabase SQL editor if your project was created
-- before the itinerary feature was added. No images are stored in the
-- database (photos aren't part of this app), so only the itinerary
-- column is needed.

alter table options
  add column if not exists itinerary jsonb not null default '[]';
