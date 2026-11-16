/**
 * 週間・月間ランキング画面の「いま」ラベル。
 * カレンダー新期間でも、その期間の最初の試合日が全部終わるまでは前期間。
 */
import { getAdminDb } from "@/lib/firebaseAdmin";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { loadGameDayIndex } from "@/lib/games/server/gameDayIndexAdmin";
import {
  currentRankingPeriodLabel,
  previousRankingPeriodLabel,
  rankingPeriodFullEndKey,
  resolveRankingPeriodRangeForLabel,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import { pickDisplayedRankingPeriodLabel } from "@/lib/rankings/pickDisplayedRankingPeriodLabel";
import { isNbaEtSlateSettledAdmin } from "@/lib/rankings/server/isNbaEtSlateSettledAdmin";
import { TIMEZONE_ET, toDateKeyInTimeZone } from "@/lib/time/zonedTime";

type PeriodOnly = Exclude<RankingPeriod, "season">;

function firstGameDayKeyInPeriod(
  startMs: readonly number[],
  startKey: string,
  endKey: string
): string | null {
  let first: string | null = null;
  for (const ms of startMs) {
    if (!Number.isFinite(ms)) continue;
    const key = toDateKeyInTimeZone(new Date(ms), TIMEZONE_ET);
    if (key < startKey || key > endKey) continue;
    if (!first || key < first) first = key;
  }
  return first;
}

export async function resolveDisplayedRankingPeriodLabel(
  period: PeriodOnly,
  now: Date = new Date()
): Promise<string> {
  const calendarLabel = currentRankingPeriodLabel(period, now);
  const previousLabel = previousRankingPeriodLabel(period, calendarLabel);
  const range = resolveRankingPeriodRangeForLabel(period, calendarLabel, now);
  const fullEnd = rankingPeriodFullEndKey(period, calendarLabel);

  const db = getAdminDb();
  const index = await loadGameDayIndex(db, {
    league: "nba",
    season: GAME_SCHEDULE_SEASON,
  });
  const firstGameDayKey = firstGameDayKeyInPeriod(
    index.startMs ?? [],
    range.startKey,
    fullEnd
  );

  let firstGameDaySettled = false;
  if (firstGameDayKey) {
    firstGameDaySettled = await isNbaEtSlateSettledAdmin(db, firstGameDayKey);
  }

  return pickDisplayedRankingPeriodLabel({
    calendarLabel,
    previousLabel,
    firstGameDayKey,
    firstGameDaySettled,
  });
}
