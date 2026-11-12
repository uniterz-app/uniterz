/**
 * 予想画面 TREND の中身を `/api/nba/team-detail`（両チーム）から組み立てる。
 * 今季の成績・日程・状況別・勢い。
 */
import type { NbaTeamDetailApiPayload } from "@/lib/nba/teamDetail/loadTeamDetailBundle";
import type { NbaTeamGameLogDetailGame } from "@/lib/nba/teamGameLog/teamGameLogDetail";
import type { NbaTeamStreak } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export type NbaTrendWl = { wins: number; losses: number };

export type NbaTrendSchedule = {
  /** 前の試合からの休み日数（0 = 連戦 2 日目）。今季まだ試合なし / 試合日不明は null */
  restDays: number | null;
  threeInFour: boolean;
  /** 今季の連戦 2 日目の成績 */
  b2bRecord: NbaTrendWl;
};

export type NbaTrendSituation = {
  /** この試合の会場での成績（ホームチームはホーム、アウェーチームはアウェー） */
  venue: NbaTrendWl;
  /** 相手が勝率 5 割以上なら vs 勝ち越し、未満なら vs 負け越し。相手がまだ試合なしなら null */
  vsOpp: { over500: boolean; record: NbaTrendWl } | null;
  /** 5 点差以内 */
  close: NbaTrendWl;
};

export type NbaTrendSide = {
  /** 今季の勝敗とカンファレンス順位（順位表が無ければ null）。INFORMATION のスタッツ表で使う */
  season: { wins: number; losses: number; rank: number; conference: "east" | "west" } | null;
  schedule: NbaTrendSchedule;
  situation: NbaTrendSituation;
  streak: NbaTeamStreak | null;
  last10: NbaTrendWl | null;
};

export type NbaMatchupTrend = {
  home: NbaTrendSide;
  away: NbaTrendSide;
};

const CLOSE_MARGIN = 5;
const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const jstDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function jstDayNumber(ms: number): number {
  const [y, m, d] = jstDayFormatter.format(new Date(ms)).split("-").map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / DAY_MS);
}

/** 試合ログの `dateLabel`（日本時間の "Nov 11"）を通し日数に。9〜12 月は季の 1 年目 */
function labelDayNumber(label: string, seasonKey: string): number | null {
  const m = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(label.trim());
  const startYear = Number(seasonKey.slice(0, 4));
  if (!m || !Number.isFinite(startYear)) return null;
  const month = MONTHS.indexOf(m[1]!);
  if (month < 0) return null;
  const year = month >= 8 ? startYear : startYear + 1;
  return Math.round(Date.UTC(year, month, Number(m[2])) / DAY_MS);
}

function wl(games: NbaTeamGameLogDetailGame[]): NbaTrendWl {
  const wins = games.filter((g) => g.result === "W").length;
  return { wins, losses: games.length - wins };
}

function schedule(
  games: NbaTeamGameLogDetailGame[],
  seasonKey: string,
  tipAtMs: number | null
): NbaTrendSchedule {
  const b2bRecord = wl(games.filter((g) => g.b2b));
  if (tipAtMs == null) return { restDays: null, threeInFour: false, b2bRecord };
  const tipDay = jstDayNumber(tipAtMs);
  const prior = games
    .map((g) => labelDayNumber(g.dateLabel, seasonKey))
    .filter((d): d is number => d != null && d < tipDay)
    .sort((a, b) => b - a);
  const prev = prior[0];
  const prevPrev = prior[1];
  return {
    restDays: prev == null ? null : tipDay - prev - 1,
    threeInFour: prevPrev != null && tipDay - prevPrev <= 3,
    b2bRecord,
  };
}

function side(
  detail: NbaTeamDetailApiPayload | null,
  opp: NbaTeamDetailApiPayload | null,
  isHome: boolean,
  tipAtMs: number | null
): NbaTrendSide {
  const games = detail?.gameLogDetail?.games ?? [];
  const seasonKey = detail?.gameLogDetail?.season ?? detail?.season ?? "";
  const splits = detail?.gameLogDetail?.splits;
  const venueRow = splits?.[isHome ? "home" : "away"];
  const oppRow = opp?.standingsRow;
  const oppGames = oppRow ? oppRow.wins + oppRow.losses : 0;
  const over500 = oppRow && oppGames > 0 ? oppRow.wins / oppGames >= 0.5 : null;
  const vsRow = over500 == null ? null : splits?.[over500 ? "vsOver500" : "vsUnder500"];
  const row = detail?.standingsRow ?? null;
  return {
    season: row
      ? { wins: row.wins, losses: row.losses, rank: row.rank, conference: row.conference }
      : null,
    schedule: schedule(games, seasonKey, tipAtMs),
    situation: {
      venue: venueRow
        ? { wins: venueRow.wins, losses: venueRow.losses }
        : wl(games.filter((g) => g.home === isHome)),
      vsOpp:
        over500 == null
          ? null
          : {
              over500,
              record: vsRow ? { wins: vsRow.wins, losses: vsRow.losses } : { wins: 0, losses: 0 },
            },
      close: wl(games.filter((g) => Math.abs(g.teamScore - g.oppScore) <= CLOSE_MARGIN)),
    },
    streak: row?.streak && row.streak.count > 0 ? row.streak : null,
    last10: row ? row.last10 : games.length ? wl(games.slice(0, 10)) : null,
  };
}

export function buildMatchupTrend(input: {
  home: NbaTeamDetailApiPayload | null;
  away: NbaTeamDetailApiPayload | null;
  tipAtMs: number | null;
}): NbaMatchupTrend {
  return {
    home: side(input.home, input.away, true, input.tipAtMs),
    away: side(input.away, input.home, false, input.tipAtMs),
  };
}
