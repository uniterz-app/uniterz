import type { Firestore } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  compactPlayerStatLeadersBundle,
  resolvePlayerStatLeadersFromFirestore,
  resolvePlayerStatLeadersEmptyFallback,
} from "./normalizePlayerStatLeadersSnapshot";
import type {
  NbaPlayerStatLeadersApiPayload,
  NbaPlayerStatLeadersFirestoreDoc,
  NbaPlayerStatLeadersSnapshotSource,
} from "./playerStatLeadersTypes";

export const NBA_LEAGUE_PLAYER_STATS_COLLECTION = "nbaLeaguePlayerStats";

export function normalizePlayerStatLeadersSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

/**
 * オフシーズンに「来季キー」だけ先に書いて advanced が空の骨 doc が残ると、
 * 前季の正しいスナップショットへ落ちない。中身が薄い doc はスキップする。
 *
 * 要求シーズン本人の doc は開幕直後（1 試合分）でも採用する。
 */
export function isPlayerStatLeadersSnapshotUseful(
  bundle: NbaPlayerStatLeadersBundle,
  options?: { allowEarlySeason?: boolean }
): boolean {
  const season = bundle.season;
  const ptsLen = season.pts?.length ?? 0;
  if (options?.allowEarlySeason) {
    if (ptsLen >= 1) return true;
    return Object.values(season).some(
      (rows) => Array.isArray(rows) && rows.length > 0
    );
  }
  if (ptsLen < 5) return false;
  // advanced / tracking が全部空なら古い or 不完全 ingest
  const advancedProbe =
    (season.ts_pct?.length ?? 0) +
    (season.efg_pct?.length ?? 0) +
    (season.pts_paint?.length ?? 0) +
    (season.passes?.length ?? 0) +
    (season.drives?.length ?? 0);
  return advancedProbe > 0;
}

export async function loadPlayerStatLeadersSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerStatLeadersApiPayload> {
  const candidates = [seasonKey];
  const prev = previousNbaSeasonKey(seasonKey);
  if (prev !== seasonKey) candidates.push(prev);

  let fromFs: ReturnType<typeof resolvePlayerStatLeadersFromFirestore> = null;
  for (const key of candidates) {
    const snap = await db
      .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
      .doc(key)
      .get();
    if (!snap.exists) continue;
    const resolved = resolvePlayerStatLeadersFromFirestore(
      snap.data() as NbaPlayerStatLeadersFirestoreDoc
    );
    if (!resolved) continue;
    if (
      !isPlayerStatLeadersSnapshotUseful(resolved.bundle, {
        allowEarlySeason: key === seasonKey,
      })
    ) {
      continue;
    }
    fromFs = resolved;
    break;
  }

  const resolved = fromFs ?? resolvePlayerStatLeadersEmptyFallback(seasonKey);

  return {
    ok: true,
    season: seasonKey,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
  };
}

/** seed / 将来の ingest が同じ口から書く */
export async function writePlayerStatLeadersSnapshot(
  db: Firestore,
  seasonKey: string,
  bundle: NbaPlayerStatLeadersBundle,
  source: NbaPlayerStatLeadersSnapshotSource,
  serverTimestamp: unknown
): Promise<void> {
  const compact = compactPlayerStatLeadersBundle(bundle);
  await db.collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION).doc(seasonKey).set({
    ...compact,
    asOfLabel: compact.asOfLabel.replace(/^MOCK · /, "SNAPSHOT · "),
    source,
    updatedAt: serverTimestamp,
  });
}
