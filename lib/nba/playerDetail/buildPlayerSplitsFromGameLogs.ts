/**
 * 試合ログ → ホーム/アウェイ・対戦相手別平均。
 * ingest 済みの今季出場試合（上限 82）ベース。
 */
import type {
  NbaPlayerGameLog,
  NbaPlayerVenueSplit,
  NbaPlayerVsOpponentSample,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function avg(sum: number, n: number): number {
  if (n <= 0) return 0;
  return round1(sum / n);
}

type Acc = {
  games: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
};

function emptyAcc(): Acc {
  return { games: 0, min: 0, pts: 0, reb: 0, ast: 0, plusMinus: 0 };
}

function add(acc: Acc, log: NbaPlayerGameLog): void {
  acc.games += 1;
  acc.min += log.min;
  acc.pts += log.pts;
  acc.reb += log.reb;
  acc.ast += log.ast;
  acc.plusMinus += log.plusMinus;
}

function venueFromAcc(venue: "home" | "away", acc: Acc): NbaPlayerVenueSplit | null {
  if (acc.games <= 0) return null;
  return {
    venue,
    games: acc.games,
    min: avg(acc.min, acc.games),
    pts: avg(acc.pts, acc.games),
    reb: avg(acc.reb, acc.games),
    ast: avg(acc.ast, acc.games),
    plusMinus: avg(acc.plusMinus, acc.games),
  };
}

export type PlayerSplitsFromGameLogs = {
  venueSplits: NbaPlayerVenueSplit[];
  vsOpponentSamples: NbaPlayerVsOpponentSample[];
};

/** 直近試合ログから Home/Away・対戦相手別平均を作る */
export function buildPlayerSplitsFromGameLogs(
  gameLogs: NbaPlayerGameLog[]
): PlayerSplitsFromGameLogs {
  const home = emptyAcc();
  const away = emptyAcc();
  const byOpp = new Map<
    string,
    Acc & { oppTeamId: string; oppAbbr: string }
  >();

  for (const log of gameLogs) {
    if (log.home) add(home, log);
    else add(away, log);

    const key = log.oppTeamId || log.oppAbbr;
    if (!key) continue;
    let row = byOpp.get(key);
    if (!row) {
      row = {
        ...emptyAcc(),
        oppTeamId: log.oppTeamId,
        oppAbbr: log.oppAbbr,
      };
      byOpp.set(key, row);
    }
    add(row, log);
  }

  const venueSplits: NbaPlayerVenueSplit[] = [];
  const homeRow = venueFromAcc("home", home);
  const awayRow = venueFromAcc("away", away);
  if (homeRow) venueSplits.push(homeRow);
  if (awayRow) venueSplits.push(awayRow);

  const vsOpponentSamples: NbaPlayerVsOpponentSample[] = [...byOpp.values()]
    .filter((r) => r.games > 0)
    .sort((a, b) => b.games - a.games || b.pts - a.pts)
    .map((r) => ({
      oppTeamId: r.oppTeamId,
      oppAbbr: r.oppAbbr,
      games: r.games,
      pts: avg(r.pts, r.games),
      reb: avg(r.reb, r.games),
      ast: avg(r.ast, r.games),
      plusMinus: avg(r.plusMinus, r.games),
    }));

  return { venueSplits, vsOpponentSamples };
}
