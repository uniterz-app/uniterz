/**
 * チームあたり得意 Top / 苦手 Top を選ぶ（minGames + delta ゲート）。
 */
import {
  MIN_TEAM_SHAPE_GAMES,
  TEAM_SHAPE_DEF_BY_ID,
  TEAM_SHAPE_EDGE_DELTA_MIN,
  type TeamShapeDef,
} from "@/lib/nba/teamShapes/shapeDefs";
import type {
  NbaTeamShapeRecord,
  NbaTeamShapeSplit,
} from "@/lib/nba/teamShapes/teamShapeTypes";
import { formatWl } from "@/lib/nba/insights/priorSeasonRecordTypes";

export type TeamShapeEdge = {
  kind: "strength" | "weakness";
  def: TeamShapeDef;
  split: NbaTeamShapeSplit;
};

export type TeamShapeSelectSurface = "edge" | "context";

function eligibleForSurface(
  def: TeamShapeDef | undefined,
  surface: TeamShapeSelectSurface
): boolean {
  if (!def) return false;
  if (surface === "edge") return def.edgeEligible;
  return def.contextEligible || def.edgeEligible;
}

export function selectTeamShapeEdges(
  record: NbaTeamShapeRecord | null | undefined,
  opts?: {
    minGames?: number;
    deltaMin?: number;
    maxStrengths?: number;
    maxWeaknesses?: number;
    /** edge = チーム詳細 / context = Pro Insight（相対型含む） */
    surface?: TeamShapeSelectSurface;
  }
): TeamShapeEdge[] {
  if (!record) return [];
  const minGames = opts?.minGames ?? MIN_TEAM_SHAPE_GAMES;
  const deltaMin = opts?.deltaMin ?? TEAM_SHAPE_EDGE_DELTA_MIN;
  const maxS = opts?.maxStrengths ?? 2;
  const maxW = opts?.maxWeaknesses ?? 1;
  const surface = opts?.surface ?? "edge";

  const eligible: NbaTeamShapeSplit[] = [];
  for (const split of Object.values(record.shapes)) {
    if (!split || split.games < minGames) continue;
    const def = TEAM_SHAPE_DEF_BY_ID.get(split.shapeId);
    if (!eligibleForSurface(def, surface)) continue;
    eligible.push(split);
  }

  const strengths = eligible
    .filter((s) => s.deltaWinPct >= deltaMin)
    .sort(
      (a, b) =>
        b.deltaWinPct - a.deltaWinPct ||
        b.games - a.games ||
        a.shapeId.localeCompare(b.shapeId)
    )
    .slice(0, maxS);

  const weaknesses = eligible
    .filter((s) => s.deltaWinPct <= -deltaMin)
    .sort(
      (a, b) =>
        a.deltaWinPct - b.deltaWinPct ||
        b.games - a.games ||
        a.shapeId.localeCompare(b.shapeId)
    )
    .slice(0, maxW);

  const out: TeamShapeEdge[] = [];
  for (const s of strengths) {
    const def = TEAM_SHAPE_DEF_BY_ID.get(s.shapeId);
    if (def) out.push({ kind: "strength", def, split: s });
  }
  for (const w of weaknesses) {
    const def = TEAM_SHAPE_DEF_BY_ID.get(w.shapeId);
    if (def) out.push({ kind: "weakness", def, split: w });
  }
  return out;
}

export function formatShapeEdgeHintEn(edge: TeamShapeEdge): string {
  const pp = Math.round(edge.split.deltaWinPct * 100);
  const sign = pp >= 0 ? `+${pp}` : String(pp);
  const tag = edge.kind === "strength" ? "strength" : "weakness";
  return `When ${edge.def.conditionEn}: ${formatWl(edge.split.when)} (${sign}pp vs season; ${tag}).`;
}
