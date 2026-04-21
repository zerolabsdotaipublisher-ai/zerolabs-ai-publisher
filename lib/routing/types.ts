export type WebsiteRouteKind = "page";

export interface WebsiteRouteRecord {
  kind: WebsiteRouteKind;
  pageId: string;
  slug: string;
  path: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface WebsiteRouteRedirect {
  fromPath: string;
  toPath: string;
  permanent: boolean;
  reason: "slug_changed" | "path_regenerated";
  createdAt: string;
}

export interface WebsiteRouteUrlRecord {
  previewBasePath: string;
  previewBaseUrl: string;
  liveBasePath: string;
  liveBaseUrl: string;
}

export interface WebsiteRoutingConfig {
  version: 1;
  generatedAt: string;
  updatedAt: string;
  routes: WebsiteRouteRecord[];
  redirects: WebsiteRouteRedirect[];
  reservedPaths: string[];
  urls: WebsiteRouteUrlRecord;
}

export interface WebsiteRouteValidationResult {
  valid: boolean;
  errors: string[];
}

export type WebsiteRouteResolutionResult =
  | {
      kind: "page";
      route: WebsiteRouteRecord;
    }
  | {
      kind: "redirect";
      redirect: WebsiteRouteRedirect;
    }
  | {
      kind: "not_found";
    };
