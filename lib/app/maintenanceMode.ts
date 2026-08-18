import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import { normalizeRoutePath } from "@/lib/profileSetupRoute";

/** true にするとアプリ全体をメンテナンスオーバーレイでブロックする */
export const APP_MAINTENANCE_MODE = false;

/**
 * true にするとアプリ本体は描画せず、NBA シーズン再開告知オーバーレイのみ表示する。
 * 再開時は false に戻す。
 */
export const APP_NBA_SEASON_RESTART_OVERLAY = false;

/**
 * true のとき Web ではアプリ本体をマウントせずメンテ画面だけ出す。
 * Native は対象外。LP・電子公告などの公開ページは出る。
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

/**
 * このパスでは Web アプリ本体を描画しない（メンテ画面のみ）。
 * `/` はゲストを LP へ送るスプラッシュのため除外。
 */
export function shouldReplaceWebAppWithMaintenance(
  pathname: string | null | undefined
): boolean {
  if (!APP_WEB_APP_MAINTENANCE) return false;
  const path = normalizeRoutePath(pathname);
  if (!path || path === "/") return false;
  if (path.startsWith("/admin")) return false;
  if (isMaintenanceExemptPath(path)) return false;
  return true;
}

/** @deprecated shouldReplaceWebAppWithMaintenance を使う */
export function isWebAppMaintenancePath(
  pathname: string | null | undefined
): boolean {
  return shouldReplaceWebAppWithMaintenance(pathname);
}
