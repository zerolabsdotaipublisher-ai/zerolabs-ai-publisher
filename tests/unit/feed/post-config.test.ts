import { describe, expect, it } from "vitest";
import {
  getAttachmentType,
  getAttachmentValidationError,
  getFileAccept,
  isFilePostType,
  maxAttachmentSize,
} from "@/app/(app)/feed/post-config";

describe("feed post configuration", () => {
  it("uses the image attachment field and accepts PNG files", () => {
    expect(isFilePostType("image")).toBe(true);
    expect(getAttachmentType("image")).toBe("image");
    expect(getFileAccept("image")).toContain("image/png");
    expect(getAttachmentValidationError(new File(["png"], "image.png", { type: "image/png" }), "image")).toBeNull();
  });

  it("keeps each backed post type mapped to its supported input behavior", () => {
    expect(isFilePostType("code")).toBe(true);
    expect(isFilePostType("docs")).toBe(true);
    expect(isFilePostType("gif")).toBe(true);
    expect(isFilePostType("video")).toBe(true);
    expect(isFilePostType("project")).toBe(false);
    expect(isFilePostType("website")).toBe(false);
    expect(getAttachmentType("project")).toBe("project");
    expect(getAttachmentType("website")).toBe("project");
  });

  it("returns clear client-preflight errors for invalid and oversized image files", () => {
    expect(getAttachmentValidationError(new File(["text"], "notes.txt", { type: "text/plain" }), "image"))
      .toBe("Images must be JPEG, PNG, WebP, or AVIF files.");
    expect(getAttachmentValidationError(new File([new Uint8Array(maxAttachmentSize + 1)], "large.png", { type: "image/png" }), "image"))
      .toBe("Files must be 4 MB or smaller.");
  });
});
