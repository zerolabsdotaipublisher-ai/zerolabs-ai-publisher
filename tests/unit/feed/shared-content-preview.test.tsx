import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SharedContentPreview } from "@/components/feed/shared-content-preview";
import type { CommunityPostAttachment } from "@/app/(app)/feed/types";

const root = process.cwd();

function attachment(overrides: Partial<CommunityPostAttachment>): CommunityPostAttachment {
  return {
    id: "attachment_fixture",
    post_id: "post_fixture",
    attachment_type: "other",
    storage_path: "user_fixture/post_fixture/private-object.png",
    public_url: null,
    file_name: null,
    mime_type: null,
    file_size: null,
    metadata: null,
    ...overrides,
  };
}

function renderPreview(overrides: Partial<CommunityPostAttachment>): string {
  return renderToStaticMarkup(<SharedContentPreview attachment={attachment(overrides)} />);
}

describe("shared feed content previews", () => {
  it("renders a shared website as a browser-style preview card", () => {
    const markup = renderPreview({
      attachment_type: "project",
      file_name: "Nimbus Studio",
      metadata: { website_id: "website_fixture", kind: "generated-website" },
    });

    expect(markup).toContain("feed-shared-content-preview--website");
    expect(markup).toContain("feed-shared-browser-fallback");
    expect(markup).toContain("Nimbus Studio");
    expect(markup).toContain("View website");
    expect(markup).toContain('href="/site/website_fixture"');
    expect(markup).toContain('target="_blank"');
  });

  it("keeps the website fallback intentional when no preview image exists", () => {
    const markup = renderPreview({
      attachment_type: "project",
      metadata: { website_id: "website_fixture" },
    });

    expect(markup).toContain("feed-shared-browser-fallback");
    expect(markup).toContain("Shared website");
    expect(markup).not.toContain("undefined");
  });

  it("renders image attachments inside a media preview card", () => {
    const markup = renderPreview({
      attachment_type: "image",
      file_name: "launch-image.png",
      mime_type: "image/png",
      file_size: 2048,
      public_url: "https://media.example.com/launch-image.png?token=signed",
    });

    expect(markup).toContain("feed-shared-content-preview--image");
    expect(markup).toContain("launch-image.png");
    expect(markup).toContain("Open image");
    expect(markup).toContain('target="_blank"');
  });

  it("renders documents as metadata-rich file cards", () => {
    const markup = renderPreview({
      attachment_type: "document",
      file_name: "Community research.pdf",
      mime_type: "application/pdf",
      file_size: 1_572_864,
      public_url: "https://media.example.com/research.pdf?token=signed",
    });

    expect(markup).toContain("feed-shared-content-preview--file");
    expect(markup).toContain("Community research.pdf");
    expect(markup).toContain("PDF");
    expect(markup).toContain("1.5 MB");
    expect(markup).toContain("Open document");
  });

  it("uses a metadata-only video card when no authorized video URL is available", () => {
    const markup = renderPreview({
      attachment_type: "video",
      file_name: "walkthrough.mp4",
      mime_type: "video/mp4",
    });

    expect(markup).toContain("feed-shared-content-preview--file");
    expect(markup).toContain("walkthrough.mp4");
    expect(markup).toContain("Preview unavailable");
    expect(markup).not.toContain("<video");
  });

  it("renders authorized videos with metadata-only preload and controls", () => {
    const markup = renderPreview({
      attachment_type: "video",
      file_name: "walkthrough.mp4",
      public_url: "https://media.example.com/walkthrough.mp4?token=signed",
    });

    expect(markup).toContain("feed-shared-content-preview--video");
    expect(markup).toContain("<video");
    expect(markup).toContain('preload="metadata"');
    expect(markup).toContain("controls");
  });

  it("renders code attachments with a code treatment and an open action", () => {
    const markup = renderPreview({
      attachment_type: "code",
      file_name: "feed-preview.tsx",
      mime_type: "application/typescript",
      public_url: "https://media.example.com/feed-preview.tsx?token=signed",
    });

    expect(markup).toContain("is-code");
    expect(markup).toContain("Code file");
    expect(markup).toContain("TSX");
    expect(markup).toContain("Open code file");
  });

  it("renders safe project links as project cards and rejects unsafe targets", () => {
    const safeMarkup = renderPreview({
      attachment_type: "project",
      public_url: "https://projects.example.com/zero-labs",
    });
    const unsafeMarkup = renderPreview({
      attachment_type: "project",
      public_url: "javascript:alert(1)",
    });

    expect(safeMarkup).toContain("feed-shared-content-preview--project");
    expect(safeMarkup).toContain("projects.example.com");
    expect(safeMarkup).toContain("Open project");
    expect(safeMarkup).toContain('href="https://projects.example.com/zero-labs"');
    expect(unsafeMarkup).toContain("Project link unavailable");
    expect(unsafeMarkup).not.toContain("javascript:alert");
  });

  it("keeps long names structurally contained and never exposes storage paths", () => {
    const longName = `${"very-long-file-name-".repeat(12)}report.pdf`;
    const markup = renderPreview({
      attachment_type: "document",
      file_name: longName,
      storage_path: "private/user_fixture/post_fixture/never-render-this.pdf",
      public_url: "https://media.example.com/report.pdf?token=signed",
    });
    const styles = readFileSync(resolve(root, "app/globals.css"), "utf8");

    expect(markup).toContain(longName);
    expect(markup).not.toContain("private/user_fixture");
    expect(styles).toContain("-webkit-line-clamp: 2");
    expect(styles).toContain("overflow-wrap: anywhere");
  });

  it("strips path segments from legacy file names before rendering them", () => {
    const markup = renderPreview({
      attachment_type: "document",
      file_name: "user_fixture/post_fixture/private-report.pdf",
      public_url: "https://media.example.com/report.pdf?token=signed",
    });

    expect(markup).toContain("private-report.pdf");
    expect(markup).not.toContain("user_fixture/post_fixture");
  });

  it("leaves ordinary posts able to render without an attachment preview", () => {
    const postList = readFileSync(resolve(root, "app/(app)/feed/post-list.tsx"), "utf8");

    expect(postList).toContain('{post.title ? <h3 className="feed-post-title">{post.title}</h3> : null}');
    expect(postList).toContain('<p className="feed-post-body">{post.body}</p>');
    expect(postList).toContain("post.attachments.length > 0");
  });
});
