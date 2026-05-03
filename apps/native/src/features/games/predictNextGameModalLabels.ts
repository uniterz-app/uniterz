/**
 * Web `app/component/predict/PredictNextGameModal.tsx` のラベル生成と同一ロジック。
 */
import { isPlayoffStyleGameCard } from "../../../../../lib/games/playoffSeriesUi";
import { normalizeLeague } from "../../../../../lib/leagues";
/** Web `PredictNextGameModal` と同じ `lib/team-name-split`（NBA は表ルールで City / ニックネーム） */
import { splitTeamNameByLeague } from "../../../../../lib/team-name-split";

/** 中継カード用：ニックネーム優先（例: New York Knicks → Knicks） */
export function scoreboardTeamLabelForNextModal(
  leagueRaw: unknown,
  rawName: string,
  isEn: boolean
): string {
  const lg = normalizeLeague(leagueRaw);
  if (lg !== "nba" && lg !== "bj" && lg !== "j1" && lg !== "pl") {
    const s = rawName.trim();
    return isEn ? s.toUpperCase() : s;
  }
  const [l1, l2] = splitTeamNameByLeague(lg, rawName);
  const nick = (l2 ?? "").replace(/\u00A0/g, "").trim();
  if (nick) return isEn ? nick.toUpperCase() : nick;
  const primary = (l1 ?? "").trim() || rawName.trim();
  return isEn ? primary.toUpperCase() : primary;
}

export function broadcastDeckTitleForNextModal(
  isEn: boolean,
  seasonPhase: "regular" | "play_in" | "playoffs" | null | undefined,
  roundLabel?: string | null
): string {
  const rl = roundLabel?.trim();
  if (rl && isPlayoffStyleGameCard(seasonPhase, rl)) {
    return isEn ? rl.toUpperCase() : rl;
  }
  if (rl) return isEn ? rl.toUpperCase() : rl;
  if (seasonPhase === "playoffs") return isEn ? "PLAYOFFS" : "プレーオフ";
  if (seasonPhase === "play_in") return isEn ? "PLAY-IN" : "プレーイン";
  return isEn ? "NEXT GAME" : "次の試合";
}

export type NextModalSeasonPhase = "regular" | "play_in" | "playoffs" | null | undefined;
