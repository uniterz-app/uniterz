import type { PushNotificationType } from "./pushNotificationCopy";

export const PUSH_NOTIFICATION_PREF_KEYS = [
  "gameFinal",
  "predictionDeadline",
  "unitReward",
  "injuryStatus",
  "proInsightUpdate",
  "weeklyReport",
  "monthlyReport",
] as const;

export type PushNotificationPrefKey = (typeof PUSH_NOTIFICATION_PREF_KEYS)[number];

export const RETIRED_PUSH_TYPES = [
  "game_start",
  "ranking_updated",
  "starter_change",
  "pregame_digest",
] as const satisfies readonly PushNotificationType[];

export type RetiredPushType = (typeof RETIRED_PUSH_TYPES)[number];

export function isRetiredPushType(
  type: PushNotificationType
): type is RetiredPushType {
  return (RETIRED_PUSH_TYPES as readonly string[]).includes(type);
}

export const PREDICTION_DEADLINE_MINUTE_OPTIONS = [60, 30, 10] as const;
export type PredictionDeadlineMinutes =
  (typeof PREDICTION_DEADLINE_MINUTE_OPTIONS)[number];

export type PushNotificationPrefs = Record<PushNotificationPrefKey, boolean> & {
  predictionDeadlineMinutes: PredictionDeadlineMinutes;
};

export const DEFAULT_PUSH_NOTIFICATION_PREFS: PushNotificationPrefs = {
  gameFinal: true,
  predictionDeadline: true,
  unitReward: true,
  injuryStatus: false,
  proInsightUpdate: false,
  weeklyReport: true,
  monthlyReport: true,
  predictionDeadlineMinutes: 30,
};

export function prefKeyForPushType(
  type: PushNotificationType
): PushNotificationPrefKey {
  switch (type) {
    case "game_final":
      return "gameFinal";
    case "unit_reward":
      return "unitReward";
    case "injury_status":
      return "injuryStatus";
    case "prediction_deadline":
      return "predictionDeadline";
    case "pro_insight_update":
      return "proInsightUpdate";
    case "weekly_report":
      return "weeklyReport";
    case "monthly_report":
      return "monthlyReport";
    case "game_start":
    case "ranking_updated":
    case "starter_change":
    case "pregame_digest":
      return "gameFinal";
  }
}

export const PRO_PREGAME_ALERT_PREF_KEYS = [
  "injuryStatus",
  "proInsightUpdate",
] as const satisfies readonly PushNotificationPrefKey[];

export const PRO_ONLY_PREF_KEYS = [
  ...PRO_PREGAME_ALERT_PREF_KEYS,
  "weeklyReport",
  "monthlyReport",
] as const satisfies readonly PushNotificationPrefKey[];

export function isProOnlyPrefKey(key: PushNotificationPrefKey): boolean {
  return (PRO_ONLY_PREF_KEYS as readonly string[]).includes(key);
}

export function isPushTypeProOnly(type: PushNotificationType): boolean {
  if (isRetiredPushType(type)) return false;
  return isProOnlyPrefKey(prefKeyForPushType(type));
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
  const boolOr = (key: string, fallback: boolean): boolean =>
    typeof src[key] === "boolean" ? (src[key] as boolean) : fallback;

  const unitRewardFallback =
    typeof src.unitReward === "boolean"
      ? (src.unitReward as boolean)
      : typeof src.rankingUpdated === "boolean"
        ? (src.rankingUpdated as boolean)
        : DEFAULT_PUSH_NOTIFICATION_PREFS.unitReward;

  return {
    gameFinal: boolOr("gameFinal", DEFAULT_PUSH_NOTIFICATION_PREFS.gameFinal),
    predictionDeadline: boolOr(
      "predictionDeadline",
      DEFAULT_PUSH_NOTIFICATION_PREFS.predictionDeadline
    ),
    unitReward: unitRewardFallback,
    injuryStatus: boolOr(
      "injuryStatus",
      DEFAULT_PUSH_NOTIFICATION_PREFS.injuryStatus
    ),
    proInsightUpdate: boolOr(
      "proInsightUpdate",
      DEFAULT_PUSH_NOTIFICATION_PREFS.proInsightUpdate
    ),
    weeklyReport: boolOr(
      "weeklyReport",
      DEFAULT_PUSH_NOTIFICATION_PREFS.weeklyReport
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
  if (isRetiredPushType(type)) return false;
  return prefs[prefKeyForPushType(type)];
}

export function isPushTypeEnabledForUser(
  rawPrefs: unknown,
  type: PushNotificationType
): boolean {
  return isPushTypeEnabledForPrefs(parsePushNotificationPrefs(rawPrefs), type);
}
