import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { TeamRecordLine } from "@/lib/teamRecordDisplay";
import { buildWcTeamRecordMap } from "@/lib/wc/buildWcTeamRecordMap";

const TTL_MS = 60_000;

let cachedMap: Record<string, TeamRecordLine> | null = null;
let cachedAt = 0;
let inflight: Promise<Record<string, TeamRecordLine>> | null = null;

/** teams コレクション（league=wc）を読んでグループ順位付き戦績マップを返す */
export async function fetchWcTeamRecordMap(
  db: Firestore
): Promise<Record<string, TeamRecordLine>> {
  const now = Date.now();
  if (cachedMap && now - cachedAt < TTL_MS) return cachedMap;
  if (inflight) return inflight;

  inflight = getDocs(
    query(collection(db, "teams"), where("league", "==", "wc"))
  )
    .then((snap) => {
      const map = buildWcTeamRecordMap(snap.docs);
      cachedMap = map;
      cachedAt = Date.now();
      return map;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function readWcTeamRecordFromCache(
  teamId: string | null | undefined
): TeamRecordLine | null {
  if (!teamId || !cachedMap) return null;
  return cachedMap[teamId] ?? null;
}

export function invalidateWcTeamRecordsCache() {
  cachedMap = null;
  cachedAt = 0;
  inflight = null;
}
