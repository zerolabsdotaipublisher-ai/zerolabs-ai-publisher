import type {
  WebsitePublishStateFilter,
  WebsiteStatusFilter,
  WebsiteTypeFilter,
} from "@/lib/management";

interface WebsiteListControlsProps {
  query: string;
  status: WebsiteStatusFilter;
  publishState: WebsitePublishStateFilter;
  websiteType: WebsiteTypeFilter;
  includeDeleted: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: WebsiteStatusFilter) => void;
  onPublishStateChange: (value: WebsitePublishStateFilter) => void;
  onWebsiteTypeChange: (value: WebsiteTypeFilter) => void;
  onIncludeDeletedChange: (value: boolean) => void;
}

const STATUS_OPTIONS: Array<{ value: WebsiteStatusFilter; label: string }> = [
  { value: "all", label: "All lifecycle statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "update_pending", label: "Update pending" },
  { value: "publishing", label: "Publishing" },
  { value: "update_failed", label: "Update failed" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
  { value: "deleted", label: "Deleted" },
];

const PUBLISH_STATE_OPTIONS: Array<{ value: WebsitePublishStateFilter; label: string }> = [
  { value: "all", label: "All publish states" },
  { value: "draft", label: "Draft" },
  { value: "publishing", label: "Publishing" },
  { value: "published", label: "Published" },
  { value: "update_pending", label: "Update pending" },
  { value: "update_failed", label: "Update failed" },
  { value: "unpublished", label: "Unpublished" },
];

const WEBSITE_TYPE_OPTIONS: Array<{ value: WebsiteTypeFilter; label: string }> = [
  { value: "all", label: "All website types" },
  { value: "portfolio", label: "Portfolio" },
  { value: "small-business", label: "Small business" },
  { value: "landing-page", label: "Landing page" },
  { value: "personal-brand", label: "Personal brand" },
  { value: "blog", label: "Blog" },
  { value: "article", label: "Article" },
];

export function WebsiteListControls({
  query,
  status,
  publishState,
  websiteType,
  includeDeleted,
  onQueryChange,
  onStatusChange,
  onPublishStateChange,
  onWebsiteTypeChange,
  onIncludeDeletedChange,
}: WebsiteListControlsProps) {
  return (
    <section className="website-list-controls" aria-label="Website list controls">
      <label className="website-search">
        <span>Search by website name</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by website name"
        />
      </label>

      <fieldset className="website-filters">
        <legend>Filters</legend>
        <label>
          <span>Lifecycle status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value as WebsiteStatusFilter)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Publish state</span>
          <select
            value={publishState}
            onChange={(event) => onPublishStateChange(event.target.value as WebsitePublishStateFilter)}
          >
            {PUBLISH_STATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Website type</span>
          <select value={websiteType} onChange={(event) => onWebsiteTypeChange(event.target.value as WebsiteTypeFilter)}>
            {WEBSITE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="website-filters-checkbox">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => onIncludeDeletedChange(event.target.checked)}
          />
          <span>Include soft-deleted websites</span>
        </label>
      </fieldset>
    </section>
  );
}
