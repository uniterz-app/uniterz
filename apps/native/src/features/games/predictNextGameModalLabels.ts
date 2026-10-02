/**
 * Web `app/component/predict/PredictNextGameModal.tsx` のラベル生成と同一ロジック。
 */
import { isPlayoffStyleGameCard } from "../../../../../lib/games/playoffSeriesUi";
import { normalizeLeague } from "../../../../../lib/leagues";
/** Web `PredictNextGameModal` と同じ `lib/team-name-split`（NBA は表ルールで City / ニックネーム） */
import { splitTeamNameByLeague } from "../../../../../lib/team-name-split";
import { displayNbaRoundLabel } from "../../../../../lib/games/displayNbaRoundLabel";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

/** 中継カード用：ニックネーム優先（例: New York Knicks → Knicks） */
export function scoreboardTeamLabelForNextModal(
  leagueRaw: unknown,
  rawName: string,
  language: string
): string {
  const lang = resolveLocalizedLang(language);
  const upper = lang !== "ja";
  const lg = normalizeLeague(leagueRaw);
  if (lg !== "nba" && lg !== "bj" && lg !== "j1" && lg !== "pl") {
    const s = rawName.trim();
    return upper ? s.toUpperCase() : s;
  }
  const [l1, l2] = splitTeamNameByLeague(lg, rawName);
  const nick = (l2 ?? "").replace(/\u00A0/g, "").trim();
  if (nick) return upper ? nick.toUpperCase() : nick;
  const primary = (l1 ?? "").trim() || rawName.trim();
  return upper ? primary.toUpperCase() : primary;
}

export function broadcastDeckTitleForNextModal(
  language: string,
  seasonPhase: "preseason" | "regular" | "play_in" | "playoffs" | null | undefined,
  roundLabel?: string | null
): string {
  const lang = resolveLocalizedLang(language);
  const rl = roundLabel?.trim();
  if (rl && isPlayoffStyleGameCard(seasonPhase, rl)) {
    return displayNbaRoundLabel(rl);
  }
  if (rl) {
    return displayNbaRoundLabel(rl);
  }
  if (seasonPhase === "playoffs") {
    return L(lang, {
      ja: "プレーオフ",
      en: "PLAYOFFS",
      ko: "플레이오프",
      zh: "季后赛",
      es: "PLAYOFFS",
      pt: "PLAYOFFS",
      fr: "PLAYOFFS",
    });
  }
  if (seasonPhase === "play_in") {
    return L(lang, {
      ja: "プレーイン",
      en: "PLAY-IN",
      ko: "플레이인",
      zh: "附加赛",
      es: "PLAY-IN",
      pt: "PLAY-IN",
      fr: "PLAY-IN",
    });
  }
  if (seasonPhase === "preseason") return "PRESEASON";
  return L(lang, {
    ja: "次の試合",
    en: "NEXT GAME",
    ko: "다음 경기",
    zh: "下一场",
    es: "SIGUIENTE",
    pt: "PRÓXIMO JOGO",
    fr: "MATCH SUIVANT",
  });
}

export type NextModalSeasonPhase =
  | "preseason"
  | "regular"
  | "play_in"
  | "playoffs"
  | null
  | undefined;
