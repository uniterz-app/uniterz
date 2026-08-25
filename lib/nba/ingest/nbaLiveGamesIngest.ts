/**
 * BDL ライブ/当日試合 → Firestore `games` のスコア + liveStats。
 * 公開 API は Firestore のみ読む（都度 BDL 禁止）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { fetchBdlGames, type BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import {
  fetchBdlBoxScoresForDate,
  fetchBdlLiveBoxScores,
  type BdlBoxScore,
} from "@/lib/nba/bdl/fetchBdlBoxScores";
import {
  bdlBoxMatchKey,
  mapBdlBoxScoreToLiveStats,
  type MappedLiveBoxScore,
} from "@/lib/nba/bdl/mapBdlBoxScoreToLiveStats";
import {
  mapBdlGameToNbaGameDoc,
  nbaGameDocIdFromBdlId,
} from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { normalizeLiveGameStatsDoc } from "@/lib/games/liveGameStats";

export type IngestNbaLiveGamesResult = {
  ok: true;
  dates: string[];
  gamesFetched: number;
  gamesUpdated: number;
  liveStatsWritten: number;
  skipped: number;
  dryRun: boolean;
  sampleGameIds: string[];
};

/** America/New_York の暦日 YYYY-MM-DD（NBA 日程の正） */
export function nbaScheduleDateKeysAroundNow(now = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = fmt.format(now);
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = fmt.format(y);
  return yesterday === today ? [today] : [yesterday, today];
}

