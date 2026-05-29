import type { GeneratedSocialPost } from "./types";

export const SOCIAL_REQUIRED_VARIANT_FIELDS = [
  "platform",
  "caption",
  "hashtags",
  "callToAction",
  "mediaReferences",
  "metadata",
] as const;

export const SOCIAL_OUTPUT_EXAMPLE: Omit<
  GeneratedSocialPost,
  "id" | "userId" | "generatedAt" | "updatedAt" | "version"
> = {
  structureId: "ws_abc123",
  topic: "AI social post generation",
  title: "Turn one content brief into platform-ready social variants",
  sourceType: "blog",
  sourceSnapshot: {
    title: "How to scale social content with AI",
    summary: "A workflow for generating social variants from one source.",
    body: "Use structured prompts, platform rules, and guardrails to keep output consistent.",
  },
  variants: [
    {
      platform: "linkedin",
      caption:
        "Most teams still rewrite social copy platform by platform. We now generate channel-ready variants from one brief while keeping tone and CTA consistent.",
      hashtags: ["#AIPublishing", "#ContentOps", "#SocialMedia"],
      callToAction: "Read the full workflow and adapt it to your team.",
      link: "https://example.com/blog/ai-social-workflow",
      mediaReferences: ["asset://hero-social-1"],
      metadata: {
        platform: "linkedin",
        characterLimit: 3000,
        hashtagLimit: 6,
        supportsLink: true,
        supportsHashtags: true,
        estimatedLength: 147,
        keywordCoverage: ["AI publishing", "content operations"],
        warnings: [],
      },
    },
  ],
  sharedKeywords: ["AI publishing", "content operations", "social media"],
  requirements: {
    tone: "professional",
    audience: "B2B content leaders",
    campaignGoal: "Drive traffic to the article",
    hashtagStyle: "balanced",
    includeEmoji: false,
    maxHashtags: 6,
    platforms: ["linkedin", "x", "facebook", "instagram"],
  },
  validation: {
    isValid: true,
    errors: [],
  },
  regenerationCount: 0,
  scheduledPublishAt: undefined,
  publishedAt: undefined,
};

export function socialOutputContractJson(): string {
  return JSON.stringify(SOCIAL_OUTPUT_EXAMPLE, null, 2);
}
