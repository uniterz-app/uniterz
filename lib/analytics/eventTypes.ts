// lib/analytics/eventTypes.ts

export const GAME_EVENT = {
  CLICK_CARD: "click_card",
  OPEN_PREDICTIONS: "open_predictions",
  CREATE_PREDICTION: "create_prediction",

  // ★ 追加（PredictionFormで使っているイベント）
  PREDICT: "predict",
} as const;

export type GameEventType =
  (typeof GAME_EVENT)[keyof typeof GAME_EVENT];


export const PROFILE_EVENT = {
  OPEN_PROFILE: "open_profile",
} as const;
export type ProfileEventType = (typeof PROFILE_EVENT)[keyof typeof PROFILE_EVENT];

export const LIKE_EVENT = {
  LIKE_POST: "like_post",
} as const;
export type LikeEventType = (typeof LIKE_EVENT)[keyof typeof LIKE_EVENT];
