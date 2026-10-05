import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { createStandardMarketingSiteFixture } from "@/tests/fixtures/editor-document";

const mocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
  loadEditorStructure: vi.fn(),
  saveEditorStructureDraft: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerUser: mocks.getServerUser,
}));
vi.mock("@/lib/editor/storage", () => ({
  loadEditorStructure: mocks.loadEditorStructure,
  saveEditorStructureDraft: mocks.saveEditorStructureDraft,
}));

import { POST } from "@/app/api/editor/save/route";

function saveRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/editor/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/editor/save", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests before any structure lookup or write", async () => {
    const structure = createStandardMarketingSiteFixture();
    mocks.getServerUser.mockResolvedValue(null);

    const response = await POST(saveRequest({ structureId: structure.id, draft: structure }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
    expect(mocks.loadEditorStructure).not.toHaveBeenCalled();
    expect(mocks.saveEditorStructureDraft).not.toHaveBeenCalled();
  });

  it("rejects a non-owner before draft persistence", async () => {
    const structure = createStandardMarketingSiteFixture();
    mocks.getServerUser.mockResolvedValue({ id: "user_non_owner" });
    mocks.loadEditorStructure.mockResolvedValue(null);

    const response = await POST(saveRequest({ structureId: structure.id, draft: structure }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: "Structure not found" });
    expect(mocks.loadEditorStructure).toHaveBeenCalledWith(structure.id, "user_non_owner");
    expect(mocks.saveEditorStructureDraft).not.toHaveBeenCalled();
  });

  it("accepts a valid owner request only when the requested structure ID matches the draft", async () => {
    const structure = createStandardMarketingSiteFixture();
    const saved = { ...structure, version: structure.version + 1 };
    mocks.getServerUser.mockResolvedValue({ id: structure.userId });
    mocks.loadEditorStructure.mockResolvedValue(structure);
    mocks.saveEditorStructureDraft.mockResolvedValue({
      structure: saved,
      validationErrors: [],
      versionId: "wver_fixture",
    });

    const response = await POST(saveRequest({ structureId: structure.id, draft: structure }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, structure: saved, validationErrors: [] });
    expect(mocks.saveEditorStructureDraft).toHaveBeenCalledWith(structure.userId, structure);
  });

  it("returns storage validation failures as 422 rather than reporting a successful save", async () => {
    const structure = createStandardMarketingSiteFixture();
    mocks.getServerUser.mockResolvedValue({ id: structure.userId });
    mocks.loadEditorStructure.mockResolvedValue(structure);
    mocks.saveEditorStructureDraft.mockResolvedValue({
      error: "Validation failed for draft edits.",
      validationErrors: [{ field: "pages.0.slug", message: "Slug is duplicated." }],
    });

    const response = await POST(saveRequest({ structureId: structure.id, draft: structure }));

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: "Validation failed for draft edits.",
      validationErrors: [{ field: "pages.0.slug" }],
    });
  });
});
