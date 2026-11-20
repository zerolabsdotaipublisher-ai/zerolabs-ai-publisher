import type { ProfileUserId } from "@/lib/profile-public";

export type CommunityPostVisibility = "public" | "private" | "draft";
/** `community_posts.id`: a Feed post identity, never a public-profile identity. */
export type PostId = string;
/** `community_posts.user_id`: the author identity recorded on a Feed post. */
export type AuthorUserId = string;

export interface CommunityPostAuthor {
  /** The exact `community_posts.user_id` value that authored this post. */
  authorUserId: AuthorUserId;
  /** The resolved `profiles.id`; this is the only identity used in a public-profile href. */
  profileUserId: ProfileUserId | null;
  username?: string | null;
  displayName: string;
  initials: string;
  /** Null when the author has no resolved public-profile identity. */
  profileHref: string | null;
  /** Relationship state is resolved once per distinct author for the feed. */
  isFollowing: boolean;
  /** Fresh, render-only URL. This is never the canonical profile-media reference. */
  avatarDisplayUrl: string | null;
}

export interface CommunityPostRecord {
  /** The database post ID. Public-profile routing must not use this value. */
  id: PostId;
  /** The database author ID. The normalized author field is `author.authorUserId`. */
  user_id: AuthorUserId;
  title: string | null;
  body: string;
  visibility: CommunityPostVisibility;
  created_at: string;
  updated_at: string;
  author: CommunityPostAuthor;
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
  storage_path: string | null;
  public_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  metadata?: Record<string, unknown> | null;
  /** Current public destination state for a shared generated website. */
  website?: SharedWebsiteAttachment | null;
}

export interface SharedWebsiteAttachment {
  id: string;
  title: string | null;
  href: string | null;
  isExternal: boolean;
  /** A public Feed share exposes this otherwise-unpublished design in `/site/[id]`. */
  isFeedSharedDesign?: boolean;
  /** The Feed viewer owns an unpublished/private shared site and may preview it. */
  isOwnerPreview?: boolean;
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
