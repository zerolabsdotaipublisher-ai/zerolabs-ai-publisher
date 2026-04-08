import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import {
  generateValidatedWebsiteNavigation,
  type NavigationOverrideInput,
  storeWebsiteNavigation,
} from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";

interface RegenerateNavigationBody {
  structureId: string;
  overrides?: NavigationOverrideInput;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateNavigationBody;

  try {
    body = (await request.json()) as RegenerateNavigationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const structure = await getWebsiteStructure(body.structureId, user.id);

  if (!structure) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  try {
    const navigationResult = generateValidatedWebsiteNavigation(
      {
        websiteType: structure.websiteType,
        siteTitle: structure.siteTitle,
        pages: structure.pages.map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: page.type,
          order: page.order,
          visible: page.visible ?? true,
          parentPageId: page.parentPageId,
          priority: page.priority,
          includeInNavigation:
            page.navigation?.includeInHeader ||
            page.navigation?.includeInFooter ||
            false,
          navigationLabel: page.navigationLabel,
        })),
        generatedAt: structure.generatedAt,
      },
      body.overrides,
    );

    const updated = await updateWebsiteStructure({
      ...structure,
      navigation: navigationResult.navigation,
      version: structure.version + 1,
      updatedAt: new Date().toISOString(),
    });

    await storeWebsiteNavigation({
      structureId: updated.id,
      userId: user.id,
      navigation: navigationResult.navigation,
      version: updated.version,
      createdAt: updated.generatedAt,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json({
      navigation: navigationResult.navigation,
      structure: updated,
      usedFallback: navigationResult.usedFallback,
      validationErrors: navigationResult.validationErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("regenerate-navigation route failed", {
      category: "error",
      service: "navigation",
      structureId: body.structureId,
      error: { message, name: "RegenerateNavigationError" },
    });

    return NextResponse.json(
      { error: "Navigation regeneration failed", message },
      { status: 500 },
    );
  }
}
