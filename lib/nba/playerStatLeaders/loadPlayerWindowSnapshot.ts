/**
 * 期間の Player Leaders。ingest が試合ログから一度だけ書いて、公開 GET は 1 doc。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  filterLogsByWindow,
  nbaStatsPeriodWindows,
  nbaStatsWindowId,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";
import { loadWindowGameKits } from "@/lib/nba/leagueWindows/loadWindowGameKits";
import { enrichPlayerWindowBoardFromKits } from "@/lib/nba/leagueWindows/applyWindowGameKits";
import type { PlayerGameLogsForLeaders } from "@/lib/nba/playerStatLeaders/buildLast10LeadersFromGameLogs";
import {
  buildPlayerWindowLeadersFromGameLogs,
  emptyPlayerWindowBoard,
} from "@/lib/nba/playerStatLeaders/buildPlayerWindowLeadersFromGameLogs";
import { normalizePlayerStatLeadersSeasonKey } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import {
  collectPlayersFromLeaderBoards,
  compactPlayerLeaderBoardFilled,
  expandPlayerLeaderBoard,
  parseCompactLeaderPlayers,
} from "@/lib/nba/playerStatLeaders/normalizePlayerStatLeadersSnapshot";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

export const NBA_LEAGUE_PLAYER_WINDOW_COLLECTION = "nbaLeaguePlayerWindow";

export function normalizePlayerWindowSeasonKey(
  raw: string | null | undefined
): string {
  return normalizePlayerStatLeadersSeasonKey(raw ?? CURRENT_NBA_SEASON_KEY);
}

export async function writePlayerWindowSnapshotFromLogs(
  db: Firestore,
  seasonKey: string,
  players: readonly PlayerGameLogsForLeaders[],
  serverTimestamp: unknown
): Promise<{ windowCount: number }> {
  const season = normalizePlayerWindowSeasonKey(seasonKey);
  const kits = await loadWindowGameKits(db, season);
  const boards: Record<
    string,
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const window of nbaStatsPeriodWindows()) {
    const sliced = players.map((p) => ({
      playerId: p.playerId,
      playerName: p.playerName,
      teamId: p.teamId,
      gameLogs: filterLogsByWindow(p.gameLogs, window),
    }));
    boards[nbaStatsWindowId(window)] = enrichPlayerWindowBoardFromKits(
      buildPlayerWindowLeadersFromGameLogs(players, window),
      sliced,
      kits
    );
  }
  const windows: Record<string, Record<string, unknown>> = {};
  for (const [id, board] of Object.entries(boards)) {
    const compact = compactPlayerLeaderBoardFilled(board);
    if (Object.keys(compact).length === 0) continue;
    windows[id] = compact;
  }
  await db.collection(NBA_LEAGUE_PLAYER_WINDOW_COLLECTION).doc(season).set({
    season,
    players: collectPlayersFromLeaderBoards(Object.values(boards)),
    windows,
    source: "firestore",
    updatedAt: serverTimestamp,
  });
  return { windowCount: Object.keys(windows).length };
}

export async function loadPlayerWindowBoard(
  db: Firestore,
  seasonKey: string,
  window: NbaStatsWindow
): Promise<Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>> {
  const empty = emptyPlayerWindowBoard();
  if (window.kind === "season") return empty;
  const season = normalizePlayerWindowSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_LEAGUE_PLAYER_WINDOW_COLLECTION)
    .doc(season)
    .get();
  if (!snap.exists) return empty;
  const data = snap.data() as {
    players?: unknown;
    windows?: unknown;
  };
  const players = parseCompactLeaderPlayers(data.players);
  if (!players) return empty;
  const windows =
    data.windows && typeof data.windows === "object" && !Array.isArray(data.windows)
      ? (data.windows as Record<string, unknown>)
      : {};
  const raw = windows[nbaStatsWindowId(window)];
  if (raw == null) return empty;
  const expanded = expandPlayerLeaderBoard(raw, players);
  if (!expanded) return empty;
  return { ...empty, ...expanded };
}
