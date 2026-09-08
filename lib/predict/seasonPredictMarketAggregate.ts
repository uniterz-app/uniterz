/**
 * シーズン予想マーケット — 提出配列からスナップショットを集計（純関数）。
 */
import {
  NBA_CONFERENCE_TEAM_IDS,
  NBA_STANDINGS_RANKS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import {
  NBA_SEASON_AWARD_DEFS,
  type NbaAwardCandidate,
  type NbaAwardId,
  type NbaSeasonAwardsPicks,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import type { NbaSeasonStandingsPrediction } from "@/lib/predict/nbaSeasonStandingsPredict";
import {
  bandIdForStandingsRank,
  type SeasonAwardsMarketAwardBlock,
  type SeasonAwardsMarketSnapshot,
  type SeasonStandingsMarketBandId,
  type SeasonStandingsMarketSnapshot,
  type SeasonStandingsTeamMarketRow,
} from "@/lib/predict/seasonPredictMarket";

function emptyRankCounts(): number[] {
  return Array.from({ length: NBA_STANDINGS_RANKS }, () => 0);
}

function buildConferenceRows(
  conference: NbaConferenceId,
  predictions: readonly NbaSeasonStandingsPrediction[],
  submissionCount: number
): SeasonStandingsTeamMarketRow[] {
  const ids = NBA_CONFERENCE_TEAM_IDS[conference];
  const counts = new Map<string, number[]>();
  for (const id of ids) counts.set(id, emptyRankCounts());

  for (const pred of predictions) {
    const picks = conference === "east" ? pred.east : pred.west;
    for (let rank = 1; rank <= NBA_STANDINGS_RANKS; rank += 1) {
      const teamId = picks[rank];
      if (typeof teamId !== "string" || !teamId) continue;
      const arr = counts.get(teamId);
      if (!arr) continue;
      arr[rank - 1] = (arr[rank - 1] ?? 0) + 1;
    }
  }

  const denom = Math.max(1, submissionCount);
  const rows: SeasonStandingsTeamMarketRow[] = [];

  for (const teamId of ids) {
    const arr = counts.get(teamId) ?? emptyRankCounts();
    const picks = arr.reduce((a, b) => a + b, 0);
    const rankPct = arr.map((c) => Math.round((c / denom) * 1000) / 10);

    let modeRank = 1;
    let modePct = rankPct[0] ?? 0;
    for (let r = 1; r < rankPct.length; r += 1) {
      const p = rankPct[r] ?? 0;
      if (p > modePct) {
        modePct = p;
        modeRank = r + 1;
      }
    }

    const bandPct: Record<SeasonStandingsMarketBandId, number> = {
      first: 0,
      straight: 0,
      playin: 0,
      out: 0,
    };
    for (let r = 0; r < rankPct.length; r += 1) {
      bandPct[bandIdForStandingsRank(r + 1)] += rankPct[r] ?? 0;
    }
    for (const key of Object.keys(bandPct) as SeasonStandingsMarketBandId[]) {
      bandPct[key] = Math.round(bandPct[key] * 10) / 10;
    }

    rows.push({
      teamId,
      conference,
      picks,
      modeRank,
      modePct,
      rankPct,
      bandPct,
    });
  }

  rows.sort((a, b) => {
    if (b.modePct !== a.modePct) return b.modePct - a.modePct;
    return a.modeRank - b.modeRank;
  });
  return rows;
}

export function aggregateStandingsMarket(input: {
  season: string;
  predictions: readonly NbaSeasonStandingsPrediction[];
  builtAtMs?: number;
}): SeasonStandingsMarketSnapshot {
  const submissionCount = input.predictions.length;
  return {
    season: input.season,
    submissionCount,
    builtAtMs: input.builtAtMs ?? Date.now(),
    east: buildConferenceRows("east", input.predictions, submissionCount),
    west: buildConferenceRows("west", input.predictions, submissionCount),
  };
}

export type AwardsMarketSubmission = {
  picks: NbaSeasonAwardsPicks;
  candidates?: readonly NbaAwardCandidate[];
};

export function aggregateAwardsMarket(input: {
  season: string;
  submissions: readonly AwardsMarketSubmission[];
  builtAtMs?: number;
}): SeasonAwardsMarketSnapshot {
  const submissionCount = input.submissions.length;
  const denom = Math.max(1, submissionCount);
  const metaById = new Map<string, NbaAwardCandidate>();

  for (const sub of input.submissions) {
    for (const c of sub.candidates ?? []) {
      if (!metaById.has(c.id)) metaById.set(c.id, c);
    }
  }

  const awards: SeasonAwardsMarketAwardBlock[] = NBA_SEASON_AWARD_DEFS.map(
    (def) => {
      const tally = new Map<string, number>();
      for (const sub of input.submissions) {
        const id = sub.picks[def.id as NbaAwardId];
        if (typeof id !== "string" || !id) continue;
        tally.set(id, (tally.get(id) ?? 0) + 1);
      }

      const ranked = [...tally.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });

      const top = ranked.slice(0, 5).map(([candidateId, picks]) => {
        const meta = metaById.get(candidateId);
        const name = meta
          ? `${meta.firstName} ${meta.lastName}`.trim()
          : candidateId;
        const pct = Math.round((picks / denom) * 1000) / 10;
        return {
          candidateId,
          name,
          teamAbbr: meta?.teamAbbr ?? null,
          pct,
          picks,
        };
      });

      return {
        awardId: def.id,
        labelEn: def.labelEn,
        labelJa: def.labelJa,
        top,
      };
    }
  );

  return {
    season: input.season,
    submissionCount,
    builtAtMs: input.builtAtMs ?? Date.now(),
    awards,
  };
}

/** 型ガード用（提出リストが NbaSeasonAwardsPrediction のとき） */
export function awardsSubmissionsFromPredictions(
  predictions: readonly NbaSeasonAwardsPrediction[],
  candidatesByUid?: ReadonlyMap<string, readonly NbaAwardCandidate[]>
): AwardsMarketSubmission[] {
  return predictions.map((p, i) => ({
    picks: p.picks,
    candidates: candidatesByUid?.get(String(i)) ?? [],
  }));
}
