import type { PeerH2hLine } from "./peerH2hGames";
import { shouldFlipH2hToMatchHomeAway } from "../../../../../lib/data/nba/h2h/h2hAlignSides";
import {
  resolveNbaH2HPack,
  type NbaH2HPack,
} from "../../../../../lib/data/nba/h2h/resolveNbaH2HPack";

type NbaPackGame = {
  id: string;
  dateEt: string;
  dateJst: string;
  leftTeamDisplay: string;
  rightTeamDisplay: string;
  scoreLeft: number | null;
  scoreRight: number | null;
  injuriesLeft: string[];
  injuriesRight: string[];
  seriesGameLabel?: string;
  wentToOvertime?: boolean;
  overtimePeriods?: number;
  inactiveFooterSummary?: { ja: string; en: string };
};

function resolveHomeTeamSide(game: NbaPackGame): "left" | "right" | undefined {
  const side = (game as NbaPackGame & { homeTeamSide?: unknown }).homeTeamSide;
  if (side === "left" || side === "right") return side;
  return undefined;
}

type NbaPack = {
  games: NbaPackGame[];
} | null;

type ResolvePack = (
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  homeName: string | undefined,
  awayName: string | undefined
) => NbaPack;

const resolvePackUnsafe: ResolvePack = resolveNbaH2HPack as ResolvePack;

/** Web `PredictionFormV2` → `h2hAverages` と同一（静的 pack の事前計算値） */
export function resolveStaticNbaH2hAverages(
  homeTeamId: string | null,
  awayTeamId: string | null,
  homeName: string | undefined,
  awayName: string | undefined
): NbaH2HPack["h2hAverages"] | null {
  const pack = resolveNbaH2HPack(
    homeTeamId ?? undefined,
    awayTeamId ?? undefined,
    homeName,
    awayName
  );
  return pack?.h2hAverages ?? null;
}

function parseJstYmdToMs(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd ?? "").trim());
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return 0;
  return Date.UTC(y, mo - 1, d, 0, 0, 0);
}

export function resolveStaticNbaH2hRows(
  homeTeamId: string | null,
  awayTeamId: string | null,
  homeName: string | undefined,
  awayName: string | undefined
): PeerH2hLine[] {
  const pack = resolvePackUnsafe(homeTeamId, awayTeamId, homeName, awayName);
  if (!pack?.games?.length) return [];
  const first = pack.games[0];
  const flip = first
    ? shouldFlipH2hToMatchHomeAway({
        leftTeamDisplay: first.leftTeamDisplay,
        rightTeamDisplay: first.rightTeamDisplay,
        homeTeamName: homeName,
        awayTeamName: awayName,
      })
    : false;
  return pack.games
    .map((g): PeerH2hLine | null => {
      const l = g.scoreLeft;
      const r = g.scoreRight;
      if (l == null || r == null) return null;
      const startMs = parseJstYmdToMs(g.dateJst);
      if (!flip) {
        const homeTeamSide = resolveHomeTeamSide(g);
        const rowHomeTeamId =
          homeTeamSide === "right" ? awayTeamId : homeTeamId;
        const rowAwayTeamId = rowHomeTeamId === homeTeamId ? awayTeamId : homeTeamId;
        const rowHomeScore = rowHomeTeamId === homeTeamId ? l : r;
        const rowAwayScore = rowAwayTeamId === awayTeamId ? r : l;
        return {
          id: g.id,
          startMs,
          leftTeamId: homeTeamId,
          rightTeamId: awayTeamId,
          leftTeamDisplay: g.leftTeamDisplay,
          rightTeamDisplay: g.rightTeamDisplay,
          homeTeamSide,
          leftScore: l,
          rightScore: r,
          homeTeamId: rowHomeTeamId,
          awayTeamId: rowAwayTeamId,
          homeScore: rowHomeScore,
          awayScore: rowAwayScore,
          seriesGameLabel: g.seriesGameLabel,
          wentToOvertime: g.wentToOvertime === true,
          overtimePeriods: g.overtimePeriods,
          injuriesLeft: Array.isArray(g.injuriesLeft) ? g.injuriesLeft : [],
          injuriesRight: Array.isArray(g.injuriesRight) ? g.injuriesRight : [],
          injuriesHome: Array.isArray(g.injuriesLeft) ? g.injuriesLeft : [],
          injuriesAway: Array.isArray(g.injuriesRight) ? g.injuriesRight : [],
          summaryJa: g.inactiveFooterSummary?.ja ?? null,
          summaryEn: g.inactiveFooterSummary?.en ?? null,
        };
      }
      return {
        id: g.id,
        startMs,
        leftTeamId: awayTeamId,
        rightTeamId: homeTeamId,
        leftTeamDisplay: g.rightTeamDisplay,
        rightTeamDisplay: g.leftTeamDisplay,
        homeTeamSide:
          resolveHomeTeamSide(g) === "left"
            ? "right"
            : resolveHomeTeamSide(g) === "right"
              ? "left"
              : undefined,
        leftScore: r,
        rightScore: l,
        homeTeamId,
        awayTeamId,
        homeScore: r,
        awayScore: l,
        seriesGameLabel: g.seriesGameLabel,
        wentToOvertime: g.wentToOvertime === true,
        overtimePeriods: g.overtimePeriods,
        injuriesLeft: Array.isArray(g.injuriesRight) ? g.injuriesRight : [],
        injuriesRight: Array.isArray(g.injuriesLeft) ? g.injuriesLeft : [],
        injuriesHome: Array.isArray(g.injuriesRight) ? g.injuriesRight : [],
        injuriesAway: Array.isArray(g.injuriesLeft) ? g.injuriesLeft : [],
        summaryJa: g.inactiveFooterSummary?.ja ?? null,
        summaryEn: g.inactiveFooterSummary?.en ?? null,
      };
    })
    .filter((v): v is PeerH2hLine => Boolean(v))
    .sort((a, b) => a.startMs - b.startMs);
}

