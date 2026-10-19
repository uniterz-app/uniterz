import type { RefObject } from "react";
import type { View } from "react-native";
import {
  buildResultCardShareCaption,
  type ResultCardShareContext,
} from "../../../../../lib/result/shareResultCardCaption";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

/** リザルトカードを PNG 化して共有（キャプション + ダウンロード URL） */
export async function shareResultCardNative(
  viewRef: RefObject<View | null>,
  ctx: ResultCardShareContext
): Promise<ShareImageNativeResult> {
  const caption = buildResultCardShareCaption(ctx);
  return captureAndShareImageNative(viewRef, { caption });
}
