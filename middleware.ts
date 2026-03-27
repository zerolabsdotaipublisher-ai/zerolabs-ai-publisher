import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPaths = [routes.dashboard];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (!protectedPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  if (user) {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = routes.login;
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
