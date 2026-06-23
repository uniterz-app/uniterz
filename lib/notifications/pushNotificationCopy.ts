import type { PushNotificationType } from "./pushPayloadTypes";
import {
  formatPushMatchupLabel,
  resolvePushTeamId,
  type PushLanguage,
  type PushMatchupInput,
} from "./pushMatchupLabel";

export type { PushLanguage };

export type GameMatchupCopyInput = PushMatchupInput;

export function buildPushNotificationCopy(
  type: PushNotificationType,
  language: PushLanguage,
  input?: GameMatchupCopyInput
): { title: string; body: string; subtitle?: string } {
  const matchup = input ? formatPushMatchupLabel(input, language) : "";

  if (language === "en") {
    switch (type) {
      case "game_start":
        return {
          title: "Your predicted match starts soon.",
          body: matchup || "Check the match in the app.",
        };
      case "game_final":
        return {
          title: "Result confirmed.",
          body: matchup || "See your result in the app.",
        };
      case "ranking_updated":
        return {
          title: "Rankings updated",
          body: "Today's cumulative rankings have been updated.",
        };
    }
  }

  switch (type) {
    case "game_start":
      return {
        title: "あなたの予想試合がまもなく開始します。",
        body: matchup || "アプリで試合を確認してください。",
      };
    case "game_final":
      return {
        title: "結果が確定しました。",
        body: matchup || "アプリで結果を確認してください。",
      };
    case "ranking_updated":
      return {
        title: "ランキング更新",
        body: "本日の累積ランキングが更新されました。",
      };
  }
}

export function normalizePushLanguage(raw: unknown): PushLanguage {
  return raw === "en" ? "en" : "ja";
}

export function resolveTeamLabel(side: unknown): string {
  if (typeof side === "string") return side.trim();
  if (side && typeof side === "object") {
    const name = (side as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
    const teamId = (side as { teamId?: unknown }).teamId;
    if (typeof teamId === "string" && teamId.trim()) return teamId.trim();
  }
  return "?";
}

export function resolveGameMatchupCopy(
  gameData: Record<string, unknown> | undefined,
  scores?: { home: number; away: number }
): GameMatchupCopyInput {
  return {
    homeLabel: resolveTeamLabel(gameData?.home),
    awayLabel: resolveTeamLabel(gameData?.away),
    homeTeamId: resolvePushTeamId(gameData?.home),
    awayTeamId: resolvePushTeamId(gameData?.away),
    homeScore: scores?.home,
    awayScore: scores?.away,
  };
}
