import { type NextRequest, NextResponse } from "next/server";
import { createSocialPublishHistoryForInstagramJob } from "@/lib/social/history";
import { logger } from "@/lib/observability";
import { getSocialPostById } from "@/lib/social";
import {
  createInstagramPublishJob,
  executeInstagramPublishJob,
  getInstagramConnection,
  prepareInstagramPublishPayload,
  updateInstagramPublishJob,
} from "@/lib/social/instagram";
import { getServerUser } from "@/lib/supabase/server";

interface InstagramPublishRouteBody {
  postId?: string;
  scheduledFor?: string;
  maxAttempts?: number;
}

function parseScheduledFor(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("scheduledFor must be a valid ISO timestamp.");
  }
  return parsed.toISOString();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: InstagramPublishRouteBody;
  try {
    body = (await request.json()) as InstagramPublishRouteBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.postId?.trim()) {
    return NextResponse.json({ ok: false, error: "postId is required." }, { status: 400 });
  }

  const socialPost = await getSocialPostById(body.postId, user.id);
  if (!socialPost) {
    return NextResponse.json({ ok: false, error: "Social post not found." }, { status: 404 });
  }

  const variant = socialPost.variants.find((entry) => entry.platform === "instagram");
  if (!variant) {
    return NextResponse.json(
      { ok: false, error: "The social post does not include an Instagram variant." },
      { status: 422 },
    );
  }

  const connection = await getInstagramConnection(user.id);
  if (!connection || connection.connectionStatus !== "connected" || !connection.instagramAccountId) {
    return NextResponse.json(
      { ok: false, error: "Instagram account is not connected for this user." },
      { status: 409 },
    );
  }

  try {
    const payload = prepareInstagramPublishPayload(variant);
    const scheduledFor = parseScheduledFor(body.scheduledFor);
    const job = await createInstagramPublishJob({
      userId: user.id,
      socialPostId: socialPost.id,
      caption: payload.caption,
      mediaUrl: payload.mediaUrl,
      instagramAccountId: connection.instagramAccountId,
      facebookPageId: connection.facebookPageId,
      scheduledFor,
      maxAttempts: body.maxAttempts,
      metadata: {
        source: "api/social/instagram/publish",
        structureId: socialPost.structureId,
      },
    });

    const history = await createSocialPublishHistoryForInstagramJob({
      job,
      source: "manual",
      sourceRefId: "api/social/instagram/publish",
      structureId: socialPost.structureId,
      socialPostId: socialPost.id,
      tenantId:
        (typeof user.app_metadata?.tenantId === "string" && user.app_metadata.tenantId) ||
        (typeof user.user_metadata?.tenantId === "string" && user.user_metadata.tenantId) ||
        undefined,
      contentMetadata: {
        hashtags: variant.hashtags,
        callToAction: variant.callToAction,
        metadata: variant.metadata,
      },
    });
    await updateInstagramPublishJob(job.id, user.id, {
      metadata_json: {
        ...job.metadata,
        historyJobId: history.id,
      },
    });

    const runImmediately = new Date(scheduledFor).getTime() <= Date.now();
    const executedJob = runImmediately ? await executeInstagramPublishJob(job.id, user.id) : job;

    return NextResponse.json({
      ok: true,
      job: executedJob,
      scheduled: !runImmediately,
    });
  } catch (error) {
    logger.error("Instagram publish route failed", {
      category: "error",
      service: "instagram",
      userId: user.id,
      error: {
        name: "InstagramPublishRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        postId: body.postId,
      },
    });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Instagram publish failed." },
      { status: 500 },
    );
  }
}
