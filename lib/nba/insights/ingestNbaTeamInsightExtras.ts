/**
 * Firestore `nbaTeamInsightExtras/{seasonKey}` の構築・保存。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  buildTeamInsightExtraRecords,
  type InsightExtraGameInput,
} from "@/lib/nba/insights/buildTeamInsightExtraRecords";
import {
  NBA_TEAM_INSIGHT_EXTRAS_COLLECTION,
  type NbaTeamInsightExtrasBundle,
} from "@/lib/nba/insights/teamInsightExtraTypes";
import {
  loadTeamSeasonRecordsSnapshot,
  loadOrBuildTeamSeasonRecords,
} from "@/lib/nba/insights/loadPriorSeasonTeamRecords";
import { previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";

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

function gameFromDoc(
  data: Record<string, unknown>
): InsightExtraGameInput | null {
  const status = String(data.status ?? "").toLowerCase();
  if (
    status !== "final" &&
    status !== "ended" &&
    data.final !== true
  ) {
    return null;
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

  const startAtMs =
    toMs(data.startAtJst) ?? toMs(data.startAtMs) ?? toMs(data.startAt);
  if (startAtMs == null || startAtMs <= 0) return null;

  return {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    startAtMs,
    seasonPhase: String(data.seasonPhase ?? data.season_type ?? "regular"),
  };
}

function lookbackSeasonKeys(seasonKey: string, years: number): string[] {
  const out: string[] = [seasonKey];
  let cur = seasonKey;
  for (let i = 1; i < years; i += 1) {
    cur = previousNbaSeasonKey(cur);
    out.push(cur);
  }
  return out;
}

export async function loadTeamInsightExtrasSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamInsightExtrasBundle | null> {
  const snap = await db
    .collection(NBA_TEAM_INSIGHT_EXTRAS_COLLECTION)
    .doc(seasonKey)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as NbaTeamInsightExtrasBundle;
  if (!data?.teams || typeof data.teams !== "object") return null;
  return data;
}

export async function saveTeamInsightExtrasBundle(
  db: Firestore,
  bundle: NbaTeamInsightExtrasBundle
): Promise<void> {
  await db
    .collection(NBA_TEAM_INSIGHT_EXTRAS_COLLECTION)
    .doc(bundle.seasonKey)
    .set(
      {
        ...bundle,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: false }
    );
}

export async function ingestNbaTeamInsightExtras(
  db: Firestore,
  opts: {
    seasonKey: string;
    force?: boolean;
    /** H2H 合算年数（当該季含む）。既定 3 */
    h2hLookbackSeasons?: number;
  }
): Promise<{
  ok: boolean;
  seasonKey: string;
  reused: boolean;
  gameCount: number;
  teamCount: number;
  h2hPairs: number;
  h2hSeasonKeys: string[];
  sample: unknown;
}> {
  const seasonKey = opts.seasonKey.trim();
  if (!opts.force) {
    const existing = await loadTeamInsightExtrasSnapshot(db, seasonKey);
    if (existing && Object.keys(existing.teams).length >= 28) {
      return {
        ok: true,
        seasonKey,
        reused: true,
        gameCount: existing.gameCount,
        teamCount: Object.keys(existing.teams).length,
        h2hPairs: Object.keys(existing.h2hMultiYear ?? {}).length,
        h2hSeasonKeys: existing.h2hSeasonKeys ?? [],
        sample: Object.values(existing.teams).slice(0, 2),
      };
    }
  }

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .orderBy("startAtJst", "asc")
    .get();

  const games: InsightExtraGameInput[] = [];
  for (const doc of snap.docs) {
    const g = gameFromDoc(doc.data() as Record<string, unknown>);
    if (g) games.push(g);
  }

  const lookback = Math.max(1, Math.min(6, opts.h2hLookbackSeasons ?? 3));
  const seasonKeys = lookbackSeasonKeys(seasonKey, lookback);
  const h2hBySeason: Array<{
    seasonKey: string;
    h2h: NbaTeamInsightExtrasBundle["h2hMultiYear"];
  }> = [];

  for (const sk of seasonKeys) {
    let bundle = await loadTeamSeasonRecordsSnapshot(db, sk);
    if (!bundle || Object.keys(bundle.h2h ?? {}).length === 0) {
      try {
        bundle = await loadOrBuildTeamSeasonRecords(db, sk, {
          forceRebuild: false,
          fetchFromBdlIfSparse: true,
          seasonInProgress: false,
        });
      } catch (e) {
        console.warn(
          `[insight-extras] season records failed ${sk}`,
          e instanceof Error ? e.message : e
        );
        continue;
      }
    }
    if (bundle?.h2h) {
      h2hBySeason.push({ seasonKey: sk, h2h: bundle.h2h });
    }
  }

  const built = buildTeamInsightExtraRecords({
    seasonKey,
    games,
    h2hBySeason,
  });

  await saveTeamInsightExtrasBundle(db, built);

  return {
    ok: true,
    seasonKey,
    reused: false,
    gameCount: built.gameCount,
    teamCount: Object.keys(built.teams).length,
    h2hPairs: Object.keys(built.h2hMultiYear).length,
    h2hSeasonKeys: built.h2hSeasonKeys,
    sample: Object.values(built.teams)
      .slice(0, 3)
      .map((t) => ({
        teamId: t.teamId,
        b2b: t.b2b,
        rest0: t.rest0,
        rest1: t.rest1,
        rest2Plus: t.rest2Plus,
        dense3in4: t.dense3in4,
        dense4in5: t.dense4in5,
        vsEast: t.vsEast,
        vsWest: t.vsWest,
        vsDivision: t.vsDivision,
        clutchClose5: t.clutchClose5,
        atAltitude: t.atAltitude,
        gamesCounted: t.gamesCounted,
      })),
  };
}
