/** LINE / X テキスト共有用 Intent URL */

import {
  buildShareOutboundMessage,
  getAppStoreShareUrl,
} from "./shareAppUrls";

export type SnsTextShareUrls = {
  /** 共有キャプション（ディープリンク + App Store 込み） */
  text: string;
  /** モバイル LINE アプリ直開き */
  lineAppUrl: string;
  /** LINE It（Web） */
  lineUrl: string;
  /** X（旧 Twitter）Intent */
  xUrl: string;
};

export type BuildSnsTextShareUrlsOptions = {
  caption: string;
  /** ある場合 LINE app 本文に追記し、LINE It / X の url クエリにも付与 */
  url?: string | null;
};

/** キャプション + 任意 URL から LINE / X 共有 URL を生成 */
export function buildSnsTextShareUrls({
  caption,
  url,
}: BuildSnsTextShareUrlsOptions): SnsTextShareUrls {
  const text = buildShareOutboundMessage(caption, url);
  const link = url?.trim() || getAppStoreShareUrl() || undefined;
  const urlPart = link ? `&url=${encodeURIComponent(link)}` : "";

  return {
    text,
    lineAppUrl: `line://msg/text/${encodeURIComponent(text)}`,
    lineUrl: `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(
      text
    )}${urlPart}`,
    xUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}${urlPart}`,
  };
}
