# サービス全体設計

> **設計正（アプリ設計図）** — 現行実装と差分があっても、本ドキュメントの方向で進める。  
> 最終更新: 2026-07-23  
> 関連: [`pro-subscription-plan.md`](pro-subscription-plan.md)

---

## 1. サービス定義

Uniterz は、ユーザーがスポーツの試合結果を予想し、分析力や予想成績を競うプラットフォームである。

---

## 2. スコア

ユーザーが投稿した予想は、アプリ独自の計算ロジックに基づいてスコア化される。

| 項目 | 内容 |
|---|---|
| 用途 | **ランキング算出専用** |
| 金銭性 | 購入・換金・譲渡・商品交換はできない |
| 価値 | **金銭的価値を持たない** |

---

## 3. ランキング

スコアを基に、次のランキングを作成する。

- 週間の個人ランキング
- 月間の個人ランキング
- （実装）シーズンの個人ランキング
- グループランキング
- （NBA）**PRO LEAGUE** — 全試合対象・Pro 限定。詳細は [`pickup-openweight-ranking-design.md`](pickup-openweight-ranking-design.md)

各ランキングの上位者に、運営から **Unit** を無料で付与する（PRO LEAGUE への Unit は未決）。

---

## 4. Unit

| 項目 | 内容 |
|---|---|
| 付与 | ランキング上位者へ、運営から無料付与 |
| 予想への使用 | **使用しない** |
| 減少 | 予想を外しても **減少しない** |
| 購入・現金化 | **不可** |
| ユーザー間譲渡・販売 | **不可** |
| 用途 | 一定数を貯めると、運営が指定するユニフォームなどの商品と交換できる |

---

## 5. Free / Pro（サービス全体の境界）

無料会員と Pro 会員で、次の差は **設けない**。

- 予想回数
- スコア計算
- ランキング条件
- Unit 付与条件
- 商品交換条件

Pro 会員には、予想の参考となる詳細データや分析情報を提供する。  
ただし、**予想結果や Unit 獲得を保証しない**。

（Pro 機能の詳細は [`pro-subscription-plan.md`](pro-subscription-plan.md)）

---

## 6. 関連設計図

| ドキュメント | 内容 |
|---|---|
| [`prediction-and-scoring.md`](prediction-and-scoring.md) | 予想機能・スコア算出 |
| [`ranking-design.md`](ranking-design.md) | ランキング設計（個人・グループ） |
| [`group-battle-design.md`](group-battle-design.md) | グループバトル設計・確定事項 |
| [`group-battle-tech-design.md`](group-battle-tech-design.md) | グループバトル技術設計（データ・集計・API） |
| [`unit-reward-design.md`](unit-reward-design.md) | Unit 付与設計 |
| [`unit-redemption-design.md`](unit-redemption-design.md) | Unit 商品交換設計 |
| [`referral-design.md`](referral-design.md) | 招待・紹介制度設計 |
| [`money-unit-product-flow.md`](money-unit-product-flow.md) | お金／Unit／商品の流れ |
| [`legal-risk-review.md`](legal-risk-review.md) | 法務リスク確認（賭博・景表法・資金決済法・NBA商標・特商法／消費者契約法・個人情報保護・ストア審査） |
| [`legal-counsel-kickoff-brief.md`](legal-counsel-kickoff-brief.md) | **弁護士初回面談ブリーフ**（事前送付・当日用） |
| [`pro-billing-design.md`](pro-billing-design.md) | Pro 課金設計 |
| [`pro-subscription-plan.md`](pro-subscription-plan.md) | Pro プラン（機能詳細） |

---

## 7. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-23 | 初版。サービス全体設計を設計図として保管 |
| 2026-07-23 | 関連に予想機能・スコア算出を追加 |
| 2026-07-27 | 弁護士初回面談ブリーフへのリンクを追加 |
| 2026-07-27 | 関連にグループバトル技術設計を追加 |
