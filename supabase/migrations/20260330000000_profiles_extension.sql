-- Extend the profiles table with future-ready optional JSONB columns.
-- These are nullable by design — no existing rows need migrating.

alter table public.profiles
  add column if not exists preferences jsonb,
  add column if not exists metadata     jsonb;
