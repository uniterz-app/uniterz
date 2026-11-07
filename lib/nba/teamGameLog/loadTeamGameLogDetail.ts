import type { Firestore } from "firebase-admin/firestore";
import { normalizeTeamGameLogSeasonKey } from "@/lib/nba/teamGameLog/loadTeamGameLog";
import { NBA_TEAM_GAME_LOGS_COLLECTION } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import {
  NBA_TEAM_GAME_LOG_DETAIL_SUBCOLLECTION,
  resolveTeamGameLogDetail,
  type NbaTeamGameLogDetail,
} from "@/lib/nba/teamGameLog/teamGameLogDetail";

function detailCollection(db: Firestore, seasonKey: string) {
  return db
    .collection(NBA_TEAM_GAME_LOGS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_TEAM_GAME_LOG_DETAIL_SUBCOLLECTION);
}

export async function loadTeamGameLogDetail(
  db: Firestore,
  seasonRaw: string | null | undefined,
  teamIdRaw: string
): Promise<{ detail: NbaTeamGameLogDetail | null; updatedAt: string | null }> {
  const season = normalizeTeamGameLogSeasonKey(seasonRaw);
  const teamId = teamIdRaw.trim();
  if (!teamId) return { detail: null, updatedAt: null };
  const snap = await detailCollection(db, season).doc(teamId).get();
  if (!snap.exists) return { detail: null, updatedAt: null };
  const data = snap.data() as Record<string, unknown> & {
    updatedAt?: { toDate(): Date };
  };
  return {
    detail: resolveTeamGameLogDetail(teamId, season, data),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

export async function writeTeamGameLogDetails(
  db: Firestore,
  seasonKey: string,
  details: Record<string, NbaTeamGameLogDetail>,
  serverTimestamp: unknown
): Promise<number> {
  const key = normalizeTeamGameLogSeasonKey(seasonKey);
  const col = detailCollection(db, key);
  const batch = db.batch();
  let count = 0;
  for (const [teamId, detail] of Object.entries(details)) {
    batch.set(col.doc(teamId), { ...detail, updatedAt: serverTimestamp });
    count += 1;
  }
  if (count > 0) await batch.commit();
  return count;
}
