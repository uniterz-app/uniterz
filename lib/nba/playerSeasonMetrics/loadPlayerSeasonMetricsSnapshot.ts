/**
 * プレイヤー今季メトリクス — Firestore 読み書き。
 * 公開 API はここだけ読む（BDL ライブ禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  NBA_PLAYER_SEASON_METRICS_COLLECTION,
  NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB,
  type NbaPlayerSeasonMetricCell,
  type NbaPlayerSeasonMetricsApiPayload,
  type NbaPlayerSeasonMetricsDoc,
  type NbaPlayerSeasonMetricsWrite,
} from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";

export function normalizePlayerSeasonMetricsSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function docRef(db: Firestore, seasonKey: string, playerId: string) {
  return db
    .collection(NBA_PLAYER_SEASON_METRICS_COLLECTION)
    .doc(seasonKey)
    .collection(NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB)
    .doc(playerId);
}

function resolveMetrics(
  raw: unknown
): Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  > = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const cell = v as Record<string, unknown>;
    const value = cell.value;
    const rank = cell.rank;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (typeof rank !== "number" || !Number.isFinite(rank) || rank < 1) continue;
    out[k as NbaPlayerLeaderMetricId] = {
      value,
      rank: Math.round(rank),
    };
  }
  return out;
}

const WRITE_BATCH = 400;

/** リーグ表 ingest から全選手分をバッチ書き込み */
export async function writePlayerSeasonMetricsSnapshots(
  db: Firestore,
  seasonKey: string,
  rows: NbaPlayerSeasonMetricsWrite[]
): Promise<number> {
  const season = normalizePlayerSeasonMetricsSeasonKey(seasonKey);
  let written = 0;
  for (let i = 0; i < rows.length; i += WRITE_BATCH) {
    const chunk = rows.slice(i, i + WRITE_BATCH);
    const batch = db.batch();
    for (const row of chunk) {
      const playerId = String(row.playerId).trim();
      if (!playerId) continue;
      const payload: Omit<NbaPlayerSeasonMetricsDoc, "updatedAt"> & {
        updatedAt: FirebaseFirestore.FieldValue;
      } = {
        playerId,
        teamId: row.teamId,
        seasonKey: season,
        gamesPlayed: Math.max(0, Math.round(row.gamesPlayed || 0)),
        metrics: row.metrics,
        source: "firestore",
        updatedAt: FieldValue.serverTimestamp(),
      };
      batch.set(docRef(db, season, playerId), payload, { merge: true });
      written += 1;
    }
    await batch.commit();
  }
  return written;
}

export async function loadPlayerSeasonMetricsSnapshot(
  db: Firestore,
  seasonKey: string,
  playerId: string
): Promise<NbaPlayerSeasonMetricsApiPayload> {
  const season = normalizePlayerSeasonMetricsSeasonKey(seasonKey);
  const id = String(playerId ?? "").trim();
  if (!id) {
    return {
      ok: true,
      season,
      playerId: id,
      teamId: null,
      gamesPlayed: 0,
      metrics: {},
      source: "empty",
      updatedAt: null,
    };
  }

  const snap = await docRef(db, season, id).get();
  if (!snap.exists) {
    return {
      ok: true,
      season,
      playerId: id,
      teamId: null,
      gamesPlayed: 0,
      metrics: {},
      source: "empty",
      updatedAt: null,
    };
  }

  const data = snap.data() as NbaPlayerSeasonMetricsDoc;
  const updatedAt = data.updatedAt?.toDate?.() ?? null;
  return {
    ok: true,
    season,
    playerId: id,
    teamId: data.teamId ?? null,
    gamesPlayed: Math.max(0, Math.round(data.gamesPlayed || 0)),
    metrics: resolveMetrics(data.metrics),
    source: data.source === "firestore" ? "firestore" : "empty",
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}
