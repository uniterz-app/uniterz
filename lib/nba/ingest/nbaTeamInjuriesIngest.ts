/**
 * BDL player_injuries → Firestore `nbaTeamInjuries/{seasonKey}`。
 * クライアントは BDL を叩かない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlPlayerInjuries } from "@/lib/nba/bdl/fetchBdlPlayerInjuries";
import { attachReturnGameStart } from "@/lib/nba/teamInjuries/attachReturnGameStart";
import { buildTeamInjuriesBundleFromBdl } from "@/lib/nba/teamInjuries/mapBdlToTeamInjuries";
import {
  NBA_TEAM_INJURIES_COLLECTION,
  normalizeTeamInjuriesSeasonKey,
  writeTeamInjuriesSnapshot,
} from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { syncGameInjuryReportsForPush } from "@/lib/nba/teamInjuries/syncGameInjuryReportsForPush";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_INJURIES_INGEST_READY = true;

/**
 * BDL が一時的に欠けたリストを返すことがある（例: 80 件 → 5 件）。
 * 前回が MIN_PREVIOUS 件以上で、今回が前回 x MIN_RATIO 未満なら上書きしない。
 * 減った状態が ACCEPT_AFTER_MS 続いたら本当に減ったとみなして書く。
 */
const DROP_GUARD_MIN_PREVIOUS = 20;
const DROP_GUARD_MIN_RATIO = 0.3;
const DROP_GUARD_ACCEPT_AFTER_MS = 24 * 60 * 60 * 1000;

export type NbaTeamInjuriesIngestInput = {
  seasonKey?: string;
  /** 件数ガードを無視して書く */
  force?: boolean;
  nowMs?: number;
};

export type NbaTeamInjuriesIngestResult = {
  ok: true;
  seasonKey: string;
  teamCount: number;
  injuryCount: number;
  gamesInjurySynced?: number;
  /** 件数ガードで書き込みを見送った */
  skipped?: boolean;
  skipReason?: "suspicious_drop";
  previousInjuryCount?: number;
};

function countInjuries(teams: unknown): number {
  if (!teams || typeof teams !== "object") return 0;
  return Object.values(teams as Record<string, unknown>).reduce<number>(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );
}

export async function ingestNbaTeamInjuriesFromBdl(
  db: Firestore,
  input: NbaTeamInjuriesIngestInput = {}
): Promise<NbaTeamInjuriesIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const nowMs = input.nowMs ?? Date.now();
  const rows = await fetchBdlPlayerInjuries();
  const { teams: bdlTeams } = buildTeamInjuriesBundleFromBdl(rows, seasonKey);
  const injuryCount = Object.values(bdlTeams).reduce((s, list) => s + list.length, 0);

  const docRef = db
    .collection(NBA_TEAM_INJURIES_COLLECTION)
    .doc(normalizeTeamInjuriesSeasonKey(seasonKey));
  if (!input.force) {
    const prev = (await docRef.get()).data();
    const previousInjuryCount = countInjuries(prev?.teams);
    const suspicious =
      previousInjuryCount >= DROP_GUARD_MIN_PREVIOUS &&
      injuryCount < previousInjuryCount * DROP_GUARD_MIN_RATIO;
    if (suspicious) {
      const sinceMs =
        typeof prev?.dropGuardSinceMs === "number" ? prev.dropGuardSinceMs : nowMs;
      if (nowMs - sinceMs < DROP_GUARD_ACCEPT_AFTER_MS) {
        if (prev?.dropGuardSinceMs == null) {
          await docRef.set({ dropGuardSinceMs: nowMs }, { merge: true });
        }
        console.warn(
          `[ingestNbaTeamInjuriesFromBdl] suspicious drop ${previousInjuryCount} -> ${injuryCount}; keeping previous snapshot`
        );
        return {
          ok: true,
          seasonKey,
          teamCount: Object.keys(bdlTeams).length,
          injuryCount,
          skipped: true,
          skipReason: "suspicious_drop",
          previousInjuryCount,
        };
      }
    }
  }

  let teams = bdlTeams;
  try {
    teams = await attachReturnGameStart(db, bdlTeams, nowMs);
  } catch (err) {
    console.warn("[ingestNbaTeamInjuriesFromBdl] return game lookup failed", err);
  }

  const { teamCount } = await writeTeamInjuriesSnapshot(db, seasonKey, teams, {
    source: "firestore",
    serverTimestamp: FieldValue.serverTimestamp(),
  });

  let gamesInjurySynced = 0;
  try {
    const synced = await syncGameInjuryReportsForPush(db, { seasonKey });
    gamesInjurySynced = synced.gamesUpdated;
  } catch (err) {
    console.warn("[ingestNbaTeamInjuriesFromBdl] game injuryReport sync failed", err);
  }

  return { ok: true, seasonKey, teamCount, injuryCount, gamesInjurySynced };
}
