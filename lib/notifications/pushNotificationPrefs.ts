import type { PushNotificationType } from "./pushPayloadTypes";

export const PUSH_NOTIFICATION_PREF_KEYS = [
  "gameStart",
  "gameFinal",
  "rankingUpdated",
] as const;

export type PushNotificationPrefKey = (typeof PUSH_NOTIFICATION_PREF_KEYS)[number];

export type PushNotificationPrefs = Record<PushNotificationPrefKey, boolean>;

export const DEFAULT_PUSH_NOTIFICATION_PREFS: PushNotificationPrefs = {
  gameStart: true,
  gameFinal: true,
  rankingUpdated: true,
};

export function prefKeyForPushType(
  type: PushNotificationType
): PushNotificationPrefKey {
  switch (type) {
    case "game_start":
      return "gameStart";
    case "game_final":
      return "gameFinal";
    case "ranking_updated":
      return "rankingUpdated";
  }
}

export function parsePushNotificationPrefs(raw: unknown): PushNotificationPrefs {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PUSH_NOTIFICATION_PREFS };
  }
  const src = raw as Record<string, unknown>;
  return {
    gameStart:
      typeof src.gameStart === "boolean"
        ? src.gameStart
        : DEFAULT_PUSH_NOTIFICATION_PREFS.gameStart,
    gameFinal:
      typeof src.gameFinal === "boolean"
        ? src.gameFinal
        : DEFAULT_PUSH_NOTIFICATION_PREFS.gameFinal,
    rankingUpdated:
      typeof src.rankingUpdated === "boolean"
        ? src.rankingUpdated
        : DEFAULT_PUSH_NOTIFICATION_PREFS.rankingUpdated,
  };
}

export function isPushTypeEnabledForPrefs(
  prefs: PushNotificationPrefs,
  type: PushNotificationType
): boolean {
  return prefs[prefKeyForPushType(type)];
}

export function isPushTypeEnabledForUser(
  rawPrefs: unknown,
  type: PushNotificationType
): boolean {
  return isPushTypeEnabledForPrefs(parsePushNotificationPrefs(rawPrefs), type);
}
