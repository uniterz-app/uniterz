import { Timestamp } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import {
  getWcKnockoutChildMatchDef,
  getWcKnockoutChildMatches,
  wcKnockoutGameId,
  wcKnockoutRoundLabel,
  type WcKnockoutMatchId,
} from "./wcKnockoutBracketStructure";
import { WC_KNOCKOUT_SCHEDULE_2026 } from "./wcKnockoutSchedule2026";
import { resolveKnockoutLoserTeamId } from "./resolveKnockoutLoser";

const WC_KNOCKOUT_TOURNAMENT_YEAR = 2026;

type TeamRef = {
  teamId: string;
  name: string;
  nameJa: string;
};

async function loadTeamRef(
  db: Firestore,
  teamId: string,
  cache: Map<string, TeamRef>
): Promise<TeamRef | null> {
  const id = teamId.trim();
  if (!id) return null;

  const cached = cache.get(id);
  if (cached) return cached;

  const snap = await db.collection("teams").doc(id).get();
  const data = snap.data();
  const ref: TeamRef = {
    teamId: id,
    name: String(data?.name ?? data?.nameEn ?? id.replace(/^wc-/, "").toUpperCase()),
    nameJa: String(data?.nameJa ?? data?.name ?? id),
  };
  cache.set(id, ref);
  return ref;
}

async function resolveFeederTeamId(
  db: Firestore,
  feederMatchId: WcKnockoutMatchId,
  winners: Record<string, string>,
  useRunnerUp: boolean,
  cache: Map<string, TeamRef>
): Promise<string | null> {
  if (!useRunnerUp) {
    return winners[feederMatchId]?.trim() || null;
  }

  const gameId = wcKnockoutGameId(feederMatchId, WC_KNOCKOUT_TOURNAMENT_YEAR);
  const snap = await db.collection("games").doc(gameId).get();
  const data = snap.data();
  if (!snap.exists || data?.final !== true) return null;

  const loser = resolveKnockoutLoserTeamId({
    homeTeamId:
      typeof data.homeTeamId === "string"
        ? data.homeTeamId
        : data.home?.teamId,
    awayTeamId:
      typeof data.awayTeamId === "string"
        ? data.awayTeamId
        : data.away?.teamId,
    homeScore: data.homeScore ?? null,
    awayScore: data.awayScore ?? null,
    advancingTeamId: data.advancingTeamId ?? null,
    knockout: data.knockout === true,
    final: data.final === true,
  });

  if (loser) return loser;
  return null;
}

async function maybeCreateOneChildGame(
  db: Firestore,
  season: string,
  childMatchId: WcKnockoutMatchId,
  winners: Record<string, string>,
  teamCache: Map<string, TeamRef>
): Promise<string | null> {
  const def = getWcKnockoutChildMatchDef(childMatchId);
  if (!def) return null;

  const useRunnerUp = def.useRunnerUpFeeders === true;
  const [feederA, feederB] = def.feedsFrom;

  const homeTeamId = await resolveFeederTeamId(
    db,
    feederA,
    winners,
    useRunnerUp,
    teamCache
  );
  const awayTeamId = await resolveFeederTeamId(
    db,
    feederB,
    winners,
    useRunnerUp,
    teamCache
  );

  if (!homeTeamId || !awayTeamId) return null;

  const gameId = wcKnockoutGameId(childMatchId, WC_KNOCKOUT_TOURNAMENT_YEAR);
  const existing = await db.collection("games").doc(gameId).get();
  const existingData = existing.data();

  if (existing.exists && existingData?.final === true) {
    return null;
  }

  const existingHome = String(
    existingData?.homeTeamId ?? existingData?.home?.teamId ?? ""
  ).trim();
  const existingAway = String(
    existingData?.awayTeamId ?? existingData?.away?.teamId ?? ""
  ).trim();

  if (
    existing.exists &&
    existingHome === homeTeamId &&
    existingAway === awayTeamId
  ) {
    return null;
  }

  const home = await loadTeamRef(db, homeTeamId, teamCache);
  const away = await loadTeamRef(db, awayTeamId, teamCache);
  if (!home || !away) {
    console.warn(
      `[wc-bracket] skip child ${childMatchId}: missing team doc for ${homeTeamId} or ${awayTeamId}`
    );
    return null;
  }

  const schedule = WC_KNOCKOUT_SCHEDULE_2026[childMatchId];
  const startAt = schedule?.startAtIso
    ? Timestamp.fromDate(new Date(schedule.startAtIso))
    : null;

  const payload: Record<string, unknown> = {
    id: gameId,
    league: "wc",
    season,
    status: "scheduled",
    venue: schedule?.venue ?? null,
    roundLabel: wcKnockoutRoundLabel(def.round),
    wcStage: "main",
    knockout: true,
    wcKnockoutMatchId: childMatchId,
    home,
    away,
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    final: false,
    homeScore: null,
    awayScore: null,
    regulationEtScore: null,
    advancingTeamId: null,
    resultComputedAt: null,
    score: null,
    liveMeta: null,
    finalMeta: null,
    goalScorers: [],
    autoCreatedFrom: "wc-knockout-parent-final",
    autoCreatedAt: Timestamp.now(),
  };

  if (startAt) {
    payload.startAt = startAt;
    payload.startAtJst = startAt;
  }

  await db.collection("games").doc(gameId).set(payload, { merge: true });

  console.log(
    `[wc-bracket] created child game ${gameId} (${childMatchId}): ${home.name} vs ${away.name}`
  );

  return gameId;
}

/**
 * 親試合 final 後 — 両親の勝者（または M103 の敗者）が揃った子試合を games に生成。
 */
export async function maybeCreateChildKnockoutGames(
  db: Firestore,
  params: {
    season: string;
    finishedMatchId: string;
    winners: Record<string, string>;
  }
): Promise<string[]> {
  const { season, finishedMatchId, winners } = params;
  const childIds = getWcKnockoutChildMatches(finishedMatchId);
  if (childIds.length === 0) return [];

  const teamCache = new Map<string, TeamRef>();
  const created: string[] = [];

  for (const childId of childIds) {
    try {
      const gameId = await maybeCreateOneChildGame(
        db,
        season,
        childId,
        winners,
        teamCache
      );
      if (gameId) created.push(gameId);
    } catch (err) {
      console.error(
        `[wc-bracket] failed to create child ${childId} after ${finishedMatchId}`,
        err
      );
    }
  }

  return created;
}
