-- Migration: add scope_note to trips
-- Run this once in your Supabase project's SQL Editor.
--
-- Stores the AI's transparency note when it judged a trip's requested
-- destination too narrowly-scoped for the requested number of days (e.g.
-- 5 days for a single landmark) and expanded planning scope to the
-- surrounding area. Null on trips where no expansion was needed.

alter table trips
  add column if not exists scope_note text;
