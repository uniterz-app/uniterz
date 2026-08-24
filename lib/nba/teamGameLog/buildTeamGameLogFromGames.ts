import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "@/lib/team-short";
import type {
  NbaTeamRecentGame,
  NbaTeamStreak,
  NbaTeamUpcomingGame,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type {
  NbaTeamGameLogSlice,
  NbaTeamGameLogWl,
  NbaTeamHeadToHeadEntry,
} from "@/lib/nba/teamGameLog/teamGameLogTypes";

const EMPTY_WL: NbaTeamGameLogWl = { wins: 0, losses: 0 };

type RawGame = Record<string, unknown> & { id?: string };

function emptySlice(teamId: string, season: string): NbaTeamGameLogSlice {
  return {
    teamId,
    season,
    seasonRecord: { ...EMPTY_WL },
    last10Record: { ...EMPTY_WL },
    streak: { kind: "W", count: 0 },
    recentGames: [],
    upcomingGames: [],
    homeAwaySplit: { home: { ...EMPTY_WL }, away: { ...EMPTY_WL } },
    conferenceSplit: { vsEast: { ...EMPTY_WL }, vsWest: { ...EMPTY_WL } },
    headToHead: [],
    finalCount: 0,
    scheduledCount: 0,
  };
}

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  if (side === "home") {
    return String(
      raw.homeTeamId ??
        (raw.home as { teamId?: unknown } | undefined)?.teamId ??
        ""
    ).trim();
  }
  return String(
    raw.awayTeamId ??
      (raw.away as { teamId?: unknown } | undefined)?.teamId ??
      ""
  ).trim();
}

function formatDateLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(ms));
}

function formatTipLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Tokyo",
  }).format(new Date(ms));
}

function addWl(target: NbaTeamGameLogWl, win: boolean): void {
  if (win) target.wins += 1;
  else target.losses += 1;
}

function buildStreak(resultsNewestFirst: Array<"W" | "L">): NbaTeamStreak {
  if (resultsNewestFirst.length === 0) return { kind: "W", count: 0 };
  const kind = resultsNewestFirst[0]!;
  let count = 0;
  for (const r of resultsNewestFirst) {
    if (r !== kind) break;
    count += 1;
  }
  return { kind, count };
}

/**
 * Firestore games 行からチーム詳細用の試合ログ／フォーム／splits を組む。
 * 試合が無ければすべて 0 / 空（モック生成しない）。
 */
