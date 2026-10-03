import { profileKinetikPanelCopy } from "@/lib/profile/profileKinetikPanelCopy";
import {
  buildShareOutboundMessage,
  getShareAppOrigin,
} from "@/lib/share/shareAppUrls";

export type ShareProfileOpts = {
  handle: string;
  displayName: string;
  variant: "web" | "mobile";
  language: string | null | undefined;
};

/**
 * 共有リンクは公開オリジン + /mobile（localhost やプレビュー URL を貼らない）。
 * 未ログイン着地・Universal Link は /mobile/u/* のみ対応。
 */
export function buildProfileShareUrl(handle: string): string {
  const safeHandle = encodeURIComponent(handle.trim());
  return `${getShareAppOrigin()}/mobile/u/${safeHandle}`;
}

/** Web Share API → 非対応時はクリップボード。成功時 true */
export async function shareProfileUrl(opts: ShareProfileOpts): Promise<boolean> {
  const url = buildProfileShareUrl(opts.handle);
  const title = opts.displayName;
  const caption = profileKinetikPanelCopy(opts.language).shareText(
    opts.displayName
  );

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      // url は別フィールドで渡す（text に含めると二重になる共有先がある）
      await navigator.share({ title, text: buildShareOutboundMessage(caption), url });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return false;
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(buildShareOutboundMessage(caption, url));
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
