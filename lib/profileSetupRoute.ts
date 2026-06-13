/**
 * 初回プロフィールセットアップ（ユーザー名・言語など）のルート。
 * 末尾スラッシュの差も吸収する。
 */
export function normalizeRoutePath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const base = pathname.split("?")[0] ?? pathname;
  return base.length > 1 && base.endsWith("/") ? base.slice(0, -1) : base;
}

export function isProfileSetupRoute(pathname: string | null | undefined): boolean {
  const trimmed = normalizeRoutePath(pathname);
  return trimmed === "/web/onboarding" || trimmed === "/mobile/onboarding";
}

/** ログイン・サインアップ・パスワードリセット等（イベントモーダルを出さない） */
export function isAuthEntryRoute(pathname: string | null | undefined): boolean {
  const trimmed = normalizeRoutePath(pathname);
  if (isProfileSetupRoute(trimmed)) return true;
  if (
    trimmed === "/web/login" ||
    trimmed === "/web/signup" ||
    trimmed === "/mobile/login" ||
    trimmed === "/mobile/signup"
  ) {
    return true;
  }
  if (trimmed.startsWith("/web/reset") || trimmed.startsWith("/mobile/reset")) {
    return true;
  }
  return false;
}
