import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { createStandardMarketingSiteFixture } from "@/tests/fixtures/editor-document";

const mocks = vi.hoisted(() => ({
  getWebsiteStructure: vi.fn(),
  updateWebsiteStructure: vi.fn(),
  storeWebsiteNavigation: vi.fn(),
  storeWebsiteSeoMetadata: vi.fn(),
  generateNavigation: vi.fn(),
  markDraftUpdatedForPublication: vi.fn(),
  withRegeneratedWebsiteRouting: vi.fn(),
  applySystemManagedBoundaries: vi.fn(),
  validateEditorDraft: vi.fn(),
  createWebsiteVersion: vi.fn(),
  createWebsiteVersionLabel: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/config", () => ({
  config: { app: { environment: "test", url: "https://publisher.test" } },
}));
vi.mock("@/lib/ai/structure", () => ({
  getWebsiteStructure: mocks.getWebsiteStructure,
  updateWebsiteStructure: mocks.updateWebsiteStructure,
}));
vi.mock("@/lib/ai/navigation", () => ({
  storeWebsiteNavigation: mocks.storeWebsiteNavigation,
}));
vi.mock("@/lib/ai/structure/navigation", () => ({
  generateNavigation: mocks.generateNavigation,
}));
vi.mock("@/lib/ai/seo", () => ({
  storeWebsiteSeoMetadata: mocks.storeWebsiteSeoMetadata,
}));
vi.mock("@/lib/publish", () => ({
  markDraftUpdatedForPublication: mocks.markDraftUpdatedForPublication,
}));
vi.mock("@/lib/routing", () => ({
  withRegeneratedWebsiteRouting: mocks.withRegeneratedWebsiteRouting,
}));
vi.mock("@/lib/editor/boundaries", () => ({
  applySystemManagedBoundaries: mocks.applySystemManagedBoundaries,
}));
vi.mock("@/lib/editor/validation", () => ({
  validateEditorDraft: mocks.validateEditorDraft,
}));
vi.mock("@/lib/versions/storage", () => ({
  createWebsiteVersion: mocks.createWebsiteVersion,
}));
vi.mock("@/lib/versions/model", () => ({
  createWebsiteVersionLabel: mocks.createWebsiteVersionLabel,
}));
vi.mock("@/lib/observability", () => ({
  logger: { error: mocks.loggerError },
}));

import { persistWebsiteStructureArtifacts, saveEditorStructureDraft } from "@/lib/editor/storage";

