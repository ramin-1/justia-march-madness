import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedPrefixes = ["/entries", "/admin/results"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const proxy = auth((request) => {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.auth?.user) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/entries/:path*", "/admin/results"],
};
