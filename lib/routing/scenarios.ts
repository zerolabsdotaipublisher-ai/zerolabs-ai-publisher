export interface WebsiteRoutingScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const websiteRoutingScenarios: WebsiteRoutingScenario[] = [
  {
    id: "homepage-route",
    name: "Homepage route generation",
    expectedBehavior: "The home page always resolves to '/' for preview and live website routes.",
  },
  {
    id: "multi-page-route-map",
    name: "Multi-page route mapping",
    expectedBehavior: "Every visible page gets one deterministic route record and one resolved navigation href.",
  },
  {
    id: "duplicate-slug-dedup",
    name: "Duplicate slug deduplication",
    expectedBehavior: "Conflicting slugs are deterministically deduplicated with numeric suffixes.",
  },
  {
    id: "reserved-path-blocked",
    name: "Reserved path detection",
    expectedBehavior: "Generated routes that overlap system paths are rejected by route validation.",
  },
  {
    id: "route-rename-redirect",
    name: "Route rename redirects",
    expectedBehavior: "When a page route changes, a typed redirect record preserves old published paths.",
  },
  {
    id: "route-resolution-404",
    name: "Route resolution and 404",
    expectedBehavior: "Unknown routes resolve to not-found behavior without crashing rendering.",
  },
];
