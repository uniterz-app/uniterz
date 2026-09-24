import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { buildSnsTextShareUrls } from "@/lib/share/snsShareUrls";

/** 共有キャプション生成用の文脈（順位・リーグ・母数） */
export type RankCardShareContext = {
  language: Language;
  rank?: number | null;
  leagueLabel?: string | null;
  totalEntries?: number | null;
};

export function buildRankCardShareCaption(ctx: RankCardShareContext): string {
  const { language, rank, leagueLabel, totalEntries } = ctx;
  const r = t(language).rankings;
  const locale = language === "ja" ? "ja-JP" : "en-US";

  if (typeof rank === "number" && rank > 0 && leagueLabel) {
    const rankStr = rank.toLocaleString(locale);
    if (typeof totalEntries === "number" && totalEntries > 0) {
      return r.shareRankCardText
        .replace("{league}", leagueLabel)
        .replace("{rank}", rankStr)
        .replace("{total}", totalEntries.toLocaleString(locale));
    }
    return r.shareRankCardTextNoTotal
      .replace("{league}", leagueLabel)
      .replace("{rank}", rankStr);
  }

  return language === "ja"
    ? "Uniterz ランキング #Uniterz"
    : "My Uniterz ranking #Uniterz";
}

export function buildRankCardShareUrls(language: Language, shareText?: string) {
  const caption = shareText ?? buildRankCardShareCaption({ language });
  /** ランキング一覧 URL は汎用すぎるので付けない（App Store は buildShareOutboundMessage 側） */
  return buildSnsTextShareUrls({ caption });
}

export function isMobileShareContext(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPhone|iPad|iPod|Android/i.test(ua) ||
    (typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches)
  );
}
