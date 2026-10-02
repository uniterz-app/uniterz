# ピックアップ制 + PRO LEAGUE 設計

> **設計正（アプリ設計図）** — 現行実装と差分があっても、本ドキュメントの方向で進める。  
> 最終更新: 2026-08-01  
> 上位: [`service-overview.md`](service-overview.md)  
> 関連: [`ranking-design.md`](ranking-design.md), [`pro-subscription-plan.md`](pro-subscription-plan.md)

---

## 1. 概要

NBA シーズン向けに、個人ランキングを二層化する。

| 区分 | 表示名 | 対象試合 | 参加・閲覧 | 期間 |
|---|---|---|---|---|
| **通常（standard）** | Pick Up | **ピックアップ試合のみ**（`pickupWeekKey` または `isPickup`） | 全員 | 週間 / 月間 / シーズン |
| **open** | **PRO LEAGUE** | 全試合（`countsForRanking !== false`） | **Pro 限定** | 週間 / 月間 / シーズン |

予想自体は全員が全試合可能。無料ユーザーの非ピックアップ予想は通常（Pick Up）ランキングへ乗らない。PRO LEAGUE は Pro のみ閲覧・掲載。

---

## 2. 確定方針

- PRO LEAGUE は Pro ユーザーだけが掲載・閲覧できる
- 期間構成は既存と同じ（週間・月間・シーズン）
- スコア計算式・予想回数は Free / Pro 同一（Pay-to-Win 回避）
- **ピックアップの選定**: 運営が **対象週の前週水曜日** に、翌月曜〜日曜の試合から指定（[`pro-subscription-plan.md`](pro-subscription-plan.md) §ピックアップ試合フロー）。集計・UI は `pickupWeekKey` / `isPickup` を読むだけ

---

## 3. データモデル

### 3.1 試合（ピックアップ）

- `games/{gameId}.pickupWeekKey: string`（運用スクリプトで付与）および任意で `isPickup: boolean`
- 既存 `countsForRanking` は Play-In 除外などの意味で維持
- 集計対象:
  - 通常（Pick Up）: `countsForRanking !== false && isNbaPickupGame(game)`
  - PRO LEAGUE: `countsForRanking !== false`

### 3.2 スナップショット

| 区分 | コレクション | doc id 例 |
|---|---|---|
| 通常 週/月 | `period_ranking_snapshots` | `nba_weekly_{label}_{metric}` |
| **PRO LEAGUE 週/月** | 同上 | `nba_open_weekly_{label}_{metric}` |
| 通常 シーズン | `cumulative_ranking_snapshots` | `s{season}_{metric}` |
| **PRO LEAGUE シーズン** | 同上 | `s{season}_open_{metric}` |

open doc には `division: "open"` を付与。掲載は `users.plan === "pro"`（+ `proUntil` 未超過）のみ。

### 3.3 スタッツ二層化

日次 `user_stats_v2_daily` / 累積 `cumulative_stats`:

| バケット | 意味 |
|---|---|
| `ranking` / `rankingBySeason` | Pick Up（ピックアップのみ） |
| `openRanking` / `openRankingBySeason` | PRO LEAGUE（全ランキング対象試合） |
| `rankingByNbaPlayoffs` | プレーオフ（全ランキング対象・ピックアップ非適用） |

過去に `ranking*` へ書き込まれた全試合分は残る（過去シーズン再集計なし）。新規精算から意味が分かれる。

---

## 4. Pro 参加制御

- API: `division=open` のとき Bearer / uid を検証し `assertProUser`（`plan` + `proUntil`）
- 403 `{ error: "pro_required" }`
- 期中に Pro が切れた場合: 以降のスナップショットから除外。スコア自体は保持。復帰時は再掲載
- UI: 無料ユーザーにはロック + Pro 訴求

---

## 5. API / UI

- `GET /api/period-ranking/bulk?period=weekly|monthly&division=open`
- `GET /api/cumulative-ranking/bulk?division=open`（NBA シーズン PRO LEAGUE）
- ランキングサイドメニューに「PRO LEAGUE」項目（Web mobile / Native）

---

## 6. ロールアウト

- NBA のみ。WC 等は対象外
- ピックアップ判定は `pickupWeekKey` / `isPickup`。未設定試合は Pick Up に乗らない
- Free が PRO LEAGUE を開くと実データではなく Report 同型ゲート（ぼかし + CTA）
- 過去シーズン再集計はしない

---

## 7. 未決事項

- ~~ピックアップの選定タイミング~~ → **確定**: 対象週の前週水曜日に運営指定（翌月〜日）
- ピックアップ選定のスポーツ側基準（何試合・どのマッチアップを優先するか）
- ピックアップ 0 試合の日の扱い
- PRO LEAGUE の最低投稿数（現状は通常と同じ）
- PRO LEAGUE への Unit 報酬有無
