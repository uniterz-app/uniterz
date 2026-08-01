/**
 * 開発用プレビュー — ログイン不要（AuthGate / WebOrMobileSplash 共通）
 */

const EXACT_GUEST_PREVIEW_PATHS = new Set([
  "/web/tutorial-preview",
  "/mobile/tutorial-preview",
  "/web/berserk-pro-skin-preview",
  "/mobile/berserk-pro-skin-preview",
  "/web/cosmos-pro-skin-preview",
  "/mobile/cosmos-pro-skin-preview",
  "/web/settings-bg-preview",
  "/mobile/settings-bg-preview",
  "/mobile/pro-subscribe-preview",
  "/web/pro-subscribe-preview",
]);

/**
 * 末尾が `-preview` でもアプリ内機能としてナビバー・Auth を出すルート。
 * （Rankings から遷移するスクワッドバトルなど）
 */
const IN_APP_PREVIEW_PATHS = new Set([
  "/web/squad-battle-preview",
  "/mobile/squad-battle-preview",
]);

function isInAppPreviewPath(pathname: string): boolean {
  for (const p of IN_APP_PREVIEW_PATHS) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

/** `/dev/*` および `*-preview` 系はゲスト閲覧可 */
export function isGuestPreviewPath(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  if (isInAppPreviewPath(pathname)) return false;
  if (pathname.startsWith("/dev")) return true;
  if (pathname.startsWith("/mobile/profile-plan-pro-")) return true;
  if (EXACT_GUEST_PREVIEW_PATHS.has(pathname)) return true;
  // 末尾 / や将来のサブパス
  for (const p of EXACT_GUEST_PREVIEW_PATHS) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  // /web|mobile/*-preview
  if (
    /^\/(web|mobile)\/[a-z0-9-]+-preview(?:\/|$)/.test(pathname)
  ) {
    return true;
  }
  return false;
}
