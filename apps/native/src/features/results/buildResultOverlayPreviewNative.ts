/**
 * リザルト詳細オーバーレイ用: Web `buildMatchCardPropsForResultPost` + MatchCard 相当のプレビュー生成。
 */
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
  resolveGameTeamName,
} from "@uniterz/shared";
import { splitTeamNameByLeague, getTeamAlias } from "../../utils/teamName";
import type { GameCardCenterBlock } from "../games/gameCardCenterTypes";
import { buildPredictModalMergedFinalPreview } from "../games/buildPredictModalMergedFinal";
import type {
  PredictModalMatchPreview,
  PredictOverlayMarketBarProps,
} from "../games/PredictModal";
import type { PredictModalMergedFinalPreview } from "../games/buildPredictModalMergedFinal";
import { resolveTeamJerseyPalette } from "../games/teamColors";
import {
  resolveNativeSeriesLabel,
  resolveNativeSeriesPair,
} from "../games/resolveNativeSeriesStanding";
import type { NativeGameRow, SupportedLeague } from "../games/useTodayGames";
import type { ResultDetailPost } from "./loadResultPostDetailNative";
import type { GamesLanguage } from "../games/gamesI18n";

function toSupportedLeague(raw: unknown): SupportedLeague {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "pl" || v.includes("premier") || v.includes("epl")) return "pl";
  if (v === "wc" || v.includes("world")) return "wc";
  return "nba";
}

function toCompactTeamName(leagueRaw: unknown, rawName: string): string {
  const league = String(leagueRaw ?? "").toLowerCase();
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const toUnifiedLabel = (value: string) => normalize(value).toLocaleUpperCase("en-US");
  if (league === "pl") return toUnifiedLabel(getTeamAlias(rawName) ?? rawName);
  if (league === "nba") {
    const normalized = normalize(rawName);
    const nbaLabel = normalized.split(" ").filter(Boolean).slice(-1)[0] ?? normalized;
    return toUnifiedLabel(nbaLabel);
  }
  if (league === "bj" || league === "j1") {
    const [line1, line2] = splitTeamNameByLeague(
      league as "nba" | "bj" | "j1",
      rawName
    );
    return toUnifiedLabel(`${line1} ${line2}`.trim());
  }
  return toUnifiedLabel(rawName);
}

