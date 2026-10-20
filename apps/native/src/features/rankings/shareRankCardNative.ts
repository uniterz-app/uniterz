import type { RefObject } from "react";
import type { View } from "react-native";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

export type ShareRankCardNativeResult = ShareImageNativeResult;

/** 順位カードを PNG 化して共有（画像のみ。文面・URL は付けない） */
export async function shareMyRankCardNative(
  viewRef: RefObject<View | null>
): Promise<ShareRankCardNativeResult> {
  return captureAndShareImageNative(viewRef);
}
