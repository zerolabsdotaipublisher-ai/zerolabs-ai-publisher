import { type NextRequest, NextResponse } from "next/server";
import {
  listManagedWebsitesPage,
  type WebsitePublishStateFilter,
  type WebsiteStatusFilter,
  type WebsiteTypeFilter,
} from "@/lib/management";
import { getServerUser } from "@/lib/supabase/server";

const VALID_STATUS_FILTERS: WebsiteStatusFilter[] = [
  "all",
  "draft",
  "published",
  "update_pending",
  "publishing",
  "update_failed",
  "unpublished",
  "archived",
  "deleted",
];
const VALID_PUBLISH_STATE_FILTERS: WebsitePublishStateFilter[] = [
  "all",
  "draft",
  "publishing",
  "published",
  "update_pending",
  "update_failed",
  "unpublished",
];
const VALID_WEBSITE_TYPES: WebsiteTypeFilter[] = [
  "all",
  "portfolio",
  "small-business",
  "landing-page",
  "personal-brand",
  "blog",
  "article",
];

function parseStatusFilter(value: string | null): WebsiteStatusFilter {
  if (!value) {
    return "all";
  }

  if (VALID_STATUS_FILTERS.includes(value as WebsiteStatusFilter)) {
    return value as WebsiteStatusFilter;
  }

  return "all";
}

function parsePublishStateFilter(value: string | null): WebsitePublishStateFilter {
  if (!value) {
    return "all";
  }

  if (VALID_PUBLISH_STATE_FILTERS.includes(value as WebsitePublishStateFilter)) {
    return value as WebsitePublishStateFilter;
  }

  return "all";
}

function parseWebsiteTypeFilter(value: string | null): WebsiteTypeFilter {
  if (!value) {
    return "all";
  }

  if (VALID_WEBSITE_TYPES.includes(value as WebsiteTypeFilter)) {
    return value as WebsiteTypeFilter;
  }

  return "all";
}

function parsePage(value: string | null): number {
  return Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
}

function parsePerPage(value: string | null): number {
  return Math.min(50, Math.max(1, Number.parseInt(value ?? "12", 10) || 12));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("query") ?? undefined;
  const status = parseStatusFilter(request.nextUrl.searchParams.get("status"));
  const publishState = parsePublishStateFilter(request.nextUrl.searchParams.get("publishState"));
  const websiteType = parseWebsiteTypeFilter(request.nextUrl.searchParams.get("websiteType"));
  const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "true";
  const page = parsePage(request.nextUrl.searchParams.get("page"));
  const perPage = parsePerPage(request.nextUrl.searchParams.get("perPage"));

  try {
    const result = await listManagedWebsitesPage(user.id, {
      query,
      status,
      publishState,
      websiteType,
      includeDeleted,
      page,
      perPage,
    });

    return NextResponse.json({
      ok: true,
      websites: result.websites,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      hasMore: result.hasMore,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to list websites" }, { status: 500 });
  }
}
