import { config } from "@/config";
import { createWasabiProvider } from "./wasabi";
import { createS3CompatibleProvider } from "./s3-compatible";
import type { MediaStorageProviderAdapter } from "./types";

export function getMediaStorageProvider(): MediaStorageProviderAdapter {
  // MVP default: Wasabi / S3-compatible.
  if (config.services.wasabi.endpoint?.includes("wasabi")) {
    return createWasabiProvider();
  }

  return createS3CompatibleProvider();
}

export type { MediaStorageProviderAdapter } from "./types";
