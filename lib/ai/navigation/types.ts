import type { WebsiteType } from "../prompts/types";

export type NavigationPageType =
  | "home"
  | "about"
  | "services"
  | "contact"
  | "custom";

export type NavigationLocation = "header" | "footer" | "sidebar";

export type NavigationStyle = "top-nav" | "footer-nav" | "sidebar-nav";

export interface PageNavigationFlags {
  includeInHeader: boolean;
  includeInFooter: boolean;
  includeInSidebar: boolean;
}

export interface PageHierarchyNode {
  pageId: string;
  slug: string;
  path: string;
  parentPageId: string | null;
  depth: number;
  order: number;
  priority: number;
  pageType: NavigationPageType;
  visible: boolean;
  navigation: PageNavigationFlags;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

export interface PageHierarchyModel {
  rootPageIds: string[];
  nodes: PageHierarchyNode[];
  maxDepth: number;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  href: string;
  pageId?: string;
  parentItemId?: string | null;
  order: number;
  visible: boolean;
  external?: boolean;
  children?: NavigationMenuItem[];
  metadata?: Record<string, unknown>;
}

export interface NavigationMenu {
  id: string;
  location: NavigationLocation;
  style: NavigationStyle;
  items: NavigationMenuItem[];
}

export interface NavigationItem {
  label: string;
  href: string;
  pageId?: string;
  external?: boolean;
}

export interface WebsiteNavigation {
  primary: NavigationItem[];
  footer?: NavigationItem[];
  menus?: NavigationMenu[];
  hierarchy?: PageHierarchyModel;
  activePath?: string;
}

export interface NavigationPageSeed {
  id: string;
  title: string;
  slug: string;
  type: NavigationPageType;
  order: number;
  visible: boolean;
  parentPageId?: string | null;
  priority?: number;
  includeInNavigation?: boolean;
  navigationLabel?: string;
}

export interface NavigationGenerationContext {
  websiteType: WebsiteType;
  siteTitle: string;
  pages: NavigationPageSeed[];
  generatedAt?: string;
}

export interface NavigationOverrideInput {
  labels?: Record<string, string>;
  order?: string[];
  visibility?: Record<string, boolean>;
  parentPageIds?: Record<string, string | null>;
  addedPages?: Array<{
    id: string;
    title: string;
    slug: string;
    type: NavigationPageType;
    parentPageId?: string | null;
    visible?: boolean;
    includeInNavigation?: boolean;
    priority?: number;
  }>;
  removedPageIds?: string[];
}

export interface NavigationGenerationResult {
  navigation: WebsiteNavigation;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface WebsiteNavigationRow {
  id: string;
  structure_id: string;
  user_id: string;
  hierarchy_json: unknown;
  navigation_json: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}
