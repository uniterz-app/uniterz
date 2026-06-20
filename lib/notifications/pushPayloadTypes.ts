/** Native プッシュ通知の data ペイロード（Expo Push `data` フィールド） */
export type PushNotificationType =
  | "game_start"
  | "game_final"
  | "ranking_updated";

export type PushNotificationData = {
  type: PushNotificationType;
  gameId?: string;
  postId?: string;
};

export function parsePushNotificationData(
  raw: Record<string, unknown> | null | undefined
): PushNotificationData | null {
  if (!raw || typeof raw !== "object") return null;
  const type = raw.type;
  if (type !== "game_start" && type !== "game_final" && type !== "ranking_updated") {
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
  return { type, gameId, postId };
}
