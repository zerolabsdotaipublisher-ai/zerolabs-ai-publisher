import { NextResponse } from "next/server";
import { config } from "@/config";
import {
  checkStorageAccess,
  createAnonymousStorageActor,
  createServiceStorageActor,
  createUserStorageActor,
  parseStorageAccessCheckBody,
  parseStorageServiceRole,
} from "@/lib/storage-access";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { getServerUser } from "@/lib/supabase/server";

function readBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await parseStorageAccessCheckBody(request);
    if (!body.resourceType || !body.operation) {
      return NextResponse.json({ ok: false, error: "resourceType and operation are required." }, { status: 400 });
    }

    const user = await getServerUser();
    const providedToken = readBearerToken(request);
    const serviceRole = parseStorageServiceRole(request.headers.get("x-storage-service-role"));
    const actor = user
      ? createUserStorageActor(user, body.tenantId)
      : providedToken && serviceRole && config.services.scheduler.executionToken && providedToken === config.services.scheduler.executionToken
        ? createServiceStorageActor(serviceRole, body.tenantId)
        : createAnonymousStorageActor();

    const result = await checkStorageAccess({
      actor,
      resourceType: body.resourceType,
      operation: body.operation,
      resourceId: body.resourceId,
      target: body.operation === "upload"
        ? {
            resourceType: body.resourceType,
            tenantId: body.tenantId ?? actor.tenantId ?? "",
            websiteId: body.websiteId,
            linkedContentId: body.linkedContentId,
            linkedContentType: body.linkedContentType,
          }
        : undefined,
    });

    return NextResponse.json({ ok: true, allowed: result.allowed, actorType: actor.actorType, serviceRole: actor.serviceRole });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to check storage access.");
  }
}
