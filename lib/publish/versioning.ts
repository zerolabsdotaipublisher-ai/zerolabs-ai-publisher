import type { WebsiteStructure } from "@/lib/ai/structure";
import { getWebsiteRoutingConfig } from "@/lib/routing";
import type {
  PublicationStructureFingerprint,
  PublicationStructureFingerprintPage,
  PublicationUpdateChangeKind,
  PublicationUpdatePlan,
} from "./types";

const CHANGE_KINDS: PublicationUpdateChangeKind[] = ["content", "structure", "layout", "seo", "routing"];
const PUBLIC_ASSET_PREFIXES = ["/assets/", "/images/", "/media/", "/fonts/"];
const PUBLIC_ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp4",
  ".webm",
];

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);

  return `{${entries.join(",")}}`;
}

function isAssetLikeValue(value: string): boolean {
  if (value.startsWith("data:image/")) {
    return true;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return PUBLIC_ASSET_EXTENSIONS.some((extension) => value.toLowerCase().includes(extension));
  }

  if (!value.startsWith("/")) {
    return false;
  }

  return (
    PUBLIC_ASSET_PREFIXES.some((prefix) => value.startsWith(prefix)) ||
    PUBLIC_ASSET_EXTENSIONS.some((extension) => value.toLowerCase().endsWith(extension))
  );
}

function collectAssetPaths(value: unknown, collector = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (isAssetLikeValue(value)) {
      collector.add(value);
    }
    return collector;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectAssetPaths(entry, collector));
    return collector;
  }

  if (!value || typeof value !== "object") {
    return collector;
  }

  Object.values(value as Record<string, unknown>).forEach((entry) => collectAssetPaths(entry, collector));
  return collector;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function createPageFingerprint(
  structure: WebsiteStructure,
  page: WebsiteStructure["pages"][number],
): PublicationStructureFingerprintPage {
  const routing = getWebsiteRoutingConfig(structure);
  const route = routing.routes.find((candidate) => candidate.pageId === page.id);
  const layoutPage = structure.layout?.pages?.find((candidate) => candidate.pageId === page.id);
  const pageRedirects = routing.redirects.filter(
    (redirect) => redirect.toPath === route?.path || redirect.fromPath === page.slug,
  );
  const assetPaths = uniqueSorted([
    ...collectAssetPaths(page.sections),
    ...collectAssetPaths(page.seo),
    ...collectAssetPaths(layoutPage),
    ...collectAssetPaths(structure.styleConfig),
  ]);

  return {
    pageId: page.id,
    path: route?.path ?? page.slug,
    assetPaths,
    signatures: {
      content: stableSerialize({
        siteTitle: structure.siteTitle,
        tagline: structure.tagline,
        navigation: structure.navigation,
        pageTitle: page.title,
        sections: page.sections,
      }),
      structure: stableSerialize({
        pageId: page.id,
        slug: page.slug,
        title: page.title,
        type: page.type,
        order: page.order,
        visible: page.visible,
        sections: page.sections.map((section) => ({
          id: section.id,
          type: section.type,
          order: section.order,
          visible: section.visible,
        })),
      }),
      layout: stableSerialize({
        styleConfig: structure.styleConfig,
        layoutPage,
      }),
      seo: stableSerialize({
        siteSeo: structure.seo,
        pageSeo: page.seo,
      }),
      routing: stableSerialize({
        route,
        redirects: pageRedirects,
        liveBasePath: routing.urls.liveBasePath,
        liveBaseUrl: routing.urls.liveBaseUrl,
      }),
    },
  };
}

export function buildPublicationFingerprint(structure: WebsiteStructure): PublicationStructureFingerprint {
  const routing = getWebsiteRoutingConfig(structure);
  const pages = structure.pages
    .slice()
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .map((page) => createPageFingerprint(structure, page));

  return {
    generatedAt: structure.updatedAt,
    site: {
      content: stableSerialize({
        siteTitle: structure.siteTitle,
        tagline: structure.tagline,
        navigation: structure.navigation,
      }),
      structure: stableSerialize({
        websiteType: structure.websiteType,
        pageOrder: structure.pages.map((page) => ({
          id: page.id,
          slug: page.slug,
          order: page.order,
          visible: page.visible,
        })),
      }),
      layout: stableSerialize({
        styleConfig: structure.styleConfig,
        layout: structure.layout,
      }),
      seo: stableSerialize({
        siteSeo: structure.seo,
        pageSeo: structure.pages.map((page) => ({ id: page.id, seo: page.seo })),
      }),
      routing: stableSerialize({
        routes: routing.routes,
        redirects: routing.redirects,
        urls: routing.urls,
      }),
    },
    pages,
    routePaths: uniqueSorted(routing.routes.filter((route) => route.visible !== false).map((route) => route.path)),
    assetPaths: uniqueSorted(pages.flatMap((page) => page.assetPaths)),
  };
}

