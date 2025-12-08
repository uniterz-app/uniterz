import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証ページはそのまま通す
const AUTH_PAGES = ["/mobile/login", "/mobile/signup"];

// mobile配下はAuthProviderで守るので通す
const PREFIX_MOBILE = "/mobile";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /mobile/... だけチェック。
  if (!pathname.startsWith(PREFIX_MOBILE)) {
    return NextResponse.next();
  }

  // login / signup はブロックしない
  if (AUTH_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  // ここでは何もせず “通すだけ”
  // 🔥 AuthGate を使っていた時のような SplashWrapper などを
  // 🔥 ページ遷移ごとに発火させないための役割。
  return NextResponse.next();
}

export const config = {
  matcher: ["/mobile/:path*"],
};
