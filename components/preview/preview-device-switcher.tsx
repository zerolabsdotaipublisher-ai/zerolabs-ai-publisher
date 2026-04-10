import Link from "next/link";
import { PREVIEW_DEVICE_MODES, type PreviewDeviceMode } from "@/lib/preview";

interface PreviewDeviceSwitcherProps {
  value: PreviewDeviceMode;
  links: Record<PreviewDeviceMode, string>;
}

const modes = PREVIEW_DEVICE_MODES;

export function PreviewDeviceSwitcher({ value, links }: PreviewDeviceSwitcherProps) {
  return (
    <fieldset className="preview-control-group">
      <legend>Device</legend>
      <div className="preview-control-buttons">
        {modes.map((mode) => (
          <Link
            key={mode}
            href={links[mode]}
            className={mode === value ? "is-active" : undefined}
          >
            {mode}
          </Link>
        ))}
      </div>
    </fieldset>
  );
}
