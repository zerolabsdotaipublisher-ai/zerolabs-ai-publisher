import Link from "next/link";
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
import { PreviewShareActions } from "./preview-share-actions";
import { PreviewToolbar } from "./preview-toolbar";

interface WebsitePreviewShellProps {
  model: WebsitePreviewModel;
}

export function WebsitePreviewShell({ model }: WebsitePreviewShellProps) {
  const pageSlug = model.currentPageSlug;
  const currentDeviceMode = model.currentDeviceMode;

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

  return (
    <div className="preview-shell">
      <PreviewToolbar
        title={`${model.structure.siteTitle} preview`}
        subtitle={`${model.accessLevel === "owner" ? "Owner" : "Shared"} preview • ${model.structure.websiteType}`}
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
          <>
            <Link
              href={buildHref({
                [PREVIEW_QUERY_KEYS.refresh]: createPreviewRefreshKey(),
              })}
              className="wizard-button-secondary"
            >
              Refresh preview
            </Link>
            <PreviewShareActions
              structureId={model.structure.id}
              canShare={model.permissions.canShare}
              sharedPreviewPath={model.sharedPreviewPath}
              sharedPreviewExpiresAt={model.sharedPreviewExpiresAt}
            />
          </>
        }
        links={[
          {
            label: "Open generated-site route",
            href: model.generatedSitePath,
          },
          ...(model.permissions.canRegenerate
            ? [{ label: "Return to generation", href: routes.generateWebsite }]
            : []),
        ]}
      />

      <div
        className={`preview-canvas ${getPreviewDeviceClass(currentDeviceMode)}`}
        data-preview-device={currentDeviceMode}
        data-preview-style={model.structure.styleConfig.style}
        data-preview-tone={model.structure.styleConfig.tone}
        data-preview-theme={model.structure.layout?.pages[0]?.metadata.themeMode || "system"}
      >
        <div className="preview-canvas-frame">
          <Renderer
            key={getPreviewRendererKey(pageSlug, currentDeviceMode, model.refreshKey)}
            structure={model.structure}
            pageSlug={pageSlug}
          />
        </div>
      </div>
    </div>
  );
}
