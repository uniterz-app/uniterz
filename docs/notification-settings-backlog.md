# 通知設定 — 確定メモ（2026-09-11）

## 残す（文言 7言語済み）

| type | prefs | 備考 |
|---|---|---|
| `game_final` | `gameFinal` | スコアなし |
| `prediction_deadline` | `predictionDeadline` | スレート予想者のうち未予想をまとめ送信 |
| `unit_reward` | `unitReward` | |
| `injury_status` | `injuryStatus` Pro | 試合 doc `injuryReport`（MPG≥25）差分 |
| `pro_insight_update` | `proInsightUpdate` Pro | |
| `monthly_report` | `monthlyReport` Pro | |

## 外した

`game_start` / `ranking_updated` / `starter_change` / `pregame_digest`

## 配線

- 締切: `functions/.../notifyPredictionDeadlineCron.ts`（未予想 + ユーザー単位まとめ）
- injury: ingest 後 `syncGameInjuryReportsForPush` → `games.injuryReport`
- 正コピー: `lib/notifications/pushNotificationCopy.ts`
