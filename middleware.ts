import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPaths = [
  routes.dashboard,
  routes.activity,
  routes.contentLibrary,
  routes.review,
  routes.approval,
  routes.createWebsite,
  routes.generateWebsite,
  routes.websites,
  routes.profile,
  routes.edit,
  routes.revisions,
  routes.editor,
  routes.generatedSites,
  routes.preview,
];
const exactProtectedPaths = new Set(protectedPaths);
const protectedPathPrefixes = protectedPaths.map((path) => `${path}/`);

function isProtectedPath(pathname: string): boolean {
  return exactProtectedPaths.has(pathname) || protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // Keep public routes out of Supabase middleware entirely so the homepage,
  // login, logout callback, and marketing pages cannot get trapped in auth
  // refresh work or redirect loops at the edge.
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const { response, hasSession } = await updateSession(request);

  if (hasSession) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = routes.login;
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Keep static assets and API handlers out of edge auth checks entirely.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
