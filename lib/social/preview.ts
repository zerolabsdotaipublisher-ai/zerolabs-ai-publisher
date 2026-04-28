import type { GeneratedSocialPost, SocialPreviewCard, SocialPreviewResponse } from "./types";

function buildHashtagLine(hashtags: string[]): string {
  return hashtags.join(" ").trim();
}

function toCard(post: GeneratedSocialPost): SocialPreviewCard[] {
  return post.variants.map((variant) => ({
    platform: variant.platform,
    caption: variant.caption,
    hashtagsLine: buildHashtagLine(variant.hashtags),
    callToAction: variant.callToAction,
    link: variant.link,
    characterCount: variant.caption.length,
    characterLimit: variant.metadata.characterLimit,
    warnings: variant.metadata.warnings,
  }));
}

export function buildSocialPreviewResponse(socialPost: GeneratedSocialPost): SocialPreviewResponse {
  const cards = toCard(socialPost);
  const warnings = cards.flatMap((card) => card.warnings);

  return {
    socialPost,
    cards,
    warnings,
  };
}
