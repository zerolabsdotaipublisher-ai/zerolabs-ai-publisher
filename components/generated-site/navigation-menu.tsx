import type { NavigationItem } from "@/lib/ai/navigation";
import { withNavigationActiveState } from "./navigation-active-state";

interface NavigationMenuProps {
  items: NavigationItem[];
  activePath: string;
  currentPageHref: string;
  ariaLabel: string;
}

function toRenderedHref(href: string, currentPageHref: string): string {
  if (href.startsWith("#")) {
    return href;
  }
  if (!href.startsWith("/")) {
    return href;
  }
  return `${currentPageHref}?page=${encodeURIComponent(href)}`;
}

export function NavigationMenu({
  items,
  activePath,
  currentPageHref,
  ariaLabel,
}: NavigationMenuProps) {
  const states = withNavigationActiveState(items, activePath);

  return (
    <ul className="gs-site-nav-list" aria-label={ariaLabel}>
      {states.map((item) => (
        <li key={`${item.href}-${item.label}`} className="gs-site-nav-item">
          <a
            href={toRenderedHref(item.href, currentPageHref)}
            className={`gs-site-nav-link${item.active ? " is-active" : ""}`}
            aria-current={item.active ? "page" : undefined}
            data-active={item.active ? "true" : "false"}
            {...(item.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
