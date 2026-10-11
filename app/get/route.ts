import { NextResponse, type NextRequest } from "next/server";
import {
  getAppStoreShareUrl,
  PLAY_STORE_URL,
  resolveAppDownloadTarget,
} from "@/lib/share/shareAppUrls";

/** 共有用ダウンロード URL: iOS → App Store / Android → Google Play / その他 → 公式サイト */
export function GET(req: NextRequest) {
  const target = resolveAppDownloadTarget(req.headers.get("user-agent"));
  const appStoreUrl = getAppStoreShareUrl();

  const destination =
    target === "playStore"
      ? PLAY_STORE_URL
      : target === "appStore" && appStoreUrl
        ? appStoreUrl
        : new URL("/lp", req.url).toString();

  const res = NextResponse.redirect(destination, 302);
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Vary", "User-Agent");
  return res;
}
