import { Platform } from "react-native";
import { getTeamAlias } from "../../../../../lib/team-alias";
import { splitTeamNameByLeague } from "../../../../../lib/team-name-split";
import {
  resolveGameLiveMeta,
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "@uniterz/shared";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import type { SupportedLeague } from "./useTodayGames";

export const LEAGUE_LINE_COLOR: Record<SupportedLeague, string> = {
  nba: "#60a5fa",
  wc: "#f59e0b",
  bj: "#eab308",
  j1: "#22c55e",
  pl: "#a855f7",
};

export const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

export const NUMERIC_FONT_FAMILY = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

function formatKickoffTime(startAt: Date | null, language: "ja" | "en"): string {
  if (!startAt) return "—";
  const parts = new Intl.DateTimeFormat(language === "en" ? "en-US" : "ja-JP", {
    timeZone: "Asia/Tokyo",
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

export function isEffectiveLive(game: Record<string, unknown>): boolean {
  const status = resolveGameStatus(game);
  if (status === "live") return true;
  if (status !== "scheduled") return false;
  const startAt = resolveGameStartAt(game);
  return startAt != null && Date.now() >= startAt.getTime();
}

export function getGameCardCenterBlock(
  game: Record<string, unknown>,
  language: "ja" | "en"
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
  if (liveUi && score) {
    const meta = resolveGameLiveMeta(game);
    const subLine =
      meta?.period || meta?.runningTime
        ? `${meta?.period ?? ""}${meta?.runningTime ? ` ${meta.runningTime}` : ""}`.trim()
        : null;
    return {
      variant: "liveScore",
      home: score.home,
      away: score.away,
      subLine: subLine || null,
    };
  }
  if (liveUi) {
    return { variant: "liveMark" };
  }
  return {
    variant: "time",
    time: formatKickoffTime(startAt, language),
  };
}

export function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1" || league === "wc";
}

export function toCompactTeamName(leagueRaw: unknown, rawName: string): string {
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

export function resolveLeagueColor(leagueRaw: unknown): string {
  const league = String(leagueRaw ?? "").toLowerCase() as SupportedLeague;
  if (league in LEAGUE_LINE_COLOR) {
    return LEAGUE_LINE_COLOR[league];
  }
  return "#60a5fa";
}

export function isGameStarted(game: Record<string, unknown>): boolean {
  const st = resolveGameStatus(game);
  return st === "live" || st === "final" || isEffectiveLive(game);
}
