/**
 * TEAM IDENTITY — 候補プール evaluate
 */
import type {
  DetailInsightChip,
  ScoredChipCandidate,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import { selectDetailChips } from "@/lib/nba/detailInsights/selectDetailChips";
import {
  avgFields,
  compositeRank,
  teamFieldValue,
  teamRank,
} from "@/lib/nba/detailInsights/leagueRankUtils";
import {
  scoreFromBottomRank,
  scoreFromHighRank,
  scoreFromLowRank,
} from "@/lib/nba/detailInsights/rankBuckets";
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  findAceOutPlayerForInjury,
} from "@/lib/nba/insights/aceOutInsight";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export type TeamIdentityInput = {
  teamId: string;
  seasonRows: NbaLeagueTeamStatRow[];
  seasonRow: NbaLeagueTeamStatRow | undefined;
  last10Row: NbaLeagueTeamStatRow | undefined;
  injuries: NbaTeamInjuryEntry[];
  aceOut: NbaTeamAceOutRecord | null | undefined;
};

type CandidateEval = {
  id: string;
  label: string;
  category: "style" | "defense" | "risk" | "momentum";
  exclusiveGroup?: string;
  tieBreak: number;
  reserveSlot?: boolean;
  evaluate: (input: TeamIdentityInput) => ScoredChipCandidate | null;
};

function chip(
  base: ScoredChipCandidate & { score?: number }
): ScoredChipCandidate {
  return { ...base, score: base.score ?? 0 };
}

function rankScoreHigh(rank: number | null, maxRank = 10): number {
  if (rank == null || rank > maxRank) return 0;
  return scoreFromHighRank(rank);
}

function rankScoreLow(rank: number | null, maxRank = 10): number {
  if (rank == null || rank > maxRank) return 0;
  return scoreFromLowRank(rank);
}

