import type { SocialGenerationInput } from "./types";

export interface SocialGenerationScenario {
  id: string;
  label: string;
  input: SocialGenerationInput;
}

export const socialGenerationScenarios: SocialGenerationScenario[] = [
  {
    id: "blog-launch-b2b",
    label: "B2B blog launch campaign",
    input: {
      topic: "AI social post generation workflow",
      keywords: ["AI publishing", "social media", "content operations"],
      campaignGoal: "Drive traffic to newly published blog post",
      audience: "B2B content marketing teams",
      tone: "professional",
      optionalUrl: "https://example.com/blog/ai-social-workflow",
      sourceContent: {
        type: "blog",
        structureId: "ws_example_blog",
      },
      platforms: ["linkedin", "x", "facebook", "instagram"],
      hashtagStyle: "balanced",
      includeEmoji: false,
      maxHashtags: 6,
    },
  },
  {
    id: "founder-awareness-campaign",
    label: "Founder awareness campaign",
    input: {
      topic: "Founder insights on shipping faster with AI",
      keywords: ["founder", "ai", "product velocity", "content strategy"],
      campaignGoal: "Increase awareness and profile visits",
      audience: "Startup founders and operators",
      tone: "friendly",
      sourceContent: {
        type: "custom",
        title: "Founder memo",
        summary: "How founders can use AI systems to scale content output.",
        body: "Pair structured prompts with human review and platform-specific constraints.",
      },
      platforms: ["linkedin", "x"],
      hashtagStyle: "minimal",
      includeEmoji: true,
      callToActionHint: "Follow for future build notes",
      maxHashtags: 4,
    },
  },
];
