import type {
  PublicationCacheInvalidationMetadata,
  PublicationStaticSiteMetadata,
  PublicationUpdatePlan,
} from "./types";

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export function createCacheInvalidationMetadata(params: {
  action: "publish" | "update";
  plan: PublicationUpdatePlan;
  staticSite: PublicationStaticSiteMetadata;
  provider: "provider-neutral" | "vercel";
  invalidatedAt: string;
}): PublicationCacheInvalidationMetadata {
  const fullSite = params.action === "publish" || params.plan.scope.fullSite;
  const affectedPaths = fullSite
    ? params.staticSite.routePaths
    : params.plan.scope.routePaths.length > 0
      ? params.plan.scope.routePaths
      : params.staticSite.routePaths;
  const assetPaths = fullSite
    ? params.staticSite.assetPaths
    : params.plan.scope.assetPaths.length > 0
      ? params.plan.scope.assetPaths
      : params.staticSite.assetPaths;

  return {
    strategy: fullSite ? "full-site-redeploy" : "targeted-path-refresh",
    provider: params.provider,
    affectedPaths: uniqueSorted(affectedPaths),
    assetPaths: uniqueSorted(assetPaths),
    notes: fullSite
      ? "The deployment replaces the live static artifact set and refreshes every published route."
      : "The deployment refreshes only the affected published routes and related asset references.",
    invalidatedAt: params.invalidatedAt,
  };
}
