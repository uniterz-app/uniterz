import type { PushNotificationType } from "./pushPayloadTypes";

/** UI / 保存対象の prefs（外した種別は含めない） */
export const PUSH_NOTIFICATION_PREF_KEYS = [
  "gameFinal",
  "predictionDeadline",
  "unitReward",
  "injuryStatus",
  "proInsightUpdate",
  "monthlyReport",
] as const;

export type PushNotificationPrefKey = (typeof PUSH_NOTIFICATION_PREF_KEYS)[number];

/** 送信停止（設定にも出さない） */
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

/** 予想締切アラートの何分前か（Free は 30 のみ想定） */
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
  /** Pro 系は明示 ON */
  injuryStatus: false,
  proInsightUpdate: false,
  monthlyReport: true,
  predictionDeadlineMinutes: 30,
};

/** Free でも使える直前アラート */
export const FREE_PREGAME_ALERT_PREF_KEYS = [
  "predictionDeadline",
] as const satisfies readonly PushNotificationPrefKey[];

/** Pro 限定の直前アラート */
export const PRO_PREGAME_ALERT_PREF_KEYS = [
  "injuryStatus",
  "proInsightUpdate",
] as const satisfies readonly PushNotificationPrefKey[];

/** 送信も UI も Pro 限定（月次レポート含む） */
export const PRO_ONLY_PREF_KEYS = [
  ...PRO_PREGAME_ALERT_PREF_KEYS,
  "monthlyReport",
] as const satisfies readonly PushNotificationPrefKey[];

export function isProOnlyPrefKey(key: PushNotificationPrefKey): boolean {
  return (PRO_ONLY_PREF_KEYS as readonly string[]).includes(key);
}

export function isPushTypeProOnly(type: PushNotificationType): boolean {
  if (isRetiredPushType(type)) return false;
  return isProOnlyPrefKey(prefKeyForPushType(type));
}

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
    case "monthly_report":
      return "monthlyReport";
    case "game_start":
    case "ranking_updated":
    case "starter_change":
    case "pregame_digest":
      // 呼び出し側は isRetiredPushType で先に弾く
      return "gameFinal";
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
  const boolOr = (key: string, fallback: boolean): boolean =>
    typeof src[key] === "boolean" ? (src[key] as boolean) : fallback;

  // 旧 rankingUpdated を unitReward の初期値に引き継ぐ
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
