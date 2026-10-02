/**
 * Firestore `nbaTeamShapeRecords/{seasonKey}` 読み書き。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  buildTeamShapeRecords,
  teamShapeGameFromDoc,
} from "@/lib/nba/teamShapes/buildTeamShapeRecords";
import type { TeamShapeSeasonRates } from "@/lib/nba/teamShapes/evalGameShape";
import {
  NBA_TEAM_SHAPE_RECORDS_COLLECTION,
  type NbaTeamShapeRecordsBundle,
} from "@/lib/nba/teamShapes/teamShapeTypes";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export function normalizeTeamShapeSeasonKey(
  raw: string | null | undefined
): string {
  const t = (raw ?? "").trim();
  return t || CURRENT_NBA_SEASON_KEY;
}

export async function writeTeamShapeRecordsSnapshot(
  db: Firestore,
  bundle: NbaTeamShapeRecordsBundle
): Promise<void> {
  const seasonKey = normalizeTeamShapeSeasonKey(bundle.seasonKey);
  await db
    .collection(NBA_TEAM_SHAPE_RECORDS_COLLECTION)
    .doc(seasonKey)
    .set(
      {
        ...bundle,
        seasonKey,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: false }
    );
}

export async function loadTeamShapeRecordsBundle(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamShapeRecordsBundle | null> {
  const season = normalizeTeamShapeSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_TEAM_SHAPE_RECORDS_COLLECTION)
    .doc(season)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as NbaTeamShapeRecordsBundle & {
    updatedAt?: { toDate?: () => Date };
  };
  if (!data?.teams || typeof data.teams !== "object") return null;
  return {
    seasonKey: season,
    teams: data.teams,
    gameCount: typeof data.gameCount === "number" ? data.gameCount : 0,
    gamesWithBox:
      typeof data.gamesWithBox === "number" ? data.gamesWithBox : 0,
    builtAtMs: typeof data.builtAtMs === "number" ? data.builtAtMs : 0,
    source: String(data.source ?? "firestore"),
  };
}

/** リーグ表シーズン行 → 相対 shape 用レート */
export async function loadTeamShapeSeasonRates(
  db: Firestore,
  seasonKey: string
): Promise<Map<string, TeamShapeSeasonRates>> {
  const map = new Map<string, TeamShapeSeasonRates>();
  try {
    const payload = await loadLeagueTeamStatsSnapshot(db, seasonKey);
    for (const row of payload.bundle.season ?? []) {
      const teamId = String(row.teamId ?? "").trim();
      if (!teamId) continue;
      const ortg = typeof row.ortg === "number" ? row.ortg : NaN;
      const papg = typeof row.papg === "number" ? row.papg : NaN;
      if (!(ortg >= 80) || !(papg >= 80)) continue;
      map.set(teamId, { ortg, papg });
    }
  } catch (e) {
    console.warn("[loadTeamShapeSeasonRates] failed", e);
  }
  return map;
}

/** games コレクションから今季 final を集計して書く */
export async function buildAndWriteTeamShapeRecordsFromGames(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamShapeRecordsBundle> {
  const season = normalizeTeamShapeSeasonKey(seasonKey);
  const [snap, seasonRatesByTeam] = await Promise.all([
    db
      .collection("games")
      .where("league", "==", "nba")
      .where("season", "==", season)
      .get(),
    loadTeamShapeSeasonRates(db, season),
  ]);

  const games = [];
  for (const doc of snap.docs) {
    const g = teamShapeGameFromDoc(doc.data() as Record<string, unknown>);
    if (g) games.push(g);
  }

  const bundle = buildTeamShapeRecords({
    seasonKey: season,
    games,
    seasonRatesByTeam,
    source: "games-liveStats",
    builtAtMs: Date.now(),
  });
  await writeTeamShapeRecordsSnapshot(db, bundle);
  return bundle;
}
