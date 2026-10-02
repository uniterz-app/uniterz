/**
 * MATCHUP 型オーナー — その型の専用指標（攻め / 守り別）で leaders チーム内 Top2 の選手だけ。
 * PTS / USG / PIE のような総合指標ではオーナーにしない。
 * leaders 無し / ヒット無し → 欠場は MATCHUP に折り込まない。
 */
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { isOutOrQuestionableInjury } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  INJURY_SHAPE_TEAM_RANK_MAX,
  formatMetricValue,
  higherIsBetterFor,
  shortLabel,
  teamRankOnBoard,
} from "@/lib/nba/insights/proInsightFacts/injuryShapeRoles";
import { MATCHUP_INJURY_MIN_MPG } from "@/lib/nba/insights/proInsightFacts/matchupInjuryMpg";

export type StyleOwnerSide = "attack" | "defend";

/**
 * clash / playtype kind → オーナーとみなす leaders 指標。
 * attack = 攻め側でその型を担う選手、defend = 守り側でその穴を塞いでいる選手。
 * 空配列 = 選手に帰属できない型（欠場を折り込まない）。
 */
export const CLASH_STYLE_OWNER_METRICS: Record<
  StyleOwnerSide,
  Record<string, readonly string[]>
> = {
  attack: {
    paint: ["pts_paint", "pct_pts_paint", "restricted_pts", "paint_touch_pts", "drive_pts"],
    fb: ["pts_fb", "trans_pts", "trans_freq"],
    off_tov: ["pts_tov", "stl"],
    second: ["oreb", "oreb_pts"],
    three: ["fg3m", "fg3a", "pts_3", "cns_pts"],
    glass: ["oreb", "oreb_pct"],
    tov: ["ast", "ast_pct"],
    fta: ["fta", "pts_ft", "fta_rate"],
    iso: ["iso_freq", "iso_pts"],
    pnr: ["pnr_bh_freq", "pnr_bh_pts"],
    post: ["post_freq", "post_pts"],
    spotup: ["spotup_freq", "spotup_pts"],
  },
  defend: {
    paint: ["blk", "contested_shots", "dreb"],
    fb: [],
    off_tov: [],
    second: ["dreb", "reb"],
    three: [],
    glass: ["dreb", "reb_pct"],
    tov: ["stl", "deflections"],
    fta: [],
  },
};

export type StyleOwnerHit = {
  metricId: string;
  label: string;
  teamRank: number;
  leagueRank: number | null;
  formatted: string;
};

/** その選手が kind × side のオーナーなら最も強い指標ヒットを返す */
export function resolveStyleOwnerHit(input: {
  kind: string;
  side: StyleOwnerSide;
  teamId: string;
  playerId: string;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
}): StyleOwnerHit | null {
  const metrics = CLASH_STYLE_OWNER_METRICS[input.side][input.kind];
  if (!metrics?.length || !input.playerId || !input.leaders) return null;
  let best: StyleOwnerHit | null = null;
  for (const metricId of metrics) {
    const board = input.leaders.season[metricId as NbaPlayerLeaderMetricId];
    const hit = teamRankOnBoard(
      board,
      input.teamId,
      input.playerId,
      higherIsBetterFor(metricId)
    );
    if (!hit || hit.rank > INJURY_SHAPE_TEAM_RANK_MAX) continue;
    if (
      !best ||
      hit.rank < best.teamRank ||
      (hit.rank === best.teamRank &&
        (hit.leagueRank ?? 999) < (best.leagueRank ?? 999))
    ) {
      best = {
        metricId,
        label: shortLabel(metricId),
        teamRank: hit.rank,
        leagueRank: hit.leagueRank,
        formatted: formatMetricValue(metricId, hit.value),
      };
    }
  }
  return best;
}

export function isStyleOwnerForClash(input: {
  kind: string;
  side?: StyleOwnerSide;
  teamId: string;
  playerId: string;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
}): boolean {
  return resolveStyleOwnerHit({ ...input, side: input.side ?? "attack" }) != null;
}

function mpgOf(
  entry: NbaTeamInjuryEntry,
  mpgByPlayerId: Record<string, number> | null | undefined
): number {
  const id = String(entry.playerId ?? "").trim();
  if (!id || !mpgByPlayerId) return 0;
  const v = mpgByPlayerId[id];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export type StyleOwnerInjury = {
  injury: NbaTeamInjuryEntry;
  owner: StyleOwnerHit;
};

/**
 * 指定 kind × side の型オーナー欠場（mpg≥25 · OUT/QUES）。
 * leaders 無し → null（折り込まない）。
 */
export function findStyleOwnerInjury(input: {
  kind: string;
  side: StyleOwnerSide;
  teamId: string;
  injuries: NbaTeamInjuryEntry[];
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
  mpgByPlayerId?: Record<string, number> | null;
}): StyleOwnerInjury | null {
  if (!input.leaders) return null;
  const list = input.injuries.filter((i) => {
    if (!isOutOrQuestionableInjury(i.status)) return false;
    return mpgOf(i, input.mpgByPlayerId) >= MATCHUP_INJURY_MIN_MPG;
  });
  if (list.length === 0) return null;
  const outs = list.filter(
    (i) => i.status === "out" || i.status === "doubtful"
  );
  const pool = outs.length > 0 ? outs : list;
  for (const injury of pool) {
    const playerId = String(injury.playerId ?? "").trim();
    if (!playerId) continue;
    const owner = resolveStyleOwnerHit({
      kind: input.kind,
      side: input.side,
      teamId: input.teamId,
      playerId,
      leaders: input.leaders,
    });
    if (owner) return { injury, owner };
  }
  return null;
}
