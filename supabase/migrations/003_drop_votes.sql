-- Run this once in the Supabase SQL editor. Voting was removed since the
-- app now recommends a single destination — this drops the now-unused
-- votes table. Safe to skip if you'd rather keep the historical data.

drop table if exists votes;
