/**
 * Firestore `nbaTeamSeasonRecords/{seasonKey}` の読み書き。
 * games が薄い／無いときは BDL からシーズン games を ingest してから集計。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  buildPriorSeasonTeamRecords,
  type PriorSeasonGameInput,
} from "@/lib/nba/insights/buildPriorSeasonTeamRecords";
import type { NbaTeamSeasonRecordsBundle } from "@/lib/nba/insights/priorSeasonRecordTypes";
import { ingestNbaGamesFromBdl } from "@/lib/nba/ingest/nbaGamesIngest";

export const NBA_TEAM_SEASON_RECORDS_COLLECTION = "nbaTeamSeasonRecords";

/** この件数未満なら BDL から取り直す候補 */
const MIN_FINAL_GAMES_BEFORE_BDL = 200;

function parseScore(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}

function toMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function gameFromDoc(data: Record<string, unknown>): PriorSeasonGameInput | null {
  const status = String(data.status ?? "").toLowerCase();
  if (status !== "final" && status !== "ended" && data.final !== true) {
    if (status !== "final" && status !== "ended") return null;
  }
  const homeTeamId = teamIdFromSide(data.home, data.homeTeamId);
  const awayTeamId = teamIdFromSide(data.away, data.awayTeamId);
  if (!homeTeamId || !awayTeamId) return null;

  let homeScore = parseScore(data.homeScore);
  let awayScore = parseScore(data.awayScore);
  if (
    (homeScore == null || awayScore == null) &&
    data.score &&
    typeof data.score === "object"
  ) {
    const s = data.score as { home?: unknown; away?: unknown };
    homeScore = homeScore ?? parseScore(s.home);
    awayScore = awayScore ?? parseScore(s.away);
  }
  if (homeScore == null || awayScore == null) return null;

  return {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    startAtMs:
      toMs(data.startAtJst) ?? toMs(data.startAtMs) ?? toMs(data.startAt),
    seasonPhase: String(data.seasonPhase ?? data.season_type ?? "regular"),
  };
}

async function countFinalNbaGamesInSeason(
  db: Firestore,
  seasonKey: string
): Promise<number> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .select("status", "homeScore", "score", "seasonPhase")
    .get();
  let n = 0;
  for (const doc of snap.docs) {
    if (gameFromDoc(doc.data() as Record<string, unknown>)) n += 1;
  }
  return n;
}

export async function loadTeamSeasonRecordsFromGames(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamSeasonRecordsBundle> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .orderBy("startAtJst", "asc")
    .get();

  const games: PriorSeasonGameInput[] = [];
  for (const doc of snap.docs) {
    const g = gameFromDoc(doc.data() as Record<string, unknown>);
    if (g) games.push(g);
  }
  return buildPriorSeasonTeamRecords({ seasonKey, games });
}

/** @deprecated 名前互換 */
export const loadPriorSeasonTeamRecordsFromGames = loadTeamSeasonRecordsFromGames;

function bundleFromFirestore(
  seasonKey: string,
  data: Record<string, unknown>
): NbaTeamSeasonRecordsBundle | null {
  const teams = data.teams;
  const h2h = data.h2h;
  if (!teams || typeof teams !== "object") return null;
  return {
    seasonKey,
    teams: teams as NbaTeamSeasonRecordsBundle["teams"],
    h2h: (h2h && typeof h2h === "object"
      ? h2h
      : {}) as NbaTeamSeasonRecordsBundle["h2h"],
    gameCount: Number(data.gameCount) || 0,
    builtAtMs: Number(data.builtAtMs) || 0,
  };
}

async function saveBundle(
  db: Firestore,
  built: NbaTeamSeasonRecordsBundle,
  source: string
): Promise<void> {
  await db
    .collection(NBA_TEAM_SEASON_RECORDS_COLLECTION)
    .doc(built.seasonKey)
    .set(
      {
        seasonKey: built.seasonKey,
        teams: built.teams,
        h2h: built.h2h,
        gameCount: built.gameCount,
        builtAtMs: built.builtAtMs,
        updatedAt: FieldValue.serverTimestamp(),
        source,
      },
      { merge: true }
    );
}

/**
 * スナップショットを返す。無い／薄いときは games 集計。
 * games も薄いときは BDL からシーズン games を ingest して再集計。
 */
export async function loadOrBuildTeamSeasonRecords(
  db: Firestore,
  seasonKey: string,
  opts?: {
    forceRebuild?: boolean;
    /** games が少ないとき BDL から取る（既定 true） */
    fetchFromBdlIfSparse?: boolean;
    /** 今季など未完了シーズンは BDL 閾値を下げない（既定 false = 完了シーズン想定） */
    seasonInProgress?: boolean;
  }
): Promise<NbaTeamSeasonRecordsBundle> {
  const key = seasonKey.trim();
  const ref = db.collection(NBA_TEAM_SEASON_RECORDS_COLLECTION).doc(key);
  const fetchBdl = opts?.fetchFromBdlIfSparse !== false;

  if (!opts?.forceRebuild) {
    const snap = await ref.get();
    if (snap.exists) {
      const parsed = bundleFromFirestore(key, snap.data() as Record<string, unknown>);
      if (parsed && parsed.gameCount > 0) {
        // 進行中シーズンは毎回 games から再集計した方がよいが重いので、
        // force か BDL パスのときだけ。キャッシュがあれば返す。
        if (!opts?.seasonInProgress) return parsed;
      }
    }
  }

  let built = await loadTeamSeasonRecordsFromGames(db, key);
  let source = "games";

  const needBdl =
    fetchBdl &&
    (opts?.forceRebuild === true ||
      (opts?.seasonInProgress
        ? built.gameCount === 0
        : built.gameCount < MIN_FINAL_GAMES_BEFORE_BDL));

  if (needBdl) {
    const existingCount = await countFinalNbaGamesInSeason(db, key);
    const shouldIngest =
      opts?.forceRebuild === true ||
      (opts?.seasonInProgress
        ? existingCount === 0
        : existingCount < MIN_FINAL_GAMES_BEFORE_BDL);

    if (shouldIngest) {
      await ingestNbaGamesFromBdl(db, {
        seasonKey: key,
        rebuildTeamGameLogs: false,
      });
      built = await loadTeamSeasonRecordsFromGames(db, key);
      source = "bdl+games";
    }
  }

  // 進行中シーズンは毎回上書き（最新 W–L / H2H）
  if (built.gameCount > 0 || opts?.forceRebuild) {
    await saveBundle(db, built, source);
  }
  return built;
}

/** @deprecated 名前互換 */
export async function loadOrBuildPriorSeasonTeamRecords(
  db: Firestore,
  seasonKey: string,
  opts?: { forceRebuild?: boolean }
): Promise<NbaTeamSeasonRecordsBundle> {
  return loadOrBuildTeamSeasonRecords(db, seasonKey, {
    forceRebuild: opts?.forceRebuild,
    fetchFromBdlIfSparse: true,
    seasonInProgress: false,
  });
}