const CANDIDATES: CandidateEval[] = [
  {
    id: "fast_pace",
    label: "FAST PACE",
    category: "style",
    exclusiveGroup: "pace",
    tieBreak: 20,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "pace", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "fast_pace", label: "FAST PACE", category: "style", exclusiveGroup: "pace", tieBreak: 20, score }) : null;
    },
  },
  {
    id: "slow_pace",
    label: "SLOW PACE",
    category: "style",
    exclusiveGroup: "pace",
    tieBreak: 19,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "pace", true);
      if (rank == null || rank < 22) return null;
      return chip({ id: "slow_pace", label: "SLOW PACE", category: "style", exclusiveGroup: "pace", tieBreak: 19, score: scoreFromBottomRank(rank) });
    },
  },
  {
    id: "three_heavy",
    label: "3PT HEAVY",
    category: "style",
    tieBreak: 50,
    evaluate: ({ teamId, seasonRows, seasonRow }) => {
      const rank = teamRank(seasonRows, teamId, "fg3a", true);
      const pct = teamFieldValue(seasonRow, "pctPts3");
      let score = rankScoreHigh(rank, 10);
      if (pct != null && pct >= 0.36) score = Math.max(score, 12);
      return score ? chip({ id: "three_heavy", label: "3PT HEAVY", category: "style", tieBreak: 50, score }) : null;
    },
  },
  {
    id: "paint_attack",
    label: "PAINT ATTACK",
    category: "style",
    tieBreak: 47,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "pctPtsPaint", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "paint_attack", label: "PAINT ATTACK", category: "style", tieBreak: 47, score }) : null;
    },
  },
  {
    id: "ft_line",
    label: "FT LINE",
    category: "style",
    tieBreak: 46,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "ftaRate", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "ft_line", label: "FT LINE", category: "style", tieBreak: 46, score }) : null;
    },
  },
  {
    id: "offense_first",
    label: "OFFENSE FIRST",
    category: "style",
    exclusiveGroup: "ortg_drtg_identity",
    tieBreak: 80,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "ortg", true);
      const score = rankScoreHigh(rank, 8);
      return score ? chip({ id: "offense_first", label: "OFFENSE FIRST", category: "style", exclusiveGroup: "ortg_drtg_identity", tieBreak: 80, score }) : null;
    },
  },
  {
    id: "defense_first",
    label: "DEFENSE FIRST",
    category: "style",
    exclusiveGroup: "ortg_drtg_identity",
    tieBreak: 90,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "drtg", false);
      const score = rankScoreLow(rank, 8);
      return score ? chip({ id: "defense_first", label: "DEFENSE FIRST", category: "style", exclusiveGroup: "ortg_drtg_identity", tieBreak: 90, score }) : null;
    },
  },
  {
    id: "elite_net",
    label: "ELITE NET",
    category: "style",
    tieBreak: 85,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "netrtg", true);
      const score = rankScoreHigh(rank, 6);
      return score ? chip({ id: "elite_net", label: "ELITE NET", category: "style", tieBreak: 85, score }) : null;
    },
  },
  {
    id: "iso_heavy",
    label: "ISO HEAVY",
    category: "style",
    tieBreak: 45,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "isoFreq", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "iso_heavy", label: "ISO HEAVY", category: "style", tieBreak: 45, score }) : null;
    },
  },
  {
    id: "pnr_heavy",
    label: "PNR HEAVY",
    category: "style",
    tieBreak: 44,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = compositeRank(
        seasonRows,
        teamId,
        (r) => avgFields(r, ["pnrBhFreq", "pnrRollFreq"]),
        true
      );
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "pnr_heavy", label: "PNR HEAVY", category: "style", tieBreak: 44, score }) : null;
    },
  },
  {
    id: "spotup_team",
    label: "SPOTUP TEAM",
    category: "style",
    tieBreak: 43,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "spotupFreq", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "spotup_team", label: "SPOTUP TEAM", category: "style", tieBreak: 43, score }) : null;
    },
  },
  {
    id: "post_up",
    label: "POST UP",
    category: "style",
    tieBreak: 42,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "postFreq", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "post_up", label: "POST UP", category: "style", tieBreak: 42, score }) : null;
    },
  },
  {
    id: "transition",
    label: "TRANSITION",
    category: "style",
    tieBreak: 41,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "transFreq", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "transition", label: "TRANSITION", category: "style", tieBreak: 41, score }) : null;
    },
  },
  {
    id: "cut_team",
    label: "CUTS HEAVY",
    category: "style",
    tieBreak: 40,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "cutFreq", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "cut_team", label: "CUTS HEAVY", category: "style", tieBreak: 40, score }) : null;
    },
  },
  {
    id: "ball_movement",
    label: "BALL MOVEMENT",
    category: "style",
    tieBreak: 39,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "passes", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "ball_movement", label: "BALL MOVEMENT", category: "style", tieBreak: 39, score }) : null;
    },
  },
  {
    id: "drive_heavy",
    label: "DRIVE HEAVY",
    category: "style",
    tieBreak: 38,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "drives", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "drive_heavy", label: "DRIVE HEAVY", category: "style", tieBreak: 38, score }) : null;
    },
  },
  {
    id: "cns_heavy",
    label: "C&S HEAVY",
    category: "style",
    tieBreak: 37,
    evaluate: ({ teamId, seasonRows }) => {
      const ptsRank = teamRank(seasonRows, teamId, "cnsPts", true);
      const fgRank = teamRank(seasonRows, teamId, "cnsFgPct", true);
      if (ptsRank == null || ptsRank > 10 || fgRank == null || fgRank > 12) return null;
      const score = Math.max(rankScoreHigh(ptsRank, 10), rankScoreHigh(fgRank, 12));
      return chip({ id: "cns_heavy", label: "C&S HEAVY", category: "style", tieBreak: 37, score });
    },
  },
  {
    id: "pullup_heavy",
    label: "PULLUP HEAVY",
    category: "style",
    tieBreak: 36,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "pullupPts", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "pullup_heavy", label: "PULLUP HEAVY", category: "style", tieBreak: 36, score }) : null;
    },
  },
  {
    id: "second_chance",
    label: "SECOND CHANCE",
    category: "style",
    exclusiveGroup: "oreb",
    tieBreak: 35,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "orebPct", true);
      if (rank == null || rank > 8) return null;
      return chip({ id: "second_chance", label: "SECOND CHANCE", category: "style", exclusiveGroup: "oreb", tieBreak: 35, score: scoreFromHighRank(rank) });
    },
  },
  {
    id: "rebound_strong",
    label: "REBOUND STRONG",
    category: "style",
    exclusiveGroup: "oreb",
    tieBreak: 34,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "orebPct", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "rebound_strong", label: "REBOUND STRONG", category: "style", exclusiveGroup: "oreb", tieBreak: 34, score }) : null;
    },
  },
  {
    id: "fb_points",
    label: "FAST-BREAK PTS",
    category: "style",
    tieBreak: 33,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "pctPtsFb", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "fb_points", label: "FAST-BREAK PTS", category: "style", tieBreak: 33, score }) : null;
    },
  },
  {
    id: "clutch_strong",
    label: "CLUTCH STRONG",
    category: "style",
    exclusiveGroup: "clutch",
    tieBreak: 32,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "clutchNet", true);
      const score = rankScoreHigh(rank, 8);
      return score ? chip({ id: "clutch_strong", label: "CLUTCH STRONG", category: "style", exclusiveGroup: "clutch", tieBreak: 32, score }) : null;
    },
  },
  {
    id: "clutch_weak",
    label: "CLUTCH WEAK",
    category: "style",
    exclusiveGroup: "clutch",
    tieBreak: 31,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "clutchNet", true);
      if (rank == null || rank < 23) return null;
      return chip({ id: "clutch_weak", label: "CLUTCH WEAK", category: "style", exclusiveGroup: "clutch", tieBreak: 31, score: scoreFromBottomRank(rank) });
    },
  },
  {
    id: "perim_def",
    label: "PERIM DEF",
    category: "defense",
    tieBreak: 30,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "oppFg3Pct", false);
      const score = rankScoreLow(rank, 10);
      return score ? chip({ id: "perim_def", label: "PERIM DEF", category: "defense", tieBreak: 30, score }) : null;
    },
  },
  {
    id: "rim_protect",
    label: "RIM PROTECT",
    category: "defense",
    tieBreak: 29,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "fgPctAllowed", false);
      const score = rankScoreLow(rank, 10);
      return score ? chip({ id: "rim_protect", label: "RIM PROTECT", category: "defense", tieBreak: 29, score }) : null;
    },
  },
  {
    id: "force_tos",
    label: "FORCE TOs",
    category: "defense",
    tieBreak: 28,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "tovForced", true);
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "force_tos", label: "FORCE TOs", category: "defense", tieBreak: 28, score }) : null;
    },
  },
  {
    id: "hustle_team",
    label: "HUSTLE TEAM",
    category: "defense",
    tieBreak: 27,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = compositeRank(
        seasonRows,
        teamId,
        (r) => avgFields(r, ["deflections", "charges", "looseBalls"]),
        true
      );
      const score = rankScoreHigh(rank, 10);
      return score ? chip({ id: "hustle_team", label: "HUSTLE TEAM", category: "defense", tieBreak: 27, score }) : null;
    },
  },
  {
    id: "clean_ball",
    label: "CLEAN BALL",
    category: "style",
    exclusiveGroup: "turnover",
    tieBreak: 26,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "tovPct", false);
      const score = rankScoreLow(rank, 10);
      return score ? chip({ id: "clean_ball", label: "CLEAN BALL", category: "style", exclusiveGroup: "turnover", tieBreak: 26, score }) : null;
    },
  },
  {
    id: "turnover_prone",
    label: "TURNOVER PRONE",
    category: "style",
    exclusiveGroup: "turnover",
    tieBreak: 25,
    evaluate: ({ teamId, seasonRows }) => {
      const rank = teamRank(seasonRows, teamId, "tovPct", false);
      if (rank == null || rank < 23) return null;
      return chip({ id: "turnover_prone", label: "TURNOVER PRONE", category: "style", exclusiveGroup: "turnover", tieBreak: 25, score: scoreFromBottomRank(rank) });
    },
  },
  {
    id: "surging",
    label: "SURGING",
    category: "momentum",
    exclusiveGroup: "momentum",
    tieBreak: 70,
    evaluate: ({ seasonRow, last10Row }) => {
      const s = teamFieldValue(seasonRow, "netrtg");
      const l = teamFieldValue(last10Row, "netrtg");
      if (s == null || l == null) return null;
      const delta = l - s;
      if (delta < 4) return null;
      return chip({ id: "surging", label: "SURGING", category: "momentum", exclusiveGroup: "momentum", tieBreak: 70, score: 10 + delta });
    },
  },
  {
    id: "free_fall",
    label: "FREE FALL",
    category: "momentum",
    exclusiveGroup: "momentum",
    tieBreak: 69,
    evaluate: ({ seasonRow, last10Row }) => {
      const s = teamFieldValue(seasonRow, "netrtg");
      const l = teamFieldValue(last10Row, "netrtg");
      if (s == null || l == null) return null;
      const delta = l - s;
      if (delta > -4) return null;
      return chip({ id: "free_fall", label: "FREE FALL", category: "momentum", exclusiveGroup: "momentum", tieBreak: 69, score: 10 + Math.abs(delta) });
    },
  },
  {
    id: "injury_risk",
    label: "INJURY RISK",
    category: "risk",
    tieBreak: 100,
    reserveSlot: true,
    evaluate: ({ teamId, injuries, aceOut }) => {
      const outGtd = injuries.filter((i) => i.status === "out" || i.status === "gtd");
      let hit = outGtd.length >= 2;
      if (!hit && aceOut) {
        for (const inj of outGtd) {
          if (findAceOutPlayerForInjury({ seasonKey: "", teams: { [teamId]: aceOut }, gameCount: 0, builtAtMs: 0, source: "" }, teamId, inj)) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) return null;
      return chip({ id: "injury_risk", label: "INJURY RISK", category: "risk", tieBreak: 100, reserveSlot: true, score: 100 });
    },
  },
];

export function evaluateTeamIdentityCandidates(
  input: TeamIdentityInput
): ScoredChipCandidate[] {
  return CANDIDATES.map((c) => c.evaluate(input)).filter(
    (x): x is ScoredChipCandidate => x != null
  );
}

export function buildTeamIdentityChips(input: TeamIdentityInput): DetailInsightChip[] {
  const scored = evaluateTeamIdentityCandidates(input);
  return selectDetailChips(scored, {
    maxDisplay: 4,
    maxPerCategory: { style: 2, defense: 2, momentum: 1, risk: 1 },
    reservedIds: scored.some((c) => c.id === "injury_risk") ? ["injury_risk"] : [],
  });
}
