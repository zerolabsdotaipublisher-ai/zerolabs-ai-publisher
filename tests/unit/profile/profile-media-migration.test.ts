import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20261108213159_profile_media_supabase_storage.sql", "utf8");
const backgroundMigration = readFileSync("supabase/migrations/20261110000000_profile_page_background_media.sql", "utf8");

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

describe("profile page background Storage migration", () => {
  it("adds background-only policies without rewriting the applied avatar/cover migration", () => {
    expect(migration).toContain("(storage.foldername(name))[2] in ('avatar', 'cover')");
    expect(backgroundMigration).toContain("profile_media_background_select_own_v1");
    expect(backgroundMigration).toContain("profile_media_background_insert_own_v1");
    expect(backgroundMigration).toContain("profile_media_background_update_own_v1");
    expect(backgroundMigration).toContain("profile_media_background_delete_own_v1");
    expect(backgroundMigration).toContain("drop policy if exists \"profile_media_background_select_own_v1\"");
    expect(backgroundMigration).toContain("(storage.foldername(name))[2] = 'background'");
    expect(backgroundMigration).toContain("to authenticated");
    expect(backgroundMigration).toContain("auth.jwt() ->> 'sub'");
    expect(backgroundMigration).not.toContain("auth.role()");
    expect(backgroundMigration).not.toContain("'avatar', 'cover', 'background'");
    expect(backgroundMigration).not.toContain("'other'");
  });
});
