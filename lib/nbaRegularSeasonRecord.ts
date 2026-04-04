/**
 * NBA チームの「レギュラーシーズン相当」の勝敗を返す。
 * GameTeamStats（詳細スタッツ）と同じく、ホーム・アウェイ集計を優先する。
 * cupFinal の減算はフォールバック時のみ（ホーム/アウェイが無い古いデータ向け）。
 */
export type NbaTeamRecordFields = {
  wins?: number;
  losses?: number;
  homeGames?: number;
  homeWins?: number;
  awayGames?: number;
  awayWins?: number;
  cupFinalWins?: number;
  cupFinalLosses?: number;
};

export function nbaRegularSeasonWinsLosses(
  team: NbaTeamRecordFields
): { wins: number; losses: number } {
  const hg = Number(team.homeGames ?? 0);
  const ag = Number(team.awayGames ?? 0);
  const hw = Number(team.homeWins ?? 0);
  const aw = Number(team.awayWins ?? 0);

  if (hg + ag > 0) {
    const wins = hw + aw;
    const losses = Math.max(0, hg - hw) + Math.max(0, ag - aw);
    return { wins, losses };
  }

  const w = Math.max(0, Number(team.wins ?? 0) - Number(team.cupFinalWins ?? 0));
  const l = Math.max(
    0,
    Number(team.losses ?? 0) - Number(team.cupFinalLosses ?? 0)
  );
  return { wins: w, losses: l };
}
