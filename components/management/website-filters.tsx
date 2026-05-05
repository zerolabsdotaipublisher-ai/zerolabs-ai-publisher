import type { WebsiteStatusFilter } from "@/lib/management";

interface WebsiteFiltersProps {
  status: WebsiteStatusFilter;
  includeDeleted: boolean;
  onStatusChange: (value: WebsiteStatusFilter) => void;
  onIncludeDeletedChange: (value: boolean) => void;
}

const STATUS_OPTIONS: Array<{ value: WebsiteStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "live", label: "Live" },
  { value: "unpublished_changes", label: "Updates pending" },
  { value: "publishing", label: "Publishing" },
  { value: "updating", label: "Updating" },
  { value: "failed", label: "Failed" },
  { value: "archived", label: "Archived" },
  { value: "deleted", label: "Deleted" },
];

export function WebsiteFilters({
  status,
  includeDeleted,
  onStatusChange,
  onIncludeDeletedChange,
}: WebsiteFiltersProps) {
  return (
    <fieldset className="website-filters">
      <legend>Filters</legend>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as WebsiteStatusFilter)}>
          {STATUS_OPTIONS.map((option) => (
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
  );
}
