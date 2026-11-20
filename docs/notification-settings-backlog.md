# 通知設定 — 確定メモ（2026-09-13）

## 残す（文言 7言語済み）

| type | prefs | 備考 |
|---|---|---|
| `game_final` | `gameFinal` | スコアなし |
| `prediction_deadline` | `predictionDeadline` | スレート予想者のうち未予想をまとめ送信 |
| `unit_reward` | `unitReward` | 週/月ランキング Unit のみ（スクワッドバトルは対象外） |
| `ranking_updated` | `rankingUpdated` | 試合日 16:00 JST の累積ランキング更新後。今季順位が付いた人。同日 1 回 |
| `injury_status` | `injuryStatus` Pro | 試合 doc `injuryReport`（MPG≥25）差分 |
| `pro_insight_update` | `proInsightUpdate` Pro | 予想の材料（`predictKit`）の有利なチームが入れ替わったか、勝つ確率が 10 ポイント以上動いた（基準は最初に見た値か前回知らせた値）。kit の無い旧試合だけ MATCHUP / INJURY IMPACT（または brief edges・players）差分 |
| `weekly_report` | `weeklyReport` Pro | 全 Pro。月曜 final cron 後 |
| `monthly_report` | `monthlyReport` Pro | Monthly / Season のみ。Weekly プランは UI 非表示＋送信除外 |

## 外した

`game_start` / `starter_change` / `pregame_digest`

## 配線

- 締切: `functions/.../notifyPredictionDeadlineCron.ts`（未予想 + ユーザー単位まとめ）
- injury: ingest 後 `syncGameInjuryReportsForPush` → `games.injuryReport`
- PRO PICK: `notifyPregameAlertCron` が `gameProInsights.predictKit` の有利なチーム・勝つ確率を `games.pushPregame.kit` と比べる（kit の無い旧試合だけ重要読みの指紋）
- 日次ランキング: `buildCumulativeRankingSnapshotCron`（16:00 JST・試合日）→ `notifyDailyRankingUpdatedPush`
- 週次: `rebuildWeeklyReportsCronV2` → `notifyWeeklyReportPush`
- 月次: `rebuildMonthlyReportsCronV2` → `notifyMonthlyReportPush`
- 正コピー: `lib/notifications/pushNotificationCopy.ts`
- prefs: `users/{uid}/private/notificationPrefs`
