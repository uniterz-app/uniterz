/** 本番 Pro Skin / 課金導線ルート */
export const PRO_SUBSCRIBE_PATH = {
  mobile: "/mobile/pro/subscribe",
  web: "/web/pro/subscribe",
} as const;

export const PRO_SKIN_PATH = {
  mobile: "/mobile/pro/skin",
  web: "/web/pro/skin",
} as const;

/** トライアル成功画面からの遷移（Skin で BACK タブ非表示） */
export const PRO_SKIN_FROM_TRIAL_QUERY = "from=trial" as const;

export function proSkinHref(
  platform: "mobile" | "web",
  opts?: { fromTrial?: boolean }
): string {
  const base = PRO_SKIN_PATH[platform];
  return opts?.fromTrial ? `${base}?${PRO_SKIN_FROM_TRIAL_QUERY}` : base;
}
