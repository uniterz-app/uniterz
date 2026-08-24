import type { Firestore } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import {
  resolveLeagueTeamStatsFromFirestore,
  resolveLeagueTeamStatsEmptyFallback,
  bundleFromFirestoreData,
} from "./normalizeLeagueTeamStatsSnapshot";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS } from "@/lib/predict/nbaLeagueTeamStatsAdvanced";
import type {
  NbaLeagueTeamStatsApiPayload,
  NbaLeagueTeamStatsFirestoreDoc,
  NbaLeagueTeamStatsSnapshotSource,
} from "./leagueTeamStatsTypes";

export const NBA_LEAGUE_TEAM_STATS_COLLECTION = "nbaLeagueTeamStats";

export function normalizeLeagueTeamStatsSeasonKey(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

export async function loadLeagueTeamStatsSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaLeagueTeamStatsApiPayload> {
  // オフシーズン等: CURRENT に doc が無くても前シーズンの実データを出す
  const candidates = [seasonKey];
  const prev = previousNbaSeasonKey(seasonKey);
  if (prev !== seasonKey) candidates.push(prev);

  let fromFs: ReturnType<typeof resolveLeagueTeamStatsFromFirestore> = null;
  for (const key of candidates) {
    const snap = await db
      .collection(NBA_LEAGUE_TEAM_STATS_COLLECTION)
      .doc(key)
      .get();
    if (!snap.exists) continue;
    fromFs = resolveLeagueTeamStatsFromFirestore(
      snap.data() as NbaLeagueTeamStatsFirestoreDoc
    );
    if (fromFs) break;
  }

  const resolved = fromFs ?? resolveLeagueTeamStatsEmptyFallback(seasonKey);

  return {
    ok: true,
    season: seasonKey,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
  };
}

/** Firestore に載せる core + advanced（clutch / playtype 等） */
function teamRowForFirestore(row: NbaLeagueTeamStatsBundle["season"][number]) {
  const core = {
    teamId: row.teamId,
    teamName: row.teamName,
    conference: row.conference,
    wins: row.wins,
    losses: row.losses,
    winPct: row.winPct,
    ppg: row.ppg,
    papg: row.papg,
    diff: row.diff,
    ortg: row.ortg,
    drtg: row.drtg,
    netrtg: row.netrtg,
    pace: row.pace,
    efgPct: row.efgPct,
    fg3Pct: row.fg3Pct,
    fg3a: row.fg3a,
    tovPct: row.tovPct,
    oppFgPct: row.oppFgPct,
    oppFg3Pct: row.oppFg3Pct,
    oppFtPct: row.oppFtPct,
    oppReb: row.oppReb,
    oppAst: row.oppAst,
    oppTov: row.oppTov,
    oppOreb: row.oppOreb,
    oppEfgPct: row.oppEfgPct,
  };
  const advanced: Record<string, number> = {};
  for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
    const v = row[d.id];
    if (typeof v === "number" && Number.isFinite(v)) advanced[d.id] = v;
  }
  return { ...core, ...advanced };
}

/** seed / ingest が同じ口から書く */
export async function writeLeagueTeamStatsSnapshot(
  db: Firestore,
  seasonKey: string,
  bundle: NbaLeagueTeamStatsBundle,
  source: NbaLeagueTeamStatsSnapshotSource,
  serverTimestamp: unknown
): Promise<void> {
  await db.collection(NBA_LEAGUE_TEAM_STATS_COLLECTION).doc(seasonKey).set({
    season: bundle.season.map(teamRowForFirestore),
    last10: bundle.last10.map(teamRowForFirestore),
    asOfLabel: bundle.asOfLabel.replace(/^MOCK · /, "SNAPSHOT · "),
    source,
    updatedAt: serverTimestamp,
  });
}

/** 既存 season スナップショットに last10 だけ merge 書き込み（doc 無しなら skip） */
export async function mergeLast10IntoLeagueTeamStatsSnapshot(
  db: Firestore,
  seasonKey: string,
  last10: NbaLeagueTeamStatsBundle["last10"],
  serverTimestamp: unknown
): Promise<boolean> {
  const key = normalizeLeagueTeamStatsSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_LEAGUE_TEAM_STATS_COLLECTION)
    .doc(key)
    .get();
  if (!snap.exists) return false;
  const data = snap.data() as NbaLeagueTeamStatsFirestoreDoc;
  const bundle = bundleFromFirestoreData(data);
  if (!bundle) return false;
  const sourceRaw = typeof data.source === "string" ? data.source : "firestore";
  const source: NbaLeagueTeamStatsSnapshotSource =
    sourceRaw === "mock" || sourceRaw === "empty" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";
  await writeLeagueTeamStatsSnapshot(
    db,
    key,
    { ...bundle, last10 },
    source,
    serverTimestamp
  );
  return true;
}
