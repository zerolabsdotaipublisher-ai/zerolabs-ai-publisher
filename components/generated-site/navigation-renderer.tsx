import type { WebsiteNavigation } from "@/lib/ai/navigation";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationMenu } from "./navigation-menu";

interface NavigationRendererProps {
  siteTitle: string;
  navigation: WebsiteNavigation;
  activePath: string;
  currentPageHref: string;
}

export function NavigationRenderer({
  siteTitle,
  navigation,
  activePath,
  currentPageHref,
}: NavigationRendererProps) {
  return (
    <nav className="gs-site-nav" aria-label="Primary navigation">
      <span className="gs-site-brand">{siteTitle}</span>
      <NavigationMenu
        items={navigation.primary}
        activePath={activePath}
        currentPageHref={currentPageHref}
        ariaLabel="Primary navigation"
      />
      <MobileNavigation
        items={navigation.primary}
        activePath={activePath}
        currentPageHref={currentPageHref}
      />
    </nav>
  );
}
