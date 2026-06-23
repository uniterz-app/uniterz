import type { RefObject } from "react";
import type { View } from "react-native";
import { buildResultShareUrl } from "../../../../../lib/share/shareAppUrls";
import {
  buildResultCardShareCaption,
  type ResultCardShareContext,
} from "../../../../../lib/result/shareResultCardCaption";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

/** リザルトカードを PNG 化して共有（キャプション + クリック可能 URL） */
export async function shareResultCardNative(
  viewRef: RefObject<View | null>,
  ctx: ResultCardShareContext
): Promise<ShareImageNativeResult> {
  const linkUrl = ctx.postId
    ? buildResultShareUrl(ctx.postId, ctx.appBaseUrl)
    : undefined;
  const caption = buildResultCardShareCaption(ctx);
  return captureAndShareImageNative(viewRef, { caption, linkUrl });
}
