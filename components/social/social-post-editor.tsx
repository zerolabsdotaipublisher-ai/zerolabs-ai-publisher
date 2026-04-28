"use client";

import { useMemo, useState } from "react";
import type { GeneratedSocialPost, SocialPlatform, SocialPostVariant } from "@/lib/social";

interface SocialPostEditorProps {
  socialPost: GeneratedSocialPost;
  onChange: (next: GeneratedSocialPost) => void;
}

function splitHashtags(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function SocialPostEditor({ socialPost, onChange }: SocialPostEditorProps) {
  const platforms = useMemo(() => socialPost.variants.map((variant) => variant.platform), [socialPost.variants]);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(platforms[0] ?? "linkedin");

  const selectedVariant = socialPost.variants.find((variant) => variant.platform === selectedPlatform);
  if (!selectedVariant) {
    return null;
  }

  const updateVariant = (updater: (variant: SocialPostVariant) => SocialPostVariant) => {
    onChange({
      ...socialPost,
      variants: socialPost.variants.map((variant) =>
        variant.platform === selectedPlatform ? updater(variant) : variant,
      ),
    });
  };

  return (
    <section className="wizard-step-panel">
      <h2>Social post editor</h2>
      <label>
        Platform
        <select
          value={selectedPlatform}
          onChange={(event) => setSelectedPlatform(event.target.value as SocialPlatform)}
        >
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </label>

      <label>
        Caption
        <textarea
          value={selectedVariant.caption}
          onChange={(event) =>
            updateVariant((variant) => ({
              ...variant,
              caption: event.target.value,
            }))
          }
          rows={6}
        />
      </label>

      <label>
        Hashtags (comma or space separated)
        <input
          value={selectedVariant.hashtags.join(" ")}
          onChange={(event) =>
            updateVariant((variant) => ({
              ...variant,
              hashtags: splitHashtags(event.target.value),
            }))
          }
        />
      </label>

      <label>
        Call to action
        <input
          value={selectedVariant.callToAction}
          onChange={(event) =>
            updateVariant((variant) => ({
              ...variant,
              callToAction: event.target.value,
            }))
          }
        />
      </label>

      <label>
        Link
        <input
          value={selectedVariant.link ?? ""}
          onChange={(event) =>
            updateVariant((variant) => ({
              ...variant,
              link: event.target.value || undefined,
            }))
          }
        />
      </label>
    </section>
  );
}
