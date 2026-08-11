alter table public.profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists suffix text,
  add column if not exists username text,
  add column if not exists country text,
  add column if not exists date_of_birth date;

-- Add a unique constraint to username. Only one person can have a specific username.
-- We use unique index instead of unique constraint so it ignores nulls cleanly in PG < 15,
-- or we can just use unique constraint (PG 15+ handles nulls nicely but it's safe either way).
create unique index if not exists profiles_username_idx on public.profiles (username);
