import type { ContentLibraryPage, ContentLibraryQuery } from "@/lib/content/library/types";

interface ContentLibraryControlsProps {
  search: string;
  type: ContentLibraryQuery["type"];
  status: ContentLibraryQuery["status"];
  websiteId: ContentLibraryQuery["websiteId"];
  sort: ContentLibraryQuery["sort"];
  availableWebsites: ContentLibraryPage["availableWebsites"];
  onSearchChange: (value: string) => void;
  onTypeChange: (value: ContentLibraryQuery["type"]) => void;
  onStatusChange: (value: ContentLibraryQuery["status"]) => void;
  onWebsiteChange: (value: ContentLibraryQuery["websiteId"]) => void;
  onSortChange: (value: ContentLibraryQuery["sort"]) => void;
}

export function ContentLibraryControls({
  search,
  type,
  status,
  websiteId,
  sort,
  availableWebsites,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onWebsiteChange,
  onSortChange,
}: ContentLibraryControlsProps) {
  return (
    <section className="content-library-controls" aria-label="Content library controls">
      <label>
        Search content
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title or keywords"
        />
      </label>

      <label>
        Content type
        <select value={type} onChange={(event) => onTypeChange(event.target.value as ContentLibraryQuery["type"])}>
          <option value="all">All types</option>
          <option value="website_page">Websites/pages</option>
          <option value="blog_post">Blog posts</option>
          <option value="article">Articles</option>
          <option value="social_post">Social posts</option>
        </select>
      </label>

      <label>
        Status
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ContentLibraryQuery["status"])}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="edited">Edited</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
          <option value="archived">Archived</option>
          <option value="deleted">Deleted</option>
        </select>
      </label>

      <label>
        Linked website
        <select value={websiteId} onChange={(event) => onWebsiteChange(event.target.value)}>
          <option value="all">All websites</option>
          {availableWebsites.map((website) => (
            <option key={website.structureId} value={website.structureId}>
              {website.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sort by
        <select value={sort} onChange={(event) => onSortChange(event.target.value as ContentLibraryQuery["sort"])}>
          <option value="updated_desc">Recently updated</option>
          <option value="created_desc">Recently created</option>
          <option value="title_asc">Title A-Z</option>
        </select>
      </label>
    </section>
  );
}
