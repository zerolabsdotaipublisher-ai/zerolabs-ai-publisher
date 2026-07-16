import type { WebsiteNavigation } from "@/lib/ai/navigation/types";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationMenu } from "./navigation-menu";

interface NavigationRendererProps {
  siteTitle: string;
  navigation: WebsiteNavigation;
  activePath: string;
}

export function NavigationRenderer({
  siteTitle,
  navigation,
  activePath,
}: NavigationRendererProps) {
  const primaryItems = Array.isArray(navigation?.primary) ? navigation.primary : [];

  return (
    <nav className="gs-site-nav" aria-label="Primary navigation">
      <span className="gs-site-brand">{siteTitle || "Untitled site"}</span>
      <NavigationMenu
        items={primaryItems}
        activePath={activePath}
        ariaLabel="Primary navigation"
      />
      <MobileNavigation
        items={primaryItems}
        activePath={activePath}
      />
    </nav>
  );
}
