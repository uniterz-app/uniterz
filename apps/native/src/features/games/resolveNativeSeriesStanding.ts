/**
 * ネイティブ試合カード用: Web `toMatchCardProps` と同系のシリーズ勝敗（プレーオフのみ）。
 * `lib/games/transform` は @/ 依存があるためここに最小実装を置く。
 */
import { normalizeLeague } from "../../../../../lib/leagues";
import {
  isPlayoffStyleGameCard,
  parseSeriesStandingFromRaw,
  type SeriesStanding,
} from "../../../../../lib/games/playoffSeriesUi";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../shared/gameRow";

const SERIES_WIN_CAP = 4;

const PLAYOFF_SERIES_STANDING_FALLBACK: SeriesStanding = { homeWins: 0, awayWins: 0 };

/** 生の `home` / `away` から teamId（Firestore `teams` の id） */
export function rawTeamIdFromGameSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  if (typeof id === "string" && id.trim() !== "") return id.trim();
  return null;
}

function seasonKeyFromRaw(raw: Record<string, unknown>): string {
  const s = raw.season;
  return s == null ? "" : String(s);
}

function normalizeSeasonPhase(
  raw: unknown
): "regular" | "play_in" | "playoffs" | null {
  if (raw === "regular" || raw === "play_in" || raw === "playoffs") {
    return raw;
  }
  return null;
}

function isSamePlayoffSeriesMatchup(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (normalizeLeague(a.league) !== normalizeLeague(b.league)) {
    return false;
  }
  if (seasonKeyFromRaw(a) !== seasonKeyFromRaw(b)) return false;

  const phaseA = normalizeSeasonPhase(a.seasonPhase);
  const phaseB = normalizeSeasonPhase(b.seasonPhase);
  const roundA = String(a.roundLabel ?? "");
  const roundB = String(b.roundLabel ?? "");
  if (!isPlayoffStyleGameCard(phaseA, roundA)) return false;
  if (!isPlayoffStyleGameCard(phaseB, roundB)) return false;

  const ha = rawTeamIdFromGameSide(a.home);
  const aa = rawTeamIdFromGameSide(a.away);
  const hb = rawTeamIdFromGameSide(b.home);
  const ab = rawTeamIdFromGameSide(b.away);
  if (!ha || !aa || !hb || !ab) return false;

  const setA = new Set([ha, aa]);
  return setA.has(hb) && setA.has(ab);
}

function inferPlayoffSeriesStandingFromPeers(
  subject: Record<string, unknown>,
  peerGames: ReadonlyArray<Record<string, unknown>>
): SeriesStanding | null {
  const cardHomeId = rawTeamIdFromGameSide(subject.home);
  const cardAwayId = rawTeamIdFromGameSide(subject.away);
  if (!cardHomeId || !cardAwayId) return null;

  const roundLabelStr = String(subject.roundLabel ?? "");
  const phase = normalizeSeasonPhase(subject.seasonPhase);
  if (!isPlayoffStyleGameCard(phase, roundLabelStr)) return null;

  const seenIds = new Set<string>();
  const candidates: Record<string, unknown>[] = [];

  for (const p of peerGames) {
    const raw = p as Record<string, unknown>;
    const gid = String(raw.id ?? "");
    if (gid && seenIds.has(gid)) continue;
    if (gid) seenIds.add(gid);
    if (!isSamePlayoffSeriesMatchup(subject, raw)) continue;
    candidates.push(raw);
  }

  if (candidates.length === 0) return null;

  type Row = { startMs: number; raw: Record<string, unknown> };
  const rows: Row[] = [];
  for (const raw of candidates) {
    const d = resolveGameStartAt(raw);
    const startMs = d ? +d : 0;
    rows.push({ startMs, raw });
  }
  rows.sort((x, y) => x.startMs - y.startMs);

  let homeWins = 0;
  let awayWins = 0;

  for (const { raw } of rows) {
    if (homeWins >= SERIES_WIN_CAP || awayWins >= SERIES_WIN_CAP) break;
    if (resolveGameStatus(raw) !== "final") continue;
    const sc = resolveGameScore(raw);
    if (!sc || sc.home === sc.away) continue;

    const gh = rawTeamIdFromGameSide(raw.home);
    const ga = rawTeamIdFromGameSide(raw.away);
    if (!gh || !ga) continue;

    const homeSideWon = sc.home > sc.away;
    const winnerId = homeSideWon ? gh : ga;

    if (winnerId === cardHomeId) homeWins += 1;
    else if (winnerId === cardAwayId) awayWins += 1;
  }

  return { homeWins, awayWins };
}

function seriesGamesPlayed(s: SeriesStanding): number {
  return s.homeWins + s.awayWins;
}

/** プレーオフ試合のみシリーズ表記。それ以外は null */
export function resolveNativeSeriesPair(
  game: Record<string, unknown>,
  peerGames: ReadonlyArray<Record<string, unknown>>
): { home: number; away: number } | null {
  const roundLabelStr = String(game.roundLabel ?? "");
  const phase = normalizeSeasonPhase(game.seasonPhase);
  if (!isPlayoffStyleGameCard(phase, roundLabelStr)) return null;

  const parsed = parseSeriesStandingFromRaw(game);
  const inferred =
    peerGames.length > 0 ? inferPlayoffSeriesStandingFromPeers(game, peerGames) : null;

  let standing: SeriesStanding | null = null;
  if (inferred != null) {
    if (!parsed || seriesGamesPlayed(inferred) > seriesGamesPlayed(parsed)) {
      standing = inferred;
    } else {
      standing = parsed;
    }
  } else if (parsed) {
    standing = parsed;
  } else {
    standing = { ...PLAYOFF_SERIES_STANDING_FALLBACK };
  }

  return { home: standing.homeWins, away: standing.awayWins };
}

export function resolveNativeSeriesLabel(
  game: Record<string, unknown>,
  peerGames: ReadonlyArray<Record<string, unknown>>
): string | null {
  const p = resolveNativeSeriesPair(game, peerGames);
  if (!p) return null;
  return `(${p.home} - ${p.away})`;
}
