"use client";

import Link from "next/link";
import { SiteThemeToggle } from "@/components/theme/site-theme-toggle";
import { PreviewShareActions } from "./preview-share-actions";

interface PreviewToolbarActionsProps {
  refreshHref: string;
  structureId: string;
  canShare: boolean;
  sharedPreviewPath?: string;
  sharedPreviewExpiresAt?: string;
}

export function PreviewToolbarActions({
  refreshHref,
  structureId,
  canShare,
  sharedPreviewPath,
  sharedPreviewExpiresAt,
}: PreviewToolbarActionsProps) {
  return (
    <>
      <SiteThemeToggle className="theme-toggle-button theme-toggle-button-preview" />
      <Link href={refreshHref} className="wizard-button-secondary">
        Refresh preview
      </Link>
      <PreviewShareActions
        structureId={structureId}
        canShare={canShare}
        sharedPreviewPath={sharedPreviewPath}
        sharedPreviewExpiresAt={sharedPreviewExpiresAt}
      />
    </>
  );
}
