-- Migration: add currency support to trips
-- Run this once in your Supabase project's SQL Editor.
--
-- New trips are always created in PKR going forward (VoyageFlow's primary
-- market). Existing trips predate this column and were created with USD
-- figures, so they're explicitly backfilled to 'USD' rather than silently
-- becoming PKR (which would mislabel their existing dollar amounts as rupees).

alter table trips
  add column if not exists currency text not null default 'PKR' check (currency in ('USD', 'PKR'));

update trips set currency = 'USD' where created_at < now();
