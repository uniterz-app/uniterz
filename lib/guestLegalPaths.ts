/** Guest-facing legal / help routes: no app chrome NavBar (see WebOrMobileSplash, AppChrome). */
export const GUEST_LEGAL_PATHS = new Set([
  "/web/help",
  "/web/privacy",
  "/web/terms",
  "/web/contact",
  "/web/contacts",
  "/web/electronic-notice",
  "/mobile/help",
  "/mobile/privacy",
  "/mobile/terms",
  "/mobile/contact",
  "/mobile/electronic-notice",
]);

export function isGuestLegalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return GUEST_LEGAL_PATHS.has(pathname);
}
