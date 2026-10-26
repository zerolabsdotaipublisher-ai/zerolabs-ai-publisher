"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Code2, ExternalLink, File, FileText, Folder, Globe, ImageIcon, Video } from "lucide-react";
import { routes } from "@/config/routes";
import { toSafeDocumentUrl } from "@/lib/editor/registry/urls";
import type { CommunityPostAttachment } from "@/app/(app)/feed/types";

export type SharedContentPreviewKind = "website" | "image" | "video" | "document" | "code" | "project" | "file";

const FALLBACK_FILE_NAMES: Record<Exclude<SharedContentPreviewKind, "website" | "project">, string> = {
  image: "Image attachment",
  video: "Video attachment",
  document: "Document attachment",
  code: "Code attachment",
  file: "File attachment",
};

function getWebsiteId(attachment: CommunityPostAttachment): string | null {
  const websiteId = attachment.metadata?.website_id;
  return typeof websiteId === "string" && websiteId.trim() ? websiteId.trim() : null;
}

export function getSharedContentPreviewKind(attachment: CommunityPostAttachment): SharedContentPreviewKind {
  if (getWebsiteId(attachment)) return "website";
  if (attachment.attachment_type === "image" || attachment.attachment_type === "gif") return "image";
  if (attachment.attachment_type === "video") return "video";
  if (attachment.attachment_type === "document") return "document";
  if (attachment.attachment_type === "code") return "code";
  if (attachment.attachment_type === "project" || attachment.attachment_type === "link") return "project";
  return "file";
}

export function getAttachmentDisplayName(attachment: CommunityPostAttachment, kind = getSharedContentPreviewKind(attachment)): string {
  const fileName = attachment.file_name?.trim().split(/[\\/]/).pop()?.trim();
  if (fileName) return fileName;
  if (kind === "website") return "Shared website";
  if (kind === "project") return "Project link";
  return FALLBACK_FILE_NAMES[kind];
}

export function getAttachmentExtension(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  return extension && extension !== fileName.toLowerCase() ? extension : null;
}

