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
 * true のとき Web のアプリ本体（games など）だけ来季メンテを出す。
 * LP・ログイン・登録・電子公告は出る。
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

/** Web ログイン後のアプリだけ止めるパス */
export function isWebAppMaintenancePath(
  pathname: string | null | undefined
): boolean {
  const path = normalizeRoutePath(pathname);
  if (!path.startsWith("/web")) return false;
  if (path === "/web") return false;
  if (isMaintenanceExemptPath(path)) return false;
  if (isAuthEntryRoute(path)) return false;
  if (path.startsWith("/web/r/")) return false;
  if (isGuestPreviewPath(path)) return false;
  return true;
}
