import type { ReactNode } from "react";
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
  return visibility.base;
}

function visibilityClasses(visibility: EditorNode["visibility"] | EditorPage["visibility"]): string[] {
  return [
    visibility.desktop === false ? "gs-document-hidden-desktop" : undefined,
    visibility.tablet === false ? "gs-document-hidden-tablet" : undefined,
    visibility.mobile === false ? "gs-document-hidden-mobile" : undefined,
  ].filter((value): value is string => Boolean(value));
}

function nodeClasses(node: EditorNode, additional?: string): string {
  const styles = node.styles;
  return [
    "gs-document-node",
    `gs-document-type-${sanitizeClassToken(node.type)}`,
    styles?.alignment ? `gs-document-align-${styles.alignment}` : undefined,
    styles?.width ? `gs-document-width-${styles.width}` : undefined,
    styles?.container ? `gs-document-container-${styles.container}` : undefined,
    styles?.spacing ? `gs-document-spacing-${styles.spacing}` : undefined,
    styles?.columns ? `gs-document-columns-${styles.columns}` : undefined,
    styles?.themeMode ? `gs-document-theme-${styles.themeMode}` : undefined,
    ...visibilityClasses(node.visibility),
    additional,
  ]
    .filter(Boolean)
    .join(" ");
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
            className={`gs-site-nav-link${active ? " is-active" : ""}`}
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
  return (
    <footer
      className={node ? nodeClasses(node, "gs-site-footer-nav") : "gs-site-footer-nav"}
      data-editor-node-id={node?.id}
      aria-label="Footer navigation"
    >
      <div className="gs-site-footer-nav-inner">
        <span className="gs-site-footer-nav-label">Explore</span>
        <NavigationItems document={document} items={menu?.items ?? []} activePageId={document.navigation.activePageId} />
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
    return <DocumentNode document={document} nodeId={symbol.rootNodeId} renderedSymbols={nextSymbols} />;
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
        <div className={nodeClasses(node, "gs-page")} data-editor-node-id={node.id}>
          {renderSlot("default")}
        </div>
      );
    case "container":
      return (
        <section id={getEditorDocumentNodeAnchorId(node)} className={nodeClasses(node)} data-editor-node-id={node.id}>
          {allSlots()}
        </section>
      );
    case "columns":
      return (
        <div className={nodeClasses(node, "gs-document-columns")} data-editor-node-id={node.id}>
          {renderSlot("default")}
        </div>
      );
    case "column":
      return (
        <div className={nodeClasses(node, "gs-document-column")} data-editor-node-id={node.id}>
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
        >
          <SectionRenderer section={toCompatibilitySection(node)} />
          {allSlots()}
        </div>
      );
    case "heading": {
      const level = node.props.level;
      const Heading = (typeof level === "number" && level >= 1 && level <= 4 ? `h${level}` : "h2") as "h1" | "h2" | "h3" | "h4";
      return <Heading className={nodeClasses(node, "gs-component gs-component-heading")} data-editor-node-id={node.id}>{asString(node.props.text) ?? ""}</Heading>;
    }
    case "paragraph":
      return <p className={nodeClasses(node, "gs-component gs-component-paragraph")} data-editor-node-id={node.id}>{asString(node.props.text) ?? ""}</p>;
    case "button": {
      const link = resolveNodeLink(document, node);
      const label = asString(node.props.label) ?? "";
      return link ? (
        <a
          className={nodeClasses(node, "gs-component gs-component-button")}
          data-editor-node-id={node.id}
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      ) : <span className={nodeClasses(node, "gs-component gs-component-button")} data-editor-node-id={node.id}>{label}</span>;
    }
    case "list": {
      const items = Array.isArray(node.props.items) ? node.props.items : [];
      return (
        <ul className={nodeClasses(node, "gs-component gs-component-list")} data-editor-node-id={node.id}>
          {items.map((item, index) => <li key={`${node.id}-${index}`}>{typeof item === "string" ? item : valueToText(item).join(" ")}</li>)}
        </ul>
      );
    }
    case "image": {
      const fromProps = toSafeDocumentUrl(node.props.src);
      const fromAsset = node.assetIds?.map((assetId) => document.assets[assetId]?.url).find((url) => Boolean(toSafeDocumentUrl(url)));
      const src = fromProps ?? (fromAsset ? toSafeDocumentUrl(fromAsset) : undefined);
      if (!src) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={nodeClasses(node, "gs-component gs-component-image")} data-editor-node-id={node.id} src={toWebsiteAssetRenderableUrl(src)} alt={asString(node.props.alt) ?? ""} />
      );
    }
    case "card":
      return (
        <article className={nodeClasses(node, "gs-component gs-component-card")} data-editor-node-id={node.id}>
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
}: EditorDocumentRendererProps) {
  const page = pageId
    ? document.pages.find((candidate) => candidate.id === pageId)
    : document.pages.find((candidate) => candidate.path === pagePath);
  const selectedPage = page ?? (strictRoute ? undefined : document.pages[0]);
  if (!selectedPage || !isVisible(selectedPage.visibility)) {
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
