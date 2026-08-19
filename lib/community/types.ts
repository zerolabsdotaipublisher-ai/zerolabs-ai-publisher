export type CommunityPostVisibility = "draft" | "public";

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  visibility: CommunityPostVisibility;
  created_at: string;
  updated_at: string;
  author_name?: string; // We'll try to fetch author profile info if safely available
}

export interface CommunitySavedItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: "website" | "post";
  created_at: string;
}

export interface CreateCommunityPostParams {
  title: string;
  content: string;
  visibility: CommunityPostVisibility;
}

export interface SaveCommunityItemParams {
  content_id: string;
  content_type: "website" | "post";
}