function gameMatchKey(g: BdlGame): string | null {
  const homeId = g.home_team?.id;
  const awayId = g.visitor_team?.id;
  if (homeId == null || awayId == null) return null;
  const date = String(g.date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return bdlBoxMatchKey({
    date,
    homeBdlTeamId: homeId,
    awayBdlTeamId: awayId,
  });
}

async function collectBoxScores(dates: string[]): Promise<BdlBoxScore[]> {
  const byKey = new Map<string, BdlBoxScore>();
  const put = (row: BdlBoxScore) => {
    const mapped = mapBdlBoxScoreToLiveStats(row);
    if (!mapped) return;
    const key =
      mapped.bdlGameId != null
        ? `id:${mapped.bdlGameId}`
        : bdlBoxMatchKey({
            date: mapped.date,
            homeBdlTeamId: mapped.homeBdlTeamId,
            awayBdlTeamId: mapped.awayBdlTeamId,
          });
    byKey.set(key, row);
  };

  for (const date of dates) {
    try {
      for (const row of await fetchBdlBoxScoresForDate(date)) put(row);
    } catch (e) {
      console.warn("[nbaLiveGamesIngest] box_scores date failed", date, e);
    }
  }
  try {
    for (const row of await fetchBdlLiveBoxScores()) put(row);
  } catch (e) {
    console.warn("[nbaLiveGamesIngest] box_scores/live failed", e);
  }
  return [...byKey.values()];
}

function findMappedBox(
  g: BdlGame,
  byGameId: Map<number, MappedLiveBoxScore>,
  byTeams: Map<string, MappedLiveBoxScore>
): MappedLiveBoxScore | null {
  if (g.id != null && byGameId.has(g.id)) return byGameId.get(g.id)!;
  const key = gameMatchKey(g);
  if (key && byTeams.has(key)) return byTeams.get(key)!;
  return null;
}

/**
 * 直近 NY 日付の試合スコアを更新し、取れる試合は liveStats も書く。
 * `final: true` は status=final のときだけ（onGameFinalV2 用）。
 */
export async function ingestNbaLiveGamesFromBdl(
  db: Firestore,
  input: { dryRun?: boolean; dates?: string[] } = {}
): Promise<IngestNbaLiveGamesResult> {
  const dryRun = input.dryRun === true;
  const dates =
    input.dates?.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) ??
    nbaScheduleDateKeysAroundNow();

  const games = await fetchBdlGames({ dates });
  const boxRows = await collectBoxScores(dates);

  const mappedBoxes: MappedLiveBoxScore[] = [];
  const byGameId = new Map<number, MappedLiveBoxScore>();
  const byTeams = new Map<string, MappedLiveBoxScore>();
  for (const row of boxRows) {
    const mapped = mapBdlBoxScoreToLiveStats(row);
    if (!mapped) continue;
    mappedBoxes.push(mapped);
    if (mapped.bdlGameId != null) byGameId.set(mapped.bdlGameId, mapped);
    byTeams.set(
      bdlBoxMatchKey({
        date: mapped.date,
        homeBdlTeamId: mapped.homeBdlTeamId,
        awayBdlTeamId: mapped.awayBdlTeamId,
      }),
      mapped
    );
  }

  let gamesUpdated = 0;
  let liveStatsWritten = 0;
  let skipped = 0;
  const sampleGameIds: string[] = [];

  for (const g of games) {
    const mappedGame = mapBdlGameToNbaGameDoc(g);
    if (!mappedGame) {
      skipped += 1;
      continue;
    }
    const box = findMappedBox(g, byGameId, byTeams);
    const liveStats = box
      ? normalizeLiveGameStatsDoc(box.liveStats)
      : null;

    const status = box?.phase === "final" ? "final" : mappedGame.status;
    const homeScore = box?.homeScore ?? mappedGame.homeScore ?? null;
    const awayScore = box?.awayScore ?? mappedGame.awayScore ?? null;
    const score =
      homeScore != null && awayScore != null
        ? { home: homeScore, away: awayScore }
        : mappedGame.score;
    const isFinal = status === "final";

    const patch: Record<string, unknown> = {
      status,
      homeScore,
      awayScore,
      score,
      final: isFinal,
      updatedAt: FieldValue.serverTimestamp(),
      liveSyncedAt: FieldValue.serverTimestamp(),
    };
    if (box) {
      patch.periodLabel = box.periodLabel;
      patch.clock = box.clock;
    }
    if (liveStats) {
      patch.liveStats = liveStats;
    }

    const docId = nbaGameDocIdFromBdlId(g.id);
    if (sampleGameIds.length < 8) sampleGameIds.push(docId);

    if (!dryRun) {
      const { id: _id, startAtMs, startAtJstIso, ...rest } = mappedGame;
      await db
        .collection("games")
        .doc(docId)
        .set(
          {
            ...rest,
            startAt: Timestamp.fromMillis(startAtMs),
            startAtJst: Timestamp.fromMillis(startAtMs),
            startAtJstIso,
            ...patch,
          },
          { merge: true }
        );
    }
    gamesUpdated += 1;
    if (liveStats) liveStatsWritten += 1;
  }

  for (const box of mappedBoxes) {
    if (box.bdlGameId == null) continue;
    if (games.some((g) => g.id === box.bdlGameId)) continue;
    const liveStats = normalizeLiveGameStatsDoc(box.liveStats);
    if (!liveStats) continue;
    const docId = nbaGameDocIdFromBdlId(box.bdlGameId);
    if (!dryRun) {
      await db
        .collection("games")
        .doc(docId)
        .set(
          {
            status: box.phase === "final" ? "final" : "live",
            final: box.phase === "final",
            homeScore: box.homeScore,
            awayScore: box.awayScore,
            score: { home: box.homeScore, away: box.awayScore },
            homeTeamId: box.homeAppTeamId,
            awayTeamId: box.awayAppTeamId,
            periodLabel: box.periodLabel,
            clock: box.clock,
            liveStats,
            league: "nba",
            source: "bdl",
            bdlGameId: box.bdlGameId,
            updatedAt: FieldValue.serverTimestamp(),
            liveSyncedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }
    gamesUpdated += 1;
    liveStatsWritten += 1;
    if (sampleGameIds.length < 8) sampleGameIds.push(docId);
  }

  return {
    ok: true,
    dates,
    gamesFetched: games.length,
    gamesUpdated: dryRun ? 0 : gamesUpdated,
    liveStatsWritten: dryRun ? 0 : liveStatsWritten,
    skipped,
    dryRun,
    sampleGameIds,
  };
}
