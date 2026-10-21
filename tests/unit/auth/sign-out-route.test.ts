import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}));

import { POST } from "@/app/api/auth/sign-out/route";

describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success after Supabase confirms the sign-out", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mocks.getSupabaseServerClient.mockResolvedValue({ auth: { signOut } });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("does not report success when Supabase returns an error", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: { message: "Session revocation failed." } });
    mocks.getSupabaseServerClient.mockResolvedValue({ auth: { signOut } });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to sign out." });
  });

  it("does not report success when Supabase throws", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("Network failure."));
    mocks.getSupabaseServerClient.mockResolvedValue({ auth: { signOut } });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to sign out." });
  });
});
