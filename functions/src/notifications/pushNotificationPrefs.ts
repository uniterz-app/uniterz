import type { PushNotificationType } from "./pushNotificationCopy";

export const PUSH_NOTIFICATION_PREF_KEYS = [
  "gameStart",
  "gameFinal",
  "rankingUpdated",
  "injuryStatus",
  "starterChange",
  "predictionDeadline",
  "pregameDigest",
  "proInsightUpdate",
  "monthlyReport",
] as const;

export type PushNotificationPrefKey = (typeof PUSH_NOTIFICATION_PREF_KEYS)[number];

export const PREDICTION_DEADLINE_MINUTE_OPTIONS = [60, 30, 10] as const;
export type PredictionDeadlineMinutes =
  (typeof PREDICTION_DEADLINE_MINUTE_OPTIONS)[number];

export type PushNotificationPrefs = Record<PushNotificationPrefKey, boolean> & {
  predictionDeadlineMinutes: PredictionDeadlineMinutes;
};

export const DEFAULT_PUSH_NOTIFICATION_PREFS: PushNotificationPrefs = {
  gameStart: true,
  gameFinal: true,
  rankingUpdated: true,
  injuryStatus: false,
  starterChange: false,
  predictionDeadline: true,
  pregameDigest: false,
  proInsightUpdate: false,
  monthlyReport: true,
  predictionDeadlineMinutes: 30,
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
    case "unit_reward":
      return "rankingUpdated";
    case "injury_status":
      return "injuryStatus";
    case "starter_change":
      return "starterChange";
    case "prediction_deadline":
      return "predictionDeadline";
    case "pregame_digest":
      return "pregameDigest";
    case "pro_insight_update":
      return "proInsightUpdate";
    case "monthly_report":
      return "monthlyReport";
  }
}

function parseDeadlineMinutes(raw: unknown): PredictionDeadlineMinutes {
  if (raw === 60 || raw === 10 || raw === 30) return raw;
  if (raw === "60") return 60;
  if (raw === "10") return 10;
  if (raw === "30") return 30;
  return DEFAULT_PUSH_NOTIFICATION_PREFS.predictionDeadlineMinutes;
}

export function parsePushNotificationPrefs(raw: unknown): PushNotificationPrefs {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PUSH_NOTIFICATION_PREFS };
  }
  const src = raw as Record<string, unknown>;
  const boolOr = (key: PushNotificationPrefKey, fallback: boolean): boolean =>
    typeof src[key] === "boolean" ? (src[key] as boolean) : fallback;

  return {
    gameStart: boolOr("gameStart", DEFAULT_PUSH_NOTIFICATION_PREFS.gameStart),
    gameFinal: boolOr("gameFinal", DEFAULT_PUSH_NOTIFICATION_PREFS.gameFinal),
    rankingUpdated: boolOr(
      "rankingUpdated",
      DEFAULT_PUSH_NOTIFICATION_PREFS.rankingUpdated
    ),
    injuryStatus: boolOr(
      "injuryStatus",
      DEFAULT_PUSH_NOTIFICATION_PREFS.injuryStatus
    ),
    starterChange: boolOr(
      "starterChange",
      DEFAULT_PUSH_NOTIFICATION_PREFS.starterChange
    ),
    predictionDeadline: boolOr(
      "predictionDeadline",
      DEFAULT_PUSH_NOTIFICATION_PREFS.predictionDeadline
    ),
    pregameDigest: boolOr(
      "pregameDigest",
      DEFAULT_PUSH_NOTIFICATION_PREFS.pregameDigest
    ),
    proInsightUpdate: boolOr(
      "proInsightUpdate",
      DEFAULT_PUSH_NOTIFICATION_PREFS.proInsightUpdate
    ),
    monthlyReport: boolOr(
      "monthlyReport",
      DEFAULT_PUSH_NOTIFICATION_PREFS.monthlyReport
    ),
    predictionDeadlineMinutes: parseDeadlineMinutes(
      src.predictionDeadlineMinutes
    ),
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
