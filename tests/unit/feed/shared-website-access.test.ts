import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServiceClient: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseServiceClient: mocks.getSupabaseServiceClient }));
vi.mock("@/lib/observability", () => ({ logger: { warn: mocks.loggerWarn } }));

import { canViewFeedSharedWebsiteDesign } from "@/lib/feed/shared-website-access";

function buildClient({
  website = { id: "website_fixture", user_id: "owner_fixture", visibility: "public", status: "draft", deleted_at: null },
  publicPost = { id: "post_fixture" } as { id: string } | null,
}: {
  website?: Record<string, unknown> | null;
  publicPost?: { id: string } | null;
} = {}) {
  const websiteMaybeSingle = vi.fn().mockResolvedValue({ data: website, error: null });
  const websiteEq = vi.fn().mockReturnValue({ maybeSingle: websiteMaybeSingle });

  const sentinelFinal = vi.fn().mockResolvedValue({ data: [{ post_id: "post_fixture" }], error: null });
  const sentinelFirstEq = vi.fn().mockReturnValue({ eq: sentinelFinal });
  const metadataFinal = vi.fn().mockResolvedValue({ data: [], error: null });
  const metadataFirstEq = vi.fn().mockReturnValue({ contains: metadataFinal });

  const publicPostMaybeSingle = vi.fn().mockResolvedValue({ data: publicPost, error: null });
  const publicPostLimit = vi.fn().mockReturnValue({ maybeSingle: publicPostMaybeSingle });
  const publicPostVisibility = vi.fn().mockReturnValue({ limit: publicPostLimit });
  const publicPostIn = vi.fn().mockReturnValue({ eq: publicPostVisibility });

  let attachmentRead = 0;
  const from = vi.fn((table: string) => {
    if (table === "website_structures") {
      return { select: vi.fn().mockReturnValue({ eq: websiteEq }) };
    }
    if (table === "community_post_attachments") {
      attachmentRead += 1;
      return {
        select: vi.fn().mockReturnValue({
          eq: attachmentRead === 1 ? sentinelFirstEq : metadataFirstEq,
        }),
      };
    }
    return { select: vi.fn().mockReturnValue({ in: publicPostIn }) };
  });

  return { from, websiteEq, sentinelFinal, metadataFinal, publicPostIn };
}

describe("Feed-shared website design access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows the internal design route only for a current public website with a public Feed attachment from its owner", async () => {
    const client = buildClient();
    mocks.getSupabaseServiceClient.mockReturnValue({ from: client.from });

    await expect(canViewFeedSharedWebsiteDesign("website_fixture")).resolves.toBe(true);

    expect(client.websiteEq).toHaveBeenCalledWith("id", "website_fixture");
    expect(client.sentinelFinal).toHaveBeenCalledWith("storage_path", "website:website_fixture");
    expect(client.metadataFinal).toHaveBeenCalledWith("metadata", { website_id: "website_fixture" });
    expect(client.publicPostIn).toHaveBeenCalledWith("id", ["post_fixture"]);
  });

  it("does not authorize a private website even when a Feed attachment claims to reference it", async () => {
    const client = buildClient({ website: { id: "website_fixture", user_id: "owner_fixture", visibility: "private", status: "draft", deleted_at: null } });
    mocks.getSupabaseServiceClient.mockReturnValue({ from: client.from });

    await expect(canViewFeedSharedWebsiteDesign("website_fixture")).resolves.toBe(false);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("does not authorize a public design when its attachments belong only to a private Feed post", async () => {
    const client = buildClient({ publicPost: null });
    mocks.getSupabaseServiceClient.mockReturnValue({ from: client.from });

    await expect(canViewFeedSharedWebsiteDesign("website_fixture")).resolves.toBe(false);
  });
});
