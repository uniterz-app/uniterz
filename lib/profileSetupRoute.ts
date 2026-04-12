/**
 * 初回プロフィールセットアップ（ユーザー名・言語など）のルート。
 * 末尾スラッシュの差も吸収する。
 */
export function isProfileSetupRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const base = pathname.split("?")[0] ?? pathname;
  const trimmed =
    base.length > 1 && base.endsWith("/") ? base.slice(0, -1) : base;
  return (
    trimmed === "/web/onboarding" || trimmed === "/mobile/onboarding"
  );
}
