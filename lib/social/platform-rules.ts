import type { SocialPlatform } from "./types";

export interface SocialPlatformRules {
  platform: SocialPlatform;
  characterLimit: number;
  hashtagLimit: number;
  supportsHashtags: boolean;
  supportsLink: boolean;
  defaultHashtagCount: number;
  toneHints: string[];
  ctaHints: string[];
}

export const SOCIAL_PLATFORM_RULES: Record<SocialPlatform, SocialPlatformRules> = {
  facebook: {
    platform: "facebook",
    characterLimit: 2200,
    hashtagLimit: 8,
    supportsHashtags: true,
    supportsLink: true,
    defaultHashtagCount: 4,
    toneHints: ["community-friendly", "conversational", "clear value statement"],
    ctaHints: ["learn more", "read now", "comment your take"],
  },
  instagram: {
    platform: "instagram",
    characterLimit: 2200,
    hashtagLimit: 30,
    supportsHashtags: true,
    supportsLink: false,
    defaultHashtagCount: 8,
    toneHints: ["visual-first", "energetic", "short paragraphs"],
    ctaHints: ["save this post", "share with your team", "drop a comment"],
  },
  x: {
    platform: "x",
    characterLimit: 280,
    hashtagLimit: 4,
    supportsHashtags: true,
    supportsLink: true,
    defaultHashtagCount: 2,
    toneHints: ["direct", "concise", "high signal"],
    ctaHints: ["read the thread", "open the link", "reply with feedback"],
  },
  linkedin: {
    platform: "linkedin",
    characterLimit: 3000,
    hashtagLimit: 6,
    supportsHashtags: true,
    supportsLink: true,
    defaultHashtagCount: 4,
    toneHints: ["professional", "insight-driven", "business outcome focused"],
    ctaHints: ["book a demo", "read the full article", "connect with us"],
  },
};

export const SOCIAL_MVP_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "x",
  "linkedin",
];

export function getPlatformRules(platform: SocialPlatform): SocialPlatformRules {
  return SOCIAL_PLATFORM_RULES[platform];
}
