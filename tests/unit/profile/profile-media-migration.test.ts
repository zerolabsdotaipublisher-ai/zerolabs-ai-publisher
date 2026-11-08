import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20261108213159_profile_media_supabase_storage.sql", "utf8");

describe("profile-media Supabase Storage migration", () => {
  it("creates a private, constrained bucket and authenticated user-folder policies", () => {
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("'profile-media'");
    expect(migration).toContain("false");
    expect(migration).toContain("4194304");
    expect(migration).toContain("'image/jpeg', 'image/png', 'image/webp', 'image/gif'");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("auth.jwt() ->> 'sub'");
    expect(migration).not.toContain("auth.role()");
    expect(migration).toContain('for select');
    expect(migration).toContain('for insert');
    expect(migration).toContain('for update');
    expect(migration).toContain('for delete');
  });
});
