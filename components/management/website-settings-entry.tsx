import Link from "next/link";

interface WebsiteSettingsEntryProps {
  href: string;
  disabled?: boolean;
}

export function WebsiteSettingsEntry({ href, disabled = false }: WebsiteSettingsEntryProps) {
  if (disabled) {
    return <span>Settings unavailable</span>;
  }

  return <Link href={href}>Settings</Link>;
}
