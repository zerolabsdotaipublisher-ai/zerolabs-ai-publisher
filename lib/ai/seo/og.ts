import type { SeoOpenGraph } from "./types";

export function buildOpenGraphMetadata(args: {
  title: string;
  description: string;
  canonicalUrl: string;
  image?: string;
  type?: SeoOpenGraph["type"];
}): SeoOpenGraph {
  return {
    title: args.title,
    description: args.description,
    url: args.canonicalUrl,
    type: args.type ?? "website",
    image: args.image,
  };
}
