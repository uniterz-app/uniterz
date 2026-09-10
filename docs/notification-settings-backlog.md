# 通知設定 — あとでやるメモ

ユーザー指示（2026-09-10）: 通知まわりは後で直す。着手まで触らない。

## 現状（監査）

- 設定は **Expo プッシュ専用**（`users/{uid}/private/notificationPrefs`）
- 送信の prefs / Pro ゲートは `functions/src/notifications/sendExpoPush.ts` で見ている → **トグル配線自体は生きている**
- **メール通知なし** / お知らせ（Announcements）に設定トグルなし
- Web 設定は保存可だが、配信は Native の Expo トークン必須

## やること（優先）

1. **予想締切の対象を正す**  
   - UI / 設計: **未予想のみ**  
   - 実装バグ: `notifyPredictionDeadlineCron.ts` が `predictorUids`（**既に予想した人**）に送っている  
   - Free は 30 分前のみ、Pro は 10/30/60（prefs の `predictionDeadlineMinutes`）

2. **Pro 試合前アラートのデータ配線**  
   - prefs + cron（`notifyPregameAlertCron.ts`）は用意済み  
   - `games.injuryReport` / lineup（`starters` | `startingLineup` | `lineup`）を **試合 doc に書く ingest がなく**、欠場・先発・ダイジェストは実質飛ばない  
   - `proBrief` 更新 → `pro_insight_update` は動く想定

3. **コピー / タイミングのズレ（任意）**  
   - UI「試合開始 15 分前」 vs cron 窓 ~0–20 分  
   - `unit_reward` は専用トグルなし → `rankingUpdated` と連動

## 実際に飛ぶ種別（メモ）

| type | トリガー目安 | 備考 |
|---|---|---|
| `game_start` | 開始前 cron | 予想済み |
| `game_final` | final | 投稿者 |
| `ranking_updated` | 累積ランキング snapshot | その日予想者 |
| `prediction_deadline` | 締切前 cron | **対象バグあり** |
| `injury_status` / `starter_change` / `pregame_digest` | pregame cron | **データ未配線** |
| `pro_insight_update` | `proBrief` 差分 | Pro |
| `monthly_report` | 月初レポート | Pro |
| `unit_reward` | 期間 Unit 付与 | `rankingUpdated` 連動 |

## 主要パス

- prefs: `lib/notifications/pushNotificationPrefs.ts`（CF 側に同名コピーあり）
- UI: `app/component/settings/NotificationSettingsPage.tsx` / Native `NotificationSettingsScreenNative.tsx`
- send: `functions/src/notifications/sendExpoPush.ts`
- copy: `functions/src/notifications/pushNotificationCopy.ts`
- 設計（aspirational）: `docs/pro-subscription-plan.md` § 通知設定

## やらない（今）

お気に入りチーム限定・quiet hours・週次レポート push などの計画項目は、上記 1–2 のあと。
