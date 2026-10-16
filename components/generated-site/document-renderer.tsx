import type { CSSProperties, ReactNode } from "react";
import type {
  DocumentPageSeo,
  EditorDocument,
  EditorNavigationItem,
  EditorNavigationTarget,
  EditorNode,
  EditorPage,
  EditorValue,
  EditorValueObject,
} from "@/lib/editor/document";
import { editorComponentRegistry, toSafeDocumentUrl } from "@/lib/editor/registry";
import { toWebsiteAssetRenderableUrl } from "@/lib/website-asset-retrieval/urls";
import type { WebsiteSection } from "@/lib/ai/structure";
import { SectionRenderer } from "./section-renderer";

export interface EditorDocumentRendererProps {
  document: EditorDocument;
  /** URL path of the page to render. Defaults to the home page. */
  pagePath?: string;
  /** Stable page ID takes precedence over pagePath when provided. */
  pageId?: string;
  strictRoute?: boolean;
  /** Editor-only affordance for inspecting a page that is hidden in the live site. */
  renderHiddenPage?: boolean;
}

export interface EditorDocumentPageMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  openGraph?: DocumentPageSeo["openGraph"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): EditorValueObject {
  return isRecord(value) ? (value as EditorValueObject) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeClassToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function isVisible(visibility: EditorNode["visibility"] | EditorPage["visibility"]): boolean {
  return visibility.base || visibility.desktop === true || visibility.tablet === true || visibility.mobile === true;
}

function visibilityClasses(visibility: EditorNode["visibility"] | EditorPage["visibility"]): string[] {
  return [
    visibility.base === false ? "gs-document-hidden-base" : undefined,
    visibility.desktop === false ? "gs-document-hidden-desktop" : undefined,
    visibility.tablet === false ? "gs-document-hidden-tablet" : undefined,
    visibility.mobile === false ? "gs-document-hidden-mobile" : undefined,
    visibility.desktop === true ? "gs-document-visible-desktop" : undefined,
    visibility.tablet === true ? "gs-document-visible-tablet" : undefined,
    visibility.mobile === true ? "gs-document-visible-mobile" : undefined,
  ].filter((value): value is string => Boolean(value));
}

function nodeClasses(node: EditorNode, additional?: string): string {
  const styles = node.styles;
  const inheritsSiteSpacing = node.type.startsWith("layout.") && !styles?.padding && !styles?.margin && !styles?.gap && !styles?.spacing;
  return [
    "gs-document-node",
    `gs-document-type-${sanitizeClassToken(node.type)}`,
    styles?.alignment ? `gs-document-align-${styles.alignment}` : undefined,
    styles?.width ? `gs-document-width-${styles.width}` : undefined,
    styles?.container ? `gs-document-container-${styles.container}` : undefined,
    styles?.spacing ? `gs-document-spacing-${styles.spacing}` : undefined,
    styles?.columns ? `gs-document-columns-${styles.columns}` : undefined,
    styles?.themeMode ? `gs-document-theme-${styles.themeMode}` : undefined,
    styles?.backgroundColor ? "gs-document-has-local-background" : undefined,
    styles?.borderColor || styles?.borderWidth !== undefined || styles?.borderStyle ? "gs-document-has-local-border" : undefined,
    styles?.radius ? "gs-document-has-local-radius" : undefined,
    styles?.shadow ? "gs-document-has-local-shadow" : undefined,
    inheritsSiteSpacing ? "gs-document-inherits-site-spacing" : undefined,
    ...visibilityClasses(node.visibility),
    additional,
  ]
    .filter(Boolean)
    .join(" ");
}

type DocumentStyleVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** Maps only typed, tokenized presentation values to local CSS variables. */
function nodeStyleVariables(node: EditorNode): DocumentStyleVariables | undefined {
  const styles = node.styles;
  if (!styles) return undefined;
  const hasBorder = Boolean(styles.borderColor || styles.borderWidth !== undefined || styles.borderStyle);
  const borderStyle = styles.borderStyle ?? (hasBorder ? "solid" : undefined);
  const borderWidth = styles.borderWidth ?? (hasBorder ? 1 : undefined);
  const justifyContent = styles.justifyContent === "between" ? "space-between" : styles.justifyContent;
  const componentSize = styles.size
    ? node.type === "component.image"
      ? { width: `var(--gs-editor-image-size-${styles.size})` }
      : { fontSize: `var(--gs-editor-component-size-${styles.size})` }
    : {};

  return {
    ...(styles.backgroundColor || (node.type === "component.button" && styles.accentColor)
      ? { backgroundColor: styles.backgroundColor ?? styles.accentColor, "--gs-editor-node-background": styles.backgroundColor ?? styles.accentColor }
      : {}),
    ...(styles.textColor ? { color: styles.textColor, "--gs-ink": styles.textColor, "--gs-muted": styles.textColor, "--gs-editor-node-button-text": styles.textColor } : {}),
    ...(styles.accentColor ? { "--gs-editor-node-accent": styles.accentColor, "--gs-accent": styles.accentColor } : {}),
    ...(hasBorder ? {
      borderColor: styles.borderColor ?? "currentColor",
      borderStyle: borderStyle!,
      borderWidth: `${borderWidth}px`,
      "--gs-border": styles.borderColor ?? "currentColor",
      "--gs-editor-node-border": styles.borderColor ?? "currentColor",
      "--gs-editor-node-border-style": borderStyle!,
      "--gs-editor-node-border-width": `${borderWidth}px`,
    } : {}),
    ...(styles.opacity !== undefined ? { opacity: styles.opacity } : {}),
    ...(styles.padding ? { padding: `var(--gs-editor-local-space-${styles.padding})` } : {}),
    ...(styles.margin ? { margin: `var(--gs-editor-local-space-${styles.margin})` } : {}),
    ...(styles.gap ? { gap: `var(--gs-editor-local-space-${styles.gap})` } : {}),
    ...(styles.radius ? { borderRadius: `var(--gs-editor-radius-${styles.radius})`, "--gs-editor-node-radius": `var(--gs-editor-radius-${styles.radius})` } : {}),
    ...(styles.shadow ? { boxShadow: `var(--gs-editor-shadow-${styles.shadow})`, "--gs-editor-node-shadow": `var(--gs-editor-shadow-${styles.shadow})` } : {}),
    ...(styles.height ? { height: `var(--gs-editor-height-${styles.height})` } : {}),
    ...(styles.minHeight ? { minHeight: `var(--gs-editor-min-height-${styles.minHeight})` } : {}),
    ...(styles.fontFamily ? { fontFamily: `var(--gs-editor-font-${styles.fontFamily})` } : {}),
    ...(styles.fontSize ? { fontSize: `var(--gs-editor-font-size-${styles.fontSize})` } : {}),
    ...(styles.fontWeight ? { fontWeight: styles.fontWeight } : {}),
    ...(styles.lineHeight ? { lineHeight: `var(--gs-editor-line-height-${styles.lineHeight})` } : {}),
    ...(styles.letterSpacing ? { letterSpacing: `var(--gs-editor-letter-spacing-${styles.letterSpacing})` } : {}),
    ...(styles.hoverBackgroundColor ? { "--gs-editor-node-hover-background": styles.hoverBackgroundColor } : {}),
    ...(styles.hoverTextColor ? { "--gs-editor-node-hover-text": styles.hoverTextColor } : {}),
    ...(styles.focusColor ? { "--gs-editor-node-focus": styles.focusColor } : {}),
    ...(justifyContent ? { justifyContent } : {}),
    ...(styles.alignItems ? { alignItems: styles.alignItems } : {}),
    ...componentSize,
  };
}

function siteStyleVariables(document: EditorDocument): DocumentStyleVariables | undefined {
  const palette = document.site.styles.palette;
  const typography = document.site.styles.typography;
  const spacing = document.site.styles.spacing;
  const radius = document.site.styles.radius;
  if (!palette && !typography && !spacing && !radius) return undefined;
  const accent = palette?.accent ?? palette?.primary;
  const primaryText = palette?.primaryText ?? palette?.text;
  const bodyFont = typography?.bodyFontFamily ?? typography?.fontFamily;
  const typeScale = typography?.scale === "compact" ? "0.9375rem" : typography?.scale === "generous" ? "1.125rem" : "1rem";
  const spacingVariables = spacing === "compact"
    ? { "--gs-editor-site-space-xs": "0.1875rem", "--gs-editor-site-space-sm": "0.375rem", "--gs-editor-site-space-md": "0.75rem", "--gs-editor-site-space-lg": "1.125rem", "--gs-editor-site-space-xl": "1.5rem", "--gs-editor-site-space-2xl": "2.25rem" }
    : spacing === "spacious"
      ? { "--gs-editor-site-space-xs": "0.3125rem", "--gs-editor-site-space-sm": "0.625rem", "--gs-editor-site-space-md": "1.25rem", "--gs-editor-site-space-lg": "1.875rem", "--gs-editor-site-space-xl": "2.5rem", "--gs-editor-site-space-2xl": "3.75rem" }
      : {};

  return {
    ...spacingVariables,
    ...(accent ? { "--accent": accent, "--gs-accent": accent, "--gs-accent-strong": accent, "--gs-editor-site-primary": accent } : {}),
    ...(palette?.secondary ? { "--gs-editor-site-secondary": palette.secondary, "--gs-highlight": palette.secondary } : {}),
    ...(palette?.background ? { backgroundColor: palette.background, "--background": palette.background, "--gs-bg": palette.background, "--gs-bg-deep": palette.background, "--gs-editor-site-background": palette.background } : {}),
    ...(palette?.surface ? { "--surface": palette.surface, "--gs-surface": palette.surface, "--gs-editor-site-surface": palette.surface } : {}),
    ...(palette?.elevatedSurface ? { "--gs-surface-strong": palette.elevatedSurface } : {}),
    ...(primaryText ? { color: primaryText, "--foreground": primaryText, "--gs-ink": primaryText, "--gs-editor-site-text": primaryText } : {}),
    ...(palette?.secondaryText ? { "--gs-editor-site-secondary-text": palette.secondaryText } : {}),
    ...(palette?.mutedText ? { "--text-muted": palette.mutedText, "--gs-muted": palette.mutedText, "--gs-editor-site-muted-text": palette.mutedText } : {}),
    ...(palette?.border ? { "--gs-border": palette.border, "--gs-border-strong": palette.border } : {}),
    ...(palette?.success ? { "--gs-editor-site-success": palette.success } : {}),
    ...(palette?.warning ? { "--gs-editor-site-warning": palette.warning } : {}),
    ...(palette?.error ? { "--gs-editor-site-error": palette.error } : {}),
    ...(typography?.headingFontFamily ? { "--font-heading": `var(--gs-editor-font-${typography.headingFontFamily})` } : {}),
    ...(bodyFont ? { fontFamily: `var(--gs-editor-font-${bodyFont})`, "--gs-editor-site-font-family": `var(--gs-editor-font-${bodyFont})` } : {}),
    ...(radius ? { "--gs-editor-global-radius": `var(--gs-editor-radius-${radius})` } : {}),
    "--gs-editor-site-font-size": typeScale,
  };
}

function headerStyleVariables(node?: EditorNode): DocumentStyleVariables | undefined {
  if (!node) return undefined;
  const styles = node.styles;
  const alignment = asString(node.props.navigationAlignment);
  const navigationAlignment = alignment === "start" || alignment === "center" || alignment === "end" || alignment === "between"
    ? alignment === "between" ? "space-between" : alignment
    : undefined;
  const linkColor = asString(node.props.navigationLinkColor);
  const activeColor = asString(node.props.navigationActiveColor);

  return {
    ...(styles?.gap ? { "--gs-editor-nav-gap": `var(--gs-editor-local-space-${styles.gap})` } : {}),
    ...(styles?.alignment ? { "--gs-editor-nav-text-align": styles.alignment === "left" ? "start" : "center" } : {}),
    ...(styles?.fontFamily ? { "--gs-editor-nav-font-family": `var(--gs-editor-font-${styles.fontFamily})` } : {}),
    ...(styles?.fontSize ? { "--gs-editor-nav-font-size": `var(--gs-editor-font-size-${styles.fontSize})` } : {}),
    ...(styles?.fontWeight ? { "--gs-editor-nav-font-weight": styles.fontWeight } : {}),
    ...(navigationAlignment ? { "--gs-editor-nav-justify": navigationAlignment } : {}),
    ...(linkColor ? { "--gs-editor-nav-link-color": linkColor } : {}),
    ...(activeColor ? { "--gs-editor-nav-active-color": activeColor } : {}),
  };
}

/** Stable fragment anchor for typed node-target navigation. */
export function getEditorDocumentNodeAnchorId(node: EditorNode): string {
  if (node.legacy?.sourceType && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(node.legacy.sourceType)) {
    return node.legacy.sourceType;
  }
  return `editor-node-${sanitizeClassToken(node.id)}`;
}

export function getEditorDocumentPageMetadata(
  document: EditorDocument,
  page: EditorPage,
): EditorDocumentPageMetadata {
  return {
    title: page.seo.title || document.site.seo.title,
    description: page.seo.description || document.site.seo.description,
    ...(page.seo.canonicalUrl ? { canonicalUrl: page.seo.canonicalUrl } : {}),
    ...(page.seo.openGraph ? { openGraph: page.seo.openGraph } : {}),
  };
}

function pageHref(page: EditorPage): string {
  return `?page=${encodeURIComponent(page.path)}`;
}

interface ResolvedLink {
  href: string;
  external: boolean;
}

function resolveTarget(document: EditorDocument, target: EditorNavigationTarget): ResolvedLink | undefined {
  switch (target.kind) {
    case "page": {
      const page = document.pages.find((candidate) => candidate.id === target.pageId);
      return page ? { href: pageHref(page), external: false } : undefined;
    }
    case "node": {
      const node = document.nodes[target.nodeId];
      return node ? { href: `#${getEditorDocumentNodeAnchorId(node)}`, external: false } : undefined;
    }
    case "external": {
      const href = toSafeDocumentUrl(target.url);
      return href ? { href, external: /^https?:/i.test(href) } : undefined;
    }
    case "unresolved": {
      const href = toSafeDocumentUrl(target.originalHref);
      return href ? { href, external: /^https?:/i.test(href) } : undefined;
    }
  }
}

function resolveNodeLink(document: EditorDocument, node: EditorNode): ResolvedLink | undefined {
  const target = node.props.target;
  if (isRecord(target) && typeof target.kind === "string") {
    return resolveTarget(document, target as EditorNavigationTarget);
  }
  const href = toSafeDocumentUrl(node.props.href);
  return href ? { href, external: /^https?:/i.test(href) } : undefined;
}

function NavigationItems({
  document,
  items,
  activePageId,
  className = "gs-site-nav-list",
}: {
  document: EditorDocument;
  items: EditorNavigationItem[];
  activePageId?: string;
  className?: string;
}) {
  const visibleItems = items.filter((item) => item.visible);
  if (!visibleItems.length) return null;

  return (
    <ul className={className}>
      {visibleItems.map((item) => {
        const target = resolveTarget(document, item.target);
        const active = item.target.kind === "page" && item.target.pageId === activePageId;
        const content = target ? (
          <a
            className={`gs-site-nav-link${active ? " is-active" : ""}${item.variant === "button" ? " is-button" : ""}`}
            href={target.href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : "false"}
            {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.label}
          </a>
        ) : (
          <span className="gs-site-nav-link" data-unresolved-link="true">
            {item.label}
          </span>
        );

        return (
          <li key={item.id} className="gs-site-nav-item">
            {content}
            <NavigationItems
              document={document}
              items={item.children}
              activePageId={activePageId}
              className="gs-site-nav-submenu"
            />
          </li>
        );
      })}
    </ul>
  );
}

function DocumentHeader({ document, page, node }: { document: EditorDocument; page: EditorPage; node?: EditorNode }) {
  if (node && !isVisible(node.visibility)) return null;
  const menu = document.navigation.menus.find((candidate) => candidate.location === "header");
  return (
    <header
      className={node ? nodeClasses(node, "gs-site-header") : "gs-site-header"}
      data-editor-node-id={node?.id}
      data-navigation-style={asString(node?.props.navigationItemStyle) ?? "pills"}
      style={node ? { ...nodeStyleVariables(node), ...headerStyleVariables(node) } : undefined}
    >
      <nav className="gs-site-nav" aria-label="Primary navigation">
        <div className="gs-site-brand-stack">
          <span className="gs-site-brand">{asString(node?.props.siteName) || document.site.name || "Untitled site"}</span>
          {asString(node?.props.tagline) || document.site.tagline ? (
            <span className="gs-site-tagline">{asString(node?.props.tagline) || document.site.tagline}</span>
          ) : null}
        </div>
        <NavigationItems document={document} items={menu?.items ?? []} activePageId={page.id} />
      </nav>
    </header>
  );
}

function DocumentFooter({ document, node }: { document: EditorDocument; node?: EditorNode }) {
  if (node && !isVisible(node.visibility)) return null;
  const menu = document.navigation.menus.find((candidate) => candidate.location === "footer");
  const label = asString(node?.props.label) || "Explore";
  const legalText = asString(node?.props.legalText);
  return (
    <footer
      className={node ? nodeClasses(node, "gs-site-footer-nav") : "gs-site-footer-nav"}
      data-editor-node-id={node?.id}
      style={node ? nodeStyleVariables(node) : undefined}
      aria-label="Footer navigation"
    >
      <div className="gs-site-footer-nav-inner">
        <span className="gs-site-footer-nav-label">{label}</span>
        <NavigationItems document={document} items={menu?.items ?? []} activePageId={document.navigation.activePageId} />
        {legalText ? <small className="gs-site-footer-nav-legal">{legalText}</small> : null}
      </div>
    </footer>
  );
}

function valueToText(value: EditorValue): string[] {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(valueToText);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(valueToText);
  }
  return [];
}

