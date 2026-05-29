import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "@/config";
import { SocialAccountError } from "./validation";

function encryptionKey(): Buffer {
  if (!config.services.auth.jwtSecret) {
    throw new SocialAccountError(
      "JWT_SECRET is required to encrypt social account access tokens in storage.",
      {
        code: "social_account_token_encryption_not_configured",
        statusCode: 500,
      },
    );
  }

  return createHash("sha256").update(config.services.auth.jwtSecret).digest();
}

export function encryptSocialAccessToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSocialAccessToken(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4) {
    throw new SocialAccountError("Invalid encrypted social account token format.", {
      code: "social_account_token_decrypt_invalid_format",
      statusCode: 500,
    });
  }

  const [version, ivB64, tagB64, dataB64] = parts;
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new SocialAccountError("Invalid encrypted social account token format.", {
      code: "social_account_token_decrypt_invalid_format",
      statusCode: 500,
    });
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
