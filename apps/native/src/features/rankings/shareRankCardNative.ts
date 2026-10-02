import type { RefObject } from "react";
import type { View } from "react-native";
import {
  buildRankCardShareCaption,
  type RankCardShareContext,
} from "../../../../../lib/rankings/shareMyRankCardImage";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

export type ShareRankCardNativeResult = ShareImageNativeResult;

type ShareMyRankCardNativeContext = RankCardShareContext & {
  appBaseUrl?: string | null;
};

/** 順位カードを PNG 化して共有（キャプションのみ。ランキング URL は付けない） */
export async function shareMyRankCardNative(
  viewRef: RefObject<View | null>,
  ctx: ShareMyRankCardNativeContext
): Promise<ShareRankCardNativeResult> {
  const caption = buildRankCardShareCaption(ctx);
  return captureAndShareImageNative(viewRef, { caption });
}
