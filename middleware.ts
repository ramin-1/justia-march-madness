import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/entries", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  /**
   * Placeholder protection:
   * replace this with Auth.js session checks in Milestone 2.
   */
  const hasAdminSession = request.cookies.get("mm_admin_session")?.value === "1";

  if (hasAdminSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/entries/:path*", "/admin/:path*"],
};
