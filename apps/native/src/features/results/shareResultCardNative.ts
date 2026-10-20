import type { RefObject } from "react";
import type { View } from "react-native";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

/** リザルトカードを PNG 化して共有（画像のみ） */
export async function shareResultCardNative(
  viewRef: RefObject<View | null>
): Promise<ShareImageNativeResult> {
  return captureAndShareImageNative(viewRef);
}
