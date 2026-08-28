/**
 * 前季（または任意シーズン）のチーム成績スプリット。
 * 開幕 Pro Insight の HOME/AWAY・H2H・対.500・対上位用。
 */

export type WlRecord = { wins: number; losses: number };

export type NbaTeamSeasonRecordSplit = {
  teamId: string;
  overall: WlRecord;
  home: WlRecord;
  away: WlRecord;
  /** 相手の最終勝率 ≥ .500 */
  vsOver500: WlRecord;
  /** 相手の最終勝率 < .500 */
  vsUnder500: WlRecord;
  /** 自カンファレンス最終勝率 Top6（自分除く） */
  vsConfTop6: WlRecord;
  vsConfTop6Home: WlRecord;
  vsConfTop6Away: WlRecord;
};

/** ペアキーは teamId 昇順 `a|b`。視点は呼び出し側で変換 */
export type NbaH2HSeasonPair = {
  teamAId: string;
  teamBId: string;
  /** A の勝ち数（レギュラー） */
  aWins: number;
  bWins: number;
  /** A のホームでの A/B 勝ち */
  atA: WlRecord;
  /** B のホームでの A/B 勝ち（atA は A視点、atB は A視点のアウェイ） */
  atB: WlRecord;
};

export type NbaTeamSeasonRecordsBundle = {
  seasonKey: string;
  /** regular のみ集計 */
  teams: Record<string, NbaTeamSeasonRecordSplit>;
  h2h: Record<string, NbaH2HSeasonPair>;
  gameCount: number;
  builtAtMs: number;
};

export function emptyWl(): WlRecord {
  return { wins: 0, losses: 0 };
}

export function addWin(r: WlRecord): void {
  r.wins += 1;
}

export function addLoss(r: WlRecord): void {
  r.losses += 1;
}

export function formatWl(r: WlRecord | null | undefined): string {
  if (!r) return "0-0";
  return `${r.wins}-${r.losses}`;
}

export function wlTotal(r: WlRecord): number {
  return r.wins + r.losses;
}

export function wlWinPct(r: WlRecord): number {
  const t = wlTotal(r);
  if (t <= 0) return 0;
  return r.wins / t;
}

export function h2hPairKey(teamA: string, teamB: string): string {
  return teamA < teamB ? `${teamA}|${teamB}` : `${teamB}|${teamA}`;
}

/** home 視点のシリーズ成績 */
export function h2hFromPerspective(
  pair: NbaH2HSeasonPair | null | undefined,
  perspectiveTeamId: string
): { overall: WlRecord; atHome: WlRecord; atAway: WlRecord } | null {
  if (!pair) return null;
  const isA = perspectiveTeamId === pair.teamAId;
  const isB = perspectiveTeamId === pair.teamBId;
  if (!isA && !isB) return null;
  if (isA) {
    return {
      overall: { wins: pair.aWins, losses: pair.bWins },
      atHome: { ...pair.atA },
      atAway: { ...pair.atB },
    };
  }
  return {
    overall: { wins: pair.bWins, losses: pair.aWins },
    atHome: {
      wins: pair.atB.losses,
      losses: pair.atB.wins,
    },
    atAway: {
      wins: pair.atA.losses,
      losses: pair.atA.wins,
    },
  };
}
