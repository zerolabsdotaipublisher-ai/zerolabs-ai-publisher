import type {
  PageSeo,
  WebsiteComponent,
  WebsitePage,
  WebsiteSection,
  WebsiteStructure,
} from "@/lib/ai/structure";
import { createStaticPageRoute, createStaticPageRoutes } from "./routes";
import type {
  StaticAssetKind,
  StaticAssetReference,
  StaticAssetSource,
  StaticPageData,
  StaticPageDataRequirement,
  StaticPageDataRequirementKey,
  StaticPageInputCompleteness,
  StaticSeoMetadata,
  StaticSiteResolutionInput,
  StaticSiteData,
} from "./types";

export const STATIC_PAGE_DATA_REQUIREMENTS: StaticPageDataRequirement[] = [
  {
    key: "structure",
    label: "Structure identity",
    requiredFields: ["id", "version", "websiteType", "siteTitle", "tagline"],
    description: "Stable website identity and display metadata required to render a static site.",
  },
  {
    key: "page",
    label: "Page identity",
    requiredFields: ["id", "slug", "title", "type", "order"],
    description: "Stable page fields required for route generation, rendering, and navigation state.",
  },
  {
    key: "sections",
    label: "Renderable sections",
    requiredFields: ["sections[].id", "sections[].type", "sections[].order", "sections[].content"],
    description: "Visible section content and component data required by the generated-site renderer.",
  },
  {
    key: "navigation",
    label: "Navigation",
    requiredFields: ["navigation.primary", "navigation.footer"],
    description: "Product-owned navigation data used for static menus and route coverage checks.",
  },
  {
    key: "metadata",
    label: "Metadata and SEO",
    requiredFields: ["seo.title", "seo.description", "seo.keywords", "page.seo"],
    description: "Site and page metadata resolved at build time for SEO-safe static output.",
  },
  {
    key: "layoutStyle",
    label: "Layout and style references",
    requiredFields: ["styleConfig", "layout.pages[]"],
    description: "Style configuration and optional layout page model used by the renderer.",
  },
  {
    key: "assets",
    label: "Asset references",
    requiredFields: ["section assets", "component assets", "seo openGraph.image"],
    description: "Local and external assets referenced by rendered sections and metadata.",
  },
];

