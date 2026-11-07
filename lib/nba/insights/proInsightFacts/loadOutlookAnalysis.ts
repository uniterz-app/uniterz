/**
 * PREVIEW 展望の分析材料を Firestore から読む（BDL なし）。
 * 選手試合ログは 1 回の生成ジョブで 1 度だけ読み、試合ごとに使い回す。
 */
import type { Firestore } from "firebase-admin/firestore";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import {
  NBA_PLAYER_GAME_LOGS_COLLECTION,
  NBA_PLAYER_GAME_LOGS_PLAYERS_SUB,
} from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import {
  buildOutlookAnalysis,
  type OutlookPlayerLogs,
  type OutlookPlayerMetric,
  type ProInsightOutlookAnalysis,
} from "@/lib/nba/insights/proInsightFacts/buildOutlookAnalysis";

export async function loadSeasonPlayerLogs(
  db: Firestore,
  seasonKey: string
): Promise<Map<string, OutlookPlayerLogs>> {
  const snap = await db
    .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_GAME_LOGS_PLAYERS_SUB)
    .get();
  const out = new Map<string, OutlookPlayerLogs>();
  for (const d of snap.docs) {
    const data = d.data() as { teamId?: unknown; gameLogs?: unknown };
    const logs = Array.isArray(data.gameLogs) ? (data.gameLogs as NbaPlayerGameLog[]) : [];
    out.set(d.id, { teamId: typeof data.teamId === "string" ? data.teamId : null, logs });
  }
  return out;
}

async function loadPlayerMetrics(
  db: Firestore,
  seasonKey: string,
  playerIds: string[]
): Promise<Record<string, Record<string, OutlookPlayerMetric>>> {
  if (!playerIds.length) return {};
  const refs = playerIds.map((id) => db.doc(`nbaPlayerSeasonMetrics/${seasonKey}/players/${id}`));
  const snaps = await db.getAll(...refs);
  const out: Record<string, Record<string, OutlookPlayerMetric>> = {};
  for (const s of snaps) {
    const metrics = (s.data() as { metrics?: Record<string, OutlookPlayerMetric> } | undefined)?.metrics;
    if (metrics) out[s.id] = metrics;
  }
  return out;
}

export async function loadProInsightOutlookAnalysis(
  db: Firestore,
  input: {
    homeTeamId: string;
    awayTeamId: string;
    seasonKey: string;
    seasonRows: NbaLeagueTeamStatRow[];
    last10Rows: NbaLeagueTeamStatRow[];
    rosterTeams: Record<string, NbaTeamRosterDocTeam> | null;
    injuries: Record<string, NbaTeamInjuryEntry[]>;
    logsByPlayer: Map<string, OutlookPlayerLogs>;
  }
): Promise<ProInsightOutlookAnalysis | null> {
  try {
    const candidates = [input.homeTeamId, input.awayTeamId].flatMap((teamId) =>
      (input.rosterTeams?.[teamId]?.players ?? [])
        .filter((p) => p.gp > 0)
        .sort((a, b) => b.ppg - a.ppg)
        .slice(0, 6)
        .map((p) => String(p.id))
    );
    const metricsByPlayer = await loadPlayerMetrics(db, input.seasonKey, candidates);
    return buildOutlookAnalysis({ ...input, metricsByPlayer });
  } catch (e) {
    console.warn("[pro-insight] outlook analysis failed", e instanceof Error ? e.message : e);
    return null;
  }
}
