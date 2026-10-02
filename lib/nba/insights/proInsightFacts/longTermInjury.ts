/**
 * 長期離脱（復帰見込み ≥21 日先 or シーズン絶望）は、チームが今季その選手抜きで
 * 3 試合戦ったら Insight から外す（チームはもう適応済み → 「形が変わる」は古い読み）。
 * Firestore の games.liveStats box のみ · BDL なし。
 */
import { normalizeLiveGameStatsDoc } from "@/lib/games/liveGameStats";
import { isProInsightEligibleNbaGame } from "@/lib/nba/insights/proInsightPhases";
import {
  teamIdFromSide,
  toMs,
} from "@/lib/nba/insights/proInsightFacts/highMinutePlayersFromLiveStats";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export const LONG_TERM_INJURY_MIN_DAYS = 21;
export const LONG_TERM_INJURY_STALE_GAMES = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

const SEASON_ENDING_RE =
  /season-ending|ends (his|\w+'s) season|out for the (season|year)|miss the (entire|rest of the|remainder of the) (\d{4}-\d{2} )?(season|campaign)|out indefinitely/i;

export function isLongTermInjury(
  entry: NbaTeamInjuryEntry,
  tipAtMs: number
): boolean {
  if (entry.status !== "out" && entry.status !== "doubtful") return false;
  const ret = entry.returnEstimate ? Date.parse(entry.returnEstimate) : NaN;
  if (Number.isFinite(ret) && ret - tipAtMs >= LONG_TERM_INJURY_MIN_DAYS * DAY_MS) {
    return true;
  }
  return SEASON_ENDING_RE.test(entry.reason ?? "");
}

/**
 * 今季レギュラーの直近試合から、選手が box にいない連続試合数（最大 limit）。
 * box の無い試合に当たったらそこで打ち切る（不明を欠場扱いしない）。
 */
export function consecutiveTeamGamesMissed(input: {
  docs: Array<{ id: string; data: Record<string, unknown> }>;
  teamId: string;
  playerId: string;
  beforeMs: number;
  limit?: number;
}): number {
  const limit = input.limit ?? LONG_TERM_INJURY_STALE_GAMES;
  const games = input.docs
    .map((d) => ({ data: d.data, tip: toMs(d.data.startAtJst) }))
    .filter((g): g is { data: Record<string, unknown>; tip: number } => {
      if (g.tip == null || g.tip >= input.beforeMs) return false;
      if (!isProInsightEligibleNbaGame(g.data)) return false;
      const home = teamIdFromSide(g.data.home, g.data.homeTeamId);
      const away = teamIdFromSide(g.data.away, g.data.awayTeamId);
      return home === input.teamId || away === input.teamId;
    })
    .sort((a, b) => b.tip - a.tip);

  let missed = 0;
  for (const g of games) {
    if (missed >= limit) break;
    const live = normalizeLiveGameStatsDoc(g.data.liveStats);
    if (!live) break;
    const home = teamIdFromSide(g.data.home, g.data.homeTeamId);
    const side = home === input.teamId ? live.box.home : live.box.away;
    if (side.length === 0) break;
    const played = side.some(
      (p) => String(p.playerId ?? "").trim() === input.playerId && p.min > 0
    );
    if (played) break;
    missed += 1;
  }
  return missed;
}

/** 長期離脱かつ今季すでに 3 試合欠場 → Insight 対象外 */
export function dropStaleLongTermInjuries(input: {
  injuries: NbaTeamInjuryEntry[];
  teamId: string;
  tipAtMs: number;
  docs: Array<{ id: string; data: Record<string, unknown> }>;
}): NbaTeamInjuryEntry[] {
  return input.injuries.filter((entry) => {
    if (!isLongTermInjury(entry, input.tipAtMs)) return true;
    const playerId = String(entry.playerId ?? "").trim();
    if (!playerId) return true;
    return (
      consecutiveTeamGamesMissed({
        docs: input.docs,
        teamId: input.teamId,
        playerId,
        beforeMs: input.tipAtMs,
      }) < LONG_TERM_INJURY_STALE_GAMES
    );
  });
}
