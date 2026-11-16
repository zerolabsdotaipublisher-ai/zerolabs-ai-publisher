import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20261115225827_profile_follows.sql", "utf8");

describe("profile follows migration contract", () => {
  it("creates the canonical user-to-user follow table with durable relationship constraints", () => {
    expect(migration).toContain("create table if not exists public.profile_follows");
    expect(migration).toContain("id uuid primary key default gen_random_uuid()");
    expect(migration).toContain("follower_user_id uuid not null references auth.users(id) on delete cascade");
    expect(migration).toContain("followed_user_id uuid not null references auth.users(id) on delete cascade");
    expect(migration).toContain("created_at timestamptz not null default now()");
    expect(migration).toContain("unique (follower_user_id, followed_user_id)");
    expect(migration).toContain("check (follower_user_id <> followed_user_id)");
    expect(migration).toContain("idx_profile_follows_followed_user_id");
    expect(migration).toContain("idx_profile_follows_follower_user_id");
  });

  it("uses RLS to permit public reads and only owner-managed outgoing follow rows", () => {
    expect(migration).toContain("alter table public.profile_follows enable row level security");
    expect(migration).toContain("revoke all on table public.profile_follows from anon, authenticated");
    expect(migration).toContain("grant select on table public.profile_follows to anon, authenticated");
    expect(migration).toContain("grant insert, delete on table public.profile_follows to authenticated");
    expect(migration).toContain('for select\n  to anon, authenticated\n  using (true)');
    expect(migration).toContain('for insert\n  to authenticated\n  with check ((select auth.uid()) = follower_user_id)');
    expect(migration).toContain('for delete\n  to authenticated\n  using ((select auth.uid()) = follower_user_id)');
    expect(migration).not.toContain("auth.role()");
    expect(migration).not.toContain("grant update");
  });
});
