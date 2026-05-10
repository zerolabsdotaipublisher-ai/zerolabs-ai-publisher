"use client";

import { useState } from "react";
import type { MediaApiRecord } from "@/lib/media/types";
import { MediaUploadDropzone } from "./media-upload-dropzone";
import { MediaUploadProgress } from "./media-upload-progress";

interface UploadResponse {
  ok: boolean;
  media?: MediaApiRecord;
  signed?: {
    mediaId: string;
    url: string;
    expiresAt: string;
  };
  error?: string;
}

interface MediaUploadPanelProps {
  linkedContentId?: string;
  linkedContentType?: string;
  onUploaded?: (payload: { media: MediaApiRecord; signedUrl?: string }) => void;
}

export function MediaUploadPanel({ linkedContentId, linkedContentType, onUploaded }: MediaUploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  function uploadFile(file: File): void {
    setUploading(true);
    setProgress(0);
    setError(undefined);
    setMessage(undefined);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("usageContext", "editing");
    if (linkedContentId) formData.set("linkedContentId", linkedContentId);
    if (linkedContentType) formData.set("linkedContentType", linkedContentType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      setProgress(100);

      let body: UploadResponse | null = null;
      try {
        body = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        setError("Upload failed.");
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !body.ok || !body.media) {
        setError(body.error || "Upload failed.");
        return;
      }

      setMessage(`Uploaded ${body.media.originalFilename}`);
      onUploaded?.({ media: body.media, signedUrl: body.signed?.url });
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed.");
    };

    xhr.send(formData);
  }

  return (
    <section className="media-upload-panel" aria-label="Media upload panel">
      <h3>Upload media</h3>
      <MediaUploadDropzone
        disabled={uploading}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onFilesSelected={(files) => {
          const first = files.item(0);
          if (first) uploadFile(first);
        }}
      />
      <MediaUploadProgress progress={progress} uploading={uploading} />
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
    </section>
  );
}
