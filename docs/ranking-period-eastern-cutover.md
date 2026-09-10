/**
 * Eastern 切替カットオーバーメモ（週次・月次ランキング / Unit / Pro レポート）
 *
 * ## 方針
 * - 期間ラベル・「今日」・月曜始まりは全員共通 `America/New_York`
 * - 期間終了 → 新しい週／月の初日 16:00 JST に前期間を最終スナップショット
- Unit 付与は **16:10 JST** の別 cron（`grantPeriodRankingUnitsCron`）
  （同一実行のタイムアウト連鎖を避け、スナップ確定後に配布）
 * - Weekly / Monthly Pro レポートも同じ Eastern 期間 + cron TZ
 *
 * ## 実装済み
 * - `lib/rankings/rankingPeriodClock.ts` / `rankingPeriod.ts`
 * - `functions/src/rankings/nbaPeriod.ts`（`dateKeyJST` 等は Eastern 互換エイリアス）
 * - NBA tip-off → `user_stats_v2_daily.date` は ET（他リーグは JST のまま）
 * - pickup 分母・月次レポート settled 範囲も ET 日界
 * - レポート cron: Mon 08:30 ET / 毎月1日 08:00 ET
 * - ランキング UI に週・月の ET 説明
 *
 * ## 運用上の注意（未バックフィル）
 * - 既存の `user_stats_v2_daily` / period snapshot / report ID は旧 JST ラベルのまま残る
 * - デプロイ直後の「今の週／月」は Eastern ラベルで新しく集計される（境界付近で1日ズレうる）
 * - 過去 JST 期間の再確定や Unit 再付与が必要なら別ジョブで再バケット
 * - Functions デプロイ後に有効（Next だけ先でも UI 説明は出るが集計は Functions 側）
 */
