import type { NavigationItem } from "@/lib/ai/navigation";
import { NavigationMenu } from "./navigation-menu";

interface MobileNavigationProps {
  items: NavigationItem[];
  activePath: string;
  currentPageHref: string;
}

export function MobileNavigation({
  items,
  activePath,
  currentPageHref,
}: MobileNavigationProps) {
  return (
    <details className="gs-mobile-nav" data-responsive="mobile">
      <summary className="gs-mobile-nav-toggle">Menu</summary>
      <NavigationMenu
        items={items}
        activePath={activePath}
        currentPageHref={currentPageHref}
        ariaLabel="Mobile navigation"
      />
    </details>
  );
}
