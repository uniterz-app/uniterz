/**
 * PREVIEW（文章）用のファクト: 前回の直接対決 · 対戦成績 · 両チームの前の試合。
 * Firestore の games（liveStats.box）と選手試合ログだけ。BDL なし。
 */
import { normalizeLiveGameStatsDoc, type LiveGameBoxPlayer } from "@/lib/games/liveGameStats";
import {
  teamIdFromSide,
  toMs,
} from "@/lib/nba/insights/proInsightFacts/highMinutePlayersFromLiveStats";
import type { ProInsightOutlookAnalysis } from "@/lib/nba/insights/proInsightFacts/buildOutlookAnalysis";

export type ProInsightPreviewPlayerLine = {
  name: string;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  /** "8-15" */
  fg?: string;
  fg3?: string;
};

export type ProInsightPreviewTeamLine = {
  teamId: string;
  score: number;
  top: ProInsightPreviewPlayerLine[];
  /** box がある試合だけ */
  reb?: number;
  fg3m?: number;
  tov?: number;
};

export type ProInsightPreviewStage = "regular" | "play_in" | "playoffs";

export type ProInsightPreviewMeeting = {
  gameId: string;
  seasonKey: string;
  stage: ProInsightPreviewStage;
  /** 米国東部の試合日 "2025-12-04" */
  dateEt: string;
  /** "12/4" */
  dateLabel: string;
  venueTeamId: string;
  winnerTeamId: string;
  margin: number;
  home: ProInsightPreviewTeamLine;
  away: ProInsightPreviewTeamLine;
};

export type ProInsightPreviewSeries = {
  seasonKey: string;
  stage: ProInsightPreviewStage;
  /** teamId → 勝ち数 */
  wins: Record<string, number>;
};

export type ProInsightPreviewPrevGame = {
  teamId: string;
  oppTeamId: string;
  isHome: boolean;
  result: "W" | "L";
  teamScore: number;
  oppScore: number;
  margin: number;
  dateLabel: string;
  /** 今夜までの米国東部の暦日差（1 = 前日） */
  daysBefore: number;
  top: ProInsightPreviewPlayerLine[];
  /** 36 分以上出た選手（出場時間の長い順） */
  heavyMinutes: Array<{ name: string; min: number }>;
};

export type ProInsightPreviewFacts = {
  lastMeeting: ProInsightPreviewMeeting | null;
  series: ProInsightPreviewSeries[];
  prevGames: ProInsightPreviewPrevGame[];
  /** 展望の分析材料（攻守・ポジション別失点・主力・欠場時の得点の移り方） */
  analysis?: ProInsightOutlookAnalysis | null;
};

export type PreviewGameDoc = { id: string; data: Record<string, unknown> };

/** box の無い過去季の直接対決用（選手試合ログから拾った行） */
export type PreviewMeetingPlayerLines = {
  home: ProInsightPreviewPlayerLine[];
  away: ProInsightPreviewPlayerLine[];
};

const TOP_N = 2;
const HEAVY_MIN = 36;

const ET_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function etDateKey(ms: number): string {
  return ET_DATE.format(new Date(ms));
}

function etDateLabel(ms: number): string {
  const [, m, d] = etDateKey(ms).split("-");
  return `${Number(m)}/${Number(d)}`;
}

