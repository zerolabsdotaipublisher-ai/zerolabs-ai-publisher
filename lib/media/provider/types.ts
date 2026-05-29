import type { MediaProvider } from "../types";

export interface ProviderUploadObjectInput {
  bucket: string;
  objectKey: string;
  contentType: string;
  bytes: Uint8Array;
  metadata?: Record<string, string>;
}

export interface ProviderDeleteObjectInput {
  bucket: string;
  objectKey: string;
}

export interface ProviderSignedUrlInput {
  bucket: string;
  objectKey: string;
  expiresInSeconds: number;
}

export interface MediaStorageProviderAdapter {
  name: MediaProvider;
  uploadObject(input: ProviderUploadObjectInput): Promise<void>;
  deleteObject(input: ProviderDeleteObjectInput): Promise<void>;
  createSignedReadUrl(input: ProviderSignedUrlInput): Promise<string>;
}