export function formatAttachmentSize(fileSize: number | null | undefined): string | null {
  if (!Number.isFinite(fileSize) || !fileSize || fileSize < 0) return null;
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(fileSize >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function getSafeAttachmentUrl(attachment: CommunityPostAttachment): string | undefined {
  return toSafeDocumentUrl(attachment.public_url);
}

function getHostname(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function getDocumentTypeLabel(attachment: CommunityPostAttachment, extension: string | null): string {
  if (extension) return extension.toUpperCase();
  const mimeType = attachment.mime_type?.split(";", 1)[0]?.trim().toLowerCase();
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType?.includes("word")) return "DOC";
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) return "Spreadsheet";
  if (mimeType?.startsWith("text/")) return "Text";
  return "Document";
}

function getFileMeta(attachment: CommunityPostAttachment, label: string, extension: string | null): string {
  return [label, extension?.toUpperCase(), formatAttachmentSize(attachment.file_size)].filter(Boolean).join(" · ");
}

function BrowserFallback({ title }: { title: string }) {
  return (
    <div className="feed-shared-browser-fallback" aria-hidden="true">
      <div className="feed-shared-browser-chrome">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className="feed-shared-browser-page">
        <div className="feed-shared-browser-brand">{title.slice(0, 1).toUpperCase()}</div>
        <div className="feed-shared-browser-lines">
          <b />
          <span />
          <span />
        </div>
        <div className="feed-shared-browser-blocks">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function CardAction({ children }: { children: ReactNode }) {
  return <span className="feed-shared-content-action">{children}<ExternalLink size={14} aria-hidden="true" /></span>;
}

function UnavailableAction({ children }: { children: ReactNode }) {
  return <span className="feed-shared-content-action is-unavailable" aria-disabled="true">{children}</span>;
}

function WebsitePreviewCard({ attachment, websiteId }: { attachment: CommunityPostAttachment; websiteId: string }) {
  const title = getAttachmentDisplayName(attachment, "website");
  const href = routes.liveSite(websiteId);

  return (
    <Link href={href} target="_blank" rel="noreferrer" className="feed-shared-content-preview feed-shared-content-preview--website" aria-label={`View website: ${title}`}>
      <BrowserFallback title={title} />
      <span className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow"><Globe size={14} aria-hidden="true" /> Shared website</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">Published website · /site/{websiteId}</span>
        <CardAction>View website</CardAction>
      </span>
    </Link>
  );
}

function ImagePreviewCard({ attachment, url }: { attachment: CommunityPostAttachment; url?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = getAttachmentDisplayName(attachment, "image");
  const isAvailable = Boolean(url && !imageFailed);
  const content = isAvailable ? (
    <Image
      src={url!}
      alt={title}
      width={1200}
      height={800}
      unoptimized
      className="feed-shared-content-image"
      onError={() => setImageFailed(true)}
    />
  ) : (
    <div className="feed-shared-media-fallback" aria-hidden="true"><ImageIcon size={28} /></div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="feed-shared-content-preview feed-shared-content-preview--image" aria-label={`Open image: ${title}`}>
      <span className="feed-shared-content-media">{content}</span>
      <span className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow"><ImageIcon size={14} aria-hidden="true" /> Image</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">{getFileMeta(attachment, "Image", getAttachmentExtension(title))}</span>
        {isAvailable ? <CardAction>Open image</CardAction> : <UnavailableAction>Image preview unavailable</UnavailableAction>}
      </span>
    </a>
  ) : (
    <div className="feed-shared-content-preview feed-shared-content-preview--image">
      <span className="feed-shared-content-media">{content}</span>
      <span className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow"><ImageIcon size={14} aria-hidden="true" /> Image</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">Image attachment</span>
        <UnavailableAction>Image unavailable</UnavailableAction>
      </span>
    </div>
  );
}

function VideoPreviewCard({ attachment, url }: { attachment: CommunityPostAttachment; url?: string }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const title = getAttachmentDisplayName(attachment, "video");
  const isAvailable = Boolean(url && !videoFailed);

  if (!isAvailable) {
    return <FilePreviewCard attachment={attachment} kind="video" unavailable />;
  }

  return (
    <div className="feed-shared-content-preview feed-shared-content-preview--video">
      <div className="feed-shared-content-media">
        <video src={url} controls preload="metadata" playsInline className="feed-shared-content-video" onError={() => setVideoFailed(true)} aria-label={`Video attachment: ${title}`} />
      </div>
      <div className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow"><Video size={14} aria-hidden="true" /> Video</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">{getFileMeta(attachment, "Video", getAttachmentExtension(title))}</span>
        <a href={url} target="_blank" rel="noreferrer" className="feed-shared-content-action">Open video<ExternalLink size={14} aria-hidden="true" /></a>
      </div>
    </div>
  );
}

function FilePreviewCard({ attachment, kind, unavailable = false }: { attachment: CommunityPostAttachment; kind: "document" | "code" | "video" | "file"; unavailable?: boolean }) {
  const title = getAttachmentDisplayName(attachment, kind);
  const extension = getAttachmentExtension(title);
  const url = getSafeAttachmentUrl(attachment);
  const isCode = kind === "code";
  const fileLabel = kind === "document" ? getDocumentTypeLabel(attachment, extension) : kind === "video" ? "Video" : isCode ? "Code" : "File";
  const icon = isCode ? <Code2 size={23} aria-hidden="true" /> : kind === "video" ? <Video size={23} aria-hidden="true" /> : kind === "document" ? <FileText size={23} aria-hidden="true" /> : <File size={23} aria-hidden="true" />;
  const actionLabel = kind === "document" ? "Open document" : kind === "video" ? "Open video" : isCode ? "Open code file" : "Open file";
  const className = `feed-shared-content-preview feed-shared-content-preview--file${isCode ? " is-code" : ""}`;
  const card = (
    <>
      <span className="feed-shared-file-icon">{icon}</span>
      <span className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow">{isCode ? "Code file" : fileLabel}</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">{getFileMeta(attachment, fileLabel, extension)}</span>
        {unavailable ? <UnavailableAction>Preview unavailable</UnavailableAction> : <CardAction>{actionLabel}</CardAction>}
      </span>
    </>
  );

  if (url && !unavailable) {
    return <a href={url} target="_blank" rel="noreferrer" className={className} aria-label={`${actionLabel}: ${title}`}>{card}</a>;
  }

  return <div className={className}>{card}</div>;
}

function ProjectPreviewCard({ attachment, url }: { attachment: CommunityPostAttachment; url?: string }) {
  const title = getAttachmentDisplayName(attachment, "project");
  const hostname = getHostname(url);
  const card = (
    <>
      <span className="feed-shared-file-icon"><Folder size={23} aria-hidden="true" /></span>
      <span className="feed-shared-content-copy">
        <span className="feed-shared-content-eyebrow">Project link</span>
        <strong>{title}</strong>
        <span className="feed-shared-content-meta">{hostname || "Project destination"}</span>
        {url ? <CardAction>Open project</CardAction> : <UnavailableAction>Project link unavailable</UnavailableAction>}
      </span>
    </>
  );

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="feed-shared-content-preview feed-shared-content-preview--project" aria-label={`Open project: ${title}`}>{card}</a>
  ) : (
    <div className="feed-shared-content-preview feed-shared-content-preview--project">{card}</div>
  );
}

export function SharedContentPreview({ attachment }: { attachment: CommunityPostAttachment }) {
  const kind = getSharedContentPreviewKind(attachment);
  const websiteId = getWebsiteId(attachment);
  const url = getSafeAttachmentUrl(attachment);

  if (kind === "website" && websiteId) return <WebsitePreviewCard attachment={attachment} websiteId={websiteId} />;
  if (kind === "image") return <ImagePreviewCard attachment={attachment} url={url} />;
  if (kind === "video") return <VideoPreviewCard attachment={attachment} url={url} />;
  if (kind === "document") return <FilePreviewCard attachment={attachment} kind="document" />;
  if (kind === "code") return <FilePreviewCard attachment={attachment} kind="code" />;
  if (kind === "project") return <ProjectPreviewCard attachment={attachment} url={url} />;
  return <FilePreviewCard attachment={attachment} kind="file" />;
}
