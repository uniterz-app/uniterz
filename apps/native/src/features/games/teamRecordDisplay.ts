/**
 * モバイル MatchCard の RecordWithRank / formatRecordLine に合わせた戦績・順位行
 */

import {
  formatTeamRecordWithRank,
  type TeamRecordLine,
} from "../../../../../lib/teamRecordDisplay";

export type TeamRecordSnapshot = TeamRecordLine;

/**
 * `teams/{teamId}` 取得結果 or 試合ドキュメント内の wins/losses/rank から1行のラベルを作る
 */
export function formatTeamRecordForCard(
  side: unknown,
  teamRecordById: Readonly<Record<string, TeamRecordSnapshot>>,
  leagueRaw?: unknown,
): string | null {
  const row = side as
    | {
        teamId?: string;
        wins?: unknown;
        losses?: unknown;
        draws?: unknown;
        rank?: unknown;
      }
    | undefined;
  if (!row) return "(0-0)";

  const id = row.teamId != null ? String(row.teamId).trim() : "";
  const fromTeamDoc = id && teamRecordById[id] ? teamRecordById[id] : null;
  if (fromTeamDoc) {
    return formatTeamRecordWithRank(fromTeamDoc, leagueRaw);
  }

  const wins = Number(row.wins);
  const losses = Number(row.losses);
  const draws = Number(row.draws);
  const rank = Number(row.rank);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return "(0-0)";
  const r =
    Number.isFinite(rank) && rank > 0 ? Math.trunc(rank) : undefined;
  return formatTeamRecordWithRank(
    {
      wins,
      losses,
      ...(Number.isFinite(draws) ? { draws } : {}),
      rank: r,
    },
    leagueRaw,
  );
}
