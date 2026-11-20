/**
 * 勝てていないチームの「負けの要因」候補を Firestore の既存スナップショットだけで並べる。書き込み・BDL なし。
 * 順位は 30 チーム中で、1 = その要因がいちばん強い（例: 移動距離 1 位 = いちばん移動した）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/report-struggling-teams.ts            # 勝ち数が最少のチーム
 *   npx tsx --tsconfig tsconfig.json scripts/report-struggling-teams.ts --max-wins 2
 *   npx tsx --tsconfig tsconfig.json scripts/report-struggling-teams.ts --teams nba-bulls,nba-jazz
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { kmBetweenArenas } from "../lib/nba/nbaArenaTravel";
import { getNbaTeamFranchiseInfo } from "../lib/nba/teamFranchise/nbaTeamFranchiseInfo";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

type Any = Record<string, any>;

const args = process.argv.slice(2);
const argVal = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};

const SEASON = CURRENT_NBA_SEASON_KEY;
const startYear = Number(SEASON.slice(0, 4));
const PRIOR = `${startYear - 1}-${String(startYear).slice(2)}`;

const etDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function etDay(ms: number): number {
  return Math.round(Date.parse(`${etDayFmt.format(new Date(ms))}T00:00:00Z`) / 86_400_000);
}
function tsMs(v: any): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v._seconds === "number") return v._seconds * 1000;
  return Date.parse(String(v)) || 0;
}
function splitMa(s: unknown): [number, number] {
  const m = String(s ?? "").match(/^(\d+)-(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}
const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** 1 = 値が大きい（desc）/ 小さい（asc） */
function rankOf(all: Record<string, number | null | undefined>, teamId: string, dir: "desc" | "asc"): string {
  const vals = Object.entries(all).filter(([, v]) => v != null && Number.isFinite(v)) as [string, number][];
  const me = all[teamId];
  if (me == null || !Number.isFinite(me)) return "-";
  const better = vals.filter(([, v]) => (dir === "desc" ? v > me : v < me)).length;
  return `${better + 1}/${vals.length}`;
}
function leagueAvg(all: Record<string, number | null | undefined>): number {
  const vals = Object.values(all).filter((v): v is number => v != null && Number.isFinite(v));
  return vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
}

type BoxP = { playerId: string; position: string; min: number; pts: number; fg: string; fg3: string; ft: string; starter?: boolean };
type G = {
  id: string;
  startMs: number;
  day: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  homeBox: BoxP[];
  awayBox: BoxP[];
  starterIds: string[];
};

