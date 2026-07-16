"use client";

import type { WebsiteStructure } from "@/lib/ai/structure";
import { PublishControls } from "@/components/publish/publish-controls";

interface PreviewOwnerControlsProps {
  structure: WebsiteStructure;
}

export function PreviewOwnerControls({ structure }: PreviewOwnerControlsProps) {
  return <PublishControls structure={structure} context="preview" />;
}
