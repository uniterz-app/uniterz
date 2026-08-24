import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
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
import {
  buildLast10LeadersFromGameLogs,
  last10BoardHasRows,
  listPlayerGameLogsForLeaders,
} from "./buildLast10LeadersFromGameLogs";

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
  // 開幕後は前期フォールバックしない（今季が空なら empty）。
  const snap = await db
    .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
    .doc(seasonKey)
    .get();
  let fromFs: ReturnType<typeof resolvePlayerStatLeadersFromFirestore> = null;
  if (snap.exists) {
    const resolved = resolvePlayerStatLeadersFromFirestore(
      snap.data() as NbaPlayerStatLeadersFirestoreDoc
    );
    if (
      resolved &&
      isPlayerStatLeadersSnapshotUseful(resolved.bundle, {
        allowEarlySeason: true,
      })
    ) {
      fromFs = resolved;
    }
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

/** 既存 season スナップショットに last10 だけ merge（doc 無しなら false） */
export async function mergeLast10IntoPlayerStatLeadersSnapshot(
  db: Firestore,
  seasonKey: string,
  last10: NbaPlayerStatLeadersBundle["last10"],
  serverTimestamp: unknown,
  asOfSuffix?: string
): Promise<boolean> {
  const key = normalizePlayerStatLeadersSeasonKey(seasonKey);
  const snap = await db
    .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
    .doc(key)
    .get();
  if (!snap.exists) return false;
  const resolved = resolvePlayerStatLeadersFromFirestore(
    snap.data() as NbaPlayerStatLeadersFirestoreDoc
  );
  if (!resolved) return false;
  let asOfLabel = resolved.bundle.asOfLabel;
  if (asOfSuffix) {
    asOfLabel = /last10/i.test(asOfLabel)
      ? asOfLabel.replace(/last10[^·]*|pending/gi, asOfSuffix).replace(/\s+/g, " ")
      : `${asOfLabel} · ${asOfSuffix}`;
  }
  await writePlayerStatLeadersSnapshot(
    db,
    key,
    { ...resolved.bundle, last10, asOfLabel },
    resolved.source === "empty" ? "firestore" : resolved.source,
    serverTimestamp
  );
  return true;
}

/**
 * 試合ログから last10 を再集計して leaders スナップショットへ書く。
 * リーグ ingest / プレイヤー game-logs ingest の両方から呼ぶ。
 */
export async function rebuildPlayerLast10FromGameLogs(
  db: Firestore,
  seasonKey: string,
  serverTimestamp: unknown
): Promise<{ playerCount: number; merged: boolean }> {
  const players = await listPlayerGameLogsForLeaders(db, seasonKey);
  const last10 = buildLast10LeadersFromGameLogs(players);
  if (!last10BoardHasRows(last10)) {
    return { playerCount: players.length, merged: false };
  }
  const merged = await mergeLast10IntoPlayerStatLeadersSnapshot(
    db,
    seasonKey,
    last10,
    serverTimestamp,
    "last10 from game logs"
  );
  return { playerCount: players.length, merged };
}
