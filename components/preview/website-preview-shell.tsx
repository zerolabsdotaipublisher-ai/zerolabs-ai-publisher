import { routes } from "@/config/routes";
import { Renderer } from "@/components/generated-site/renderer";
import {
  createPreviewRefreshKey,
  getPreviewDeviceClass,
  getPreviewRendererKey,
  PREVIEW_QUERY_KEYS,
  type PreviewDeviceMode,
  type WebsitePreviewModel,
} from "@/lib/preview";
import { PreviewDeviceSwitcher } from "./preview-device-switcher";
import { PreviewPageNavigation } from "./preview-page-navigation";
import { PreviewToolbar } from "./preview-toolbar";
import { PreviewClientBoundary } from "./preview-client-boundary";
import { PreviewOwnerControls } from "./preview-owner-controls";
import { PreviewToolbarActions } from "./preview-toolbar-actions";

interface WebsitePreviewShellProps {
  model: WebsitePreviewModel;
  requestId?: string;
}

export function WebsitePreviewShell({ model, requestId }: WebsitePreviewShellProps) {
  const pageSlug = model.currentPageSlug;
  const currentDeviceMode = model.currentDeviceMode;
  const currentPage = model.pages.find((page) => page.slug === pageSlug) ?? model.pages[0];
  const currentPageIndex = Math.max(
    model.pages.findIndex((page) => page.slug === currentPage?.slug),
    0,
  );
  const layoutPages = model.structure.layout?.pages ?? [];
  const currentLayoutPage =
    layoutPages.find((page) => page.pageSlug === pageSlug) ?? layoutPages[0];
  const previewTheme = currentLayoutPage?.metadata?.themeMode ?? "auto";
  const previewStyle = model.structure.styleConfig?.style;
  const previewTone = model.structure.styleConfig?.tone;
  const previewTitle = model.structure.siteTitle || "Untitled site";
  const previewWebsiteType = model.structure.websiteType || "website";
  const previewAccessLabel = model.accessLevel === "owner" ? "Owner preview" : "Shared preview";
  const previewThemeLabel =
    previewTheme === "auto"
      ? "System theme"
      : `${previewTheme.charAt(0).toUpperCase()}${previewTheme.slice(1)} theme`;
  const previewStyleLabel = previewStyle
    ? `${previewStyle.charAt(0).toUpperCase()}${previewStyle.slice(1)} style`
    : "Default style";
  const previewToneLabel = previewTone
    ? `${previewTone.charAt(0).toUpperCase()}${previewTone.slice(1)} tone`
    : "Default tone";
  const deviceLabel = `${currentDeviceMode.charAt(0).toUpperCase()}${currentDeviceMode.slice(1)} frame`;
  const pageCountLabel = `${currentPageIndex + 1} of ${model.pages.length} page${model.pages.length === 1 ? "" : "s"}`;
  const currentPagePath = currentPage?.slug || pageSlug;

  function buildHref(changes: Partial<Record<(typeof PREVIEW_QUERY_KEYS)[keyof typeof PREVIEW_QUERY_KEYS], string | undefined>>): string {
    const query = new URLSearchParams();
    const nextPage = changes[PREVIEW_QUERY_KEYS.page] || pageSlug;
    const nextDevice = changes[PREVIEW_QUERY_KEYS.device] || currentDeviceMode;
    const nextRefresh = changes[PREVIEW_QUERY_KEYS.refresh] || model.refreshKey;

    query.set(PREVIEW_QUERY_KEYS.page, nextPage);
    query.set(PREVIEW_QUERY_KEYS.device, nextDevice);
    if (nextRefresh) {
      query.set(PREVIEW_QUERY_KEYS.refresh, nextRefresh);
    }

    return `${model.routePath}?${query.toString()}`;
  }

  const pageLinks = Object.fromEntries(
    model.pages.map((page) => [page.slug, buildHref({ [PREVIEW_QUERY_KEYS.page]: page.slug })]),
  );

  const deviceLinks: Record<PreviewDeviceMode, string> = {
    desktop: buildHref({ [PREVIEW_QUERY_KEYS.device]: "desktop" }),
    tablet: buildHref({ [PREVIEW_QUERY_KEYS.device]: "tablet" }),
    mobile: buildHref({ [PREVIEW_QUERY_KEYS.device]: "mobile" }),
  };
  const refreshHref = buildHref({
    [PREVIEW_QUERY_KEYS.refresh]: createPreviewRefreshKey(),
  });

  return (
    <main id="main-content" className="preview-shell">
      <PreviewToolbar
        eyebrow={model.accessLevel === "owner" ? "Preview workspace" : "Shared preview"}
        title={previewTitle}
        subtitle={
          model.structure.tagline ||
          `${currentPage?.title || "Current page"} / ${previewWebsiteType}`
        }
        meta={
          <div className="preview-toolbar-pills" aria-label="Preview details">
            <span className="preview-toolbar-pill is-strong">{currentPage?.title || "Current page"}</span>
            <span className="preview-toolbar-pill">{currentPagePath}</span>
            <span className="preview-toolbar-pill">{pageCountLabel}</span>
            <span className="preview-toolbar-pill">{deviceLabel}</span>
            <span className="preview-toolbar-pill">{previewStyleLabel}</span>
            <span className="preview-toolbar-pill">{previewToneLabel}</span>
          </div>
        }
        controls={
          <>
            <PreviewPageNavigation
              pages={model.pages}
              currentPageSlug={pageSlug}
              pageLinks={pageLinks}
            />
            <PreviewDeviceSwitcher
              value={currentDeviceMode}
              links={deviceLinks}
            />
          </>
        }
        actions={
          <PreviewClientBoundary
            requestId={requestId}
            boundaryName="preview-toolbar-actions"
            structureId={model.structure.id}
            fallback={
              <p className="preview-share-caption">
                Interactive preview controls are temporarily unavailable.
              </p>
            }
          >
            <PreviewToolbarActions
              refreshHref={refreshHref}
              structureId={model.structure.id}
              canShare={model.permissions.canShare}
              sharedPreviewPath={model.sharedPreviewPath}
              sharedPreviewExpiresAt={model.sharedPreviewExpiresAt}
            />
          </PreviewClientBoundary>
        }
        links={[
          ...(model.accessLevel === "owner"
            ? [{ label: "Edit site", href: routes.editorSite(model.structure.id) }]
            : []),
          {
            label: "Standalone view",
            href: model.generatedSitePath,
          },
          ...(model.permissions.canRegenerate
            ? [{ label: "Generation workspace", href: routes.generateWebsite }]
            : []),
        ]}
      />
      <div
        className={`preview-canvas ${getPreviewDeviceClass(currentDeviceMode)}`}
        data-preview-device={currentDeviceMode}
        data-preview-style={previewStyle}
        data-preview-tone={previewTone}
        data-preview-theme={previewTheme}
      >
        <div className="preview-canvas-surface">
          <div className="preview-canvas-browser" aria-hidden="true">
            <div className="preview-canvas-browser-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-canvas-urlbar">
              <span className="preview-canvas-url-origin">{previewTitle}</span>
              <span className="preview-canvas-url-path">{currentPagePath}</span>
            </div>
            <div className="preview-canvas-browser-meta">
              <span>{deviceLabel}</span>
              <span>{currentPage?.title || "Current page"}</span>
            </div>
          </div>
          <div className="preview-canvas-frame">
            <Renderer
              key={getPreviewRendererKey(pageSlug, currentDeviceMode, model.refreshKey)}
              structure={model.structure}
              pageSlug={pageSlug}
            />
          </div>
          <div className="preview-canvas-status" aria-hidden="true">
            <span>{previewAccessLabel}</span>
            <span>{previewThemeLabel}</span>
            <span>{pageCountLabel}</span>
          </div>
        </div>
      </div>

      {model.accessLevel === "owner" ? (
        <PreviewClientBoundary
          requestId={requestId}
          boundaryName="preview-owner-controls"
          structureId={model.structure.id}
          fallback={
            <section className="publish-controls" aria-label="Publish controls">
              <p className="publish-warning">
                Publish controls are temporarily unavailable in preview.
              </p>
            </section>
          }
        >
          <PreviewOwnerControls structure={model.structure} />
        </PreviewClientBoundary>
      ) : null}
    </main>
  );
}
