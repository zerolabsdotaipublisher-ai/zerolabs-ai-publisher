interface WebsiteSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function WebsiteSearch({ value, onChange }: WebsiteSearchProps) {
  return (
    <label className="website-search">
      <span>Search websites</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title, description, or ID"
      />
    </label>
  );
}
