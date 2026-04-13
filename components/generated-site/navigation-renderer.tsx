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
  return (
    <nav className="gs-site-nav" aria-label="Primary navigation">
      <span className="gs-site-brand">{siteTitle}</span>
      <NavigationMenu
        items={navigation.primary}
        activePath={activePath}
        ariaLabel="Primary navigation"
      />
      <MobileNavigation
        items={navigation.primary}
        activePath={activePath}
      />
    </nav>
  );
}
