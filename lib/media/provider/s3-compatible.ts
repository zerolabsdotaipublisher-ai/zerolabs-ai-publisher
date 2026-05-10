import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "@/config";
import type { MediaStorageProviderAdapter, ProviderDeleteObjectInput, ProviderSignedUrlInput, ProviderUploadObjectInput } from "./types";

function assertS3CompatibleConfig() {
  const accessKeyId = config.services.wasabi.accessKey;
  const secretAccessKey = config.services.wasabi.secretKey;
  const endpoint = config.services.wasabi.endpoint;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Wasabi/S3-compatible storage is not configured.");
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
    region: config.services.wasabi.region,
  };
}

let cachedClient: S3Client | null = null;
let cachedSignature = "";

function createS3Client(): S3Client {
  const cfg = assertS3CompatibleConfig();
  const signature = `${cfg.endpoint}|${cfg.region}|${cfg.accessKeyId}`;
  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  cachedSignature = signature;
  return cachedClient;
}

export function createS3CompatibleProvider(): MediaStorageProviderAdapter {
  return {
    name: "s3-compatible",
    async uploadObject(input: ProviderUploadObjectInput): Promise<void> {
      const client = createS3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: input.bucket,
          Key: input.objectKey,
          Body: input.bytes,
          ContentType: input.contentType,
          Metadata: input.metadata,
        }),
      );
    },
    async deleteObject(input: ProviderDeleteObjectInput): Promise<void> {
      const client = createS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: input.bucket,
          Key: input.objectKey,
        }),
      );
    },
    async createSignedReadUrl(input: ProviderSignedUrlInput): Promise<string> {
      const client = createS3Client();
      return getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: input.bucket,
          Key: input.objectKey,
        }),
        { expiresIn: input.expiresInSeconds },
      );
    },
  };
}
