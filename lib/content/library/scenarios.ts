export interface ContentLibraryScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const CONTENT_LIBRARY_MVP_BOUNDARIES = [
  "Content Library is an owner-scoped browse/manage surface for generated content, not a full CMS.",
  "Library reuses existing website, generated-content, blog/article, social, SEO, and scheduling systems.",
  "Quick actions route into existing preview/edit/publish-schedule/delete flows only when already available.",
  "SEO metadata is linked as supporting metadata and not promoted as noisy standalone records.",
] as const;

export const contentLibraryScenarios: ContentLibraryScenario[] = [
  {
    id: "list-owned-content",
    name: "List owner-scoped generated content",
    expectedBehavior: "Only content rows owned by the authenticated user are returned in the library.",
  },
  {
    id: "filter-type-status-website",
    name: "Filter by type/status/linked website",
    expectedBehavior: "Combined filters reduce results to matching content type, lifecycle status, and linked website.",
  },
  {
    id: "search-title-keywords",
    name: "Search title and metadata keywords",
    expectedBehavior: "Search matches title, linked campaign/site fields, and extracted keyword metadata.",
  },
  {
    id: "sort-ordering",
    name: "Sort content listing",
    expectedBehavior: "Sort supports updated-desc default, created-desc, and title alphabetical ordering.",
  },
  {
    id: "status-indicators",
    name: "Lifecycle status indicators",
    expectedBehavior: "Cards display lifecycle badges derived from stored content status and schedule signals.",
  },
  {
    id: "quick-actions",
    name: "Quick action availability",
    expectedBehavior: "Cards show view/edit/publish-schedule links and safe delete only when supported by existing routes/flows.",
  },
  {
    id: "loading-empty-error",
    name: "Loading, empty, and error states",
    expectedBehavior: "Shell displays loading skeletons, contextual empty messaging, and retryable error handling.",
  },
  {
    id: "pagination-load-more",
    name: "Incremental loading",
    expectedBehavior: "Load more appends next page results while preserving active filters/search/sort.",
  },
  {
    id: "responsive-layout",
    name: "Responsive card/list layout",
    expectedBehavior: "Controls and cards stack on small screens while preserving accessible action controls.",
  },
  {
    id: "dashboard-integration",
    name: "Dashboard integration",
    expectedBehavior: "Dashboard quick actions and content summary link to the content library route.",
  },
];
