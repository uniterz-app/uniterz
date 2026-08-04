import {
  formatPushMatchupLabel,
  resolvePushTeamId,
  type PushMatchupInput,
} from "./pushMatchupLabel";

export type PushNotificationType =
  | "game_start"
  | "game_final"
  | "ranking_updated"
  | "injury_status"
  | "starter_change"
  | "prediction_deadline"
  | "pregame_digest"
  | "pro_insight_update"
  | "monthly_report";

export type PushNotificationData = {
  type: PushNotificationType;
  gameId?: string;
  postId?: string;
  monthKey?: string;
};

export type PushLanguage = "ja" | "en";

export type GameMatchupCopyInput = Partial<PushMatchupInput> & {
  detail?: string;
};

export function buildPushNotificationCopy(
  type: PushNotificationType,
  language: PushLanguage,
  input?: GameMatchupCopyInput
): { title: string; body: string; subtitle?: string } {
  const hasMatchup =
    typeof input?.homeLabel === "string" && typeof input?.awayLabel === "string";
  const matchup = hasMatchup
    ? formatPushMatchupLabel(
        {
          homeLabel: input.homeLabel!,
          awayLabel: input.awayLabel!,
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
        },
        language
      )
    : "";
  const detail = input?.detail?.trim() || "";

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
      case "injury_status":
        return {
          title: "Player availability updated",
          body:
            detail ||
            (matchup
              ? `${matchup} — review your prediction.`
              : "A key player's status changed. Review your prediction."),
        };
      case "starter_change":
        return {
          title: "Important lineup change",
          body:
            detail ||
            (matchup
              ? `${matchup} — check the starting lineup.`
              : "A high-impact starter change. Review your prediction."),
        };
      case "prediction_deadline":
        return {
          title: "Prediction deadline soon",
          body:
            matchup ||
            "You haven't predicted this match yet. Submit before tip-off.",
        };
      case "pregame_digest":
        return {
          title: "Pregame updates",
          body:
            detail ||
            (matchup
              ? `${matchup} — several updates. Re-check your prediction.`
              : "Several pregame updates. Re-check your prediction."),
        };
      case "pro_insight_update":
        return {
          title: "PRO INSIGHT updated",
          body:
            detail ||
            (matchup
              ? `${matchup} — the conclusion changed.`
              : "The insight conclusion changed. Open the match."),
        };
      case "monthly_report":
        return {
          title: "Monthly report is ready",
          body: detail || "Your Pro monthly report is available in Profile → Report.",
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
    case "injury_status":
      return {
        title: "出場ステータスが更新されました",
        body:
          detail ||
          (matchup
            ? `${matchup} の予想を確認してください。`
            : "重要選手の出場情報が変わりました。予想を確認してください。"),
      };
    case "starter_change":
      return {
        title: "重要な先発変更があります",
        body:
          detail ||
          (matchup
            ? `${matchup} の先発を確認してください。`
            : "影響の大きい先発変更があります。予想を確認してください。"),
      };
    case "prediction_deadline":
      return {
        title: "予想締切が近づいています",
        body:
          matchup ||
          "まだ予想していない試合があります。開始前に提出してください。",
      };
    case "pregame_digest":
      return {
        title: "試合前情報が更新されました",
        body:
          detail ||
          (matchup
            ? `${matchup} に複数の更新があります。予想を再確認してください。`
            : "複数の更新があります。予想を再確認してください。"),
      };
    case "pro_insight_update":
      return {
        title: "PRO INSIGHT が更新されました",
        body:
          detail ||
          (matchup
            ? `${matchup} の結論が変わりました。`
            : "重要結論が変わりました。試合を開いて確認してください。"),
      };
    case "monthly_report":
      return {
        title: "月次レポートが届きました",
        body:
          detail ||
          "プロフィールの Report タブで月次レポートを確認できます。",
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
