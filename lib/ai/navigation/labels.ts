import type { NavigationPageSeed } from "./types";

const TYPE_LABELS: Record<NavigationPageSeed["type"], string> = {
  home: "Home",
  about: "About",
  services: "Services",
  contact: "Contact",
  custom: "Page",
};

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function generateNavigationLabel(page: NavigationPageSeed): string {
  if (page.navigationLabel?.trim()) {
    return page.navigationLabel.trim();
  }
  if (page.title?.trim()) {
    return page.title.trim();
  }
  if (page.slug === "/") {
    return "Home";
  }
  const slugSegment = page.slug.split("/").filter(Boolean).pop();
  if (slugSegment) {
    return titleCase(slugSegment);
  }
  return TYPE_LABELS[page.type] ?? "Page";
}
