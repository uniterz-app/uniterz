/**
 * NBA チームのレギュラー勝敗（表示・並び替え用）。
 *
 * 1. `wins` / `losses` があれば Firestore の値をそのまま使う。
 * 2. 無い古いドキュメントのみホーム/アウェイ集計から算出。
 * 3. それも無ければ wins/losses と cupFinal のレガシー処理。
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

/** `teams/{id}.playoff` — playoff W/L/D for all leagues (written by Cloud Functions). */
export type TeamPlayoffWlFields = {
  wins?: number;
  losses?: number;
  draws?: number;
};

export function teamPlayoffWinsLossesDraws(team: {
  playoff?: TeamPlayoffWlFields;
}): { wins: number; losses: number; draws: number } {
  const p = team.playoff ?? {};
  return {
    wins: Number(p.wins ?? 0),
    losses: Number(p.losses ?? 0),
    draws: Number(p.draws ?? 0),
  };
}

/** `teams/{id}.playoffNba` — NBA playoff detail stats (same shape as top-level RS fields). */
export function nbaPlayoffWinsLosses(
  team: NbaTeamRecordFields & { playoffNba?: NbaTeamRecordFields }
): { wins: number; losses: number } {
  if (!team.playoffNba) return { wins: 0, losses: 0 };
  return nbaRegularSeasonWinsLosses(team.playoffNba);
}

export function nbaRegularSeasonWinsLosses(
  team: NbaTeamRecordFields
): { wins: number; losses: number } {
  if (team.wins !== undefined && team.losses !== undefined) {
    return { wins: Number(team.wins), losses: Number(team.losses) };
  }

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
