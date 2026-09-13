# 通知設定 — 確定メモ（2026-09-13）

## 残す（文言 7言語済み）

| type | prefs | 備考 |
|---|---|---|
| `game_final` | `gameFinal` | スコアなし |
| `prediction_deadline` | `predictionDeadline` | スレート予想者のうち未予想をまとめ送信 |
| `unit_reward` | `unitReward` | 週/月ランキング Unit のみ（スクワッドバトルは対象外） |
| `injury_status` | `injuryStatus` Pro | 試合 doc `injuryReport`（MPG≥25）差分 |
| `pro_insight_update` | `proInsightUpdate` Pro | MATCHUP / INJURY IMPACT（または brief edges・players）差分 |
| `weekly_report` | `weeklyReport` Pro | 全 Pro。月曜 final cron 後 |
| `monthly_report` | `monthlyReport` Pro | Monthly / Season のみ。Weekly プランは UI 非表示＋送信除外 |

## 外した

`game_start` / `ranking_updated` / `starter_change` / `pregame_digest`

## 配線

- 締切: `functions/.../notifyPredictionDeadlineCron.ts`（未予想 + ユーザー単位まとめ）
- injury: ingest 後 `syncGameInjuryReportsForPush` → `games.injuryReport`
- Insight: `notifyPregameAlertCron` が重要読みだけ指紋化
- 週次: `rebuildWeeklyReportsCronV2` → `notifyWeeklyReportPush`
- 月次: `rebuildMonthlyReportsCronV2` → `notifyMonthlyReportPush`
- 正コピー: `lib/notifications/pushNotificationCopy.ts`
- prefs: `users/{uid}/private/notificationPrefs`
