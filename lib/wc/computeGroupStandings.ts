// lib/wc/computeGroupStandings.ts
//
// グループステージの順位を games（試合結果）から集計する純関数。
// FIFA ルール: 勝点（W=3, D=1, L=0） → 得失点差 → 総得点 の順でソート。
// （細かい H2H タイブレーカーは将来 v2 で）

export type WcStandingGame = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  /** "scheduled" | "live" | "final" など。final 以外は集計対象外 */
  status: string;
};

export type WcStandingRow = {
  teamId: string;
  /** 試合数（final のみカウント） */
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** 得点 */
  goalsFor: number;
  /** 失点 */
  goalsAgainst: number;
  /** 得失点差 */
  goalDiff: number;
  /** 勝点 */
  points: number;
};

const EMPTY_ROW = (teamId: string): WcStandingRow => ({
  teamId,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  points: 0,
});

/**
 * グループに属する 4 チームと、関連する試合を渡すと順位表を返す。
 *
 * @param teamIds グループの teamId 配列（4 つ想定だが任意数 OK）
 * @param games 同シーズンの WC 試合リスト（グループ外の試合を含んでいても自動で無視される）
 */
export function computeGroupStandings(
  teamIds: readonly string[],
  games: readonly WcStandingGame[],
): WcStandingRow[] {
  const set = new Set(teamIds);
  const rows = new Map<string, WcStandingRow>();
  for (const id of teamIds) rows.set(id, EMPTY_ROW(id));

  for (const g of games) {
    if (g.status !== "final") continue;
    if (!set.has(g.homeTeamId) || !set.has(g.awayTeamId)) continue;
    if (g.homeScore == null || g.awayScore == null) continue;

    const h = rows.get(g.homeTeamId)!;
    const a = rows.get(g.awayTeamId)!;

    h.played += 1;
    a.played += 1;
    h.goalsFor += g.homeScore;
    h.goalsAgainst += g.awayScore;
    a.goalsFor += g.awayScore;
    a.goalsAgainst += g.homeScore;

    if (g.homeScore > g.awayScore) {
      h.wins += 1;
      a.losses += 1;
      h.points += 3;
    } else if (g.homeScore < g.awayScore) {
      a.wins += 1;
      h.losses += 1;
      a.points += 3;
    } else {
      h.draws += 1;
      a.draws += 1;
      h.points += 1;
      a.points += 1;
    }
  }

  for (const r of rows.values()) {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
  }

  return Array.from(rows.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff;
    if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor;
    return x.teamId.localeCompare(y.teamId);
  });
}
