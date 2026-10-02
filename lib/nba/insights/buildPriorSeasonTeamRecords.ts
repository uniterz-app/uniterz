/**
 * 確定試合リスト → チーム成績バンドル。
 * レギュラーのみ。
 *
 * 対.500 / 対カンファ上位6 は **試合時点（その試合より前）の相手成績** で分類する。
 * 最終勝率で遡及しない（シーズン中に勝率は変わるため）。
 */
import { NBA_EAST_TEAM_IDS, NBA_WEST_TEAM_IDS } from "@/lib/nba/nbaConferenceTeams";
import {
  addLoss,
  addWin,
  emptyWl,
  h2hPairKey,
  type NbaH2HSeasonPair,
  type NbaTeamSeasonRecordSplit,
  type NbaTeamSeasonRecordsBundle,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";

export type PriorSeasonGameInput = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  /** 時系列判定用。無いと末尾扱い */
  startAtMs?: number | null;
  /** preseason は除外。play_in / playoffs も開幕 Insight では使わない */
  seasonPhase?: string | null;
};

function ensureTeam(
  map: Record<string, NbaTeamSeasonRecordSplit>,
  teamId: string
): NbaTeamSeasonRecordSplit {
  if (!map[teamId]) {
    map[teamId] = {
      teamId,
      overall: emptyWl(),
      home: emptyWl(),
      away: emptyWl(),
      vsOver500: emptyWl(),
      vsUnder500: emptyWl(),
      vsConfTop6: emptyWl(),
      vsConfTop6Home: emptyWl(),
      vsConfTop6Away: emptyWl(),
    };
  }
  return map[teamId]!;
}

function applyResult(r: WlRecord, won: boolean): void {
  if (won) addWin(r);
  else addLoss(r);
}

function confIdsFor(teamId: string): readonly string[] {
  if (NBA_EAST_TEAM_IDS.includes(teamId)) return NBA_EAST_TEAM_IDS;
  if (NBA_WEST_TEAM_IDS.includes(teamId)) return NBA_WEST_TEAM_IDS;
  return [];
}

function cloneWl(r: WlRecord): WlRecord {
  return { wins: r.wins, losses: r.losses };
}

function ensureRunning(
  running: Map<string, WlRecord>,
  teamId: string
): WlRecord {
  if (!running.has(teamId)) running.set(teamId, emptyWl());
  return running.get(teamId)!;
}

/** 試合時点の勝率。未消化（0試合）は null = 分類しない */
function asOfWinPct(r: WlRecord): number | null {
  const t = r.wins + r.losses;
  if (t <= 0) return null;
  return r.wins / t;
}

/** 試合時点の自カンファ上位6（勝率→勝ち数） */
function confTop6AsOf(
  running: Map<string, WlRecord>,
  conf: readonly string[]
): Set<string> {
  const ranked = [...conf]
    .map((id) => ({ id, r: running.get(id) ?? emptyWl() }))
    .filter((x) => x.r.wins + x.r.losses > 0)
    .sort((a, b) => {
      const pa = a.r.wins / (a.r.wins + a.r.losses);
      const pb = b.r.wins / (b.r.wins + b.r.losses);
      if (pb !== pa) return pb - pa;
      return b.r.wins - a.r.wins;
    })
    .slice(0, 6)
    .map((x) => x.id);
  return new Set(ranked);
}

function isRegular(g: PriorSeasonGameInput): boolean {
  const phase = String(g.seasonPhase ?? "regular").toLowerCase();
  if (phase === "preseason" || phase === "pre") return false;
  if (phase === "play_in" || phase === "playin") return false;
  if (phase === "playoffs" || phase === "playoff") return false;
  return true;
}

