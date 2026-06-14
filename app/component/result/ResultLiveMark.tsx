"use client";

import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import type { Language } from "@/lib/i18n/language";

type Props = {
  isMobile: boolean;
  language?: Language;
};

/** リザルトカード右上など — HIT / MISS と同系の LIVE バッジ */
export default function ResultLiveMark({
  isMobile,
  language = "en",
}: Props) {
  return (
    <LiveMatchMark
      density={isMobile ? "resultMobile" : "resultDesktop"}
      language={language}
      className="pointer-events-auto"
    />
  );
}
