import type { WebsiteNavigation } from "@/lib/ai/navigation/types";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationMenu } from "./navigation-menu";

interface NavigationRendererProps {
  siteTitle: string;
  tagline?: string;
  navigation: WebsiteNavigation;
  activePath: string;
}

export function NavigationRenderer({
  siteTitle,
  tagline,
  navigation,
  activePath,
}: NavigationRendererProps) {
  const primaryItems = Array.isArray(navigation?.primary) ? navigation.primary : [];

  return (
    <nav className="gs-site-nav" aria-label="Primary navigation">
      <div className="gs-site-brand-stack">
        <span className="gs-site-brand">{siteTitle || "Untitled site"}</span>
        {tagline ? <span className="gs-site-tagline">{tagline}</span> : null}
      </div>
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
