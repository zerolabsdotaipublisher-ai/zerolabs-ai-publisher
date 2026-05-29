"use client";

interface WebsiteMediaPreviewDialogProps {
  open: boolean;
  title: string;
  mediaType: string;
  previewUrl?: string;
  altText?: string;
  onClose: () => void;
}

export function WebsiteMediaPreviewDialog({ open, title, mediaType, previewUrl, altText, onClose }: WebsiteMediaPreviewDialogProps) {
  if (!open) return null;
  const isImage = mediaType.startsWith("image") || mediaType === "generated_image";

  return (
    <section className="media-selector-dialog website-media-preview-dialog" role="dialog" aria-modal="true" aria-label="Website media preview">
      <header className="media-selector-dialog-header">
        <h3>{title}</h3>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      {!previewUrl ? <p>Preview unavailable.</p> : null}
      {previewUrl && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={altText || title} className="website-media-preview-image" />
      ) : null}
      {previewUrl && mediaType === "video" ? <video src={previewUrl} className="website-media-preview-image" controls /> : null}
      {previewUrl && mediaType !== "image" && mediaType !== "generated_image" && mediaType !== "video" ? (
        <a href={previewUrl} target="_blank" rel="noreferrer">Open signed preview</a>
      ) : null}
    </section>
  );
}
