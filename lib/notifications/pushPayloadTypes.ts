/** Native プッシュ通知の data ペイロード（Expo Push `data` フィールド） */
export type PushNotificationType =
  | "game_start"
  | "game_final"
  | "ranking_updated"
  /** 出場ステータス変更（例: Questionable → Out） */
  | "injury_status"
  /** 影響の大きい先発変更 */
  | "starter_change"
  /** 予想締切（未予想試合） */
  | "prediction_deadline"
  /** 複数変化のまとめ通知 */
  | "pregame_digest"
  /** PRO INSIGHT の重要更新（結論変化時のみ） */
  | "pro_insight_update"
  | "monthly_report";

export type PushNotificationData = {
  type: PushNotificationType;
  gameId?: string;
  postId?: string;
  monthKey?: string;
};

const PUSH_TYPES = new Set<PushNotificationType>([
  "game_start",
  "game_final",
  "ranking_updated",
  "injury_status",
  "starter_change",
  "prediction_deadline",
  "pregame_digest",
  "pro_insight_update",
  "monthly_report",
]);

export function parsePushNotificationData(
  raw: Record<string, unknown> | null | undefined
): PushNotificationData | null {
  if (!raw || typeof raw !== "object") return null;
  const type = raw.type;
  if (typeof type !== "string" || !PUSH_TYPES.has(type as PushNotificationType)) {
    return null;
  }
  const gameId =
    typeof raw.gameId === "string" && raw.gameId.trim() !== ""
      ? raw.gameId.trim()
      : undefined;
  const postId =
    typeof raw.postId === "string" && raw.postId.trim() !== ""
      ? raw.postId.trim()
      : undefined;
  const monthKey =
    typeof raw.monthKey === "string" && raw.monthKey.trim() !== ""
      ? raw.monthKey.trim()
      : undefined;
  return { type: type as PushNotificationType, gameId, postId, monthKey };
}