describe("Save Draft storage contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applySystemManagedBoundaries.mockImplementation(
      (_existing: WebsiteStructure, draft: WebsiteStructure) => draft,
    );
    mocks.markDraftUpdatedForPublication.mockImplementation((structure: WebsiteStructure) => structure);
    mocks.withRegeneratedWebsiteRouting.mockImplementation((structure: WebsiteStructure) => ({
      structure,
      validationErrors: [],
    }));
    mocks.validateEditorDraft.mockReturnValue([]);
    mocks.storeWebsiteNavigation.mockResolvedValue(undefined);
    mocks.storeWebsiteSeoMetadata.mockResolvedValue(undefined);
    mocks.createWebsiteVersionLabel.mockReturnValue("Draft save");
    mocks.createWebsiteVersion.mockResolvedValue({ id: "wver_fixture" });
    mocks.generateNavigation.mockReturnValue({
      primary: [{ label: "Generated Home", href: "/" }],
      footer: [{ label: "Generated Home", href: "/" }],
      menus: [{ id: "primary", location: "header", style: "top-nav", items: [] }],
      hierarchy: { rootPageIds: [], nodes: [], maxDepth: 0 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks validation failures before any persistence call", async () => {
    const structure = createStandardMarketingSiteFixture();
    mocks.getWebsiteStructure.mockResolvedValue(structure);
    mocks.validateEditorDraft.mockReturnValue([{ field: "pages.0.slug", message: "Duplicate slug" }]);

    const result = await saveEditorStructureDraft(structure.userId, structure);

    expect(result).toEqual({
      error: "Validation failed for draft edits.",
      validationErrors: [{ field: "pages.0.slug", message: "Duplicate slug" }],
    });
    expect(mocks.updateWebsiteStructure).not.toHaveBeenCalled();
    expect(mocks.storeWebsiteNavigation).not.toHaveBeenCalled();
    expect(mocks.storeWebsiteSeoMetadata).not.toHaveBeenCalled();
    expect(mocks.createWebsiteVersion).not.toHaveBeenCalled();
  });

  it("persists a valid draft with navigation, SEO, and a draft version snapshot contract", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T08:00:00.000Z"));
    const structure = createStandardMarketingSiteFixture();
    const saved = { ...structure, version: structure.version + 1, updatedAt: "2026-10-05T08:00:00.000Z" };
    mocks.getWebsiteStructure.mockResolvedValue(structure);
    mocks.updateWebsiteStructure.mockResolvedValue(saved);

    const result = await saveEditorStructureDraft(structure.userId, structure);

    expect(result).toMatchObject({ structure: saved, validationErrors: [], versionId: "wver_fixture" });
    expect(mocks.updateWebsiteStructure).toHaveBeenCalledWith(
      expect.objectContaining({
        id: structure.id,
        userId: structure.userId,
        version: structure.version + 1,
        updatedAt: "2026-10-05T08:00:00.000Z",
      }),
    );
    expect(mocks.storeWebsiteNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        structureId: structure.id,
        userId: structure.userId,
        version: saved.version,
        navigation: expect.objectContaining({
          primary: structure.navigation.primary,
          hierarchy: expect.any(Object),
          menus: expect.any(Array),
        }),
      }),
    );
    expect(mocks.storeWebsiteSeoMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        structureId: structure.id,
        userId: structure.userId,
        version: saved.version,
        site: expect.objectContaining({ title: structure.seo.title }),
        pages: expect.arrayContaining([
          expect.objectContaining({
            pageSlug: "/",
            title: structure.pages[0].seo.title,
            canonicalUrl: "https://sprintboard.example/",
          }),
        ]),
      }),
    );
    expect(mocks.createWebsiteVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        structure: saved,
        userId: structure.userId,
        source: "draft_save",
        status: "draft",
        label: "Draft save",
      }),
    );
  });

  it("reports navigation as the failure stage when a navigation projection write fails", async () => {
    const structure = createStandardMarketingSiteFixture();
    mocks.getWebsiteStructure.mockResolvedValue(structure);
    mocks.updateWebsiteStructure.mockResolvedValue({ ...structure, version: structure.version + 1 });
    mocks.storeWebsiteNavigation.mockRejectedValue(
      Object.assign(new Error("website_navigation is unavailable"), { code: "PGRST205" }),
    );

    const result = await saveEditorStructureDraft(structure.userId, structure);

    expect(result).toMatchObject({
      error: "Failed to save draft changes.",
      validationErrors: [],
      failureStage: "navigation",
    });
    expect(mocks.storeWebsiteSeoMetadata).not.toHaveBeenCalled();
    expect(mocks.createWebsiteVersion).not.toHaveBeenCalled();
  });

  it("derives missing navigation hierarchy and menus for the projection without mutating the draft", async () => {
    const structure = createStandardMarketingSiteFixture();
    const before = structuredClone(structure);
    await persistWebsiteStructureArtifacts(structure, structure.userId);

    expect(mocks.generateNavigation).toHaveBeenCalledWith(structure.websiteType, structure.pages, structure.siteTitle);
    expect(mocks.storeWebsiteNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        navigation: expect.objectContaining({
          primary: structure.navigation.primary,
          hierarchy: expect.any(Object),
          menus: expect.any(Array),
        }),
      }),
    );
    expect(structure).toEqual(before);
  });
});
