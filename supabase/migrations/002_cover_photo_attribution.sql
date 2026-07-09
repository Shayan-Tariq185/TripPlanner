-- Migration: add photographer attribution columns for destination cover photos
-- Run this once in your Supabase project's SQL Editor.
--
-- cover_image_url already exists from the original schema — this migration
-- only adds the two attribution columns needed to credit Pexels photographers,
-- which their license requires whenever we display their photos.

alter table trips
  add column if not exists cover_photographer_name text,
  add column if not exists cover_photographer_url text;
