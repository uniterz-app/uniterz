/**
 * 期間のチームリーグ表。ingest が試合ログ明細から一度だけ書いて、公開 GET は 1 doc。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  nbaStatsPeriodWindows,
  nbaStatsWindowId,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";
import {
  buildTeamWindowRowsFromDetails,
  fillWindowRatingsFromSeasonPace,
} from "@/lib/nba/leagueTeamStats/buildTeamWindowRowsFromGameLogs";
import {
  normalizeLeagueTeamStatsSeasonKey,
  teamRowForFirestore,
} from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { parseLeagueTeamWindowRows } from "@/lib/nba/leagueTeamStats/normalizeLeagueTeamStatsSnapshot";
import { NBA_ALL_TEAM_IDS } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import type { NbaTeamGameLogDetail } from "@/lib/nba/teamGameLog/teamGameLogDetail";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

export const NBA_LEAGUE_TEAM_WINDOW_COLLECTION = "nbaLeagueTeamWindow";

export function normalizeTeamWindowSeasonKey(
  raw: string | null | undefined
): string {
  return normalizeLeagueTeamStatsSeasonKey(raw ?? CURRENT_NBA_SEASON_KEY);
}

export async function writeTeamWindowSnapshotFromDetails(
  db: Firestore,
  seasonKey: string,
  details: Record<string, NbaTeamGameLogDetail>,
  seasonRows: ReadonlyArray<{ teamId: string; pace?: number | null }>,
  serverTimestamp: unknown
): Promise<{ windowCount: number }> {
  const season = normalizeTeamWindowSeasonKey(seasonKey);
  const detailsMap = new Map<string, NbaTeamGameLogDetail | null>(
    NBA_ALL_TEAM_IDS.map((id) => [id, details[id] ?? null])
  );
  const windows: Record<string, ReturnType<typeof teamRowForFirestore>[]> = {};
  for (const window of nbaStatsPeriodWindows()) {
    const rows = fillWindowRatingsFromSeasonPace(
      buildTeamWindowRowsFromDetails(detailsMap, window),
      seasonRows
    );
    if (rows.length === 0) continue;
    windows[nbaStatsWindowId(window)] = rows.map(teamRowForFirestore);
  }
  await db.collection(NBA_LEAGUE_TEAM_WINDOW_COLLECTION).doc(season).set({
    season,
    windows,
    source: "firestore",
    updatedAt: serverTimestamp,
  });
  return { windowCount: Object.keys(windows).length };
}

export async function loadTeamWindowRows(
  db: Firestore,
  seasonKey: string,
  window: NbaStatsWindow
): Promise<NbaLeagueTeamStatRow[]> {
  if (window.kind === "season") return [];
  const season = normalizeTeamWindowSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_LEAGUE_TEAM_WINDOW_COLLECTION)
    .doc(season)
    .get();
  if (!snap.exists) return [];
  const data = snap.data() as { windows?: unknown };
  const windows =
    data.windows && typeof data.windows === "object" && !Array.isArray(data.windows)
      ? (data.windows as Record<string, unknown>)
      : {};
  const parsed = parseLeagueTeamWindowRows(windows[nbaStatsWindowId(window)]);
  return parsed ?? [];
}
