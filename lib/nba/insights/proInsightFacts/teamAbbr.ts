/**
 * Pro Insight 文中のチーム表記。
 * 略称（MIA）ではなく HEAT / RAPTORS / LAKERS 形式。
 */
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { teamNameRulesNBA } from "@/lib/team-names-nba";

export function proInsightTeamAbbr(teamId: string | null | undefined): string {
  const id = String(teamId ?? "").trim();
  if (!id) return "";
  if (id.startsWith("nba-")) {
    return id.slice(4).replace(/-/g, " ").toUpperCase();
  }
  return id.toUpperCase();
}

/**
 * 移動ホップ用の都市名（大文字）。例: nba-heat → MIAMI、nba-raptors → TORONTO。
 * ニックネーム（HEAT）は使わない。
 */
export function proInsightTeamCity(teamId: string | null | undefined): string {
  const id = String(teamId ?? "").trim();
  if (!id) return "";
  const full = NBA_TEAM_NAME_BY_ID[id];
  if (full) {
    const rule = teamNameRulesNBA[full];
    if (rule?.line1) return rule.line1.toUpperCase();
  }
  // フォールバック: ニックネームではなく空寄りに id 末尾を出さない
  return proInsightTeamAbbr(id);
}

/** 例: "from MIAMI to TORONTO"（hintEn / LLM が JA「MIAMIからTORONTO」にしやすい） */
export function proInsightTravelHopEn(
  fromTeamId: string | null | undefined,
  toTeamId: string | null | undefined
): string {
  const from = proInsightTeamCity(fromTeamId);
  const to = proInsightTeamCity(toTeamId);
  if (from && to) return `from ${from} to ${to}`;
  if (to) return `to ${to}`;
  return from || "";
}
