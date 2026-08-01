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
| **通常（standard）** | NBA プレーオフ等 | 将来はピックアップ試合のみ（現状は全試合） | 全員 | 週間 / 月間 / シーズン |
| **open** | **PRO LEAGUE** | 全試合（`countsForRanking !== false`） | **Pro 限定** | 週間 / 月間 / シーズン |

予想自体は全員が全試合可能。無料ユーザーの非ピックアップ予想は、ピックアップ制導入後に通常ランキングへ乗らないだけ（現状はピックアップ未実装のため点数源は同一）。

---

## 2. 確定方針

- PRO LEAGUE は Pro ユーザーだけが掲載・閲覧できる
- 期間構成は既存と同じ（週間・月間・シーズン）
- スコア計算式・予想回数は Free / Pro 同一（Pay-to-Win 回避）
- **ピックアップの選定方法は未決**（誰が・基準・タイミング）。集計側は試合の `isPickup` フラグを読むだけにする

---

## 3. データモデル

### 3.1 試合（将来・ピックアップ）

- `games/{gameId}.isPickup: boolean`（未実装）
- 既存 `countsForRanking` は Play-In 除外などの意味で維持
- 集計対象:
  - 通常: `countsForRanking !== false && isPickup === true`（導入後）
  - PRO LEAGUE: `countsForRanking !== false`

### 3.2 スナップショット

| 区分 | コレクション | doc id 例 |
|---|---|---|
| 通常 週/月 | `period_ranking_snapshots` | `nba_weekly_{label}_{metric}` |
| **PRO LEAGUE 週/月** | 同上 | `nba_open_weekly_{label}_{metric}` |
| 通常 シーズン | `cumulative_ranking_snapshots` | `s{season}_{metric}` |
| **PRO LEAGUE シーズン** | 同上 | `s{season}_open_{metric}` |

open doc には `division: "open"` を付与。掲載は `users.plan === "pro"`（+ `proUntil` 未超過）のみ。

### 3.3 スタッツ二層化（ピックアップ導入時）

現状の `pointsSumV3` 等は全試合。ピックアップ導入時:

- 既存フィールド → ピックアップのみに意味変更（新シーズンから）
- `openPointsSumV3` 等 → 全試合（PRO LEAGUE 用）

コミュニティ・グループバトルは通常（ピックアップ）側を読む想定。

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
- ピックアップ制は別途。PRO LEAGUE はピックアップ前でも Pro フィルタ付きで稼働可能（点数源は現状の全試合集計）
- 過去シーズン再集計はしない

---

## 7. 未決事項

- ピックアップの選定方法・基準・タイミング
- ピックアップ 0 試合の日の扱い
- PRO LEAGUE の最低投稿数（現状は通常と同じ）
- PRO LEAGUE への Unit 報酬有無
