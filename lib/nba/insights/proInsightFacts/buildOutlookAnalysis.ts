/**
 * PREVIEW 展望の分析材料（ピックアップのみ）。純関数。
 * リーグ表・ロスター・選手試合ログ・選手メトリクス・injury から、
 * チームの攻守とペース、ポジション別の失点、主力の型と調子、欠場時の得点の移り方をまとめる。
 */
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import { previewShortName } from "@/lib/nba/insights/proInsightFacts/buildPreviewFacts";
import { projectPlayerPoints } from "@/lib/nba/insights/proInsightFacts/playerPointsProjection";

export type OutlookPos = "G" | "F" | "C";

export type OutlookPlayerMetric = { value: number; rank: number };

export type OutlookPlayerLogs = { teamId: string | null; logs: NbaPlayerGameLog[] };

export type OutlookAnalysisInput = {
  homeTeamId: string;
  awayTeamId: string;
  seasonKey: string;
  seasonRows: NbaLeagueTeamStatRow[];
  last10Rows: NbaLeagueTeamStatRow[];
  rosterTeams: Record<string, NbaTeamRosterDocTeam> | null;
  logsByPlayer: Map<string, OutlookPlayerLogs>;
  metricsByPlayer: Record<string, Record<string, OutlookPlayerMetric>>;
  injuries: Record<string, NbaTeamInjuryEntry[]>;
};

export type OutlookPointsRange = { mean: number; low: number; high: number; games: number };

export type OutlookKeyPlayer = {
  /** 選手 ID（試合後の採点で box と照合する） */
  playerId?: string;
  name: string;
  pos: OutlookPos;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
  fg3Pct: string | null;
  last5Ppg: number | null;
  /** 直近 5 試合が平均から大きく離れたとき。好調・不調は次の試合で平均へ戻る（2026-11 検証） */
  formNote?: string;
  /** 今夜の得点の目安（今季平均が中心・約 6 割がこの幅に入る） */
  pointsRange?: OutlookPointsRange;
  pointsOutlook?: string;
  seasonHigh: string | null;
  strengths: string[];
  vsOpponentThisSeason?: string;
  /** 今夜の相手がそのポジションで上位 10 / 下位 10 のときだけ */
  opponentVsPosition?: string;
  /** この選手が支える守りが相手の同ポジションの得点源に厳しい（defensiveReads と同じ文） */
  defensiveRead?: string;
};

export type OutlookTeam = {
  team: string;
  record: string;
  offense: string;
  defense: string;
  net: string;
  pace: string;
  shooting: string[];
  last10?: string;
  /** 上位 10 / 下位 10 のポジションだけ */
  allowedByPosition: Partial<Record<OutlookPos, string>>;
  keyPlayers: OutlookKeyPlayer[];
  /** そのポジションへの失点が上位 5 かつ守りの強みを持つ選手がいる → 相手の同ポジションの得点源に厳しい */
  defensiveReads?: string[];
  absences: string[];
  loadShiftWithoutAbsent: string[];
};

export type ProInsightOutlookAnalysis = {
  seasonKey: string;
  teamsRanked: number;
  rankNote: string;
  teams: OutlookTeam[];
};

const POS_WORD: Record<OutlookPos, string> = { G: "guards", F: "forwards", C: "centers" };