function etDayDiff(fromMs: number, toMsValue: number): number {
  const a = Date.parse(`${etDateKey(fromMs)}T00:00:00Z`);
  const b = Date.parse(`${etDateKey(toMsValue)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function previewShortName(firstName: string, lastName: string): string {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f && l) return `${f.charAt(0)}.${l}`;
  return l || f || "Player";
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function scoresOf(data: Record<string, unknown>): { home: number; away: number } | null {
  const score = (data.score ?? {}) as Record<string, unknown>;
  const home = num(data.homeScore) ?? num(score.home);
  const away = num(data.awayScore) ?? num(score.away);
  if (home == null || away == null || (home === 0 && away === 0)) return null;
  return { home, away };
}

export function isFinalGameDoc(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? "").toLowerCase();
  return data.final === true || status === "final" || status === "ended";
}

function made(line: string | undefined): number {
  const m = /^(\d+)\s*-\s*\d+$/.exec(String(line ?? "").trim());
  return m ? Number(m[1]) : 0;
}

function lineOf(p: LiveGameBoxPlayer): ProInsightPreviewPlayerLine {
  return {
    name: previewShortName(p.firstName, p.lastName),
    min: Math.round(p.min),
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    ...(p.fg ? { fg: p.fg } : {}),
    ...(p.fg3 ? { fg3: p.fg3 } : {}),
  };
}

export function topPreviewLines(
  lines: ProInsightPreviewPlayerLine[],
  n = TOP_N
): ProInsightPreviewPlayerLine[] {
  return [...lines]
    .filter((l) => l.min > 0)
    .sort((a, b) => b.pts - a.pts || b.reb + b.ast - (a.reb + a.ast))
    .slice(0, n);
}

type BoxSides = { home: LiveGameBoxPlayer[]; away: LiveGameBoxPlayer[] } | null;

function boxOf(data: Record<string, unknown>): BoxSides {
  const live = normalizeLiveGameStatsDoc(data.liveStats);
  if (!live?.box || (live.box.home.length === 0 && live.box.away.length === 0)) return null;
  return live.box;
}

function teamLine(
  teamId: string,
  score: number,
  box: LiveGameBoxPlayer[] | null,
  fallbackTop: ProInsightPreviewPlayerLine[] | null
): ProInsightPreviewTeamLine {
  if (box && box.length > 0) {
    return {
      teamId,
      score,
      top: topPreviewLines(box.map(lineOf)),
      reb: box.reduce((s, p) => s + (p.reb || 0), 0),
      fg3m: box.reduce((s, p) => s + made(p.fg3), 0),
      tov: box.reduce((s, p) => s + (p.tov || 0), 0),
    };
  }
  return { teamId, score, top: fallbackTop ? topPreviewLines(fallbackTop) : [] };
}

function stageOf(data: Record<string, unknown>): ProInsightPreviewStage {
  const phase = String(data.seasonPhase ?? "regular").trim().toLowerCase();
  if (phase === "playoffs" || phase === "postseason") return "playoffs";
  if (phase === "play_in" || phase === "play-in") return "play_in";
  return "regular";
}

function sideIds(data: Record<string, unknown>): { homeId: string; awayId: string } {
  return {
    homeId: teamIdFromSide(data.home, data.homeTeamId),
    awayId: teamIdFromSide(data.away, data.awayTeamId),
  };
}

/** 直接対決の確定試合（古い順）。2 チームの組み合わせ・今夜より前・スコアあり */
export function finishedMeetings(
  docs: PreviewGameDoc[],
  homeTeamId: string,
  awayTeamId: string,
  beforeMs: number
): PreviewGameDoc[] {
  const pair = [homeTeamId, awayTeamId].sort().join("|");
  const seen = new Set<string>();
  return docs
    .filter((d) => {
      const tip = toMs(d.data.startAtJst);
      if (tip == null || tip >= beforeMs) return false;
      if (!isFinalGameDoc(d.data) || !scoresOf(d.data)) return false;
      const { homeId, awayId } = sideIds(d.data);
      if ([homeId, awayId].sort().join("|") !== pair) return false;
      // 同じ東部暦日の重複 doc は 1 試合
      const key = `${etDateKey(tip)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (toMs(a.data.startAtJst) ?? 0) - (toMs(b.data.startAtJst) ?? 0));
}

export function meetingNeedsPlayerLogs(doc: PreviewGameDoc | null | undefined): boolean {
  return doc != null && boxOf(doc.data) == null;
}

export function buildPreviewFacts(input: {
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  /** 直接対決の候補（今季 + 前季。順不同） */
  meetingDocs: PreviewGameDoc[];
  /** 両チームの直近試合（順不同） */
  recentDocs: PreviewGameDoc[];
  /** 前回の対戦に box が無いとき、選手試合ログから拾った行 */
  lastMeetingPlayerLines?: PreviewMeetingPlayerLines | null;
}): ProInsightPreviewFacts {
  const { homeTeamId, awayTeamId, tipAtMs } = input;
  const meetings = finishedMeetings(input.meetingDocs, homeTeamId, awayTeamId, tipAtMs);

  const seriesByKey = new Map<string, ProInsightPreviewSeries>();
  for (const m of meetings) {
    const season = String(m.data.season ?? "").trim();
    const s = scoresOf(m.data);
    if (!season || !s) continue;
    const stage = stageOf(m.data);
    const { homeId, awayId } = sideIds(m.data);
    const winner = s.home > s.away ? homeId : awayId;
    const key = `${season}|${stage}`;
    const row = seriesByKey.get(key) ?? {
      seasonKey: season,
      stage,
      wins: { [homeTeamId]: 0, [awayTeamId]: 0 },
    };
    row.wins[winner] = (row.wins[winner] ?? 0) + 1;
    seriesByKey.set(key, row);
  }
  const STAGE_ORDER: Record<ProInsightPreviewStage, number> = { regular: 0, play_in: 1, playoffs: 2 };
  const series = [...seriesByKey.values()].sort(
    (a, b) => b.seasonKey.localeCompare(a.seasonKey) || STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
  );

  let lastMeeting: ProInsightPreviewMeeting | null = null;
  const last = meetings[meetings.length - 1];
  if (last) {
    const tip = toMs(last.data.startAtJst) ?? 0;
    const s = scoresOf(last.data)!;
    const { homeId, awayId } = sideIds(last.data);
    const box = boxOf(last.data);
    const logs = box ? null : input.lastMeetingPlayerLines ?? null;
    lastMeeting = {
      gameId: last.id,
      seasonKey: String(last.data.season ?? ""),
      stage: stageOf(last.data),
      dateEt: etDateKey(tip),
      dateLabel: etDateLabel(tip),
      venueTeamId: homeId,
      winnerTeamId: s.home > s.away ? homeId : awayId,
      margin: Math.abs(s.home - s.away),
      home: teamLine(homeId, s.home, box?.home ?? null, logs?.home ?? null),
      away: teamLine(awayId, s.away, box?.away ?? null, logs?.away ?? null),
    };
  }

  const prevGames: ProInsightPreviewPrevGame[] = [];
  for (const teamId of [homeTeamId, awayTeamId]) {
    let best: { tip: number; doc: PreviewGameDoc } | null = null;
    for (const doc of input.recentDocs) {
      const tip = toMs(doc.data.startAtJst);
      if (tip == null || tip >= tipAtMs) continue;
      if (!isFinalGameDoc(doc.data) || !scoresOf(doc.data)) continue;
      const { homeId, awayId } = sideIds(doc.data);
      if (homeId !== teamId && awayId !== teamId) continue;
      if (!best || tip > best.tip) best = { tip, doc };
    }
    if (!best) continue;
    const bestTip = best.tip;
    const unplayedBetween = input.recentDocs.some((doc) => {
      const tip = toMs(doc.data.startAtJst);
      if (tip == null || tip <= bestTip || tip >= tipAtMs) return false;
      if (isFinalGameDoc(doc.data)) return false;
      const { homeId, awayId } = sideIds(doc.data);
      return homeId === teamId || awayId === teamId;
    });
    if (unplayedBetween) continue;
    const s = scoresOf(best.doc.data)!;
    const { homeId, awayId } = sideIds(best.doc.data);
    const isHome = homeId === teamId;
    const teamScore = isHome ? s.home : s.away;
    const oppScore = isHome ? s.away : s.home;
    const box = boxOf(best.doc.data);
    const players = box ? (isHome ? box.home : box.away).map(lineOf) : [];
    prevGames.push({
      teamId,
      oppTeamId: isHome ? awayId : homeId,
      isHome,
      result: teamScore > oppScore ? "W" : "L",
      teamScore,
      oppScore,
      margin: Math.abs(teamScore - oppScore),
      dateLabel: etDateLabel(best.tip),
      daysBefore: etDayDiff(best.tip, tipAtMs),
      top: topPreviewLines(players),
      heavyMinutes: players
        .filter((p) => p.min >= HEAVY_MIN)
        .sort((a, b) => b.min - a.min)
        .slice(0, 2)
        .map((p) => ({ name: p.name, min: p.min })),
    });
  }

  return { lastMeeting, series, prevGames };
}

export function hasPreviewFacts(facts: ProInsightPreviewFacts | null | undefined): boolean {
  return Boolean(facts && (facts.lastMeeting || facts.prevGames.length > 0));
}
