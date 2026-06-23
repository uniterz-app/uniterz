import type { RefObject } from "react";
import type { View } from "react-native";
import {
  buildRankCardShareCaption,
  type RankCardShareContext,
} from "../../../../../lib/rankings/shareMyRankCardImage";
import { buildRankingsShareUrl } from "../../../../../lib/share/shareAppUrls";
import {
  captureAndShareImageNative,
  type ShareImageNativeResult,
} from "../share/shareImageNative";

export type ShareRankCardNativeResult = ShareImageNativeResult;

type ShareMyRankCardNativeContext = RankCardShareContext & {
  appBaseUrl?: string | null;
};

/** 順位カードを PNG 化して共有（キャプション + ランキング URL） */
export async function shareMyRankCardNative(
  viewRef: RefObject<View | null>,
  ctx: ShareMyRankCardNativeContext
): Promise<ShareRankCardNativeResult> {
  const caption = buildRankCardShareCaption(ctx);
  const linkUrl = buildRankingsShareUrl(ctx.appBaseUrl);
  return captureAndShareImageNative(viewRef, { caption, linkUrl });
}
