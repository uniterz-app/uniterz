/** お問い合わせ添付。storage.rules の 8MB・ラスタ画像と揃える */
export const CONTACT_SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;

const CONTACT_SCREENSHOT_CONTENT_TYPE =
  /^image\/(png|jpe?g|webp|gif|heic|heif)$/i;

/** ルールが通す Content-Type だけ返す。それ以外は null */
export function contactScreenshotContentType(type: string): string | null {
  const normalized = type.trim().toLowerCase();
  return CONTACT_SCREENSHOT_CONTENT_TYPE.test(normalized) ? normalized : null;
}

/**
 * 本人が上げた問い合わせ画像のダウンロード URL だけ通す。
 * 管理画面がそのまま img で開くので、任意の https は受けない。
 */
export function isContactScreenshotUrl(uid: string, url: string): boolean {
  if (!uid || url.length > 2048) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== "firebasestorage.googleapis.com") return false;
  const path = safeDecodePath(parsed.pathname);
  return path.includes(`/o/contact_screenshots/${uid}/`);
}

function safeDecodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}
