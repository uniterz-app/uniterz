import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isGuestPreviewPath } from "@/lib/guestPreviewPaths";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import {
  isAuthEntryRoute,
  normalizeRoutePath,
} from "@/lib/profileSetupRoute";

/** true にするとアプリ全体をメンテナンスオーバーレイでブロックする */
export const APP_MAINTENANCE_MODE = false;

/**
 * true にするとアプリ本体は描画せず、NBA シーズン再開告知オーバーレイのみ表示する。
 * 再開時は false に戻す。
 */
export const APP_NBA_SEASON_RESTART_OVERLAY = false;

/**
 * true のとき Web のアプリ本体（/web と /mobile の games など）だけメンテを出す。
 * Native は対象外。LP・ログイン・登録・電子公告は出る。
 * 本番反映: 2026-08-18
 */
export const APP_WEB_APP_MAINTENANCE = true;

/** 口座開設・定款の電子公告など、メンテ中でも公開する会社ページ */
export function isMaintenanceExemptPath(
  pathname: string | null | undefined
): boolean {
  if (isPublicLpPath(pathname)) return true;
  if (isGuestLegalPath(pathname)) return true;
  return false;
}

/** Web ログイン後のアプリだけ止めるパス（/web・/mobile） */
export function isWebAppMaintenancePath(
  pathname: string | null | undefined
): boolean {
  const path = normalizeRoutePath(pathname);
  const isWeb = path.startsWith("/web");
  const isMobile = path.startsWith("/mobile");
  if (!isWeb && !isMobile) return false;
  if (path === "/web" || path === "/mobile") return false;
  if (isMaintenanceExemptPath(path)) return false;
  if (isAuthEntryRoute(path)) return false;
  if (path.startsWith("/web/r/") || path.startsWith("/mobile/r/")) return false;
  if (isGuestPreviewPath(path)) return false;
  return true;
}
