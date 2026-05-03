import { DEFAULT_INSTAGRAM_SCOPES } from "@/lib/social/instagram";
import type { SocialAccountPlatform, SocialAccountProvider } from "./types";

const PROVIDERS: Record<SocialAccountPlatform, SocialAccountProvider> = {
  instagram: {
    platform: "instagram",
    mvpSupported: true,
    supportsOAuth: true,
    defaultScopes: DEFAULT_INSTAGRAM_SCOPES,
  },
  facebook: {
    platform: "facebook",
    mvpSupported: false,
    supportsOAuth: false,
    defaultScopes: [],
  },
  linkedin: {
    platform: "linkedin",
    mvpSupported: false,
    supportsOAuth: false,
    defaultScopes: [],
  },
  x: {
    platform: "x",
    mvpSupported: false,
    supportsOAuth: false,
    defaultScopes: [],
  },
};

export function getSocialAccountProvider(platform: SocialAccountPlatform): SocialAccountProvider {
  return PROVIDERS[platform];
}

export function listSocialAccountProviders(): SocialAccountProvider[] {
  return Object.values(PROVIDERS);
}
