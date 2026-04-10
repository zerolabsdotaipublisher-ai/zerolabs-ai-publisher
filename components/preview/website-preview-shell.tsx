"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { Renderer } from "@/components/generated-site/renderer";
import {
  createPreviewRefreshKey,
  getPreviewDeviceClass,
  getPreviewRendererKey,
  PREVIEW_QUERY_KEYS,
  updatePreviewQuery,
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushQuery(changes: Partial<Record<(typeof PREVIEW_QUERY_KEYS)[keyof typeof PREVIEW_QUERY_KEYS], string | undefined>>) {
    const query = updatePreviewQuery(new URLSearchParams(searchParams.toString()), changes);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function replaceQuery(changes: Partial<Record<(typeof PREVIEW_QUERY_KEYS)[keyof typeof PREVIEW_QUERY_KEYS], string | undefined>>) {
    const query = updatePreviewQuery(new URLSearchParams(searchParams.toString()), changes);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const pageSlug = searchParams.get(PREVIEW_QUERY_KEYS.page) || model.currentPageSlug;
  const currentDeviceMode = (searchParams.get(PREVIEW_QUERY_KEYS.device) || model.currentDeviceMode) as PreviewDeviceMode;
  const refreshKey = searchParams.get(PREVIEW_QUERY_KEYS.refresh) || model.refreshKey;

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
              onSelectPage={(nextPageSlug) => pushQuery({ [PREVIEW_QUERY_KEYS.page]: nextPageSlug })}
            />
            <PreviewDeviceSwitcher
              value={currentDeviceMode}
              onChange={(mode) => pushQuery({ [PREVIEW_QUERY_KEYS.device]: mode })}
            />
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="wizard-button-secondary"
              onClick={() =>
                replaceQuery({
                  [PREVIEW_QUERY_KEYS.refresh]: createPreviewRefreshKey(),
                })
              }
              disabled={!model.permissions.canRefresh}
            >
              Refresh preview
            </button>
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
            key={getPreviewRendererKey(pageSlug, currentDeviceMode, refreshKey)}
            structure={model.structure}
            pageSlug={pageSlug}
          />
        </div>
      </div>
    </div>
  );
}