export function primaryPos(raw: string | null | undefined): OutlookPos | null {
  const c = String(raw ?? "").trim().toUpperCase();
  if (!c) return null;
  // "F-C" / "C-F" はビッグとして C に寄せる（C 単独だけだと母数が少なく失点が極端に低く出る）
  if (c.includes("C")) return "C";
  if (c.startsWith("F")) return "F";
  if (c.startsWith("G") || c === "SG" || c === "PG") return "G";
  return null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * ポジション別失点を「狙い目 / 厳しい相手」の根拠にしてよい最少試合数。
 * 2026-11 の検証（各チーム約 10 試合）では選手の得点をまったく予測しなかった（r=+0.03）。
 * それ未満の時期はシートに載せない。シーズン中に scripts/backtest-pro-insight-projection.ts と試合後採点で取り直す。
 */
export const OUTLOOK_POSITION_DEFENSE_MIN_GAMES = 20;

/** 直近 5 試合と今季平均の差がこれ以上なら formNote を付ける */
const FORM_GAP_PTS = 4;

/** 順位の段階（#1 = その指標で最良）。LLM が中位を強み・弱みと書かないよう語で渡す */
export function rankTier(rank: number, of: number): string {
  if (rank <= 5) return "top 5";
  if (rank <= 10) return "top 10";
  if (rank > of - 5) return "bottom 5";
  if (rank > of - 10) return "bottom 10";
  return "middle — not a strength or weakness";
}

/** 失点の順位（#1 = 最も許さない。中位は allowedLine が渡さない） */
function allowedTier(rank: number, of: number): string {
  if (rank <= 5) return "among the stingiest — a tough matchup";
  if (rank <= 10) return "stingier than most";
  if (rank > of - 5) return "allows among the most — a clear weakness";
  return "allows more than most — a weakness";
}
const pct1 = (n: number) => `${round1(n * 100)}%`;

function rankMap(
  rows: NbaLeagueTeamStatRow[],
  key: keyof NbaLeagueTeamStatRow,
  higherIsBetter: boolean
): Map<string, number> {
  const sorted = rows
    .filter((r) => typeof r[key] === "number" && Number.isFinite(r[key] as number))
    .sort((a, b) =>
      higherIsBetter ? (b[key] as number) - (a[key] as number) : (a[key] as number) - (b[key] as number)
    );
  return new Map(sorted.map((r, i) => [r.teamId, i + 1]));
}

/** 相手チーム別・ポジション別の失点（選手試合ログの oppTeamId × ロスターのポジション） */
export function allowedByPosition(
  logsByPlayer: Map<string, OutlookPlayerLogs>,
  posByPlayer: Map<string, OutlookPos>
): Map<string, { games: number; pts: Record<OutlookPos, number> }> {
  const acc = new Map<string, { games: Set<string>; pts: Record<OutlookPos, number> }>();
  for (const [playerId, { logs }] of logsByPlayer) {
    const pos = posByPlayer.get(playerId);
    if (!pos) continue;
    for (const g of logs) {
      if (!g.oppTeamId || !(g.min > 0)) continue;
      let row = acc.get(g.oppTeamId);
      if (!row) {
        row = { games: new Set(), pts: { G: 0, F: 0, C: 0 } };
        acc.set(g.oppTeamId, row);
      }
      row.games.add(g.gameId);
      row.pts[pos] += g.pts;
    }
  }
  const out = new Map<string, { games: number; pts: Record<OutlookPos, number> }>();
  for (const [teamId, row] of acc) {
    const n = row.games.size;
    if (!n) continue;
    out.set(teamId, {
      games: n,
      pts: { G: row.pts.G / n, F: row.pts.F / n, C: row.pts.C / n },
    });
  }
  return out;
}

const STRENGTH_METRICS: Array<{ id: string; label: string; pct?: boolean }> = [
  { id: "usg", label: "usage rate", pct: true },
  { id: "iso_freq", label: "isolation frequency", pct: true },
  { id: "iso_pts", label: "isolation points" },
  { id: "drives", label: "drives per game" },
  { id: "drive_pts", label: "points on drives" },
  { id: "pts_paint", label: "paint points" },
  { id: "restricted_pts", label: "restricted-area points" },
  { id: "pts_mid", label: "mid-range points" },
  { id: "pullup_pts", label: "pull-up points" },
  { id: "pnr_bh_pts", label: "pick-and-roll ball-handler points" },
  { id: "trans_pts", label: "transition points" },
  { id: "fg3m", label: "3PM per game" },
  { id: "cns_pts", label: "catch-and-shoot points" },
  { id: "spotup_pts", label: "spot-up points" },
  { id: "fta", label: "free-throw attempts" },
  { id: "ast", label: "assists" },
  { id: "reb", label: "rebounds" },
  { id: "oreb", label: "offensive rebounds" },
  { id: "blk", label: "blocks" },
  { id: "stl", label: "steals" },
  { id: "clutch_pts", label: "clutch points" },
];

/** 守りの読みの根拠にする指標と、それが効くポジション */
const DEFENSIVE_METRICS: Array<{ id: string; label: string; positions: OutlookPos[] }> = [
  { id: "blk", label: "blocks", positions: ["C", "F"] },
  { id: "stl", label: "steals", positions: ["G", "F"] },
  { id: "reb", label: "rebounds", positions: ["C"] },
];

function strengthsOf(metrics: Record<string, OutlookPlayerMetric> | undefined): string[] {
  if (!metrics) return [];
  return STRENGTH_METRICS.map((def) => ({ def, m: metrics[def.id] }))
    .filter(({ m }) => m && m.rank > 0 && m.rank <= 15 && Number.isFinite(m.value))
    .sort((a, b) => a.m.rank - b.m.rank)
    .slice(0, 4)
    .map(({ def, m }) => `${def.label} ${def.pct ? pct1(m.value) : round1(m.value)} (#${m.rank} among all players)`);
}

function sortedLogs(logs: NbaPlayerGameLog[]): NbaPlayerGameLog[] {
  return logs.filter((g) => g.min > 0).sort((a, b) => Number(a.gameId) - Number(b.gameId));
}

function avgPts(logs: NbaPlayerGameLog[]): number {
  return round1(logs.reduce((s, g) => s + g.pts, 0) / logs.length);
}

export function buildOutlookAnalysis(input: OutlookAnalysisInput): ProInsightOutlookAnalysis | null {
  const rows = input.seasonRows;
  if (rows.length < 10) return null;
  const teamsRanked = rows.length;
  const ranks = {
    ortg: rankMap(rows, "ortg", true),
    drtg: rankMap(rows, "drtg", false),
    netrtg: rankMap(rows, "netrtg", true),
    pace: rankMap(rows, "pace", true),
    fg3a: rankMap(rows, "fg3a", true),
    fg3Pct: rankMap(rows, "fg3Pct", true),
    oppFg3Pct: rankMap(rows, "oppFg3Pct", false),
    tovPct: rankMap(rows, "tovPct", false),
    oppTov: rankMap(rows, "oppTov", true),
  };

  const posByPlayer = new Map<string, OutlookPos>();
  for (const team of Object.values(input.rosterTeams ?? {})) {
    for (const p of team.players) {
      const pos = primaryPos(p.position);
      if (pos) posByPlayer.set(String(p.id), pos);
    }
  }
  const allowed = allowedByPosition(input.logsByPlayer, posByPlayer);
  const allowedRank = (["G", "F", "C"] as const).reduce(
    (acc, pos) => {
      const sorted = [...allowed.entries()].sort((a, b) => a[1].pts[pos] - b[1].pts[pos]);
      acc[pos] = new Map(sorted.map(([id], i) => [id, i + 1]));
      return acc;
    },
    {} as Record<OutlookPos, Map<string, number>>
  );
  const allowedTeams = allowed.size;

  /** 中位（上位 10・下位 10 以外）は返さない。渡すと LLM が「平均的で弱点はない」と要らない一言を書く */
  const allowedLine = (teamId: string, pos: OutlookPos): string | null => {
    const a = allowed.get(teamId);
    const r = allowedRank[pos].get(teamId);
    if (!a || !r || a.games < OUTLOOK_POSITION_DEFENSE_MIN_GAMES) return null;
    if (r > 10 && r <= allowedTeams - 10) return null;
    return `${round1(a.pts[pos])} pts per game to ${POS_WORD[pos]} (#${r} of ${allowedTeams}, #1 = allows the least: ${allowedTier(r, allowedTeams)})`;
  };

  /** 欠場者がいない試合でその選手の得点が 3 点以上伸びていれば 1 文で返す */
  const loadShiftOf = (teamId: string, player: { id: string | number }): string | null => {
    const roster = input.rosterTeams?.[teamId]?.players ?? [];
    const logs = sortedLogs(input.logsByPlayer.get(String(player.id))?.logs ?? []);
    for (const inj of input.injuries[teamId] ?? []) {
      if (inj.status !== "out" && inj.status !== "doubtful") continue;
      const outLogs = sortedLogs(input.logsByPlayer.get(String(inj.playerId))?.logs ?? []);
      if (!outLogs.length) continue;
      const played = new Set(outLogs.map((g) => g.gameId));
      const without = logs.filter((g) => !played.has(g.gameId));
      const withHim = logs.filter((g) => played.has(g.gameId));
      if (without.length < 2 || withHim.length < 2) continue;
      if (avgPts(without) - avgPts(withHim) < 3) continue;
      const outPlayer = roster.find((r) => String(r.id) === String(inj.playerId));
      const outName = outPlayer ? previewShortName(outPlayer.firstName, outPlayer.lastName) : inj.name;
      return `${avgPts(without)} ppg in ${without.length} games without ${outName}, who is out tonight`;
    }
    return null;
  };

  const teamOf = (teamId: string, oppId: string): OutlookTeam | null => {
    const row = rows.find((r) => r.teamId === teamId);
    if (!row) return null;
    const abbr = proInsightTeamAbbr(teamId);
    const opp = proInsightTeamAbbr(oppId);
    const rk = (m: Map<string, number>) => {
      const r = m.get(teamId);
      return r ? `#${r}, ${rankTier(r, teamsRanked)}` : "#?";
    };
    const injuries = input.injuries[teamId] ?? [];
    const sidelined = new Set(
      injuries.filter((i) => i.status === "out" || i.status === "doubtful").map((i) => String(i.playerId))
    );
    const roster = input.rosterTeams?.[teamId]?.players ?? [];

    const keyPlayers = roster
      .filter((p) => !sidelined.has(String(p.id)) && p.gp > 0 && !p.averagesSeasonKey)
      .sort((a, b) => b.ppg - a.ppg)
      .slice(0, 3)
      .map((p): OutlookKeyPlayer => {
        const id = String(p.id);
        const pos = primaryPos(p.position) ?? "F";
        const logs = sortedLogs(input.logsByPlayer.get(id)?.logs ?? []);
        const last5 = logs.slice(-5);
        const high = logs.reduce<NbaPlayerGameLog | null>((best, g) => (!best || g.pts > best.pts ? g : best), null);
        const vsOpp = logs.filter((g) => g.oppTeamId === oppId);
        const last5Ppg = last5.length >= 3 ? avgPts(last5) : null;
        const formGap = last5Ppg != null ? last5Ppg - p.ppg : 0;
        const proj = projectPlayerPoints({
          logs,
          missingTeammatePpg: 0,
          shareOfRemaining: 0,
          oppAllowedRatio: null,
        });
        return {
          playerId: id,
          name: previewShortName(p.firstName, p.lastName),
          pos,
          gp: p.gp,
          ppg: round1(p.ppg),
          rpg: round1(p.rpg ?? 0),
          apg: round1(p.apg ?? 0),
          mpg: round1(p.mpg),
          fg3Pct:
            typeof p.fg3Pct === "number" && (p.fg3a ?? 0) >= 2
              ? pct1(p.fg3Pct > 1 ? p.fg3Pct / 100 : p.fg3Pct)
              : null,
          last5Ppg,
          ...(formGap >= FORM_GAP_PTS
            ? {
                formNote:
                  "hot last 5 games — such runs usually cool back toward the season average next game; not a reason by itself for a big night",
              }
            : formGap <= -FORM_GAP_PTS
              ? {
                  formNote:
                    "cold last 5 games — such dips usually bounce back toward the season average; not a reason by itself for a quiet night",
                }
              : {}),
          ...(proj
            ? {
                pointsRange: { mean: proj.mean, low: proj.low, high: proj.high, games: proj.games },
                pointsOutlook: `tonight's points: centered on his season average; about 6 nights in 10 land between ${proj.low} and ${proj.high}`,
              }
            : {}),
          seasonHigh: high ? `${high.pts} pts vs ${high.oppAbbr} (${high.dateLabel})` : null,
          strengths: strengthsOf(input.metricsByPlayer[id]),
          ...(vsOpp.length ? { vsOpponentThisSeason: `${avgPts(vsOpp)} ppg in ${vsOpp.length} game(s) vs ${opp}` } : {}),
          ...(() => {
            const line = allowedLine(oppId, pos);
            return line ? { opponentVsPosition: `${opp} allow ${line}` } : {};
          })(),
        };
      });

    const absences: string[] = [];
    let minorAbsences = 0;
    for (const i of injuries) {
      if (i.status !== "out" && i.status !== "doubtful" && i.status !== "questionable") continue;
      const p = roster.find((r) => String(r.id) === String(i.playerId));
      const ppg = p && p.gp > 0 && !p.averagesSeasonKey ? p.ppg : null;
      if (ppg == null || ppg < 5) {
        minorAbsences += 1;
        continue;
      }
      const name = p ? previewShortName(p.firstName, p.lastName) : i.name;
      absences.push(
        `${name} ${i.status === "out" ? "OUT" : i.status}, ${round1(ppg)} ppg in ${p!.gp} games${
          i.status === "questionable" ? " (questionable players usually play — uncertain, not missing)" : ""
        }`
      );
    }
    if (minorAbsences) absences.push(`plus ${minorAbsences} other player(s) out with under 5 ppg or no games this season`);

    const loadShiftWithoutAbsent: string[] = [];
    for (const inj of injuries.filter((i) => sidelined.has(String(i.playerId)))) {
      const outLogs = sortedLogs(input.logsByPlayer.get(String(inj.playerId))?.logs ?? []);
      if (!outLogs.length) continue;
      const played = new Set(outLogs.map((g) => g.gameId));
      const outPlayer = roster.find((r) => String(r.id) === String(inj.playerId));
      const outName = outPlayer ? previewShortName(outPlayer.firstName, outPlayer.lastName) : inj.name;
      for (const kp of roster.filter((p) => !sidelined.has(String(p.id)) && p.gp > 0).sort((a, b) => b.ppg - a.ppg).slice(0, 5)) {
        const logs = sortedLogs(input.logsByPlayer.get(String(kp.id))?.logs ?? []);
        const without = logs.filter((g) => !played.has(g.gameId));
        const withHim = logs.filter((g) => played.has(g.gameId));
        if (without.length < 2 || withHim.length < 2) continue;
        const diff = avgPts(without) - avgPts(withHim);
        if (Math.abs(diff) < 3) continue;
        loadShiftWithoutAbsent.push(
          `${previewShortName(kp.firstName, kp.lastName)}: ${avgPts(without)} ppg in ${without.length} games without ${outName} vs ${avgPts(withHim)} ppg in ${withHim.length} games with him`
        );
      }
    }

    const oppSidelined = new Set(
      (input.injuries[oppId] ?? [])
        .filter((i) => i.status === "out" || i.status === "doubtful")
        .map((i) => String(i.playerId))
    );
    const oppRoster = (input.rosterTeams?.[oppId]?.players ?? []).filter(
      (p) => !oppSidelined.has(String(p.id)) && p.gp > 0 && !p.averagesSeasonKey
    );
    const anchors = roster
      .filter((p) => !sidelined.has(String(p.id)) && p.gp > 0 && !p.averagesSeasonKey)
      .flatMap((p) =>
        DEFENSIVE_METRICS.map((def) => ({ p, def, m: input.metricsByPlayer[String(p.id)]?.[def.id] }))
          .filter(({ m }) => m && m.rank > 0 && m.rank <= 15)
          .map(({ p, def, m }) => ({ p, def, m: m! }))
      );
    const defensiveReads: string[] = [];
    for (const pos of ["G", "F", "C"] as const) {
      const r = allowedRank[pos].get(teamId);
      if (!r || r > 5 || (allowed.get(teamId)?.games ?? 0) < OUTLOOK_POSITION_DEFENSE_MIN_GAMES) continue;
      const anchor = anchors
        .filter(({ p, def }) => def.positions.includes(pos) && primaryPos(p.position) === pos)
        .sort((a, b) => a.m.rank - b.m.rank)[0];
      if (!anchor) continue;
      const target = oppRoster
        .filter((p) => primaryPos(p.position) === pos && p.ppg >= 8)
        .sort((a, b) => b.ppg - a.ppg)[0];
      if (!target) continue;
      const shift = loadShiftOf(oppId, target);
      const anchorName = previewShortName(anchor.p.firstName, anchor.p.lastName);
      const read =
        `${anchorName} (${abbr}, #${anchor.m.rank} among all players in ${anchor.def.label}, ${round1(anchor.m.value)}) anchors a ${abbr} defense that allows ${r === 1 ? "the fewest" : "among the fewest"} points to ${POS_WORD[pos]} (#${r} of ${allowedTeams}) — a tough matchup for ${opp}'s ${POS_WORD[pos].slice(0, -1)} ${previewShortName(target.firstName, target.lastName)} (${round1(target.ppg)} ppg${shift ? `; ${shift}` : ""}). The stingy defense belongs to ${abbr}, not ${opp}.`;
      defensiveReads.push(read);
      const kp = keyPlayers.find((k) => k.name === anchorName);
      if (kp) kp.defensiveRead = read;
    }

    const l10 = input.last10Rows.find((r) => r.teamId === teamId);
    const seasonGames = row.wins + row.losses;
    return {
      team: abbr,
      record: `${row.wins}-${row.losses}`,
      offense: `ORtg ${round1(row.ortg)} (${rk(ranks.ortg)}), ${round1(row.ppg)} ppg`,
      defense: `DRtg ${round1(row.drtg)} (${rk(ranks.drtg)}), ${round1(row.papg)} allowed per game`,
      net: `Net ${round1(row.netrtg)} (${rk(ranks.netrtg)})`,
      pace: `${round1(row.pace)} (${rk(ranks.pace)}; #1 = fastest)`,
      shooting: [
        `3PA ${round1(row.fg3a)} per game (${rk(ranks.fg3a)})`,
        `3P% ${pct1(row.fg3Pct)} (${rk(ranks.fg3Pct)})`,
        `opponent 3P% allowed ${pct1(row.oppFg3Pct)} (${rk(ranks.oppFg3Pct)}; #1 = stingiest)`,
        `TOV% ${pct1(row.tovPct)} (${rk(ranks.tovPct)}; #1 = fewest)`,
        `forced turnovers ${round1(row.oppTov)} per game (${rk(ranks.oppTov)})`,
      ],
      ...(l10 && l10.wins + l10.losses < seasonGames
        ? { last10: `${l10.wins}-${l10.losses}, net ${round1(l10.netrtg)}` }
        : {}),
      allowedByPosition: Object.fromEntries(
        (["G", "F", "C"] as const).flatMap((pos) => {
          const line = allowedLine(teamId, pos);
          return line ? [[pos, line]] : [];
        })
      ),
      keyPlayers,
      ...(defensiveReads.length ? { defensiveReads } : {}),
      absences,
      loadShiftWithoutAbsent: loadShiftWithoutAbsent.slice(0, 3),
    };
  };

  const away = teamOf(input.awayTeamId, input.homeTeamId);
  const home = teamOf(input.homeTeamId, input.awayTeamId);
  if (!away || !home) return null;
  return {
    seasonKey: input.seasonKey,
    teamsRanked,
    rankNote: "Team ranks: #1 = best in that stat unless noted. Player ranks are among all NBA players.",
    teams: [away, home],
  };
}
