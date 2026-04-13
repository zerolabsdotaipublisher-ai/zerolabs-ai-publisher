import type { NavigationItem } from "@/lib/ai/navigation/types";
import { NavigationMenu } from "./navigation-menu";

interface MobileNavigationProps {
  items: NavigationItem[];
  activePath: string;
}

export function MobileNavigation({
  items,
  activePath,
}: MobileNavigationProps) {
  return (
    <details className="gs-mobile-nav" data-responsive="mobile">
      <summary className="gs-mobile-nav-toggle">Menu</summary>
      <NavigationMenu
        items={items}
        activePath={activePath}
        ariaLabel="Mobile navigation"
      />
    </details>
  );
}