function formatKickoffTime(startAt: Date | null, language: GamesLanguage): string {
  if (!startAt) return "--:--";
  const timeZone = language === "en" ? "America/New_York" : "Asia/Tokyo";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(startAt);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function resolveFinalMetaOt(raw: Record<string, unknown>): boolean {
  const fm = raw.finalMeta as { ot?: boolean } | undefined;
  return Boolean(fm?.ot);
}

function isEffectiveLive(game: Record<string, unknown>): boolean {
  const status = resolveGameStatus(game);
  if (status === "live") return true;
  if (status !== "scheduled") return false;
  const startAt = resolveGameStartAt(game);
  return startAt != null && Date.now() >= startAt.getTime();
}

function getGameCardCenterBlock(
  game: Record<string, unknown>,
  language: GamesLanguage
): GameCardCenterBlock {
  const status = resolveGameStatus(game);
  const score = resolveGameScore(game);
  const startAt = resolveGameStartAt(game);
  const liveUi = isEffectiveLive(game);
  if (status === "final" && score) {
    const ot = resolveFinalMetaOt(game);
    const sub = `${language === "en" ? "Final" : "試合終了"}${ot ? " (OT)" : ""}`;
    return { variant: "score", home: score.home, away: score.away, subLine: sub };
  }
  if (liveUi) {
    return { variant: "liveMark" };
  }
  return {
    variant: "time",
    time: formatKickoffTime(startAt, language),
  };
}

export function buildResultOverlayMatchPreview(
  post: ResultDetailPost,
  game: Record<string, unknown>,
  language: GamesLanguage
): PredictModalMatchPreview {
  const row = { ...game, id: String(game.id ?? post.gameId ?? "") } as NativeGameRow;
  const peerGames = [row];
  const homeName = resolveGameTeamName(game.home, game.homeTeamName, "HOME");
  const awayName = resolveGameTeamName(game.away, game.awayTeamName, "AWAY");
  const roundLabelRaw = game.roundLabel;
  const roundLabel =
    typeof roundLabelRaw === "string" && roundLabelRaw.trim()
      ? roundLabelRaw.trim()
      : null;
  return {
    roundLabel,
    homeCompact: toCompactTeamName(game.league, homeName),
    awayCompact: toCompactTeamName(game.league, awayName),
    homeRecord: null,
    awayRecord: null,
    centerBlock: getGameCardCenterBlock(game, language),
    seriesLabel: resolveNativeSeriesLabel(game, peerGames),
    seriesPair: resolveNativeSeriesPair(game, peerGames),
    homePalette: resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a"),
    awayPalette: resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff"),
    leagueRaw: game.league,
    homeSide: game.home,
    awaySide: game.away,
  };
}

export function buildResultOverlayMarketBar(
  post: ResultDetailPost,
  game: Record<string, unknown>,
  language: GamesLanguage
): PredictOverlayMarketBarProps | null {
  const gameId = String(game.id ?? post.gameId ?? "");
  if (!gameId) return null;
  const league = toSupportedLeague(game.league);
  const homeName = resolveGameTeamName(game.home, game.homeTeamName, "HOME");
  const awayName = resolveGameTeamName(game.away, game.awayTeamName, "AWAY");
  const pred = post.prediction as { winner?: "home" | "away" | "draw" } | undefined;
  const homePalette = resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a");
  const awayPalette = resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff");
  const marketBias = game.marketBias as { homePct?: number; awayPct?: number } | undefined;
  return {
    gameId,
    league,
    status: resolveGameStatus(game),
    score: resolveGameScore(game),
    fallbackMarketBias:
      marketBias?.homePct != null && marketBias?.awayPct != null
        ? { homePct: marketBias.homePct, awayPct: marketBias.awayPct }
        : null,
    homeColor: homePalette.primary,
    awayColor: awayPalette.primary,
    homeLabel: toCompactTeamName(game.league, homeName),
    awayLabel: toCompactTeamName(game.league, awayName),
    compact: league === "wc",
    userPredictionWinner: pred?.winner ?? null,
  };
}

export function buildResultOverlayMergedFinal(
  post: ResultDetailPost,
  game: Record<string, unknown>,
  language: GamesLanguage
): PredictModalMergedFinalPreview | null {
  if (resolveGameStatus(game) !== "final") return null;
  const finalScore = resolveGameScore(game);
  if (!finalScore) return null;
  const pred = post.prediction as
    | {
        score?: { home?: number; away?: number };
        goalScorer?: unknown;
      }
    | undefined;
  const predictedScore = pred?.score;
  if (
    predictedScore?.home == null ||
    predictedScore?.away == null ||
    !Number.isFinite(predictedScore.home) ||
    !Number.isFinite(predictedScore.away)
  ) {
    return null;
  }
  const homeSide = game.home as { teamId?: string } | undefined;
  const awaySide = game.away as { teamId?: string } | undefined;
  return buildPredictModalMergedFinalPreview({
    league: toSupportedLeague(game.league),
    language,
    finalScore,
    predictedScore: {
      home: predictedScore.home,
      away: predictedScore.away,
    },
    stats: (post.stats as Record<string, unknown> | undefined) ?? null,
    goalScorer: pred?.goalScorer,
    homeTeamId: homeSide?.teamId,
    awayTeamId: awaySide?.teamId,
    finalOt: resolveFinalMetaOt(game),
  });
}

export function resolveResultOverlayLeague(
  game: Record<string, unknown> | null
): SupportedLeague {
  if (!game) return "nba";
  return toSupportedLeague(game.league);
}
