import { isNavigationItemActive } from "@/lib/ai/navigation/state";
import type { NavigationItem } from "@/lib/ai/navigation/types";

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
