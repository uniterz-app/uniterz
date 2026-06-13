export type ShareProfileOpts = {
  handle: string;
  displayName: string;
  variant: "web" | "mobile";
  language: "ja" | "en";
};

export function buildProfileShareUrl(
  handle: string,
  variant: "web" | "mobile"
): string {
  const safeHandle = encodeURIComponent(handle.trim());
  const path = `/${variant}/u/${safeHandle}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

/** Web Share API → 非対応時はクリップボード。成功時 true */
export async function shareProfileUrl(opts: ShareProfileOpts): Promise<boolean> {
  const url = buildProfileShareUrl(opts.handle, opts.variant);
  const title = opts.displayName;
  const text =
    opts.language === "ja"
      ? `${opts.displayName} のプロフィール`
      : `${opts.displayName}'s profile`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return false;
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
