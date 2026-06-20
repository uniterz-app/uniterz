export type PushNotificationType =
  | "game_start"
  | "game_final"
  | "ranking_updated";

export type PushNotificationData = {
  type: PushNotificationType;
  gameId?: string;
  postId?: string;
};

export type PushLanguage = "ja" | "en";

export type GameMatchupCopyInput = {
  homeLabel: string;
  awayLabel: string;
  homeScore?: number;
  awayScore?: number;
};

function matchupLabel(input: GameMatchupCopyInput): string {
  const home = input.homeLabel.trim() || "?";
  const away = input.awayLabel.trim() || "?";
  if (
    typeof input.homeScore === "number" &&
    typeof input.awayScore === "number"
  ) {
    return `${home} ${input.homeScore}-${input.awayScore} ${away}`;
  }
  return `${home} vs ${away}`;
}

export function buildPushNotificationCopy(
  type: PushNotificationType,
  language: PushLanguage,
  input?: GameMatchupCopyInput
): { title: string; body: string } {
  const matchup = input ? matchupLabel(input) : "";

  if (language === "en") {
    switch (type) {
      case "game_start":
        return {
          title: "Kickoff soon",
          body: matchup
            ? `Your predicted match starts soon: ${matchup}`
            : "Your predicted match starts soon.",
        };
      case "game_final":
        return {
          title: "Final score",
          body: matchup
            ? `Result confirmed: ${matchup}`
            : "Your predicted match result is confirmed.",
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
        title: "まもなくキックオフ",
        body: matchup
          ? `あなたの予想試合がまもなく開始します: ${matchup}`
          : "あなたの予想試合がまもなく開始します。",
      };
    case "game_final":
      return {
        title: "試合結果確定",
        body: matchup
          ? `結果が確定しました: ${matchup}`
          : "予想した試合の結果が確定しました。",
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
    homeScore: scores?.home,
    awayScore: scores?.away,
  };
}
