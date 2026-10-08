/**
 * BDL の return_date は米国の試合日付（時刻なし）。チームのその日の試合（プレシーズン含む）を
 * Firestore `games` から引いて開始 ms を付ける。表示側はユーザーの時刻で日付を出す。
 */
import type { Firestore } from "firebase-admin/firestore";
import { resolveGameStartAt } from "../../../packages/shared/src/gameRow";
import { loadUpcomingNbaGames } from "@/lib/nba/games/loadUpcomingNbaGames";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";

/** これより先の復帰日は試合を引かない（米国日付のまま表示） */
const LOOKAHEAD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const GAMES_LIMIT = 400;

const US_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function teamIdOf(raw: Record<string, unknown>, side: "home" | "away"): string {
  const nested = raw[side] as { teamId?: unknown } | undefined;
  return String(raw[`${side}TeamId`] ?? nested?.teamId ?? "").trim();
}

function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function attachReturnGameStart(
  db: Firestore,
  teams: Record<string, NbaTeamInjuryEntry[]>,
  nowMs: number = Date.now()
): Promise<Record<string, NbaTeamInjuryEntry[]>> {
  const today = US_DATE_FORMAT.format(new Date(nowMs));
  const last = US_DATE_FORMAT.format(new Date(nowMs + LOOKAHEAD_DAYS * DAY_MS));
  const dates = new Set<string>();
  for (const list of Object.values(teams)) {
    for (const e of list) {
      if (isIsoDate(e.returnEstimate) && e.returnEstimate >= today && e.returnEstimate <= last) {
        dates.add(e.returnEstimate);
      }
    }
  }
  if (dates.size === 0) return teams;

  const sorted = [...dates].sort();
  const games = await loadUpcomingNbaGames(db, {
    fromMs: Date.parse(`${sorted[0]}T00:00:00Z`),
    toMs: Date.parse(`${sorted[sorted.length - 1]}T00:00:00Z`) + 2 * DAY_MS,
    limit: GAMES_LIMIT,
  });

  const startByTeamDate = new Map<string, number>();
  for (const { data } of games) {
    const start = resolveGameStartAt(data);
    if (!start) continue;
    const ms = start.getTime();
    const usDate = US_DATE_FORMAT.format(start);
    for (const teamId of [teamIdOf(data, "home"), teamIdOf(data, "away")]) {
      if (teamId) startByTeamDate.set(`${teamId}|${usDate}`, ms);
    }
  }

  const out: Record<string, NbaTeamInjuryEntry[]> = {};
  for (const [teamId, list] of Object.entries(teams)) {
    out[teamId] = list.map((e) => {
      const ms = isIsoDate(e.returnEstimate)
        ? startByTeamDate.get(`${teamId}|${e.returnEstimate}`)
        : undefined;
      return ms != null ? { ...e, returnGameStartMs: ms } : e;
    });
  }
  return out;
}
