import type { NextConfig } from "next";
import { validateEnv } from "./config/env";

// Fail fast at build time or dev-server startup if required vars are missing.
validateEnv();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
