import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "@uniterz/shared";

export type PeerH2hLine = {
  id: string;
  startMs: number;
  leftTeamId: string | null;
  rightTeamId: string | null;
  leftTeamDisplay: string;
  rightTeamDisplay: string;
  homeTeamSide?: "left" | "right";
  leftScore: number;
  rightScore: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  seriesGameLabel?: string;
  wentToOvertime?: boolean;
  overtimePeriods?: number;
  injuriesLeft: string[];
  injuriesRight: string[];
  injuriesHome: string[];
  injuriesAway: string[];
  summaryJa?: string | null;
  summaryEn?: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function pickFirstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function resolveSideName(side: unknown, fallback: string): string {
  if (typeof (side as { name?: unknown })?.name === "string") {
    const n = String((side as { name: string }).name).trim();
    if (n) return n;
  }
  if (typeof side === "string" && side.trim()) return side.trim();
  return fallback;
}

function resolveInjuries(
  raw: Record<string, unknown>
): { home: string[]; away: string[] } {
  const injuriesObj = raw.injuries as
    | { home?: unknown; away?: unknown; left?: unknown; right?: unknown }
    | undefined;
  const inactiveObj = raw.inactives as
    | { home?: unknown; away?: unknown; left?: unknown; right?: unknown }
    | undefined;
  const home = asStringArray(
    (raw.injuriesHome as unknown) ??
      injuriesObj?.home ??
      injuriesObj?.left ??
      inactiveObj?.home ??
      inactiveObj?.left
  );
  const away = asStringArray(
    (raw.injuriesAway as unknown) ??
      injuriesObj?.away ??
      injuriesObj?.right ??
      inactiveObj?.away ??
      inactiveObj?.right
  );
  return { home, away };
}

function resolveSummary(raw: Record<string, unknown>): {
  ja: string | null;
  en: string | null;
} {
  const inactiveFooterSummary = raw.inactiveFooterSummary as
    | { ja?: unknown; en?: unknown }
    | undefined;
  const gameSummary = raw.gameSummary as { ja?: unknown; en?: unknown } | undefined;
  const summary = raw.summary as { ja?: unknown; en?: unknown } | undefined;
  const ja = pickFirstString(
    inactiveFooterSummary?.ja,
    gameSummary?.ja,
    summary?.ja,
    raw.summaryJa
  );
  const en = pickFirstString(
    inactiveFooterSummary?.en,
    gameSummary?.en,
    summary?.en,
    raw.summaryEn
  );
  return { ja, en };
}

function sameLeagueAndMatchup(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (String(a.league ?? "") !== String(b.league ?? "")) return false;
  const ha = rawTeamIdFromGameSide(a.home);
  const aa = rawTeamIdFromGameSide(a.away);
  const hb = rawTeamIdFromGameSide(b.home);
  const ab = rawTeamIdFromGameSide(b.away);
  if (!ha || !aa || !hb || !ab) return false;
  const setA = new Set([ha, aa]);
  return setA.has(hb) && setA.has(ab);
}

/**
 * `peerGames` から同一リーグ・同一二チームの終了試合を日付順（古い→新）で切り出す。
 * 日付周辺のクエリ枠内に収まる対戦履歴用（`resolveNbaH2HPack` の正規 H2H とは一致しない場合あり）。
 */
export function listFinalH2hGamesFromPeers(
  subject: Record<string, unknown>,
  peerGames: ReadonlyArray<Record<string, unknown>>,
  maxRows = 12
): PeerH2hLine[] {
  const out: PeerH2hLine[] = [];
  for (const p of peerGames) {
    const raw = p as Record<string, unknown>;
    if (!sameLeagueAndMatchup(subject, raw)) continue;
    if (resolveGameStatus(raw) !== "final") continue;
    const sc = resolveGameScore(raw);
    if (!sc) continue;
    const d = resolveGameStartAt(raw);
    const injuries = resolveInjuries(raw);
    const summary = resolveSummary(raw);
    const leftTeamId = rawTeamIdFromGameSide(raw.home);
    const rightTeamId = rawTeamIdFromGameSide(raw.away);
    out.push({
      id: String(raw.id ?? ""),
      startMs: d ? +d : 0,
      leftTeamId,
      rightTeamId,
      leftTeamDisplay: resolveSideName(raw.home, "HOME"),
      rightTeamDisplay: resolveSideName(raw.away, "AWAY"),
      homeTeamSide: "left",
      homeTeamId: leftTeamId,
      awayTeamId: rightTeamId,
      leftScore: sc.home,
      rightScore: sc.away,
      homeScore: sc.home,
      awayScore: sc.away,
      seriesGameLabel:
        pickFirstString(raw.seriesGameLabel, raw.playoffGameLabel, raw.gameLabel) ?? undefined,
      injuriesLeft: injuries.home,
      injuriesRight: injuries.away,
      injuriesHome: injuries.home,
      injuriesAway: injuries.away,
      summaryJa: summary.ja,
      summaryEn: summary.en,
    });
  }
  out.sort((a, b) => a.startMs - b.startMs);
  if (out.length > maxRows) {
    return out.slice(out.length - maxRows);
  }
  return out;
}
