import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /**
     * `/api` は除外。x-pathname は Web の layout（メンテ判定）専用で、
     * Native 向け API では使わない。API に乗ると Fast Origin Transfer が
     * 二重に付きやすいので対象外にする。
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
