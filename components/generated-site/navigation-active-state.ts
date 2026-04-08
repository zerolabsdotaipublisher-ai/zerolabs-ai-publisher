import { isNavigationItemActive } from "@/lib/ai/navigation";
import type { NavigationItem } from "@/lib/ai/navigation";

export interface NavigationItemState extends NavigationItem {
  active: boolean;
}

export function withNavigationActiveState(
  items: NavigationItem[],
  activePath: string,
): NavigationItemState[] {
  return items.map((item) => ({
    ...item,
    active: isNavigationItemActive(item.href, activePath),
  }));
}
