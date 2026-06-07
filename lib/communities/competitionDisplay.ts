import type { Language } from "@/lib/i18n/language";
import type { CommunityLeague } from "./types";
import { leagueLabel, metricLabel, rankingTeamsLabel } from "./labels";

/** 一覧・詳細用: リーグ + チーム + 指標の表示行 */
export function formatCommunityCompetitionLine(
  opts: {
    rankingLeague: CommunityLeague;
    rankingMetric: Parameters<typeof metricLabel>[0];
    rankingTeamIds?: string[];
  },
  language: Language,
  nameById?: Record<string, string>
): string {
  const leaguePart = leagueLabel(opts.rankingLeague ?? "all", language);
  const teamsPart = rankingTeamsLabel(opts.rankingTeamIds ?? [], language, nameById);
  const metricPart = metricLabel(opts.rankingMetric, language);
  if (teamsPart) {
    return `${leaguePart} · ${teamsPart} · ${metricPart}`;
  }
  return `${leaguePart} · ${metricPart}`;
}
