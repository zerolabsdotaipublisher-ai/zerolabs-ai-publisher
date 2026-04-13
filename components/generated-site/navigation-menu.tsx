import type { NavigationItem } from "@/lib/ai/navigation/types";
import { withNavigationActiveState } from "./navigation-active-state";

interface NavigationMenuProps {
  items: NavigationItem[];
  activePath: string;
  ariaLabel: string;
}

function toRenderedHref(href: string): string {
  if (href.startsWith("#")) {
    return href;
  }
  if (!href.startsWith("/")) {
    return href;
  }
  return `?page=${encodeURIComponent(href)}`;
}

export function NavigationMenu({
  items,
  activePath,
  ariaLabel,
}: NavigationMenuProps) {
  const states = withNavigationActiveState(items, activePath);

  return (
    <ul className="gs-site-nav-list" aria-label={ariaLabel}>
      {states.map((item) => (
        <li key={item.pageId ?? item.href} className="gs-site-nav-item">
            <a
            href={toRenderedHref(item.href)}
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
