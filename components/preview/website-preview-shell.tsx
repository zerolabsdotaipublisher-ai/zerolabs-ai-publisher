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
  const layoutPages = model.structure.layout?.pages ?? [];
  const currentLayoutPage =
    layoutPages.find((page) => page.pageSlug === pageSlug) ?? layoutPages[0];
  const previewTheme = currentLayoutPage?.metadata?.themeMode ?? "system";
  const previewStyle = model.structure.styleConfig?.style;
  const previewTone = model.structure.styleConfig?.tone;
  const previewTitle = model.structure.siteTitle || "Untitled site";
  const previewWebsiteType = model.structure.websiteType || "website";

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
        title={`${previewTitle} preview`}
        subtitle={`${model.accessLevel === "owner" ? "Owner" : "Shared"} preview / ${previewWebsiteType}`}
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
            ? [{ label: "Open editor", href: routes.editorSite(model.structure.id) }]
            : []),
          {
            label: "Open generated-site route",
            href: model.generatedSitePath,
          },
          ...(model.permissions.canRegenerate
            ? [{ label: "Return to generation", href: routes.generateWebsite }]
            : []),
        ]}
      />
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

      <div
        className={`preview-canvas ${getPreviewDeviceClass(currentDeviceMode)}`}
        data-preview-device={currentDeviceMode}
        data-preview-style={previewStyle}
        data-preview-tone={previewTone}
        data-preview-theme={previewTheme}
      >
        <div className="preview-canvas-frame">
          <Renderer
            key={getPreviewRendererKey(pageSlug, currentDeviceMode, model.refreshKey)}
            structure={model.structure}
            pageSlug={pageSlug}
          />
        </div>
      </div>
    </main>
  );
}
