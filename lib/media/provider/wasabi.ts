import { createS3CompatibleProvider } from "./s3-compatible";
import type { MediaStorageProviderAdapter } from "./types";

export function createWasabiProvider(): MediaStorageProviderAdapter {
  return {
    ...createS3CompatibleProvider(),
    name: "wasabi",
  };
}
