/**
 * モバイル MatchCard の RecordWithRank / formatRecordLine に合わせた戦績・順位行
 */

function ordinalEn(n: number): string {
  const v = Math.abs(Math.trunc(n));
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = v % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

export type TeamRecordSnapshot = {
  wins: number;
  losses: number;
  rank?: number;
};

/**
 * `teams/{teamId}` 取得結果 or 試合ドキュメント内の wins/losses/rank から1行のラベルを作る
 */
export function formatTeamRecordForCard(
  side: unknown,
  teamRecordById: Readonly<Record<string, TeamRecordSnapshot>>
): string | null {
  const row = side as
    | {
        teamId?: string;
        wins?: unknown;
        losses?: unknown;
        rank?: unknown;
      }
    | undefined;
  if (!row) return "(0-0)";

  const id = row.teamId != null ? String(row.teamId).trim() : "";
  const fromTeamDoc = id && teamRecordById[id] ? teamRecordById[id] : null;
  if (fromTeamDoc) {
    return formatWinsLossesRank(
      fromTeamDoc.wins,
      fromTeamDoc.losses,
      fromTeamDoc.rank
    );
  }

  const wins = Number(row.wins);
  const losses = Number(row.losses);
  const rank = Number(row.rank);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return "(0-0)";
  const r =
    Number.isFinite(rank) && rank > 0 ? Math.trunc(rank) : undefined;
  return formatWinsLossesRank(wins, losses, r);
}

function formatWinsLossesRank(
  wins: number,
  losses: number,
  rank: number | undefined
): string {
  const core = `(${wins}-${losses})`;
  if (rank == null || !Number.isFinite(rank) || rank <= 0) {
    return core;
  }
  /** 日英とも 1st / 2nd / 3rd / 4th 表記（例: (40-30):3rd） */
  return `${core}:${rank}${ordinalEn(rank)}`;
}
