import { describe, expect, it } from "vitest";
import { resolveIsolatedTestEnvironment } from "@/tests/integration/support/isolated-environment";

const validLocalEnvironment = {
  ZERO_ENV: "test",
  ZERO_TEST_SUPABASE_URL: "http://127.0.0.1:54321",
  ZERO_TEST_SUPABASE_ANON_KEY: "isolated-anon-key",
  ZERO_TEST_SUPABASE_SERVICE_ROLE_KEY: "isolated-service-role-key",
  ZERO_TEST_DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
} satisfies Record<string, string | undefined>;

describe("isolated atomic integration environment", () => {
  it("accepts a fully configured local test target", () => {
    expect(resolveIsolatedTestEnvironment(validLocalEnvironment)).toMatchObject({
      available: true,
      target: { kind: "local", supabaseUrl: validLocalEnvironment.ZERO_TEST_SUPABASE_URL },
    });
  });

  it.each([undefined, "prod", "production", "qa", "development"])(
    "rejects unsafe or missing ZERO_ENV=%s",
    (marker) => {
      const result = resolveIsolatedTestEnvironment({
        ...validLocalEnvironment,
        ...(marker === undefined ? {} : { ZERO_ENV: marker }),
        ...(marker === undefined ? { ZERO_ENV: undefined } : {}),
      });
      expect(result.available).toBe(false);
    },
  );

  it.each([
    { NEXT_PUBLIC_SUPABASE_URL: validLocalEnvironment.ZERO_TEST_SUPABASE_URL },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: validLocalEnvironment.ZERO_TEST_SUPABASE_ANON_KEY },
    { SUPABASE_SERVICE_ROLE_KEY: validLocalEnvironment.ZERO_TEST_SUPABASE_SERVICE_ROLE_KEY },
    { DATABASE_URL: validLocalEnvironment.ZERO_TEST_DATABASE_URL },
  ])("rejects a test target that reuses normal application credentials", (normalEnvironment) => {
    const result = resolveIsolatedTestEnvironment({
      ...validLocalEnvironment,
      ...normalEnvironment,
    });

    expect(result).toEqual({
      available: false,
      reason: "Isolated test credentials must not match normal application credentials.",
    });
  });

  it("requires an explicit dedicated marker for a remote test project", () => {
    const remote = {
      ...validLocalEnvironment,
      ZERO_TEST_SUPABASE_URL: "https://slice3b-test.supabase.co",
      ZERO_TEST_DATABASE_URL: "postgresql://postgres:password@db.slice3b-test.supabase.co:5432/postgres",
    };

    expect(resolveIsolatedTestEnvironment(remote)).toEqual({
      available: false,
      reason: "A remote target requires ZERO_TEST_PROJECT=dedicated.",
    });
    expect(resolveIsolatedTestEnvironment({ ...remote, ZERO_TEST_PROJECT: "dedicated" })).toMatchObject({
      available: true,
      target: { kind: "dedicated" },
    });
  });
});
