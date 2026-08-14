/** ログイン不要の公開 LP。App chrome / AuthGate / EventGate を外す。 */
export function isPublicLpPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (
    pathname === "/lp" ||
    pathname.startsWith("/lp-") ||
    pathname.startsWith("/lp/")
  ) {
    return true;
  }
  if (
    pathname === "/mobile/lp" ||
    pathname.startsWith("/mobile/lp-") ||
    pathname.startsWith("/mobile/lp/")
  ) {
    return true;
  }
  return false;
}
