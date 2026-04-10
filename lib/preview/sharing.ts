import "server-only";

import crypto from "crypto";
import { config, routes } from "@/config";
import type { PreviewShareResult, PreviewShareTokenPayload } from "./types";

const TOKEN_DELIMITER = ".";
const DEFAULT_PREVIEW_SHARE_TTL_IN_MINUTES = 60;
const MAX_PREVIEW_SHARE_TTL_IN_MINUTES = 1440;

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getPreviewSigningSecret(): string {
  return config.services.auth.jwtSecret || config.services.supabase.serviceRole;
}

function signPayload(payloadEncoded: string): string {
  return crypto.createHmac("sha256", getPreviewSigningSecret()).update(payloadEncoded).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPreviewShareToken(
  structureId: string,
  userId: string,
  ttlMinutes: number = DEFAULT_PREVIEW_SHARE_TTL_IN_MINUTES,
): PreviewShareResult {
  const boundedTtlMinutes = Math.max(1, Math.min(ttlMinutes, MAX_PREVIEW_SHARE_TTL_IN_MINUTES));
  const expiresAt = new Date(Date.now() + boundedTtlMinutes * 60_000);
  const payload: PreviewShareTokenPayload = {
    sid: structureId,
    uid: userId,
    exp: expiresAt.getTime(),
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);
  const shareToken = `${payloadEncoded}${TOKEN_DELIMITER}${signature}`;
  const sharePath = routes.previewShared(shareToken);

  return {
    structureId,
    shareToken,
    sharePath,
    expiresAt: expiresAt.toISOString(),
  };
}

export function verifyPreviewShareToken(token: string): PreviewShareTokenPayload | null {
  const [payloadEncoded, signature] = token.split(TOKEN_DELIMITER);
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expected = signPayload(payloadEncoded);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as PreviewShareTokenPayload;

    if (!payload.sid || !payload.uid || !payload.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function toAbsolutePreviewShareUrl(sharePath: string): string {
  return new URL(sharePath, config.app.url).toString();
}
