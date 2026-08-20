import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  compactPlayerStatLeadersBundle,
  resolvePlayerStatLeadersFromFirestore,
  resolvePlayerStatLeadersMockFallback,
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

export async function loadPlayerStatLeadersSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerStatLeadersApiPayload> {
  const snap = await db
    .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
    .doc(seasonKey)
    .get();

  const fromFs = snap.exists
    ? resolvePlayerStatLeadersFromFirestore(
        snap.data() as NbaPlayerStatLeadersFirestoreDoc
      )
    : null;

  const resolved = fromFs ?? resolvePlayerStatLeadersMockFallback();

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
