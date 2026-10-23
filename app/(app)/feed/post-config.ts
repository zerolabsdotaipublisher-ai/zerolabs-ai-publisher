export const communityPostTypes = ["text", "image", "code", "project", "docs", "gif", "video", "website"] as const;

export type CommunityPostType = (typeof communityPostTypes)[number];
export type CommunityAttachmentType = "image" | "gif" | "video" | "document" | "code" | "project";

// Vercel Functions accept request bodies up to 4.5 MB. Leave room for the
// multipart envelope and the rest of the composer fields.
export const maxAttachmentSize = 4 * 1024 * 1024;
export const maxAttachmentSizeLabel = "4 MB";

const acceptedMimeTypes: Record<Exclude<CommunityAttachmentType, "project">, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  gif: ["image/gif"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  code: ["application/json", "application/javascript", "application/typescript", "application/xml"],
};

export function isCommunityPostType(value: string): value is CommunityPostType {
  return (communityPostTypes as readonly string[]).includes(value);
}

export function getAttachmentType(postType: CommunityPostType): CommunityAttachmentType | null {
  if (postType === "image") return "image";
  if (postType === "gif") return "gif";
  if (postType === "video") return "video";
  if (postType === "docs") return "document";
  if (postType === "code") return "code";
  if (postType === "project" || postType === "website") return "project";
  return null;
}

export function isFilePostType(postType: CommunityPostType): boolean {
  return ["image", "code", "docs", "gif", "video"].includes(postType);
}

export function getFileAccept(postType: CommunityPostType): string | undefined {
  if (postType === "image") return "image/jpeg,image/png,image/webp,image/avif";
  if (postType === "code") return ".txt,.md,.js,.jsx,.ts,.tsx,.json,.xml,text/plain,text/markdown,application/json,application/javascript,application/typescript,application/xml";
  if (postType === "docs") return ".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (postType === "gif") return "image/gif";
  if (postType === "video") return "video/mp4,video/webm,video/ogg,video/quicktime";
  return undefined;
}

function normalizedMimeType(file: Pick<File, "type">): string {
  return file.type.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function getAttachmentValidationError(
  file: Pick<File, "size" | "type">,
  attachmentType: Exclude<CommunityAttachmentType, "project">,
): string | null {
  if (!file.size) return "Select a file before posting.";
  if (file.size > maxAttachmentSize) return `Files must be ${maxAttachmentSizeLabel} or smaller.`;

  const mimeType = normalizedMimeType(file);
  if (attachmentType === "document" && (mimeType.startsWith("text/") || acceptedMimeTypes.document.includes(mimeType))) return null;
  if (attachmentType === "code" && (mimeType.startsWith("text/") || acceptedMimeTypes.code.includes(mimeType))) return null;
  if (acceptedMimeTypes[attachmentType].includes(mimeType)) return null;

  if (attachmentType === "image") return "Images must be JPEG, PNG, WebP, or AVIF files.";
  if (attachmentType === "gif") return "GIF posts require a GIF file.";
  if (attachmentType === "video") return "Videos must be MP4, WebM, OGG, or QuickTime files.";
  if (attachmentType === "document") return "Documents must be PDF, text, Word, or Excel files.";
  return "Code files must be text, JSON, JavaScript, TypeScript, or XML files.";
}