const assetExtensionPattern = /\.(?:avif|gif|ico|jpg|jpeg|json|pdf|png|svg|webp|woff|woff2)(?:[?#].*)?$/i;
const localAssetPrefixPattern = /^\/(?:assets|images|media|fonts)\//;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableAssetId(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(":").replace(/[^a-zA-Z0-9:_-]/g, "_");
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isAssetUrl(value: string): boolean {
  return (
    assetExtensionPattern.test(value) ||
    localAssetPrefixPattern.test(value) ||
    value.startsWith("data:image/")
  );
}

function classifyAsset(url: string, source: StaticAssetSource): StaticAssetKind {
  if (source === "seo") {
    return "open-graph-image";
  }

  if (isExternalUrl(url) && !assetExtensionPattern.test(url)) {
    return "external";
  }

  if (/\.(?:woff|woff2)(?:[?#].*)?$/i.test(url)) {
    return "font";
  }

  if (/\.(?:json|pdf)(?:[?#].*)?$/i.test(url)) {
    return "document";
  }

  return "image";
}

function createAssetReference(params: {
  url: string;
  source: StaticAssetSource;
  pageId?: string;
  sectionId?: string;
  fieldPath?: string;
  required?: boolean;
}): StaticAssetReference {
  const kind = classifyAsset(params.url, params.source);
  const external = isExternalUrl(params.url) || kind === "external";

  return {
    id: stableAssetId([
      params.pageId,
      params.sectionId,
      params.source,
      params.fieldPath,
      params.url,
    ]),
    kind,
    source: params.source,
    url: params.url,
    required: params.required ?? true,
    pageId: params.pageId,
    sectionId: params.sectionId,
    fieldPath: params.fieldPath,
    cachePolicyId: external ? "external-assets" : "static-assets",
  };
}

function collectAssetsFromValue(params: {
  value: unknown;
  source: StaticAssetSource;
  pageId: string;
  sectionId?: string;
  fieldPath: string;
  assets: StaticAssetReference[];
}): void {
  if (typeof params.value === "string") {
    if (isAssetUrl(params.value)) {
      params.assets.push(
        createAssetReference({
          url: params.value,
          source: params.source,
          pageId: params.pageId,
          sectionId: params.sectionId,
          fieldPath: params.fieldPath,
        }),
      );
    }
    return;
  }

  if (Array.isArray(params.value)) {
    params.value.forEach((item, index) => {
      collectAssetsFromValue({
        ...params,
        value: item,
        fieldPath: `${params.fieldPath}[${index}]`,
      });
    });
    return;
  }

  if (hasRecord(params.value)) {
    Object.entries(params.value).forEach(([key, value]) => {
      collectAssetsFromValue({
        ...params,
        value,
        fieldPath: params.fieldPath ? `${params.fieldPath}.${key}` : key,
      });
    });
  }
}

function collectComponentAssets(params: {
  components: WebsiteComponent[] | undefined;
  pageId: string;
  sectionId: string;
}): StaticAssetReference[] {
  const assets: StaticAssetReference[] = [];

  params.components?.forEach((component) => {
    collectAssetsFromValue({
      value: component.props,
      source: "component",
      pageId: params.pageId,
      sectionId: params.sectionId,
      fieldPath: `components.${component.id}.props`,
      assets,
    });
  });

  return assets;
}

function collectSectionAssets(page: WebsitePage, sections: WebsiteSection[]): StaticAssetReference[] {
  return sections.flatMap((section) => {
    const assets: StaticAssetReference[] = [];
    collectAssetsFromValue({
      value: section.content,
      source: "section",
      pageId: page.id,
      sectionId: section.id,
      fieldPath: "content",
      assets,
    });

    return [
      ...assets,
      ...collectComponentAssets({
        components: section.components,
        pageId: page.id,
        sectionId: section.id,
      }),
    ];
  });
}

function collectSeoAssets(page: WebsitePage, seo: StaticSeoMetadata): StaticAssetReference[] {
  const image = seo.openGraph?.image;
  if (!image) {
    return [];
  }

  return [
    createAssetReference({
      url: image,
      source: "seo",
      pageId: page.id,
      fieldPath: "metadata.openGraph.image",
    }),
  ];
}

function dedupeAssets(assets: StaticAssetReference[]): StaticAssetReference[] {
  const seen = new Map<string, StaticAssetReference>();

  for (const asset of assets) {
    const key = [asset.pageId, asset.sectionId, asset.source, asset.url].join(":");
    if (!seen.has(key)) {
      seen.set(key, asset);
    }
  }

  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function resolvePageMetadata(structure: WebsiteStructure, page: WebsitePage): StaticSeoMetadata {
  const pageSeo = page.seo;

  return {
    title: pageSeo.title || structure.seo.title,
    description: pageSeo.description || structure.seo.description,
    keywords: pageSeo.keywords.length > 0 ? pageSeo.keywords : structure.seo.keywords,
    canonicalUrl: pageSeo.canonicalUrl,
    openGraph: pageSeo.openGraph ?? structure.seo.openGraph,
  };
}

function hasRequiredStructureFields(structure: WebsiteStructure): boolean {
  return (
    hasText(structure.id) &&
    Number.isInteger(structure.version) &&
    hasText(structure.websiteType) &&
    hasText(structure.siteTitle) &&
    hasText(structure.tagline)
  );
}

function hasRequiredPageFields(page: WebsitePage): boolean {
  return (
    hasText(page.id) &&
    hasText(page.slug) &&
    hasText(page.title) &&
    hasText(page.type) &&
    Number.isInteger(page.order)
  );
}

function hasRequiredSections(sections: WebsiteSection[]): boolean {
  return (
    sections.length > 0 &&
    sections.every(
      (section) =>
        hasText(section.id) &&
        hasText(section.type) &&
        Number.isInteger(section.order) &&
        hasRecord(section.content),
    )
  );
}

function hasRequiredMetadata(structure: WebsiteStructure, pageSeo: PageSeo): boolean {
  return (
    hasText(structure.seo.title) &&
    hasText(structure.seo.description) &&
    Array.isArray(structure.seo.keywords) &&
    hasText(pageSeo.title) &&
    hasText(pageSeo.description) &&
    Array.isArray(pageSeo.keywords)
  );
}

function createCompleteness(params: {
  structure: WebsiteStructure;
  page: WebsitePage;
  sections: WebsiteSection[];
  assets: StaticAssetReference[];
}): StaticPageInputCompleteness {
  const checks: Record<StaticPageDataRequirementKey, boolean> = {
    structure: hasRequiredStructureFields(params.structure),
    page: hasRequiredPageFields(params.page),
    sections: hasRequiredSections(params.sections),
    navigation: Array.isArray(params.structure.navigation.primary),
    metadata: hasRequiredMetadata(params.structure, params.page.seo),
    layoutStyle: hasRecord(params.structure.styleConfig),
    assets: params.assets.every((asset) => hasText(asset.url)),
  };
  const missing = Object.entries(checks)
    .filter(([, complete]) => !complete)
    .map(([key]) => key as StaticPageDataRequirementKey);

  return {
    ...checks,
    missing,
  };
}

export function resolveStaticPageData(params: {
  structure: WebsiteStructure;
  page: WebsitePage;
}): StaticPageData {
  const visibleSections = params.page.sections
    .filter((section) => section.visible !== false)
    .sort((a, b) => a.order - b.order);
  const route = createStaticPageRoute(params.structure, params.page);
  const metadata = resolvePageMetadata(params.structure, params.page);
  const assets = dedupeAssets([
    ...collectSectionAssets(params.page, visibleSections),
    ...collectSeoAssets(params.page, metadata),
  ]);

  return {
    structureId: params.structure.id,
    structureVersion: params.structure.version,
    siteTitle: params.structure.siteTitle,
    tagline: params.structure.tagline,
    websiteType: params.structure.websiteType,
    page: {
      id: params.page.id,
      slug: params.page.slug,
      title: params.page.title,
      type: params.page.type,
      order: params.page.order,
      visible: params.page.visible,
    },
    sections: visibleSections,
    navigation: params.structure.navigation,
    metadata,
    siteMetadata: {
      title: params.structure.seo.title,
      description: params.structure.seo.description,
      keywords: params.structure.seo.keywords,
      canonicalBaseUrl: params.structure.seo.canonicalBaseUrl,
    },
    styleConfig: params.structure.styleConfig,
    layoutPage: params.structure.layout?.pages.find(
      (layoutPage) => layoutPage.pageId === params.page.id || layoutPage.pageSlug === params.page.slug,
    ),
    route,
    assets,
    completeness: createCompleteness({
      structure: params.structure,
      page: params.page,
      sections: visibleSections,
      assets,
    }),
  };
}

export function resolveStaticSiteData(input: StaticSiteResolutionInput): StaticSiteData {
  const routes = createStaticPageRoutes(input.structure);
  const visiblePageIds = new Set(routes.map((route) => route.pageId));
  const pages = input.structure.pages
    .filter((page) => visiblePageIds.has(page.id))
    .map((page) => resolveStaticPageData({ structure: input.structure, page }))
    .sort((a, b) => a.route.path.localeCompare(b.route.path));

  return {
    structureId: input.structure.id,
    structureVersion: input.structure.version,
    siteTitle: input.structure.siteTitle,
    websiteType: input.structure.websiteType,
    environment: input.environment,
    pages,
    routes,
    assets: dedupeAssets(pages.flatMap((page) => page.assets)),
    resolvedAt: input.generatedAt ?? new Date().toISOString(),
  };
}

export function resolveStaticSitesData(inputs: StaticSiteResolutionInput[]): StaticSiteData[] {
  return inputs.map((input) => resolveStaticSiteData(input));
}
