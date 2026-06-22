import type { Language } from "@/lib/i18n/language";

export type FootballScoringChangeCopy = {
  tag: string;
  title: string;
  lead: string;
};

export function resolveFootballScoringChangeCopy(
  language: Language
): FootballScoringChangeCopy {
  if (language === "en") {
    return {
      tag: "RULE UPDATE",
      title: "Soccer scoring updated",
      lead:
        "Base points now use winner + HOME goals + AWAY goals + goal difference. Each part adds points only when your winner pick is correct.",
    };
  }

  return {
    tag: "採点変更",
    title: "サッカーの採点ルールが更新されました",
    lead:
      "基本点は「勝者＋HOME得点＋AWAY得点＋得失点差」で加点します。勝者予想が合っているときだけ、それぞれの項目が加点対象になります。",
  };
}
