"use client";

import type { MediaApiRecord } from "@/lib/media/types";
import { buildFileUploadAssociations } from "@/lib/file-upload/associations";
import { FileUploadPanel } from "@/components/file-upload/file-upload-panel";

interface UploadResponse {
  ok: boolean;
  media?: MediaApiRecord;
  signed?: {
    mediaId: string;
    url: string;
    expiresAt: string;
  };
}

interface MediaUploadPanelProps {
  linkedContentId?: string;
  linkedContentType?: string;
  onUploaded?: (payload: { media: MediaApiRecord; signedUrl?: string }) => void;
}

export function MediaUploadPanel({ linkedContentId, linkedContentType, onUploaded }: MediaUploadPanelProps) {
  return (
    <FileUploadPanel
      source="media_library"
      multiple={false}
      linkedContentId={linkedContentId}
      linkedContentType={linkedContentType}
      usageContext="editing"
      permissionResourceType="file_upload"
      associations={buildFileUploadAssociations({
        source: "media_library",
        linkedContentId,
        linkedContentType,
        metadata: { surface: "media-upload-panel" },
      })}
      metadata={{ surface: "media-upload-panel" }}
      title="Upload media"
      description="Upload reusable assets for content management and social publishing without exposing raw storage paths."
      onUploaded={(payload) => {
        const body = payload as UploadResponse;
        if (body.media) {
          onUploaded?.({ media: body.media, signedUrl: body.signed?.url });
        }
      }}
    />
  );
}