export function buildPriorSeasonTeamRecords(input: {
  seasonKey: string;
  games: PriorSeasonGameInput[];
  nowMs?: number;
}): NbaTeamSeasonRecordsBundle {
  const regular = input.games
    .filter(
      (g) =>
        isRegular(g) &&
        Number.isFinite(g.homeScore) &&
        Number.isFinite(g.awayScore) &&
        g.homeTeamId &&
        g.awayTeamId &&
        g.homeTeamId !== g.awayTeamId
    )
    .sort((a, b) => (a.startAtMs ?? 0) - (b.startAtMs ?? 0));

  const teams: Record<string, NbaTeamSeasonRecordSplit> = {};
  const h2h: Record<string, NbaH2HSeasonPair> = {};
  /** 試合適用前の累計 W–L（時系列） */
  const running = new Map<string, WlRecord>();

  for (const g of regular) {
    const homeWon = g.homeScore > g.awayScore;
    const home = ensureTeam(teams, g.homeTeamId);
    const away = ensureTeam(teams, g.awayTeamId);

    const homeAsOf = cloneWl(ensureRunning(running, g.homeTeamId));
    const awayAsOf = cloneWl(ensureRunning(running, g.awayTeamId));
    const awayPct = asOfWinPct(awayAsOf);
    const homePct = asOfWinPct(homeAsOf);

    applyResult(home.overall, homeWon);
    applyResult(home.home, homeWon);
    applyResult(away.overall, !homeWon);
    applyResult(away.away, !homeWon);

    // 対.500 — 相手の「この試合より前」の勝率。未消化ならスキップ
    if (awayPct != null) {
      if (awayPct >= 0.5) applyResult(home.vsOver500, homeWon);
      else applyResult(home.vsUnder500, homeWon);
    }
    if (homePct != null) {
      if (homePct >= 0.5) applyResult(away.vsOver500, !homeWon);
      else applyResult(away.vsUnder500, !homeWon);
    }

    // 対カンファ上位6 — 試合時点の順位表
    const homeConf = confIdsFor(g.homeTeamId);
    const awayConf = confIdsFor(g.awayTeamId);
    if (homeConf.length > 0 && homeConf.includes(g.awayTeamId)) {
      const top = confTop6AsOf(running, homeConf);
      if (top.has(g.awayTeamId)) {
        applyResult(home.vsConfTop6, homeWon);
        applyResult(home.vsConfTop6Home, homeWon);
      }
    }
    if (awayConf.length > 0 && awayConf.includes(g.homeTeamId)) {
      const top = confTop6AsOf(running, awayConf);
      if (top.has(g.homeTeamId)) {
        applyResult(away.vsConfTop6, !homeWon);
        applyResult(away.vsConfTop6Away, !homeWon);
      }
    }

    const key = h2hPairKey(g.homeTeamId, g.awayTeamId);
    let pair = h2h[key];
    if (!pair) {
      const [a, b] =
        g.homeTeamId < g.awayTeamId
          ? [g.homeTeamId, g.awayTeamId]
          : [g.awayTeamId, g.homeTeamId];
      pair = {
        teamAId: a!,
        teamBId: b!,
        aWins: 0,
        bWins: 0,
        atA: emptyWl(),
        atB: emptyWl(),
      };
      h2h[key] = pair;
    }

    const homeIsA = g.homeTeamId === pair.teamAId;
    if (homeIsA) {
      if (homeWon) {
        pair.aWins += 1;
        addWin(pair.atA);
      } else {
        pair.bWins += 1;
        addLoss(pair.atA);
      }
    } else if (homeWon) {
      pair.bWins += 1;
      addLoss(pair.atB);
    } else {
      pair.aWins += 1;
      addWin(pair.atB);
    }

    // この試合の結果を累計に反映（次の試合の「時点」用）
    applyResult(ensureRunning(running, g.homeTeamId), homeWon);
    applyResult(ensureRunning(running, g.awayTeamId), !homeWon);
  }

  return {
    seasonKey: input.seasonKey,
    teams,
    h2h,
    gameCount: regular.length,
    builtAtMs: input.nowMs ?? Date.now(),
  };
}
