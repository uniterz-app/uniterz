# Pro Skin / Pro 周辺 — 次の作業計画

最終更新: 2026-08-04

## いままで（develop 向け実装）

- 採用カタログ **即解放 12 / マイルストーン 20**（Wave 招待・週/月回数含む）
- Circuit Lace / Iso Cubes など全面パターン、Crimson Eclipse 再採用、Carbon 削除
- Pro Skin 一覧の軽量化（カタログは swatch、フル模様はプレビュー時のみ）
- **無料ユーザー**も Pro Skin プレビュー可。適用ボタンは **GET PRO** → 購入ページ
- **薄い集計基盤** `users.proSkinProgress`（seasonKey / posts / exactHits / maxWinStreak）
- マイルストーンは **2026-27 以降のみ**（旧シーズン・`users.maxWinStreak` 通算は使わない）
- **GET `/api/me/pro-skin` は `users` + meta のみ**（`cumulative_stats` を毎回読まない）
- NBA settle 時に `syncProSkinProgressOnNbaSettle` で進捗更新 + 閾値解放
- ロック下に進捗バー（連勝 / 予想 / Perfect のみ。順位系はバーなし）
- 達成モーダル（プロフィール復帰）+ ライブ通知キュー
- Pro Skin 画面の旧リストモーダル削除 → `noticeIds` の NEW バッジのみ
- Free→Pro: Stripe / IAP 成功直後に `ensurePersisted` で progress + earned を unlocked へ合流（サイレント）
- 週/月スナップショット確定後に順位マイルストーン ×6 を付与（**standard 通常**）
- マイルストーン定義は `lib/profile/proSkinMilestoneCatalog.ts` 単一ソース（Functions 同期）
- grant は `done` のみスキップ、`running` 停滞（15分超）はリトライ
- settle の新規努力解放でも所持人数を加算

## 解放アーキテクチャ（確定）

| 種類 | 正データ | いつ書くか | ホットパス |
|---|---|---|---|
| Pro 即解放 ×12 | `users.plan` | Pro Skin API | users 1 read |
| 連勝 / 予想 / Perfect / 招待 / 週月回数 | `users.proSkinProgress` + `referralStats` | settle / period grant / referral settle | 進捗は users に載っている |
| 週/月順位 | `proSkinRankEarnedIds`（権利）+ unlocked | 期間確定時に standard 順位で earned。Pro なら unlocked+notice | users の短い ID 配列のみ |

### 通知方針（確定）

| ケース | 解放 | モーダル |
|---|---|---|
| Free 中に閾値到達 | 進捗のみ積む（unlocked には入れない） | なし |
| Free→Pro で遡及解放 | 努力: progress / 順位: `proSkinRankEarnedIds` → unlocked | **なし**（サイレント） |
| Pro 中に閾値を初めて跨ぐ | settle が unlocked + `proSkinUnlockNoticeIds` | **あり**（プロフィール復帰） |
| Pro 中に期間順位を達成 | grant が earned + unlocked + notice | **あり** |

- モーダル対象の正は `users.proSkinUnlockNoticeIds`（unlocked 全件 diff ではない）
- dismiss は `POST /api/me/pro-skin` `{ dismissNoticeIds }` + ローカル seen
- （任意）遡及分は NEW バッジ / 短い toast のみ — ヒーローモーダルは出さない

### なぜ cumulative を再利用しなかったか

- シーズン連勝が cumulative に無い / フィールドが日次と不一致
- exactHit の加算が壊れていた（settle で修正）
- 閲覧ごとに cumulative を読むとコストが閲覧回数に比例する

→ **スキン用の薄いミラー**が最安・最速・進捗バーも出せる。

## 次にやること

1. ~~**商品交換** — Unit ロック本番化（弁護士後 `REDEMPTION_UNITS_LIVE`）/ 規約追記 / 運用習熟~~ ✅ 2026-08-13（弁護士 OK・LIVE ON・規約/プライバシー追記）
2. **月次レポート** — ledger 内訳接続（`MONTHLY_REPORT_UNITS_FROM_LEDGER` は既に true）・Pro Stats 孤児掃除・表示仕上げ
3. （任意）メニュー NEW バッジ / 遡及用 toast
4. 開幕前: シーズン予想締切・報酬付与本番・Insight/アラート実データ

### 商品交換 — 運用メモ（LIVE 後）

- Admin: `/admin/redemptions` で審査 → ordered で Unit 消費
- まとめ購入目安: 毎月 25 日前後
- 申請プレビュー文言は `unitsLive` が true なら非表示

## やらないこと

- `main` へのマージ（develop のみ）
- Pro Skin GET ごとの `cumulative_stats` 読み
- 全ユーザー定期バッチ走査
- Free→Pro 遡及でのヒーローモーダル
- Pro Skin 画面での二重ヒーローモーダル（プロフィール復帰が正）