export function buildTeamGameLogFromGames(input: {
  teamId: string;
  season: string;
  games: RawGame[];
  nowMs?: number;
}): NbaTeamGameLogSlice {
  const teamId = input.teamId.trim();
  const season = input.season.trim();
  if (!teamId) return emptySlice(teamId, season);

  const nowMs = input.nowMs ?? Date.now();
  const teamConf = nbaConferenceForTeam(teamId);

  type FinalRow = {
  startMs: number;
  recent: NbaTeamRecentGame;
  /** レギュラー／プレーオフ等。プレはシーズン集計・H2H・直近フォーム・連勝から除外 */
  countsForSeason: boolean;
};
  type UpcomingRow = { startMs: number; upcoming: NbaTeamUpcomingGame };

  const finals: FinalRow[] = [];
  const upcoming: UpcomingRow[] = [];

  for (const raw of input.games) {
    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    if (homeId !== teamId && awayId !== teamId) continue;

    const start = resolveGameStartAt(raw);
    if (!start) continue;
    const startMs = start.getTime();
    const home = homeId === teamId;
    const oppTeamId = home ? awayId : homeId;
    if (!oppTeamId) continue;

    const oppConf = nbaConferenceForTeam(oppTeamId);
    const conferenceGame =
      teamConf != null && oppConf != null && teamConf === oppConf;
    const oppAbbr = TEAM_SHORT[oppTeamId] ?? oppTeamId;
    const status = resolveGameStatus(raw);
    const phase = String(raw.seasonPhase ?? "").toLowerCase();
    const countsForSeason =
      phase !== "preseason" && raw.countsForRanking !== false;

    if (status === "final") {
      const score = resolveGameScore(raw);
      if (!score) continue;
      const teamScore = home ? score.home : score.away;
      const oppScore = home ? score.away : score.home;
      const result: "W" | "L" = teamScore > oppScore ? "W" : "L";
      finals.push({
        startMs,
        countsForSeason,
        recent: {
          dateLabel: formatDateLabel(startMs),
          oppTeamId,
          oppAbbr,
          home,
          teamScore,
          oppScore,
          result,
          conferenceGame,
        },
      });
      continue;
    }

    // scheduled — 終了前の予定のみ upcoming（進行中 live はログ側）
    if (status === "scheduled" && startMs >= nowMs - 3 * 60 * 60 * 1000) {
      upcoming.push({
        startMs,
        upcoming: {
          dateLabel: formatDateLabel(startMs),
          tipLabel: formatTipLabel(startMs),
          oppTeamId,
          oppAbbr,
          home,
          conferenceGame,
        },
      });
    }
  }

  finals.sort((a, b) => a.startMs - b.startMs);
  upcoming.sort((a, b) => a.startMs - b.startMs);

  const upcomingGames = upcoming.slice(0, 8).map((u) => u.upcoming);

  const seasonRecord: NbaTeamGameLogWl = { wins: 0, losses: 0 };
  const homeAwaySplit = {
    home: { wins: 0, losses: 0 },
    away: { wins: 0, losses: 0 },
  };
  const conferenceSplit = {
    vsEast: { wins: 0, losses: 0 },
    vsWest: { wins: 0, losses: 0 },
  };
  const h2hByOpp = new Map<
    string,
    { oppAbbr: string; wins: number; losses: number }
  >();

  for (const f of finals) {
    if (!f.countsForSeason) continue;
    const win = f.recent.result === "W";
    addWl(seasonRecord, win);
    addWl(f.recent.home ? homeAwaySplit.home : homeAwaySplit.away, win);
    const oppConf = nbaConferenceForTeam(f.recent.oppTeamId);
    if (oppConf === "east") addWl(conferenceSplit.vsEast, win);
    else if (oppConf === "west") addWl(conferenceSplit.vsWest, win);

    const oppId = f.recent.oppTeamId;
    const bucket = h2hByOpp.get(oppId) ?? {
      oppAbbr: f.recent.oppAbbr,
      wins: 0,
      losses: 0,
    };
    if (win) bucket.wins += 1;
    else bucket.losses += 1;
    h2hByOpp.set(oppId, bucket);
  }

  const headToHead: NbaTeamHeadToHeadEntry[] = [...h2hByOpp.entries()]
    .map(([oppTeamId, wl]) => ({
      oppTeamId,
      oppAbbr: wl.oppAbbr,
      wins: wl.wins,
      losses: wl.losses,
    }))
    .sort(
      (a, b) =>
        b.wins + b.losses - (a.wins + a.losses) ||
        a.oppAbbr.localeCompare(b.oppAbbr)
    );

  const seasonFinals = finals.filter((f) => f.countsForSeason);
  const last10 = seasonFinals.slice(-10);
  const last10Record: NbaTeamGameLogWl = { wins: 0, losses: 0 };
  for (const f of last10) addWl(last10Record, f.recent.result === "W");

  // 直近フォーム・連勝もプレ除外（シーズン集計・H2H・L10 と同じ母集団）
  const resultsNewestFirst = [...seasonFinals]
    .reverse()
    .map((f) => f.recent.result);
  const streak = buildStreak(resultsNewestFirst);
  const recentGames = [...seasonFinals]
    .reverse()
    .slice(0, 10)
    .map((f) => f.recent);

  return {
    teamId,
    season,
    seasonRecord,
    last10Record,
    streak,
    recentGames,
    upcomingGames,
    homeAwaySplit,
    conferenceSplit,
    headToHead,
    /** シーズン対象の final 数（プレ除外）。overlay の W–L 適用判定に使う */
    finalCount: seasonFinals.length,
    scheduledCount: upcomingGames.length,
  };
}

export function emptyTeamGameLog(
  teamId: string,
  season: string
): NbaTeamGameLogSlice {
  return emptySlice(teamId, season);
}
