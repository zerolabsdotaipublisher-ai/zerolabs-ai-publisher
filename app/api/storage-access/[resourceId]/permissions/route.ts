import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import {
  createAnonymousStorageActor,
  createServiceStorageActor,
  createUserStorageActor,
  getStorageAccessPermissions,
  parseStorageResourceType,
  parseStorageServiceRole,
} from "@/lib/storage-access";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

function readBearerToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { resourceId } = await context.params;
    const resourceType = parseStorageResourceType(request.nextUrl.searchParams.get("resourceType"));
    if (!resourceType) {
      return NextResponse.json({ ok: false, error: "resourceType query parameter is required." }, { status: 400 });
    }

    const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim() || undefined;
    const user = await getServerUser();
    const providedToken = readBearerToken(request);
    const serviceRole = parseStorageServiceRole(request.headers.get("x-storage-service-role"));
    const actor = user
      ? createUserStorageActor(user, tenantId)
      : providedToken && serviceRole && config.services.scheduler.executionToken && providedToken === config.services.scheduler.executionToken
        ? createServiceStorageActor(serviceRole, tenantId)
        : createAnonymousStorageActor();

    const result = await getStorageAccessPermissions({
      actor,
      resourceType,
      resourceId: decodeURIComponent(resourceId).trim(),
    });

    return NextResponse.json({ ok: true, resource: result.resource, permissions: result.permissions, actorType: actor.actorType, serviceRole: actor.serviceRole });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to resolve storage permissions.");
  }
}
