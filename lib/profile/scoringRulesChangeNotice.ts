/**
 * プロフィールで「集計ルール変更」の注意モーダルを
 * ログインユーザー単位で1回だけ出すためのベースキー。
 * 実際の保存キーは `${BASE}:${uid}` 形式。
 * ルールを再度変更して再表示したいときはサフィックスを上げる（例: v2）。
 */
export const PROFILE_SCORING_RULES_NOTICE_STORAGE_KEY =
  "uniterz_profile_scoring_rules_notice_v1";