function LegacyFallback({ node, children }: { node: EditorNode; children: ReactNode }) {
  const content = asRecord(node.props.content ?? node.props);
  const headline = asString(content.headline) ?? asString(content.title) ?? asString(content.name);
  const description =
    asString(content.subheadline) ?? asString(content.description) ?? asString(content.body) ?? asString(content.text);
  const action = asRecord(content.action);
  const actionLabel = asString(action.label);
  const actionHref = toSafeDocumentUrl(action.href);
  const image = asRecord(content.image);
  const imageSrc = toSafeDocumentUrl(image.src);
  const textValues = valueToText(content).filter((value) => value !== headline && value !== description).slice(0, 8);

  return (
    <section
      id={getEditorDocumentNodeAnchorId(node)}
      className={nodeClasses(node, "gs-document-legacy")}
      data-editor-node-id={node.id}
      data-legacy-node={node.type}
      style={nodeStyleVariables(node)}
    >
      {headline ? <h2 className="gs-section-headline">{headline}</h2> : null}
      {description ? <p className="gs-about-body">{description}</p> : null}
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="gs-component gs-component-image" src={toWebsiteAssetRenderableUrl(imageSrc)} alt={asString(image.alt) ?? ""} />
      ) : null}
      {actionLabel ? (
        actionHref ? (
          <a className="gs-btn gs-btn-primary" href={actionHref}>
            {actionLabel}
          </a>
        ) : (
          <span className="gs-btn gs-btn-primary">{actionLabel}</span>
        )
      ) : null}
      {textValues.length ? (
        <ul className="gs-feature-list">
          {textValues.map((value, index) => (
            <li key={`${node.id}-${index}`} className="gs-feature-list-item">
              {value}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}

const LEGACY_SECTION_RENDERERS = new Set([
  "hero",
  "about",
  "services",
  "features",
  "benefits",
  "testimonials",
  "faq",
  "pricing",
  "cta",
  "contact",
  "footer",
]);

const LEGACY_CUSTOM_KINDS = new Set([
  "blog-index",
  "blog-post-header",
  "blog-post-body",
  "article-index",
  "article-page-header",
  "article-page-body",
  "article-page-references",
]);

function canRenderCompatibilitySection(node: EditorNode): boolean {
  const sourceType = node.legacy?.sourceType ?? node.type.replace(/^section\./, "");
  if (LEGACY_SECTION_RENDERERS.has(sourceType)) return true;
  const content = asRecord(node.props.content);
  return sourceType === "custom" && typeof content.kind === "string" && LEGACY_CUSTOM_KINDS.has(content.kind);
}

function toCompatibilitySection(node: EditorNode): WebsiteSection {
  const sourceType = node.legacy?.sourceType ?? node.type.replace(/^section\./, "custom");
  const legacyOrder = typeof node.props.legacyOrder === "number" ? node.props.legacyOrder : 0;
  return {
    id: node.legacy?.sourceId ?? node.id,
    type: sourceType as WebsiteSection["type"],
    order: legacyOrder,
    visible: node.visibility.base,
    content: asRecord(node.props.content),
    ...(isRecord(node.props.styleHints) ? { styleHints: node.props.styleHints } : {}),
  };
}

function DocumentNode({
  document,
  nodeId,
  renderedSymbols = new Set<string>(),
}: {
  document: EditorDocument;
  nodeId: string;
  renderedSymbols?: Set<string>;
}) {
  const node = document.nodes[nodeId];
  if (!node || !isVisible(node.visibility)) return null;

  if (node.symbolReference) {
    const symbol = document.globals.symbols[node.symbolReference.symbolId];
    if (!symbol || renderedSymbols.has(symbol.id)) return null;
    const nextSymbols = new Set(renderedSymbols);
    nextSymbols.add(symbol.id);
    return (
      <div className="gs-document-symbol-instance" data-editor-symbol-instance-id={node.id}>
        <DocumentNode document={document} nodeId={symbol.rootNodeId} renderedSymbols={nextSymbols} />
      </div>
    );
  }

  const renderSlot = (slotName: string): ReactNode => {
    const slot = node.slots[slotName];
    if (!slot) return null;
    return slot.childIds.map((childId) => <DocumentNode key={childId} document={document} nodeId={childId} renderedSymbols={renderedSymbols} />);
  };
  const allSlots = (): ReactNode =>
    Object.values(node.slots).flatMap((slot) =>
      slot.childIds.map((childId) => (
        <DocumentNode key={childId} document={document} nodeId={childId} renderedSymbols={renderedSymbols} />
      )),
    );

  const definition = editorComponentRegistry.get(node.type);
  const rendererKey = definition?.renderer.key ?? "legacy-fallback";

  switch (rendererKey) {
    case "page-root":
      return (
        <div className={nodeClasses(node, "gs-page")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {renderSlot("default")}
        </div>
      );
    case "container":
      return (
        <section id={getEditorDocumentNodeAnchorId(node)} className={nodeClasses(node)} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {allSlots()}
        </section>
      );
    case "columns":
      return (
        <div className={nodeClasses(node, "gs-document-columns")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {renderSlot("default")}
        </div>
      );
    case "column":
      return (
        <div className={nodeClasses(node, "gs-document-column")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {renderSlot("default")}
        </div>
      );
    case "section-compat":
      if (!canRenderCompatibilitySection(node)) {
        return <LegacyFallback node={node}>{allSlots()}</LegacyFallback>;
      }
      return (
        <div
          id={getEditorDocumentNodeAnchorId(node)}
          className={nodeClasses(node, "gs-document-section")}
          data-editor-node-id={node.id}
          data-legacy-source-id={node.legacy?.sourceId}
          style={nodeStyleVariables(node)}
        >
          <SectionRenderer section={toCompatibilitySection(node)} />
          {allSlots()}
        </div>
      );
    case "heading": {
      const level = node.props.level;
      const Heading = (typeof level === "number" && level >= 1 && level <= 4 ? `h${level}` : "h2") as "h1" | "h2" | "h3" | "h4";
      return <Heading className={nodeClasses(node, "gs-component gs-component-heading")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>{asString(node.props.text) ?? ""}</Heading>;
    }
    case "paragraph":
      return <p className={nodeClasses(node, "gs-component gs-component-paragraph")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>{asString(node.props.text) ?? ""}</p>;
    case "button": {
      const link = resolveNodeLink(document, node);
      const label = asString(node.props.label) ?? "";
      return link ? (
        <a
          className={nodeClasses(node, "gs-component gs-component-button")}
          data-editor-node-id={node.id}
          href={link.href}
          style={nodeStyleVariables(node)}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      ) : <span className={nodeClasses(node, "gs-component gs-component-button")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>{label}</span>;
    }
    case "list": {
      const items = Array.isArray(node.props.items) ? node.props.items : [];
      return (
        <ul className={nodeClasses(node, "gs-component gs-component-list")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {items.map((item, index) => <li key={`${node.id}-${index}`}>{typeof item === "string" ? item : valueToText(item).join(" ")}</li>)}
        </ul>
      );
    }
    case "image": {
      const sourceReference = asString(node.props.src);
      const fromProps = toSafeDocumentUrl(sourceReference) ?? (sourceReference ? toSafeDocumentUrl(document.assets[sourceReference]?.url) : undefined);
      const fromAsset = node.assetIds?.map((assetId) => document.assets[assetId]?.url).find((url) => Boolean(toSafeDocumentUrl(url)));
      const src = fromProps ?? (fromAsset ? toSafeDocumentUrl(fromAsset) : undefined);
      if (!src) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={nodeClasses(node, "gs-component gs-component-image")} data-editor-node-id={node.id} style={{ ...nodeStyleVariables(node), ...(asString(node.props.fit) ? { "--gs-editor-node-object-fit": asString(node.props.fit) } : {}) }} src={toWebsiteAssetRenderableUrl(src)} alt={asString(node.props.alt) ?? ""} />
      );
    }
    case "card":
      return (
        <article className={nodeClasses(node, "gs-component gs-component-card")} data-editor-node-id={node.id} style={nodeStyleVariables(node)}>
          {asString(node.props.title) ? <h3>{asString(node.props.title)}</h3> : null}
          {asString(node.props.body) ? <p>{asString(node.props.body)}</p> : null}
          {allSlots()}
        </article>
      );
    case "global-header":
    case "global-footer":
      return null;
    case "legacy-fallback":
    default:
      return <LegacyFallback node={node}>{allSlots()}</LegacyFallback>;
  }
}

/**
 * Isolated canonical-document renderer. It is not imported by the current
 * WebsiteStructure production renderer or editor canvas.
 */
export function EditorDocumentRenderer({
  document,
  pagePath = "/",
  pageId,
  strictRoute = false,
  renderHiddenPage = false,
}: EditorDocumentRendererProps) {
  const page = pageId
    ? document.pages.find((candidate) => candidate.id === pageId)
    : document.pages.find((candidate) => candidate.path === pagePath);
  const selectedPage = page ?? (strictRoute ? undefined : document.pages[0]);
  if (!selectedPage || (!isVisible(selectedPage.visibility) && !renderHiddenPage)) {
    return <div className="gs-error"><p>Page not found.</p></div>;
  }

  const metadata = getEditorDocumentPageMetadata(document, selectedPage);
  const headerNode = document.globals.header ? document.nodes[document.globals.header.nodeId] : undefined;
  const footerNode = document.globals.footer ? document.nodes[document.globals.footer.nodeId] : undefined;

  return (
    <div
      className="gs-site gs-document-site"
      data-editor-document-id={document.id}
      data-editor-schema-version={document.schemaVersion}
      data-style-preset={document.site.styles.visualStyle}
      data-tone-preset={document.site.styles.tone}
      data-theme-mode={document.site.styles.themeMode}
      data-editor-has-global-radius={document.site.styles.radius ? "true" : undefined}
      style={siteStyleVariables(document)}
    >
      <div
        className="gs-document-render-metadata"
        hidden
        data-page-title={metadata.title}
        data-page-description={metadata.description}
        data-page-canonical-url={metadata.canonicalUrl}
        data-page-open-graph-title={metadata.openGraph?.title}
      />
      <DocumentHeader document={document} page={selectedPage} node={headerNode} />
      <main
        className={["gs-site-main", ...visibilityClasses(selectedPage.visibility)].join(" ")}
        data-page-id={selectedPage.id}
        data-page-path={selectedPage.path}
      >
        {selectedPage.rootNodeIds.map((nodeId) => <DocumentNode key={nodeId} document={document} nodeId={nodeId} />)}
      </main>
      <DocumentFooter document={document} node={footerNode} />
    </div>
  );
}
