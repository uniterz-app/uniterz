/**
 * PLAYER ROLE — 候補プール evaluate
 */
import type {
  DetailInsightChip,
  ScoredChipCandidate,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import {
  isBigPosition,
  playerMetricRank,
  rankInRange,
  scoreFromBottomRank,
  scoreFromHighRank,
  scoreFromLowRank,
} from "@/lib/nba/detailInsights/playerMetricUtils";
import { selectDetailChips } from "@/lib/nba/detailInsights/selectDetailChips";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaPlayerSeasonMetricCell } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";

export type PlayerRoleInput = {
  leaderMetrics: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>
  >;
  position: string;
  rosterPlayer?: NbaRosterPlayer | null;
  seasonMin: number;
};

type CandidateEval = {
  evaluate: (input: PlayerRoleInput) => ScoredChipCandidate | null;
};

function chip(c: ScoredChipCandidate): ScoredChipCandidate {
  return c;
}

function r(
  metrics: PlayerRoleInput["leaderMetrics"],
  id: NbaPlayerLeaderMetricId
): number | null {
  return playerMetricRank(metrics, id);
}

const CANDIDATES: CandidateEval[] = [
  {
    evaluate: ({ leaderMetrics }) => {
      const usg = r(leaderMetrics, "usg");
      const pts = r(leaderMetrics, "pts");
      if (!rankInRange(usg, 1, 8) || pts == null || pts > 12) return null;
      return chip({ id: "first_option", label: "1ST OPTION", category: "usage", exclusiveGroup: "usage_tier", tieBreak: 90, score: scoreFromHighRank(usg!) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const usg = r(leaderMetrics, "usg");
      const pts = r(leaderMetrics, "pts");
      if (!rankInRange(usg, 9, 16) || pts == null || pts > 18) return null;
      return chip({ id: "second_option", label: "2ND OPTION", category: "usage", exclusiveGroup: "usage_tier", tieBreak: 80, score: scoreFromHighRank(16 - (usg! - 8)) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const usg = r(leaderMetrics, "usg");
      const pts = r(leaderMetrics, "pts");
      if (!rankInRange(usg, 17, 22) || pts == null || pts > 22) return null;
      return chip({ id: "third_option", label: "3RD OPTION", category: "usage", exclusiveGroup: "usage_tier", tieBreak: 70, score: 6 });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const pnr = r(leaderMetrics, "pnr_bh_freq");
      const ast = r(leaderMetrics, "ast");
      const usg = r(leaderMetrics, "usg");
      const pnrOk = pnr != null && pnr <= 10;
      const astOk = ast != null && ast <= 10 && usg != null && usg <= 18;
      if (!pnrOk && !astOk) return null;
      const score = Math.max(pnrOk ? scoreFromHighRank(pnr!) : 0, astOk ? scoreFromHighRank(ast!) : 0);
      return chip({ id: "primary_handler", label: "PRIMARY HANDLER", category: "offense_style", exclusiveGroup: "creator", tieBreak: 75, score });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const ast = r(leaderMetrics, "ast");
      const usg = r(leaderMetrics, "usg");
      if (ast == null || ast > 14 || usg == null || usg < 14 || usg > 22) return null;
      return chip({ id: "secondary_creator", label: "SECONDARY CREATOR", category: "offense_style", exclusiveGroup: "creator", tieBreak: 65, score: scoreFromHighRank(ast) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const astPct = r(leaderMetrics, "ast_pct");
      if (astPct == null || astPct > 10) return null;
      return chip({ id: "playmaker", label: "PLAYMAKER", category: "offense_style", exclusiveGroup: "creator", tieBreak: 64, score: scoreFromHighRank(astPct) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const spot = r(leaderMetrics, "spotup_freq");
      const usg = r(leaderMetrics, "usg");
      if (spot == null || spot > 10 || usg == null || usg < 14) return null;
      return chip({ id: "spot_up", label: "SPOT-UP SHOOTER", category: "offense_style", exclusiveGroup: "shooter_type", tieBreak: 60, score: scoreFromHighRank(spot) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const fg3a = r(leaderMetrics, "fg3a");
      const usg = r(leaderMetrics, "usg");
      if (fg3a == null || fg3a > 12 || usg == null || usg < 14 || usg > 24) return null;
      return chip({ id: "floor_spacer", label: "FLOOR SPACER", category: "offense_style", exclusiveGroup: "shooter_type", tieBreak: 58, score: scoreFromHighRank(fg3a) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const fg3a = r(leaderMetrics, "fg3a");
      const stl = r(leaderMetrics, "stl");
      const mfg = r(leaderMetrics, "matchup_fg_pct");
      const defRank = mfg ?? stl;
      if (fg3a == null || fg3a > 12 || defRank == null || defRank > 12) return null;
      return chip({ id: "three_d", label: "3&D WING", category: "offense_style", exclusiveGroup: "shooter_type", tieBreak: 62, score: scoreFromHighRank(fg3a) + scoreFromLowRank(defRank) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const rim = r(leaderMetrics, "restricted_fg_pct");
      if (rim == null || rim > 10) return null;
      return chip({ id: "rim_runner", label: "RIM RUNNER", category: "offense_style", tieBreak: 55, score: scoreFromHighRank(rim) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const drives = r(leaderMetrics, "drives");
      if (drives == null || drives > 10) return null;
      return chip({ id: "slasher", label: "SLASHER", category: "offense_style", tieBreak: 54, score: scoreFromHighRank(drives) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const paint = r(leaderMetrics, "paint_touches");
      const rim = r(leaderMetrics, "restricted_fg_pct");
      if (paint == null || paint > 10 || rim == null || rim > 12) return null;
      return chip({ id: "paint_finisher", label: "PAINT FINISHER", category: "offense_style", tieBreak: 53, score: scoreFromHighRank(paint) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const post = r(leaderMetrics, "post_freq");
      if (post == null || post > 10) return null;
      return chip({ id: "post_scorer", label: "POST SCORER", category: "offense_style", tieBreak: 52, score: scoreFromHighRank(post) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const cut = r(leaderMetrics, "cut_freq");
      if (cut == null || cut > 10) return null;
      return chip({ id: "cutter", label: "CUTTER", category: "offense_style", tieBreak: 51, score: scoreFromHighRank(cut) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const off = r(leaderMetrics, "offscreen_freq");
      const hnd = r(leaderMetrics, "handoff_freq");
      const best = off != null && hnd != null ? Math.min(off, hnd) : off ?? hnd;
      if (best == null || best > 10) return null;
      return chip({ id: "off_ball_mover", label: "OFF-BALL MOVER", category: "offense_style", tieBreak: 50, score: scoreFromHighRank(best) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const trans = r(leaderMetrics, "trans_freq");
      if (trans == null || trans > 10) return null;
      return chip({ id: "transition_threat", label: "TRANSITION", category: "offense_style", tieBreak: 49, score: scoreFromHighRank(trans) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const fga = r(leaderMetrics, "fga");
      if (fga == null || fga > 10) return null;
      return chip({ id: "volume_scorer", label: "VOLUME SCORER", category: "offense_style", exclusiveGroup: "scorer_type", tieBreak: 48, score: scoreFromHighRank(fga) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const ts = r(leaderMetrics, "ts_pct");
      const usg = r(leaderMetrics, "usg");
      if (ts == null || ts > 10 || usg == null || usg < 12) return null;
      return chip({ id: "efficient_scorer", label: "EFFICIENT", category: "offense_style", exclusiveGroup: "scorer_type", tieBreak: 47, score: scoreFromHighRank(ts) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const ftr = r(leaderMetrics, "fta_rate");
      if (ftr == null || ftr > 10) return null;
      return chip({ id: "ft_magnet", label: "FT MAGNET", category: "offense_style", tieBreak: 46, score: scoreFromHighRank(ftr) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const cu = r(leaderMetrics, "clutch_usg");
      const cp = r(leaderMetrics, "clutch_pts");
      const best = cu ?? cp;
      if (best == null || best > 10) return null;
      return chip({ id: "closer", label: "CLOSER", category: "offense_style", tieBreak: 45, score: scoreFromHighRank(best) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const mfg = r(leaderMetrics, "matchup_fg_pct");
      const stl = r(leaderMetrics, "stl");
      const best = mfg ?? stl;
      if (best == null || best > 12) return null;
      return chip({ id: "pao_defender", label: "POA DEFENDER", category: "defense", exclusiveGroup: "defense_type", tieBreak: 44, score: scoreFromLowRank(best) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const blk = r(leaderMetrics, "blk");
      const lt6 = r(leaderMetrics, "opp_lt6_pct");
      const best = blk ?? lt6;
      if (best == null || best > 10) return null;
      return chip({ id: "rim_protector", label: "RIM PROTECTOR", category: "defense", exclusiveGroup: "defense_type", tieBreak: 43, score: scoreFromLowRank(best) });
    },
  },
  {
    evaluate: ({ leaderMetrics, seasonMin }) => {
      const drtg = r(leaderMetrics, "drtg");
      const min = r(leaderMetrics, "min");
      if (drtg == null || drtg > 10 || ((min == null || min > 15) && seasonMin < 24)) return null;
      return chip({ id: "def_anchor", label: "DEF ANCHOR", category: "defense", exclusiveGroup: "defense_type", tieBreak: 42, score: scoreFromLowRank(drtg) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const reb = r(leaderMetrics, "reb_pct");
      if (reb == null || reb > 10) return null;
      return chip({ id: "glass_cleaner", label: "GLASS CLEANER", category: "defense", tieBreak: 41, score: scoreFromHighRank(reb) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const def = r(leaderMetrics, "deflections");
      const chg = r(leaderMetrics, "charges");
      const lb = r(leaderMetrics, "loose_balls");
      const ranks = [def, chg, lb].filter((x): x is number => x != null);
      if (!ranks.length || Math.min(...ranks) > 10) return null;
      return chip({ id: "hustle_energy", label: "HUSTLE", category: "defense", tieBreak: 40, score: scoreFromHighRank(Math.min(...ranks)) });
    },
  },
  {
    evaluate: ({ leaderMetrics, position }) => {
      const fg3a = r(leaderMetrics, "fg3a");
      if (!isBigPosition(position) || fg3a == null || fg3a > 15) return null;
      return chip({ id: "stretch_big", label: "STRETCH BIG", category: "big", exclusiveGroup: "big_type", tieBreak: 39, score: scoreFromHighRank(fg3a) });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const roll = r(leaderMetrics, "pnr_roll_freq");
      if (roll == null || roll > 10) return null;
      return chip({ id: "roll_man", label: "ROLL MAN", category: "big", exclusiveGroup: "big_type", tieBreak: 38, score: scoreFromHighRank(roll) });
    },
  },
  {
    evaluate: ({ leaderMetrics, position, seasonMin }) => {
      const usg = r(leaderMetrics, "usg");
      const min = r(leaderMetrics, "min");
      if (!isBigPosition(position)) return null;
      const minRank = min ?? (seasonMin >= 28 ? 10 : seasonMin >= 20 ? 18 : 25);
      if (minRank < 18 || usg == null || usg < 20) return null;
      return chip({ id: "backup_big", label: "BACKUP BIG", category: "big", exclusiveGroup: "big_type", tieBreak: 37, score: 8 });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const ast = r(leaderMetrics, "ast");
      const usg = r(leaderMetrics, "usg");
      const ts = r(leaderMetrics, "ts_pct");
      if (ast == null || ast > 18 || usg == null || usg < 22 || ts == null || ts > 12) return null;
      return chip({ id: "connector", label: "CONNECTOR", category: "offense_style", tieBreak: 36, score: 7 });
    },
  },
  {
    evaluate: ({ rosterPlayer }) => {
      if (!rosterPlayer || rosterPlayer.starter !== false || rosterPlayer.mpg < 24) return null;
      return chip({ id: "sixth_man", label: "SIXTH MAN", category: "usage", exclusiveGroup: "bench_role", tieBreak: 85, score: 14 });
    },
  },
  {
    evaluate: ({ leaderMetrics }) => {
      const usg = r(leaderMetrics, "usg");
      if (usg == null || usg < 26) return null;
      return chip({ id: "low_usage", label: "LOW-USAGE", category: "usage", exclusiveGroup: "bench_role", tieBreak: 10, score: scoreFromBottomRank(usg) });
    },
  },
];

export function evaluatePlayerRoleCandidates(
  input: PlayerRoleInput
): ScoredChipCandidate[] {
  return CANDIDATES.map((c) => c.evaluate(input)).filter(
    (x): x is ScoredChipCandidate => x != null
  );
}

export function buildPlayerRoleChips(input: PlayerRoleInput): DetailInsightChip[] {
  const scored = evaluatePlayerRoleCandidates(input);
  const hasUsageTier = scored.some((c) =>
    ["first_option", "second_option", "third_option"].includes(c.id)
  );
  const filtered = hasUsageTier
    ? scored.filter((c) => c.id !== "low_usage")
    : scored;

  return selectDetailChips(filtered, {
    maxDisplay: 3,
    maxPerCategory: {
      usage: 1,
      offense_style: 1,
      defense: 1,
      big: 1,
    },
  });
}