function summarizeChangeKinds(changeKinds: PublicationUpdateChangeKind[]): string {
  if (changeKinds.length === 0) {
    return "no deployment-relevant changes";
  }

  if (changeKinds.length === 1) {
    return `${changeKinds[0]} changes`;
  }

  const leading = changeKinds.slice(0, -1).join(", ");
  return `${leading}, and ${changeKinds[changeKinds.length - 1]} changes`;
}

export function planDeploymentUpdate(
  structure: WebsiteStructure,
  options?: {
    liveFingerprint?: PublicationStructureFingerprint;
    includeManualTrigger?: boolean;
  },
): PublicationUpdatePlan {
  const fingerprint = buildPublicationFingerprint(structure);
  const liveFingerprint = options?.liveFingerprint;
  const changeKinds = new Set<PublicationUpdateChangeKind>();
  const pageIds = new Set<string>();
  const routePaths = new Set<string>();
  const assetPaths = new Set<string>();
  let fullSite = false;

  if (!liveFingerprint) {
    fingerprint.pages.forEach((page) => {
      pageIds.add(page.pageId);
      routePaths.add(page.path);
      page.assetPaths.forEach((assetPath) => assetPaths.add(assetPath));
    });

    return {
      required: true,
      triggeredBy: options?.includeManualTrigger ? ["manual", ...CHANGE_KINDS] : CHANGE_KINDS,
      scope: {
        fullSite: true,
        metadataOnly: false,
        pageIds: uniqueSorted(pageIds),
        routePaths: uniqueSorted(routePaths),
        assetPaths: uniqueSorted(assetPaths),
        changeKinds: CHANGE_KINDS,
      },
      summary: "Initial publish requires a full deployment of the current website structure.",
      comparedAt: fingerprint.generatedAt,
      fingerprint,
    };
  }

  CHANGE_KINDS.forEach((kind) => {
    if (fingerprint.site[kind] !== liveFingerprint.site[kind]) {
      changeKinds.add(kind);
      if (kind !== "routing") {
        fullSite = true;
      }
    }
  });

  const livePages = new Map(liveFingerprint.pages.map((page) => [page.pageId, page]));
  const currentPages = new Map(fingerprint.pages.map((page) => [page.pageId, page]));

  uniqueSorted([...livePages.keys(), ...currentPages.keys()]).forEach((pageId) => {
    const livePage = livePages.get(pageId);
    const currentPage = currentPages.get(pageId);

    if (!livePage || !currentPage) {
      changeKinds.add("structure");
      fullSite = true;
      pageIds.add(pageId);
      (currentPage ?? livePage)?.assetPaths.forEach((assetPath) => assetPaths.add(assetPath));
      if (livePage) {
        routePaths.add(livePage.path);
      }
      if (currentPage) {
        routePaths.add(currentPage.path);
      }
      return;
    }

    CHANGE_KINDS.forEach((kind) => {
      if (currentPage.signatures[kind] !== livePage.signatures[kind]) {
        changeKinds.add(kind);
        pageIds.add(pageId);
        routePaths.add(currentPage.path);
        routePaths.add(livePage.path);
        currentPage.assetPaths.forEach((assetPath) => assetPaths.add(assetPath));
        livePage.assetPaths.forEach((assetPath) => assetPaths.add(assetPath));
      }
    });
  });

  const required = changeKinds.size > 0;
  const normalizedChangeKinds = CHANGE_KINDS.filter((kind) => changeKinds.has(kind));
  const triggeredBy = options?.includeManualTrigger
    ? (["manual", ...normalizedChangeKinds] as PublicationUpdatePlan["triggeredBy"])
    : normalizedChangeKinds;
  const metadataOnly = required && normalizedChangeKinds.every((kind) => kind === "seo");

  return {
    required,
    triggeredBy,
    scope: {
      fullSite,
      metadataOnly,
      pageIds: uniqueSorted(pageIds),
      routePaths: uniqueSorted(routePaths),
      assetPaths: uniqueSorted(assetPaths),
      changeKinds: normalizedChangeKinds,
    },
    summary: required
      ? `Deployment update required because ${summarizeChangeKinds(normalizedChangeKinds)} were detected.`
      : options?.includeManualTrigger
        ? "Manual update requested but no deployment-relevant changes were detected."
        : "No deployment-relevant changes were detected.",
    comparedAt: fingerprint.generatedAt,
    fingerprint,
  };
}

export function createDeploymentVersionId(structure: WebsiteStructure): string {
  return `deployment_${structure.id}_v${structure.version}`;
}
