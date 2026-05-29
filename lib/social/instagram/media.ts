import { getInstagramGraphApiBaseUrl } from "./config";
import { InstagramIntegrationError } from "./errors";
import type {
  InstagramGraphMediaContainerResponse,
  InstagramGraphPublishResponse,
} from "./types";

interface InstagramGraphErrorResponse {
  error?: {
    message?: string;
    code?: number;
    type?: string;
    error_subcode?: number;
    is_transient?: boolean;
  };
}

function classifyInstagramApiRetryability(
  status: number,
  providerCode?: number,
  isTransient?: boolean,
): boolean {
  if (isTransient) return true;
  if (status >= 500 || status === 429) return true;
  // Meta Graph common transient/rate-limit style codes:
  // 2   -> service temporarily unavailable
  // 4   -> application-level throttle
  // 17  -> user-level throttle
  // 32  -> page-level request throttle
  // 613 -> overall call rate exceeded
  if (providerCode && [2, 4, 17, 32, 613].includes(providerCode)) return true;
  return false;
}

function parseRetryAfterSeconds(response: Response): number | undefined {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return undefined;

  const asNumber = Number.parseInt(retryAfter, 10);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }
  return undefined;
}

function toInstagramApiError(
  status: number,
  payload: InstagramGraphErrorResponse,
  response: Response,
): InstagramIntegrationError {
  const retryAfterSeconds = parseRetryAfterSeconds(response);
  const providerCode = payload.error?.code;

  return new InstagramIntegrationError(payload.error?.message ?? "Instagram Graph API request failed.", {
    code: "instagram_graph_api_error",
    statusCode: status,
    retryable: classifyInstagramApiRetryability(status, providerCode, payload.error?.is_transient),
    metadata: {
      providerCode,
      providerType: payload.error?.type,
      providerSubCode: payload.error?.error_subcode,
      retryAfterSeconds,
    },
  });
}

export async function createInstagramMediaContainer(input: {
  instagramAccountId: string;
  imageUrl: string;
  caption: string;
  accessToken: string;
}): Promise<InstagramGraphMediaContainerResponse> {
  const url = new URL(`${getInstagramGraphApiBaseUrl()}/${input.instagramAccountId}/media`);
  url.searchParams.set("image_url", input.imageUrl);
  url.searchParams.set("caption", input.caption);
  url.searchParams.set("access_token", input.accessToken);

  const response = await fetch(url, { method: "POST" });
  const data = (await response.json()) as InstagramGraphMediaContainerResponse & InstagramGraphErrorResponse;
  if (!response.ok || !data.id) {
    throw toInstagramApiError(response.status, data, response);
  }

  return data;
}

export async function publishInstagramMediaContainer(input: {
  instagramAccountId: string;
  creationId: string;
  accessToken: string;
}): Promise<InstagramGraphPublishResponse> {
  const url = new URL(`${getInstagramGraphApiBaseUrl()}/${input.instagramAccountId}/media_publish`);
  url.searchParams.set("creation_id", input.creationId);
  url.searchParams.set("access_token", input.accessToken);

  const response = await fetch(url, { method: "POST" });
  const data = (await response.json()) as InstagramGraphPublishResponse & InstagramGraphErrorResponse;
  if (!response.ok || !data.id) {
    throw toInstagramApiError(response.status, data, response);
  }

  return data;
}
