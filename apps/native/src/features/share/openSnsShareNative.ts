/** Native: OS 共有シート + 文面コピー */

import { Share } from "react-native";
import { buildShareOutboundMessage } from "../../../../../lib/share/shareAppUrls";
import { copyTextNative } from "../leaderboards/copyTextNative";
import {
  shareImageUriNative,
  type ShareImageNativeResult,
} from "./shareImageNative";

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss");
}

/** OS 共有シート（画像ありなら PNG + 文面） */
export async function shareViaOsNative(options: {
  caption: string;
  linkUrl?: string | null;
  imageUri?: string | null;
  title?: string;
}): Promise<ShareImageNativeResult> {
  const { caption, linkUrl, imageUri, title } = options;
  if (imageUri) {
    return shareImageUriNative(imageUri, {
      caption,
      linkUrl: linkUrl ?? undefined,
    });
  }

  const message = buildShareOutboundMessage(caption, linkUrl);
  try {
    const result = await Share.share({
      message,
      title: title ?? message.split("\n")[0]?.slice(0, 80) ?? "Uniterz",
      ...(linkUrl ? { url: linkUrl } : {}),
    });
    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch (error) {
    if (isShareCancelled(error)) return "cancelled";
    return "failed";
  }
}

/** キャプション（+ ディープリンク + App Store）をクリップボードへ */
export async function copyShareCaptionNative(options: {
  caption: string;
  linkUrl?: string | null;
}): Promise<boolean> {
  return copyTextNative(
    buildShareOutboundMessage(options.caption, options.linkUrl)
  );
}