async function main() {
  const db = getAdminDb();
  console.log(`season=${SEASON} prior=${PRIOR}`);

  const [stDoc, hubDoc, ltsDoc, ltsPrevDoc, cleanDoc, movesDoc, injDoc, rosDoc, finalTeamsDoc] = await Promise.all([
    db.collection("nbaStandings").doc(SEASON).get(),
    db.collection("nbaLeagueHub").doc(SEASON).get(),
    db.collection("nbaLeagueTeamStats").doc(SEASON).get(),
    db.collection("nbaLeagueTeamStats").doc(PRIOR).get(),
    db.collection("nbaTeamCleanRatings").doc(SEASON).get(),
    db.collection("nbaTeamOffseasonMoves").doc(SEASON).get(),
    db.collection("nbaTeamInjuries").doc(SEASON).get(),
    db.collection("nbaTeamRosters").doc(SEASON).get(),
    db.collection("nbaPlayerSeasonFinalTeams").doc(PRIOR).get(),
  ]);

  const standings: Any[] = [...(stDoc.data()?.board?.east ?? []), ...(stDoc.data()?.board?.west ?? [])];
  const winPct: Record<string, number> = {};
  for (const r of standings) winPct[r.teamId] = r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0;
  const teamIds = standings.map((r) => r.teamId as string);

  const teamsArg = argVal("--teams");
  const maxWins = argVal("--max-wins");
  const minWins = Math.min(...standings.map((r) => r.wins));
  const targets = teamsArg
    ? teamsArg.split(",")
    : standings.filter((r) => r.wins <= (maxWins != null ? Number(maxWins) : minWins)).map((r) => r.teamId as string);

  const hubTeams: Record<string, Any> = Object.fromEntries((hubDoc.data()?.teams ?? []).map((t: Any) => [t.teamId, t]));
  const hubPlayers: Any[] = hubDoc.data()?.players ?? [];
  const hubHot: Any[] = hubDoc.data()?.hot ?? [];
  const hubCold: Any[] = hubDoc.data()?.cold ?? [];
  const lts: Record<string, Any> = Object.fromEntries((ltsDoc.data()?.season ?? []).map((r: Any) => [r.teamId, r]));
  const ltsPrev: Record<string, Any> = Object.fromEntries((ltsPrevDoc.data()?.season ?? []).map((r: Any) => [r.teamId, r]));
  const clean: Record<string, Any> = cleanDoc.data()?.teams ?? {};
  const moves: Record<string, Any> = movesDoc.data()?.teams ?? {};
  const injuries: Record<string, Any[]> = injDoc.data()?.teams ?? {};
  const rosterTeams: Record<string, Any> = rosDoc.data()?.teams ?? {};
  const priorFinalTeam: Record<string, string> = Object.fromEntries(
    Object.entries((finalTeamsDoc.data()?.players ?? {}) as Record<string, Any>).map(([pid, v]) => [pid, v.teamId])
  );

  const rosterPlayer: Record<string, Any & { teamId: string }> = {};
  for (const [tid, t] of Object.entries(rosterTeams)) for (const p of t.players ?? []) rosterPlayer[String(p.id)] = { ...p, teamId: tid };

  // 前季メトリクス（ロスター全員 + 対象チームの OUT）。必要な項目だけ
  const outgoingIds = targets.flatMap((t) => (moves[t]?.outgoing ?? []).map((m: Any) => String(m.playerId)));
  const priorIds = [...new Set([...Object.keys(rosterPlayer), ...outgoingIds])];
  const priorRefs = priorIds.map((id) => db.collection("nbaPlayerSeasonMetrics").doc(PRIOR).collection("players").doc(id));
  const priorSnaps = priorRefs.length
    ? await db.getAll(...priorRefs, { fieldMask: ["gamesPlayed", "teamId", "metrics.pts", "metrics.min", "metrics.ts_pct", "metrics.fg3_pct", "metrics.usg"] })
    : [];
  const prior: Record<string, { gp: number; pts: number | null; min: number | null; ts: number | null; fg3: number | null; usg: number | null }> = {};
  for (const s of priorSnaps) {
    if (!s.exists) continue;
    const d = s.data() as Any;
    prior[s.id] = {
      gp: Number(d.gamesPlayed ?? 0),
      pts: d.metrics?.pts?.value ?? null,
      min: d.metrics?.min?.value ?? null,
      ts: d.metrics?.ts_pct?.value ?? null,
      fg3: d.metrics?.fg3_pct?.value ?? null,
      usg: d.metrics?.usg?.value ?? null,
    };
  }

  // 今季の終了試合（必要な項目だけ）
  const gSnap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", SEASON)
    .orderBy("startAtJst", "asc")
    .select("homeTeamId", "awayTeamId", "startAtJst", "startAt", "seasonPhase", "final", "homeScore", "awayScore", "liveStarterIds", "liveStats.box", "liveStats.phase")
    .get();
  const byKey = new Map<string, G>();
  for (const d of gSnap.docs) {
    const x = d.data() as Any;
    const phase = String(x.seasonPhase ?? "");
    if (phase === "preseason" || phase === "playoffs") continue;
    const isFinal = x.final === true || x.liveStats?.phase === "final";
    if (!isFinal) continue;
    const startMs = tsMs(x.startAtJst) || tsMs(x.startAt);
    const g: G = {
      id: d.id,
      startMs,
      day: etDay(startMs),
      homeId: x.homeTeamId,
      awayId: x.awayTeamId,
      homeScore: Number(x.homeScore ?? 0),
      awayScore: Number(x.awayScore ?? 0),
      homeBox: x.liveStats?.box?.home ?? [],
      awayBox: x.liveStats?.box?.away ?? [],
      starterIds: (x.liveStarterIds ?? []).map(String),
    };
    if (!g.homeId || !g.awayId || !(g.homeScore + g.awayScore)) continue;
    const key = `${g.homeId}|${g.awayId}|${g.day}`;
    const prev = byKey.get(key);
    if (!prev || (!prev.homeBox.length && g.homeBox.length)) byKey.set(key, g);
  }
  const games = [...byKey.values()].sort((a, b) => a.startMs - b.startMs);
  console.log(`final regular games=${games.length}`);

  // ---- 30 チーム分の集計（順位用）
  type T = {
    gp: number; home: number; away: number; km: number; restDays: number[]; b2b: number; threeInFour: number;
    oppWinPcts: number[]; strongRunMax: number; pf: number; pa: number;
    closeW: number; closeL: number; midW: number; midL: number; blowoutL: number;
    strongW: number; strongL: number; strongMargins: number[];
    opp3Excess: number; opp3Games: number; opp3m: number; opp3a: number;
    starterSets: Set<string>; starterPlayers: Set<string>;
    minutes: Record<string, number>; gamesPlayedBy: Record<string, number>; pts: Record<string, number>;
    tsAcc: Record<string, { pts: number; fga: number; fta: number; fg3m: number; fg3a: number }>;
    posMin: Record<string, number>;
  };
  const T0 = (): T => ({
    gp: 0, home: 0, away: 0, km: 0, restDays: [], b2b: 0, threeInFour: 0, oppWinPcts: [], strongRunMax: 0, pf: 0, pa: 0,
    closeW: 0, closeL: 0, midW: 0, midL: 0, blowoutL: 0, strongW: 0, strongL: 0, strongMargins: [],
    opp3Excess: 0, opp3Games: 0, opp3m: 0, opp3a: 0, starterSets: new Set(), starterPlayers: new Set(),
    minutes: {}, gamesPlayedBy: {}, pts: {}, tsAcc: {}, posMin: {},
  });
  const acc: Record<string, T> = Object.fromEntries(teamIds.map((t) => [t, T0()]));
  const lastVenue: Record<string, string> = {};
  const recentDays: Record<string, number[]> = {};
  const strongRun: Record<string, number> = {};

  for (const g of games) {
    for (const side of ["home", "away"] as const) {
      const me = side === "home" ? g.homeId : g.awayId;
      const opp = side === "home" ? g.awayId : g.homeId;
      const a = acc[me];
      if (!a) continue;
      const myScore = side === "home" ? g.homeScore : g.awayScore;
      const oppScore = side === "home" ? g.awayScore : g.homeScore;
      const myBox = side === "home" ? g.homeBox : g.awayBox;
      const oppBox = side === "home" ? g.awayBox : g.homeBox;
      const win = myScore > oppScore;
      const margin = myScore - oppScore;

      a.gp++;
      side === "home" ? a.home++ : a.away++;
      a.km += kmBetweenArenas(lastVenue[me] ?? me, g.homeId) ?? 0;
      lastVenue[me] = g.homeId;
      const days = recentDays[me] ?? (recentDays[me] = []);
      if (days.length) {
        const rest = g.day - days[days.length - 1]! - 1;
        a.restDays.push(rest);
        if (rest === 0) a.b2b++;
      }
      days.push(g.day);
      if (days.filter((d) => d > g.day - 4).length >= 3) a.threeInFour++;

      const ow = winPct[opp] ?? 0.5;
      a.oppWinPcts.push(ow);
      const strong = ow >= 0.5;
      strongRun[me] = strong ? (strongRun[me] ?? 0) + 1 : 0;
      a.strongRunMax = Math.max(a.strongRunMax, strongRun[me]!);
      if (strong) {
        win ? a.strongW++ : a.strongL++;
        a.strongMargins.push(margin);
      }
      a.pf += myScore;
      a.pa += oppScore;
      const abs = Math.abs(margin);
      if (abs <= 5) win ? a.closeW++ : a.closeL++;
      else if (abs <= 10) win ? a.midW++ : a.midL++;
      else if (!win && abs >= 15) a.blowoutL++;

      if (oppBox.length) {
        let m3 = 0, a3 = 0;
        for (const p of oppBox) {
          const [m, at] = splitMa(p.fg3);
          m3 += m;
          a3 += at;
        }
        const oppSeason3 = lts[opp]?.fg3Pct;
        if (a3 > 0 && oppSeason3) {
          a.opp3Excess += m3 - a3 * oppSeason3;
          a.opp3Games++;
          a.opp3m += m3;
          a.opp3a += a3;
        }
      }
      if (myBox.length) {
        const ids = new Set(myBox.map((p) => String(p.playerId)));
        const st = g.starterIds.filter((id) => ids.has(id));
        if (st.length === 5) {
          a.starterSets.add([...st].sort().join(","));
          st.forEach((id) => a.starterPlayers.add(id));
        }
        for (const p of myBox) {
          if (!(p.min > 0)) continue;
          const pid = String(p.playerId);
          a.minutes[pid] = (a.minutes[pid] ?? 0) + p.min;
          a.gamesPlayedBy[pid] = (a.gamesPlayedBy[pid] ?? 0) + 1;
          a.pts[pid] = (a.pts[pid] ?? 0) + (p.pts ?? 0);
          const [, fga] = splitMa(p.fg);
          const [, fta] = splitMa(p.ft);
          const [f3m, f3a] = splitMa(p.fg3);
          const t = a.tsAcc[pid] ?? (a.tsAcc[pid] = { pts: 0, fga: 0, fta: 0, fg3m: 0, fg3a: 0 });
          t.pts += p.pts ?? 0;
          t.fga += fga;
          t.fta += fta;
          t.fg3m += f3m;
          t.fg3a += f3a;
          const pos = String(p.position ?? "").trim().charAt(0).toUpperCase();
          if (pos) a.posMin[pos] = (a.posMin[pos] ?? 0) + p.min;
        }
      }
    }
  }

  const sumMin = (t: T, f: (pid: string) => boolean) => {
    const tot = Object.values(t.minutes).reduce((s, v) => s + v, 0);
    const part = Object.entries(t.minutes).filter(([pid]) => f(pid)).reduce((s, [, v]) => s + v, 0);
    return tot > 0 ? part / tot : null;
  };
  const draftYearOf = (pid: string): number | null => {
    const y = rosterPlayer[pid]?.draftYear;
    return typeof y === "number" && y > 1900 ? y : null;
  };
  const isRookie = (pid: string) => draftYearOf(pid) === startYear || (prior[pid] == null && priorFinalTeam[pid] == null && rosterPlayer[pid] != null && draftYearOf(pid) == null);

  /** 主力 = 今季ロスターで (今季 ppg, 前季 pts) の大きいほう上位 3 */
  const coreOf = (tid: string): string[] =>
    (rosterTeams[tid]?.players ?? [])
      .map((p: Any) => {
        const pid = String(p.id);
        const cur = (p.gp ?? 0) >= 3 ? Number(p.ppg ?? 0) : 0;
        const pr = (prior[pid]?.gp ?? 0) >= 20 ? Number(prior[pid]?.pts ?? 0) : 0;
        return { pid, v: Math.max(cur, pr) };
      })
      .sort((a: Any, b: Any) => b.v - a.v)
      .slice(0, 3)
      .map((x: Any) => x.pid);

  const metric = <K extends string>(f: (tid: string, t: T) => number | null) =>
    Object.fromEntries(teamIds.map((tid) => [tid, f(tid, acc[tid]!)])) as Record<string, number | null>;

  const M = {
    oppWin: metric((_, t) => (t.oppWinPcts.length ? leagueAvg(Object.fromEntries(t.oppWinPcts.map((v, i) => [i, v]))) : null)),
    sosAdj: metric((tid) => clean[tid]?.sosAdj ?? null),
    awayShare: metric((_, t) => (t.gp ? t.away / t.gp : null)),
    kmPerGame: metric((_, t) => (t.gp ? t.km / t.gp : null)),
    km: metric((_, t) => t.km),
    b2b: metric((_, t) => t.b2b),
    threeInFour: metric((_, t) => t.threeInFour),
    avgRest: metric((_, t) => (t.restDays.length ? t.restDays.reduce((s, v) => s + Math.min(v, 4), 0) / t.restDays.length : null)),
    strongShare: metric((_, t) => (t.gp ? t.oppWinPcts.filter((v) => v >= 0.5).length / t.gp : null)),
    strongRunMax: metric((_, t) => t.strongRunMax),
    newMinShare: metric((tid, t) => sumMin(t, (pid) => priorFinalTeam[pid] !== tid)),
    rookieMinShare: metric((_, t) => sumMin(t, isRookie)),
    vetMinShare: metric((_, t) => sumMin(t, (pid) => {
      const y = draftYearOf(pid);
      return y != null && startYear - y >= 8;
    })),
    experience: metric((tid) => hubTeams[tid]?.m?.experience ?? null),
    benchShare: metric((tid) => hubTeams[tid]?.m?.benchShare ?? null),
    scorerCount: metric((tid) => hubTeams[tid]?.m?.scorerCount ?? null),
    coreMissedShare: metric((tid, t) => {
      if (!t.gp) return null;
      const core = coreOf(tid);
      return core.reduce((s, pid) => s + (t.gp - (t.gamesPlayedBy[pid] ?? 0)), 0) / (core.length * t.gp);
    }),
    injuredNow: metric((tid) => (injuries[tid] ?? []).filter((p) => /out/i.test(String(p.status))).length),
    startingLineups: metric((_, t) => t.starterSets.size),
    starterPlayers: metric((_, t) => t.starterPlayers.size),
    fg3Pct: metric((tid) => lts[tid]?.fg3Pct ?? null),
    efgPct: metric((tid) => lts[tid]?.efgPct ?? null),
    ftPct: metric((tid) => lts[tid]?.ftPct ?? null),
    tovPct: metric((tid) => lts[tid]?.tovPct ?? null),
    oppFg3Pct: metric((tid) => lts[tid]?.oppFg3Pct ?? null),
    opp3ExtraPtsPerGame: metric((_, t) => (t.opp3Games ? (3 * t.opp3Excess) / t.opp3Games : null)),
    clutchNet: metric((tid) => lts[tid]?.clutchNet ?? null),
    ftaDiff: metric((tid) => (lts[tid] ? (lts[tid].ftaRate ?? 0) - (lts[tid].oppFtaRate ?? 0) : null)),
    netrtg: metric((tid) => lts[tid]?.netrtg ?? null),
    cleanAdjNet: metric((tid) => (clean[tid] ? clean[tid].clean.net + (clean[tid].sosAdj ?? 0) : null)),
    pythagGap: metric((tid, t) => {
      if (!t.gp) return null;
      const exp = (t.gp * t.pf ** 14) / (t.pf ** 14 + t.pa ** 14);
      const w = standings.find((r) => r.teamId === tid)?.wins ?? 0;
      return exp - w;
    }),
    closeLossShare: metric((_, t) => (t.gp ? t.closeL / t.gp : null)),
  };

  const name = (pid: string) => {
    const r = rosterPlayer[pid];
    if (r) return `${r.firstName?.[0] ?? ""}.${r.lastName ?? pid}`;
    for (const t of targets) {
      const m = [...(moves[t]?.outgoing ?? []), ...(moves[t]?.incoming ?? [])].find((x: Any) => String(x.playerId) === pid);
      if (m) return `${m.firstName?.[0] ?? ""}.${m.lastName}`;
    }
    const h = hubPlayers.find((p) => p.playerId === pid);
    return h?.name ?? pid;
  };

  for (const tid of targets) {
    const t = acc[tid]!;
    const st = standings.find((r) => r.teamId === tid)!;
    const hub = hubTeams[tid] ?? {};
    const fr = getNbaTeamFranchiseInfo(tid);
    const cur = lts[tid] ?? {};
    const prv = ltsPrev[tid] ?? {};
    const L = (k: keyof typeof M, dir: "desc" | "asc", fmt: (v: number) => string = (v) => String(r1(v))) => {
      const v = M[k][tid];
      return `${v == null ? "-" : fmt(v)}（${rankOf(M[k], tid, dir)}・平均 ${fmt(leagueAvg(M[k]))}）`;
    };

    console.log(`\n\n################ ${tid}  ${st.wins}-${st.losses}  連敗 ${st.streak?.kind}${st.streak?.count}  ホーム ${st.home?.wins}-${st.home?.losses} / アウェー ${st.away?.wins}-${st.away?.losses}`);

    console.log("\n[日程]");
    console.log(`1 対戦相手の今の勝率の平均: ${L("oppWin", "desc", pct)} / 相手補正 sosAdj ${L("sosAdj", "desc")} / 残り日程の相手勝率 ${hub.schedule ? pct(hub.schedule.remaining) : "-"}`);
    console.log(`  .500 以上の相手: ${t.strongW}-${t.strongL}（試合割合 ${L("strongShare", "desc", pct)}）`);
    console.log(`2/6 アウェー割合: ${L("awayShare", "desc", pct)}  ホーム ${t.home} 試合 / アウェー ${t.away} 試合`);
    console.log(`3 移動距離: 合計 ${L("km", "desc", (v) => `${Math.round(v)}km`)} / 1 試合あたり ${L("kmPerGame", "desc", (v) => `${Math.round(v)}km`)}`);
    console.log(`4 B2B 2 日目: ${L("b2b", "desc")}  成績 ${hub.b2b?.wins ?? "-"}-${hub.b2b?.losses ?? "-"} / 3IN4: ${L("threeInFour", "desc")}`);
    console.log(`5 試合間の休養日の平均（4 日で打ち切り）: ${L("avgRest", "asc")}`);
    console.log(`7 .500 以上の相手との最長連戦: ${L("strongRunMax", "desc")}`);

    console.log("\n[ロスター]");
    const inc = (moves[tid]?.incoming ?? []) as Any[];
    const out = (moves[tid]?.outgoing ?? []) as Any[];
    console.log(`9/11 前季このチームにいなかった選手の出場時間割合: ${L("newMinShare", "desc", pct)}  IN ${inc.length} 人 / OUT ${out.length} 人`);
    console.log(`  IN: ${inc.map((m) => `${m.firstName?.[0]}.${m.lastName}(${m.kind})`).join(", ")}`);
    const outRanked = out
      .map((m) => ({ m, p: prior[String(m.playerId)] }))
      .sort((a, b) => (b.p?.pts ?? 0) * (b.p?.gp ?? 0) - (a.p?.pts ?? 0) * (a.p?.gp ?? 0));
    console.log(`10 OUT（前季の平均得点順）: ${outRanked.map(({ m, p }) => `${m.firstName?.[0]}.${m.lastName}[${m.kind}${m.otherTeamId ? `→${m.otherTeamId.replace("nba-", "")}` : ""}] ${p?.pts != null ? `${r1(p.pts)}pt/${r1(p.min ?? 0)}min ${p.gp}g` : "前季データなし"}`).join(" | ")}`);
    const pos = Object.entries(t.posMin);
    const posTot = pos.reduce((s, [, v]) => s + v, 0);
    console.log(`13 ポジション別の出場時間: ${pos.sort().map(([k, v]) => `${k} ${pct(v / posTot)}`).join(" / ")}`);
    console.log(`14 ドラフトから 8 年以上の選手の出場時間割合: ${L("vetMinShare", "asc", pct)}`);
    console.log(`15 経験年数（出場時間で平均・ドラフトから）: ${L("experience", "asc")}`);
    console.log(`16 新人の出場時間割合: ${L("rookieMinShare", "desc", pct)}`);
    const rookies = Object.entries(t.minutes).filter(([pid]) => isRookie(pid)).sort((a, b) => b[1] - a[1]);
    console.log(`  新人: ${rookies.map(([pid, m]) => `${name(pid)} ${r1(m / (t.gamesPlayedBy[pid] ?? 1))}min ${r1((t.pts[pid] ?? 0) / (t.gamesPlayedBy[pid] ?? 1))}pt`).join(", ") || "なし"}`);
    console.log(`17 ベンチ得点割合: ${L("benchShare", "asc", pct)} / 得点源の数: ${L("scorerCount", "asc")}`);

    console.log("\n[ケガ・コンディション]");
    const core = coreOf(tid);
    console.log(`19 主力 3 人の欠場割合: ${L("coreMissedShare", "desc", pct)}`);
    for (const pid of core) {
      const gpd = t.gamesPlayedBy[pid] ?? 0;
      const ts = t.tsAcc[pid];
      const curTs = ts && ts.fga + ts.fta > 0 ? ts.pts / (2 * (ts.fga + 0.44 * ts.fta)) : null;
      const cur3 = ts && ts.fg3a > 0 ? ts.fg3m / ts.fg3a : null;
      const p = prior[pid];
      console.log(
        `  ${name(pid)}: 出場 ${gpd}/${t.gp}  今季 ${gpd ? r1((t.pts[pid] ?? 0) / gpd) : "-"}pt・${gpd ? r1((t.minutes[pid] ?? 0) / gpd) : "-"}min・TS ${curTs != null ? pct(curTs) : "-"}・3P ${cur3 != null ? `${pct(cur3)}(${ts!.fg3m}/${ts!.fg3a})` : "-"}  ／ 前季 ${p?.pts != null ? `${r1(p.pts)}pt・${r1(p.min ?? 0)}min・TS ${p.ts != null ? pct(p.ts) : "-"}・3P ${p.fg3 != null ? pct(p.fg3) : "-"}` : "なし"}`
      );
    }
    console.log(`20 今 OUT の選手: ${L("injuredNow", "desc")}  → ${(injuries[tid] ?? []).map((p) => `${p.name}(${p.status})`).join(", ") || "なし"}`);
    const hot = hubHot.filter((p) => p.teamId === tid).map((p) => `${p.name} ${p.before}→${p.recent}`);
    const cold = hubCold.filter((p) => p.teamId === tid).map((p) => `${p.name} ${p.before}→${p.recent}`);
    console.log(`22 好調リスト: ${hot.join(", ") || "なし"} / 不調リスト: ${cold.join(", ") || "なし"}`);
    console.log(`23 3P%: ${L("fg3Pct", "asc", pct)}（前季 ${prv.fg3Pct != null ? pct(prv.fg3Pct) : "-"}） / eFG%: ${L("efgPct", "asc", pct)}（前季 ${prv.efgPct != null ? pct(prv.efgPct) : "-"}） / FT%: ${L("ftPct", "asc", pct)}（前季 ${prv.ftPct != null ? pct(prv.ftPct) : "-"}）`);

    console.log("\n[コーチ・戦術]");
    console.log(`26 HC: ${fr?.headCoach ?? "-"}（${fr?.headCoachSinceYear ?? "-"} 年就任）`);
    console.log(`30 先発 5 人の組み合わせ数: ${L("startingLineups", "desc")}（先発した選手 ${t.starterPlayers.size} 人）`);
    const roleChanges = Object.entries(t.minutes)
      .filter(([pid]) => priorFinalTeam[pid] === tid && prior[pid]?.min != null && (t.gamesPlayedBy[pid] ?? 0) >= 3)
      .map(([pid, m]) => ({ pid, now: m / t.gamesPlayedBy[pid]!, before: prior[pid]!.min! }))
      .sort((a, b) => Math.abs(b.now - b.before) - Math.abs(a.now - a.before))
      .slice(0, 4);
    console.log(`31 残留組の出場時間の変化: ${roleChanges.map((x) => `${name(x.pid)} ${r1(x.before)}→${r1(x.now)}min`).join(", ") || "-"}`);
    console.log(`28 ペース ${cur.pace ?? "-"}（前季 ${prv.pace ?? "-"}） / ORTG ${cur.ortg ?? "-"}（前季 ${prv.ortg ?? "-"}） / DRTG ${cur.drtg ?? "-"}（前季 ${prv.drtg ?? "-"}）`);

    console.log("\n[試合内容・不運]");
    console.log(`35 5 点差以内: ${t.closeW}-${t.closeL} / 6–10 点差: ${t.midW}-${t.midL} / 15 点差以上の負け ${t.blowoutL}`);
    console.log(`36 クラッチ NET: ${L("clutchNet", "asc")}`);
    console.log(`37 相手の 3P%: ${L("oppFg3Pct", "desc", pct)}（前季 ${prv.oppFg3Pct != null ? pct(prv.oppFg3Pct) : "-"}） / 相手が自分の今季 3P% より多く決めた分: ${L("opp3ExtraPtsPerGame", "desc", (v) => `${v >= 0 ? "+" : ""}${r1(v)}点/試合`)}`);
    console.log(`38 FT 試投率の差（自分 − 相手）: ${L("ftaDiff", "asc", (v) => (v >= 0 ? "+" : "") + v.toFixed(3))}`);
    console.log(`39 TOV%: ${L("tovPct", "desc", pct)}（前季 ${prv.tovPct != null ? pct(prv.tovPct) : "-"}）`);
    const expW = t.gp ? (t.gp * t.pf ** 14) / (t.pf ** 14 + t.pa ** 14) : 0;
    console.log(`40 得失点 ${r1(t.pf / t.gp)}-${r1(t.pa / t.gp)}（差 ${r1((t.pf - t.pa) / t.gp)}）→ 期待勝数 ${r1(expW)} / 実際 ${st.wins}（不運 ${L("pythagGap", "desc", (v) => `${v >= 0 ? "+" : ""}${r1(v)}勝`)}）`);
    console.log(`  NET ${L("netrtg", "asc")} / ガベージ抜き + 相手補正 NET ${L("cleanAdjNet", "asc")} / UNITERZ ユーザーの予想勝数 ${hub.picks?.expectedWins ?? "-"}`);
    const sm = t.strongMargins;
    console.log(`41 .500 以上の相手: ${t.strongW}-${t.strongL}・平均点差 ${sm.length ? r1(sm.reduce((s, v) => s + v, 0) / sm.length) : "-"}・6 点差以内の負け ${sm.filter((v) => v < 0 && v >= -6).length}`);

    console.log("\n[球団]");
    console.log(`47 フロント: ${fr?.generalManager ?? "-"}（${fr?.generalManagerSinceYear ?? "-"} 年〜） / 年俸総額 $${hub.m?.payrollM ?? "-"}M`);
    const topPicks = (rosterTeams[tid]?.players ?? []).filter((p: Any) => p.draftNumber && p.draftNumber <= 10 && p.draftYear >= startYear - 4);
    console.log(`45 直近 5 年のトップ 10 指名: ${topPicks.map((p: Any) => `${p.firstName?.[0]}.${p.lastName}(${p.draftYear}#${p.draftNumber}) ${p.mpg ?? "-"}min ${p.ppg ?? "-"}pt`).join(", ") || "なし"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
