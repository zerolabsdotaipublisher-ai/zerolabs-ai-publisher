import type { NextConfig } from "next";
import { validateEnv } from "./config/env";

// Fail fast at build time or dev-server startup if required vars are missing.
validateEnv();

const nextConfig: NextConfig = {
  experimental: {
    // Keep multipart uploads below Vercel's 4.5 MB Function request limit.
    serverActions: {
      bodySizeLimit: "4.4mb",
    },
  },
};

export default nextConfig;
