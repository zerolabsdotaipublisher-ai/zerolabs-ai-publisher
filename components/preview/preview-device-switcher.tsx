import type { PreviewDeviceMode } from "@/lib/preview";

interface PreviewDeviceSwitcherProps {
  value: PreviewDeviceMode;
  onChange: (mode: PreviewDeviceMode) => void;
}

const modes: PreviewDeviceMode[] = ["desktop", "tablet", "mobile"];

export function PreviewDeviceSwitcher({ value, onChange }: PreviewDeviceSwitcherProps) {
  return (
    <fieldset className="preview-control-group">
      <legend>Device</legend>
      <div className="preview-control-buttons">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={mode === value ? "is-active" : undefined}
            onClick={() => onChange(mode)}
            aria-pressed={mode === value}
          >
            {mode}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
