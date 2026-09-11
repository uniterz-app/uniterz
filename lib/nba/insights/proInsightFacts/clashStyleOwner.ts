/**
 * MATCHUP 型オーナー — leaders チーム内 Top2 で clash kind と突合。
 * leaders 無し / ヒット無し → 欠場は MATCHUP に折り込まない。
 */
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { isOutOrQuestionableInjury } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { resolveInjuryShapeImpact } from "@/lib/nba/insights/proInsightFacts/injuryShapeRoles";
import { MATCHUP_INJURY_MIN_MPG } from "@/lib/nba/insights/proInsightFacts/matchupInjuryMpg";

/** clash kind → オーナーとみなす leaders 指標 */
export const CLASH_STYLE_OWNER_METRICS: Record<string, readonly string[]> = {
  paint: ["pts_paint", "pct_pts_paint", "reb", "blk", "oreb"],
  fb: ["stl", "pts"],
  off_tov: ["stl"],
  second: ["oreb", "reb"],
  three: ["fg3m", "fg3_pct", "pts_3", "pct_pts_3"],
  glass: ["oreb", "reb", "reb_pct"],
  tov: ["ast", "usg"],
  fta: ["pts", "fta"],
  // playtype（weakening のみ）
  iso: ["pts", "usg", "iso_ppp", "iso_freq"],
  pnr: ["ast", "usg", "pnr_bh_ppp", "pnr_bh_freq"],
  post: ["pts", "reb", "post_ppp", "post_freq"],
  spotup: ["fg3m", "pts_3", "spotup_ppp", "spotup_freq"],
};

export function isStyleOwnerForClash(input: {
  kind: string;
  teamId: string;
  playerId: string;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
}): boolean {
  const metrics = CLASH_STYLE_OWNER_METRICS[input.kind];
  if (!metrics?.length || !input.playerId || !input.leaders) return false;
  const shape = resolveInjuryShapeImpact({
    teamId: input.teamId,
    playerId: input.playerId,
    leaders: input.leaders,
  });
  if (!shape?.roles.length) return false;
  const set = new Set(metrics);
  return shape.roles.some((r) => set.has(r));
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

/**
 * 指定 kind の型オーナー欠場（mpg≥25 · OUT/QUES）。
 * leaders 無し → null（折り込まない）。
 */
export function findStyleOwnerInjury(input: {
  kind: string;
  teamId: string;
  injuries: NbaTeamInjuryEntry[];
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
  mpgByPlayerId?: Record<string, number> | null;
}): NbaTeamInjuryEntry | null {
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
    if (
      isStyleOwnerForClash({
        kind: input.kind,
        teamId: input.teamId,
        playerId,
        leaders: input.leaders,
      })
    ) {
      return injury;
    }
  }
  return null;
}
