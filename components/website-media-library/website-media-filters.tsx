"use client";

interface WebsiteMediaFiltersProps {
  search: string;
  mediaType: string;
  tag: string;
  status: string;
  onSearchChange: (value: string) => void;
  onMediaTypeChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const MEDIA_TYPES = ["all", "image", "video", "document", "generated_image", "asset", "file"];
const STATUSES = ["active", "archived", "deleted"];

export function WebsiteMediaFilters({
  search,
  mediaType,
  tag,
  status,
  onSearchChange,
  onMediaTypeChange,
  onTagChange,
  onStatusChange,
}: WebsiteMediaFiltersProps) {
  return (
    <section className="website-media-filters" aria-label="Website media filters">
      <label>
        <span>Search</span>
        <input value={search} placeholder="Search media name, description, or alt text" onChange={(event) => onSearchChange(event.target.value)} />
      </label>
      <label>
        <span>Media type</span>
        <select value={mediaType} onChange={(event) => onMediaTypeChange(event.target.value)}>
          {MEDIA_TYPES.map((value) => (
            <option key={value} value={value}>{value === "all" ? "All media" : value.replaceAll("_", " ")}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Tag</span>
        <input value={tag} placeholder="Filter by tag" onChange={(event) => onTagChange(event.target.value)} />
      </label>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {STATUSES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
