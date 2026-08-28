export type CommunityPostVisibility = "public" | "private" | "draft";

export interface CommunityPostAuthor {
  id: string;
  full_name?: string | null;
  username?: string | null;
}

export interface CommunityPostRecord {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  visibility: CommunityPostVisibility;
  created_at: string;
  updated_at: string;
  author?: CommunityPostAuthor | null;
  attachments: CommunityPostAttachment[];
  reactionCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  reactedByCurrentUser: boolean | null;
  comments: CommunityPostComment[];
}

export interface CommunityPostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export type CommunityPostAttachmentType = "image" | "gif" | "video" | "document" | "code" | "project" | "link" | "other";

export interface CommunityPostAttachment {
  id: string;
  post_id: string;
  attachment_type: CommunityPostAttachmentType;
  storage_path: string;
  public_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface CommunitySavedItemRecord {
  item_id: string;
  item_type: "post" | "website";
}

export interface PublicWebsiteRecord {
  id: string;
  site_title: string | null;
  visibility: "public" | "private" | null;
  updated_at: string;
  generated_at: string;
  status: string;
  owner_id?: string | null;
}
