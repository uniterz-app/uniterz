# Pro サブスクリプション計画書

> ステータス: **ドラフト（設計・議論用）** — 本番未接続  
> 最終更新: 2026-07-16（次作業キュー追記）  
> 関連: `app/mobile/pro/subscribe/page.tsx`, `app/lp/_components/lp-data.ts`, `app/dev/my-rank-free-pro-preview/`  
> **プレビュー→本番の待ち・ゲート一覧:** [`docs/preview-to-prod-checklist.md`](preview-to-prod-checklist.md)（WC 7/20 以降の UI 反映、API 契約、開幕スケジュール等）  
> **直近の作業順（課金導線・週次/月次・ライブ・招待）:** 同ファイルの [§0 次の作業キュー](preview-to-prod-checklist.md#0-次の作業キュー優先順)  
> **課金プラン方針:** Weekly / Monthly / Season Pass の 3 種（価格・特典差は未確定）

---

## 1. Pro の位置づけ

**Pro = 順位の理由が分かり、同じ帯の人と比べて、次の予想で何を意識すればいいかが分かるプラン**

| 軸 | 内容 |
|---|---|
| **ステータス** | Pro バッジ、My Rank / プロフィールカードのラグジュアリー化、トロフィールーム |
| **競争インテリジェンス** | 差の構造（Gap）、匿名ライバル帯（Shadow）、予想フォーム連動 |
| **定期配信** | 週次 Shadow サマリー、月次 Pro Stats レポート |
| **記憶・実績** | 大会 / シーズン振り返り、トロフィールーム（プロフィール） |

### 鉄則（Pay to Win 回避）

- 予想参加・基本ランキングは **Free のまま**
- 他人の予想内容は **見せない**
- 順位そのものにボーナスを付けない
- 「推奨予想」はしない（過去の自分と帯統計のみ）

---

## 2. パッケージ構成（3 層）

### Layer A — 見た目の特権（即時満足）

| 機能 | Free | Pro |
|---|---|---|
| Pro バッジ | なし | 角ブラケット + 嵌込ダイヤ + ゴールド PRO 文字 |
| My Rank カード枠 | シンプル単線 | ゴールド四隅 L + 右下チャムファー |
| プロフィールカード | 標準 | ラグジュアリー化（設計中） |
| **トロフィールーム** | バッジ一覧のみ（既存） | 展示棚 UI + ピン留め + 大会トロフィー |
| ランキング一覧ハイライト | なし | 控えめな Pro 表示（将来） |
| フッター表記 | `UNITERZ` | `UNITERZ/PRO` |

**My Rank カード（設計済み・プレビューあり）**

| 要素 | Free | Pro |
|---|---|---|
| TOP% | 非表示 or ブラー | 常時表示 |
| 順位帯ギャップ | 非表示 or `+??pt` | 「TOP20まで +42pt」等 |
| Ranking Progress | 直近 3 点 | 直近 10 点 |
| VOL · AVG | 表示 | 表示 |
| 指標 HUD / dayDelta | 表示 | 表示 |

プレビュー: `/dev/my-rank-free-pro-preview`

---

### Layer B — 競争インテリジェンス（Pro の本命）

3 本柱に絞る。**Momentum（勢い専用画面）は入れない** — Ranking Progress 10 点で足りる。別画面にすると分かりづらくなる。

#### 柱 1: 差の構造（Gap）— メイン分析画面

自分の総合得点を分解し、**上位帯の人と何が違うか** を可視化 + 1 行アドバイス。

**分解軸（例）**

- ベース得点
- 完全的中ボーナス
- 連勝ボーナス
- Upset ボーナス
- 得点者ボーナス（WC）

**比較の見せ方（例）**

```
総合得点 1,284pt
├─ ベース得点        ████████░░  上位帯比 -12
├─ 完全的中ボーナス  ███░░░░░░░  上位帯比 -28  ← 不足
├─ 連勝ボーナス      ██░░░░░░░░  上位帯比 -15
├─ Upset ボーナス    ██████░░░░  上位帯比 +8   ← 強み
└─ 得点者ボーナス    ██░░░░░░░░  上位帯比 -22
```

**アドバイス例**

> 勝率は TOP20 帯と同水準です。完全的中と得点者予想を 1 試合分増やすと、あと約 18pt で TOP20 圏内です。

**指標別の不足パターン（例）**

- 勝率は上位と同じ → 完全的中が少ない
- ベース点は取れている → 連勝ボーナスを取りこぼしている
- スコア予想は当たっている → 得点者予想が外れている

**データソース（既存）**

- `pointsV3` = base + upsetBonus + streakBonus + goalScorerBonus（WC）
- `useUserStatsV2` / `SummaryForCardsV2`
- 上位帯は匿名集計（個人特定なし）

---

#### 柱 2: 匿名ライバル帯（Shadow / RIVAL）— 週次更新

**JST 日曜始まりの 1 週間**で区切り、先週と同じ順位帯（±5 位）にいた匿名ユーザー群と、**今週の積み上げ**を比較。

**週の区切り（確定）**

| 項目 | ルール |
|---|---|
| 週の開始 | **日曜 0:00（JST）** |
| 先週の帯 | **先週の日曜**時点の順位 ±5 位でコホートを決定 |
| 今週の比較 | **今週の日曜**以降に積み上がった得点・完全的中・ボーナス等 |
| 画面の更新 | **週の途中**も閲覧可（日曜からの途中経過）。キャッシュは **1 日 1 回**再計算 |

→ ユーザー向けには「**毎週日曜が新しい週の始まり**」「日曜以降に今週分が積み上がっていく」と説明する。

**見せ方（例）**

```
先週の帯: 45〜55位（あなたは 48位）※先週日曜時点
今週の帯の動き（今週日曜〜今日）:
  ├─ 3人が順位上昇
  ├─ 5人が横ばい
  └─ 2人が下落

先週同帯だった人との差（今週の積み上げ）:
  · 順位変動: あなた +2位 vs 同帯平均 +0.8位
  · 総合得点: あなた 84pt vs 同帯平均 62pt
  · 完全的中: あなた 1回 vs 同帯平均 0.7回
  · 連勝ボーナス: あなた 12pt vs 同帯平均 18pt  ← ここで差
```

**比較指標とデータ精度**

| 指標 | 週次デルタの出し方 | 精度 |
|---|---|---|
| 順位変動 | 今週日曜時点の順位 − 現在順位 | ◎ 即日 |
| 総合得点 | 現在累計 − 今週日曜の `metricValues` | ◎ cron 後 |
| 完全的中 | 同上 | ◎ cron 後 |
| Upset ボーナス | 同上（`totalUpset` / `upsetBonusSum`） | ◎ cron 後 |
| **連勝ボーナス** | 同上（`streakBonusSum` を history に保存） | △ **cron 反映後**（下記） |
| **得点者ボーナス（WC）** | 同上（`goalScorerBonusSum` を history に保存） | △ **cron 反映後**（下記） |

**連勝・得点者ボーナスについて（ユーザー / 運用向けメモ）**

- 週次比較は `rankSnapshotHistory` の **アンカー日スナップショット**と現在累計の差分。
- 連勝・得点者は **日次ランキング cron**（`buildCumulativeRankingSnapshot`）が `metricValues` に `streakBonusSum` / `goalScorerBonusSum` を書き込んでから、週次デルタとして正確になる。
- cron 適用前のアンカー日にはこれらのフィールドが無い／0 のため、**初回は週次値が実態より大きく見える**ことがある。数日運用後に安定。
- UI フッター・Pro 説明に「日曜区切り」「連勝・得点者はスナップショット蓄積後に精度向上」と明記する。

**ポイント**

- 個人は特定しない（帯の匿名統計）
- 「先週一緒だったのに、今週こんなに差がついた」で競争意欲を掻き立てる
- 帯のタイプ（堅実型 / Upset 型 / 多投稿型）を表示
- 更新頻度: **週 1 が主**（週中は途中経過として閲覧可。毎日 push はしない）
- コスト: `rankIntelShadowCache` で **同一週・同一日内は再計算しない**

---

#### 柱 3: タイミング — 予想フォーム連動のみ

> **ステータス: 仕様確定（v1）** — L1 `context_cache` 設計済み。実装は dev プレビュー → データパイプライン → 本番フォームの順。本番 `PredictionFormV2` のドラフトは feature flag 推奨。

常設画面は作らない。**予想フォームに文脈で 1 行出す**。意味のある文脈がなければ **沈黙**。

**Free との差**

| | Free | Pro |
|---|---|---|
| 市場分布 | 全ユーザーの予想分布（市場タブ） | — |
| タイミング 1 行 | 非表示 | L1〜L3 の文脈ヒント |

**鉄則（柱 3 固有）**

- 「推奨予想」はしない — 偏り・過去実績の **事実** のみ
- 他人の個別予想は見せない（L2 は匿名集計のみ）
- H2H / 形式タブの内容は **繰り返さない**

---

##### 3 レイヤー（確定）

| レイヤー | 内容 | 視点 | v1 |
|---|---|---|---|
| **L1 自分** | 勝率・得意/苦手チーム・アウェイ/Upset 癖 | 過去の自分 | ✅ |
| **L2 同帯×この試合** | 今週の帯が **この試合** でどう寄っているか | 匿名ライバル | ✅ |
| **L3 チーム文脈** | 「このチームは今大会アップセット多め」等 | 試合のチーム | ✅ |

**v1 から外す（確定）**

- 試合形式（KO / グループ）別の自分統計 — 集計未整備
- 今週の帯メトリクス単体（「完全的中が効いている週」）— 試合と無関係
- 汎用 KO 注意書き

---

##### L1 自分 — データ源（**月次は使わない**）

柱 3 は **予想する瞬間** に効かせるため、カレンダー月次（`user_stats_v2_monthly`）は使わない。**大会 / シーズン通算** を `context_cache` 1 読みで返す。

**鮮度の意味**

- 試合が確定した直後から次の予想フォームに反映（月次バッチ待ち不要）
- 「1つ前の試合まで含む大会通算」は ✅（昨日までの確定試合がすべて入る）
- 「直前 1 試合だけ」の切り出しは ❌（柱 3 の範囲外。個別 `posts` が必要）

---

##### コスト設計（確定）

`window_cache` と同型の **増分キャッシュ**。フォーム表示時に daily をロールアップしない。

| パス | 読み取り | 書き込み | 備考 |
|---|---|---|---|
| 投稿確定（既存） | マーカー + daily | daily + cumulative 等 | 変更なし |
| 投稿確定（柱 3 追加分） | context_cache 1（merge 用） | context_cache 1 + daily 新バケット | `updateUserStatsV2` トランザクション内 |
| 予想フォーム表示 | **context_cache 1 doc** | 0 | Pro のみ |
| L2 match-bias | サーバー側（キャッシュ hit 時 0） | 日次キャッシュ doc | クライアント直読不可 |
| daily ロールアップ | 30〜40 reads | — | **バックフィル・整合性チェック専用**（通常パスでは使わない） |

`finalizePost` 後の `buildWindowCacheForUser`（30 daily 読み）とは **別物**。柱 3 はトランザクション内 increment だけで済ませ、window 再構築に依存しない。

---

##### `user_stats_v2_context_cache` — フィールド設計（v1）

**Doc ID:** `{uid}_{contextId}`  
**例:** `abc123_wc:2026:main` / `abc123_nba:2025-26:playoffs`

`contextId` は大会・シーズンが変わったら新 doc（旧 doc は履歴として残す）。

```ts
/** lib/stats/userStatsV2ContextCache.ts（予定） */
type ContextStatsBucket = {
  posts: number;
  wins: number;
  upsetPickCount: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
};

type ContextTeamBucket = {
  posts: number;
  wins: number;
};

type UserStatsV2ContextCache = {
  schemaVersion: 1;
  uid: string;
  /** 例: "wc:2026:main" | "nba:2025-26:regular" */
  contextId: string;
  league: string;
  /** WC: qualifying | main。NBA: regular | play_in | playoffs */
  scope?: string | null;
  /** 大会/シーズン開始日（JST YYYY-MM-DD）— 表示・デバッグ用 */
  periodStartDateKey: string;
  updatedAt: Timestamp;

  /** リーグ全体の通算（柱 3 L1 の全体勝率） */
  raw: ContextStatsBucket;

  /** ホーム / アウェイを選んだ試合の勝率（pick 側で分岐） */
  homeAway: {
    home: ContextStatsBucket;
    away: ContextStatsBucket;
  };

  /** 市場多数派に乗った / 逆張りした試合 */
  market: {
    favoritePickCount: number;
    underdogPickCount: number;
    favoriteWins: number;
    underdogWins: number;
  };

  /**
   * チーム ID ごとの通算（ホーム・アウェイ両方の試合で pick した側のチーム）
   * キー例: "jpn", "bra", "1610612747"
   * 柱 3 では試合の homeTeamId / awayTeamId だけ lookup（全チーム走査しない）
   */
  teams: Record<string, ContextTeamBucket>;
};
```

**派生値（書き込まない — 読み取り時に計算）**

| フィールド | 式 |
|---|---|
| `raw.winRate` | `wins / posts` |
| `teams[id].winRate` | 同上 |
| `market.underdogWinRate` | `underdogWins / underdogPickCount` |
| `homeAway.away.winRate` | 同上 |

**ルール評価（`buildPredictTimingAdvice`）**

| ルール | 参照 |
|---|---|
| 得意チーム | `teams[teamId]` — `posts ≥ 5` かつ `winRate ≥ 0.58` かつ大会平均より高い |
| 苦手チーム | `teams[teamId]` — `posts ≥ 5` かつ `winRate ≤ 0.42` |
| アウェイ苦手 | `homeAway.away` — `posts ≥ 8` かつ `away.winRate < raw.winRate - 0.10` |
| 逆張り得意 | `market` — `underdogPickCount ≥ 8` かつ `underdogWinRate` が大会平均より高い |

`teamStats.strong / weak` 配列は **キャッシュに持たない**（月次専用）。試合に出ている 2 チームだけ都度判定。

---

##### daily 拡張（`user_stats_v2_daily` — 投稿確定時 increment）

既存の `all` / `leagues.*` / `teams.*` に加え、**同じ `inc` オブジェクト**を以下にも merge:

```ts
// updateUserStatsV2 — 追加バケット（context_cache と同構造の部分集合）
homeAway: {
  home: inc,  // prediction.winner === "home"
  away: inc,  // prediction.winner === "away"
}
market: {
  favoritePickCount: +1,  // pick === marketMeta.majoritySide
  underdogPickCount: +1,
  favoriteWins: +1,       // isWin 時のみ該当側
  underdogWins: +1,
}
```

`finalizePost` から `pickedWinner` と `marketMeta` を `ApplyOptsV2` に渡す（未設定の旧投稿は increment 0）。

**context_cache 更新:** daily と同一トランザクションで `context_cache/{uid}_{contextId}` に同じ delta を `FieldValue.increment`。**新規 doc** は `periodStartDateKey` とメタだけ set。

---

##### 大会平均（比較用・v1）

| Doc | ID | 更新 | 用途 |
|---|---|---|---|
| `context_global_cache` | `{contextId}` | 投稿確定ごとに `raw` increment（全ユーザー共通 1 doc） | 「大会平均 62%」表示 |

```ts
type ContextGlobalCache = {
  schemaVersion: 1;
  contextId: string;
  raw: { posts: number; wins: number };
  market: { underdogPickCount: number; underdogWins: number };
  updatedAt: Timestamp;
};
```

Firestore の `increment` は単一 doc への concurrent write に強い。WC 規模なら問題になりにくい。  
母数不足（`raw.posts < 100` 等）のときは **平均比較なし**で勝率のみ表示。

---

##### L1 表示例

- あなた 83%（平均 62%）← 得意チーム
- 苦手 20%（5回）← 苦手チーム
- アウェイ予想は全体より弱い（勝率 41%）← 自分パターン
- 逆張りの的中率が高い傾向（7/10）← 自分パターン

---

##### L2 同帯×この試合（確定 — **偏りバーのみ。テキスト行にはしない**）

Free 市場タブ（全員分布）との **Pro 差別化の核**。ただし **偏りバー**（全員 vs 同帯の 2 本）で見れば分かるため、**タイミングのテキスト 1 行には出さない**。テキストは「自分の文脈」に集中させる。

| 項目 | 内容 |
|---|---|
| 定義 | 先週日曜アンカー時点で ±5 位にいたユーザーが、**この `gameId`** で選んでいる勝敗分布 |
| 表示 | オーバーレイ内の **偏りバー**（Free 全員バーの下に Pro 同帯バーを追加）。テキスト化しない |
| 最小 N | 帯内 **8 投稿** 未満はバー非表示 |
| API（案） | `GET /api/rankings/shadow/match-bias?gameId=...&league=...` |
| キャッシュ | Shadow と同じ週アンカー + 日次キャッシュ |
| 実装 | `posts` × 先週日曜 `rankSnapshotHistory` をサーバー集計（クライアント直読不可） |

---

##### L3 チーム文脈（確定 — **チームカード内のチップ**）

ユーザーでも帯でもなく **試合のチーム属性**（公開の試合結果・順位・日程から算出。推奨ではなく事実）。  
各チームカードの下段にチップで表示。

**コア（v1・両リーグ共通）**

| チップ ID | データ源 | 例 | トーン |
|---|---|---|---|
| `recentForm` | `lastGames` / 過去結果 | 直近5: 3-2 | up/down/neutral |
| `winStreak` | 直近結果から算出 | 3連勝中 | up |
| `loseStreak` | 連勝の対称 | 3連敗中 | down |
| `giantKilling` | 順位差付き勝利（集計） | 格上撃破 2/4 | up |
| `recentUpset` | 同上（直近） | Upset 2 | up |

**NBA 拡充（v1.1・確定）** — 予想フォームで特に効く事実系。最大3チップの選抜対象に含める。

| チップ ID | データ源 | 例 | トーン |
|---|---|---|---|
| `sideForm` | ホーム/アウェイ別の直近 | 直近ホーム 4-1 / 直近アウェイ 1-4 | up/down |
| `vsTop` | 対上位（例 Top10 / 勝率上位）の戦績 | vs Top10 1-4 | 通常 down寄り、優勢なら up |
| `rest` | 試合日程（B2B / 3-in-4） | B2B / 3-in-4 / 休養3日+ | down（疲労）/ up（休養） |

**Pro Info では出さない（チームスタッツ側）:** 得点/失点/得失点差などの数値傾向（旧 `scoringSkew` 案）。予想オーバーレイは試合前の文脈に集中し、スタッツは既存のチーム詳細・H2H 等で見せる。

選抜優先度（高いほど残りやすい）:
1. `rest`（今夜の試合に直結）
2. `winStreak` / `loseStreak`（≥2）
3. `sideForm`（該当サイドの試合時）
4. `vsTop` / `giantKilling` / `recentUpset`
5. `recentForm`（他が無いときのフォールバック）

除外（引き続き）: 「西に強い」等の粗い対戦相手カテゴリ（サンプル不足・説明コスト高）。

閾値: フォーム系は終了試合 **3+**。`rest` は当試合の日程だけで可。チップは 1 チームあたり **最大 5 個**（`MAX_TEAM_CONTEXTS`）。

---

##### Pro Info 情報設計（v2 確定 — **予想補助チェックリスト**）

> 旧案「両チーム常時カード（自分成績 + チーム調子チップ）」は撤回。  
> 理由: デザインがタブ群と合わず、チーム調子は Injury / Team Stats / Roster と重複し、**今夜の投稿判断に落ちにくい**。

**役割（1文）**

> Pro Info = **Free にない一段上の合成事実**（試合条件 × チーム切片 × あなた）を、最大数行で見せる。  
> 推奨スコアは出さない。母数が薄いときは沈黙。

**Free / Pro の境界**

| 層 | 置き場 | 中身 |
|---|---|---|
| 試合の事実 | Injury / Team Stats / Roster | 欠場・SEASON/L10・ロスター |
| 市場の偏り | カード上の偏りバー | Free 全員 / Pro 同帯（L2） |
| 予想の補助 | **Pro Info** | 合成・ユーザー掛け合わせのみ |

---

##### 行候補（第1弾・確定）

| 優先 | ID | 合成 | 条件 | 例 |
|---|---|---|---|---|
| 1 | `injuryContext` | 主力 OUT × 欠場時チーム成績 | 今夜 Top2 スコアラーが OUT、かつ without 母数 ≥ 閾値 | `AD OUT · LAL w/o AD 3-9 (n=12)` |
| 2 | `restContext` | B2B/3-in-4 ×（任意）その条件の成績 | 今夜該当。成績切片は母数あれば | `AWAY · B2B` / `Away B2B 2-7 (n=9)` |
| 3 | `youVsTeam` | あなた × そのチーム | 母数 ≥ 5 | `vs LAL 1/5 (20%)` |
| 4 | `youVsSide` | あなた × Home/Away 予想 | 今夜のサイドに該当、母数 ≥ 8 | `Your away picks 38% (n=24)` |
| 5 | `vsBand` | 相手帯への強さ（今夜の相手に該当する1系統のみ） | 帯対戦 ≥ 5 | `vs Top10 2-6` / `vs sub-.500 18-4` |

選抜: **最大 3 行**。上から埋める。該当ゼロ → ブロック全体非表示。

**出さない**

| 項目 | 扱い |
|---|---|
| Free と同じ生スタッツの再掲 | 禁止 |
| 大会平均並記 / 「得意・苦手」強ラベル | 禁止 |
| 同帯の寄りテキスト | 偏りバーのみ |
| 推奨予想・推奨スコア | 禁止 |
| FIRE/HOT 等の情緒バッジ | 禁止 |

---

##### `injuryContext` — 主力定義・算出・序盤

**主力 = チームのシーズン PPG Top 2**（同点は MPG 降順）。  
今夜 Injury でその選手が **OUT**（v1 は OUT のみ。Questionable は対象外）。

**BDL には without-player 分割はない。** 自前集計:

1. Injury → 今夜 OUT の選手 ID
2. シーズン平均 PPG で Top2 判定（その選手が Top2 なら続く）
3. 今季試合一覧 × box/stats で「その選手 min≈0 / 不出場」を欠場試合とする
4. 欠場試合の W-L（任意 NET）をキャッシュ `teamId+playerId+season`
5. 表示: `{PLAYER} OUT · {TEAM} w/o {PLAYER} {W}-{L} (n={N})`

**母数・シーズン序盤（沈黙ルール・確定）**

| 指標 | 沈黙 | 出す | 備考 |
|---|---|---|---|
| チームの消化試合 | < 15 | ≥ 15 | リーグ序盤は合成行を抑える |
| `injuryContext` without n | < 5 | ≥ 5 | 序盤はほぼ不出 |
| `vsBand` 帯対戦 | < 5 | ≥ 5 | |
| `youVsTeam` | < 5 | ≥ 5 | ユーザー側。シーズン暦とは独立 |
| `youVsSide` | < 8 | ≥ 8 | やや厳しめ |
| `restContext` 日程ラベル | 日程があれば常時可 | — | 「B2B」事実だけなら母数不要 |
| `restContext` + 成績切片 | その条件 n < 5 | ≥ 5 | 足りなければラベルのみ |

序盤の振る舞い:

- **試合 0〜14:** Pro Info はほぼ `restContext`（日程）と、十分な `youVs*` だけ。`injuryContext` / `vsBand` は原則沈黙
- **試合 15+ だが without n<5:** Injury Free タブはあるが、Pro の合成行は出さない（「データ少」で埋めない）
- 沈黙メッセージやティーザーは出さない（空なら枠ごと消す）

近似の限界（許容）: ロードマネジメント・トレード前欠場も without に混ざる。コピーは事実＋`n=` のみ。

---

##### `vsBand` 定義（v1）

今夜の相手に合わせて **1 系統だけ**:

| 相手 | 出す行 |
|---|---|
| 勝率上位 10 or シード相当 | `vs Top10 W-L` |
| 勝率 .500 未満 | `vs sub-.500 W-L` |
| それ以外（中位） | 出さない |

---

**表示ルール**

- レイアウト: **縦リスト 1 カラム**（2チーム並列カードはやめる）
- 見出し: `Pro` / `Before you pick`（JA: `投稿前チェック`）
- 色: 弱い自分成績のみ控えめ down。強ラベル語は使わない

**ワイヤー**

```
┌─ Pro · Before you pick ───────────┐
│ AD OUT · LAL w/o AD 3-9 (n=12)    │  ← injuryContext
│ AWAY · B2B                        │  ← restContext
│ vs LAL 1/5 (20%)                  │  ← youVsTeam
└───────────────────────────────────┘
```

**UI 実装は情報設計確定後**（次フェーズ）。プレビューの現行2カードは暫定。

##### NBA 予想ツールタブ（レギュラー確定）

WC / ポストシーズンとは分ける。レギュラーでは「直接対決・試合展望・過去試合・市場タブ」は使わない（市場はカード上の偏りバーで足りる）。

| 順 | タブ（英語・ランキング同型の斜めタブ） | 役割 |
|---|---|---|
| 1 | `Injury Report` | 当日欠場・疑問。予想に直結する事実 |
| 2 | `Team Stats` | 既存 `GameTeamStats`。得失点・効率などの土台 |
| 3 | `Roster` | 主力・役割の一覧 |

- ラベルはランキング（Playoffs / Bracket）と同様 **常に英語**
- UI は `CyberSlantedTab` / `CyberSlantedTabBar`（シアン・skew）を流用
- ポストシーズンは従来どおり **直接対決 / 市場 / Team Stats** を維持してよい
- データ源は将来 BallDontLie（サーバ同期 → Firestore キャッシュ → フォーム読み取り）
- **3 タブは Free 含む全員向け**（予想の参考情報）。Pro 専用は Pro Info パネル（自分の成績・同帯など）側

##### Injury Report パネル（UI 確定・参考カードデザイン）

参考モック（縦リスト・ステータスカラーカード）に合わせて実装。見出しタイトルはタブ側のみ。

```
┌─────┬──────────────────┬────────┐
│ LJ  │ LEBRON …         │   X    │  OUT (pink)
│ LAL │ FOOT / …         │  OUT   │
│     │ EXPECTED: 2 WEEKS│        │
└─────┴──────────────────┴────────┘
```

| 要素 | 仕様 |
|---|---|
| レイアウト | 縦並びカード（HOME/AWAY を1リストにフラット化） |
| 左 | イニシャル枠 + チーム略称バッジ（ステータス色） |
| 中央 | 氏名 / 部位詳細 / `EXPECTED:` 復帰目安 |
| 右 | ステータスアイコン + ラベル（OUT / QUESTIONABLE / PROBABLE / AVAILABLE） |
| 枠 | ステータス色ボーダー + 右下ノッチ |
| 型 | BDL `player_injuries` 寄せ `lib/predict/nbaInjuryReport.ts` |

実装: `NbaInjuryReportPanel` + `nbaInjuryReportPreviewMocks`（`/dev/predict-timing-preview`）

##### Team Stats パネル（プレビュー・コア + Pace / SEASON · LAST10）

既存 `GameTeamStats` と同系の左右比較バー。ラベルは英語（Oxanium）、数値は既存メトリックフォント。

**内部タブ（Free）:** `LAST 10` | `SEASON`（初期は LAST 10）

| 行 | ラベル | Season | Last 10 |
|---|---|---|---|
| 平均得点 | `PPG` | ○ | ○ |
| 攻撃効率 | `ORTG` | ○ | ○ |
| 平均失点 | `PAPG` | ○ | ○ |
| 守備効率 | `DRTG` | ○ | ○ |
| 得失点差 | `DIFF` | ○ | ○ |
| ネット | `NETRTG` | ○ | ○ |
| ペース | `PACE` | ○ | ○ |
| ホーム戦績 | `HOME`（% + W-L） | ○ | — |
| アウェイ戦績 | `AWAY`（% + W-L） | ○ | — |
| 直近戦績 | `L10`（% + W-L） | — | ○ |

**Pro（確定）:**
- `LAST 10` タブで主数値の下は縦1列: `SZN ±x.x` → `#n`（順位があれば）
- FIRE/HOT 等の情緒バッジは置かない（順位で足りる）

データは mock（Season は BDL team averages、Last10 は試合ログ自前集計の想定）。実装: `NbaTeamStatsPanel` + `nbaTeamStatsPreviewMocks` + `nbaTeamStatsForm`。

##### Roster パネル（プレビュー・参考テーブル UI）

**全員向け。** HOME ブロックの下に AWAY（縦積み）。参考デザイン: HOME=シアン / AWAY=紫のカードテーブル。

並び（確定）:
1. **スターター**を上
2. その中・外とも **MPG（平均出場分）降順**
3. 同点なら **GP 降順**

※ GP より MPG を優先 — 「今夜どれくらい出るか」の方が予想に効く。GP は怪我明け・試合消化の参考で第2キー。

| 列 | 内容 |
|---|---|
| `#` | 背番号（固定左） |
| Player | `L.JAMES` + Injury 該当時はステータスチップ（OUT 等） |
| Pos | ポジション（名前の直後・詰め） |
| 横スクロール | `GP / MIN / PTS / REB / AST`（列は後で増減可） |

Injury 連動: `injuryReport` を渡すと report 上の選手（Available 除く）にチップ表示。

実装: `NbaRosterPanel` + `nbaRoster` / `nbaRosterPreviewMocks`（`/dev/predict-timing-preview`）

**Pro オーバーレイの枠色（確定 — 差分ゴールド）**

| 要素 | Free | Pro |
|---|---|---|
| HUD 外枠・隅カッコ | シアン | **ゴールド**（`PREDICT_HUD_PRO_SHELL_CLASS`） |
| MatchCard / フォーム | シアン | **シアン維持**（操作 UI は変えない） |
| 同帯バー | — | amber（既存） |
| Pro Info パネル | 非表示 | ゴールド帯（タイトル + サブのみ、バッジなし） |

ゴールドは `ProCyberBadge` と同系（`#d4af5a` 周辺）。全面ゴールド化はしない。

**実装ファイル（型）**

| パス | 役割 |
|---|---|
| `lib/predict/predictTeamIntel.ts` | チームインテル型・tone・連勝算出・閾値 |
| `lib/predict/predictTimingPreviewMocks.ts` | プレビュー用 mock（teamIntel + selfPattern） |
| `app/component/predict/dev/PredictTimingOverlayPreview.tsx` | 2 カラムカード UI |

**閾値**

| 種別 | 最小投稿数 |
|---|---|
| チーム勝率表示 | 5（`MIN_TEAM_PERSONAL_POSTS`） |
| アウェイ / Upset パターン | 8 |
| チーム文脈チップ | 終了試合 3 |

---

##### 自分パターン行（優先度）

チームカードで拾えない自己傾向を、**最大 1 行**で下段に。

1. **L1** アウェイ苦手
2. **L1** Upset 癖（逆張り得意）

---

##### UI・ゲート（確定）

| 項目 | 内容 |
|---|---|
| 配置 | 予想オーバーレイ内・**試合カードの下 / スコア予想フォームの上** に Pro Info パネル |
| Pro Info | 両チームカード（常時）+ 自分パターン 1 行（任意）|
| 偏りバー | 試合カード内（全員 Free / 同帯 Pro）|
| ゲート | **Pro のみ**（Free 非表示・ティーザーなし） |
| 展開 UI | v1 ではなし |

**dev プレビュー（推奨 — RIVAL と同じ進め方）**

本番フォームより **先に** `/dev/predict-timing-preview` を作る。

| 理由 | 説明 |
|---|---|
| コピー調整 | L1/L2/L3 で 1 行に収まるか、優先度の切り替えが自然かを試せる |
| データ未接続でも進む | mock `context_cache` + mock match-bias で全パターン表示 |
| 本番リスク回避 | `PredictionFormV2` はパイプライン完成まで触らない |

**プレビュー構成（Phase A 完了）**

```
/dev/predict-timing-preview
├── 予想オーバーレイ mock（MatchCard + 市場棒 + Pro Info 帯 + タブ + スコア予想）
├── プリセット切替（L1/L2/L3 / 沈黙）
└── 開発メモ（折りたたみ）
```

旧「ミニフォーム + Rule debug のみ」は廃止。**オーバーレイ上に情報を載せる**イメージを確認する用途。

| 段階 | 接続 |
|---|---|
| Phase A | mock のみ（UI・i18n・優先度） |
| Phase B | 実 `context_cache` 読み取り（ログイン Pro ユーザー） |
| Phase C | L2 API + L3 チーム集計 |
| Phase D | `PredictionFormV2` 本番（feature flag → 全 Pro） |

**実装ファイル**

| パス | 役割 | 状態 |
|---|---|---|
| `lib/stats/userStatsV2ContextCache.ts` | 型・contextId 解決・派生値 | 型のみ |
| `lib/predict/predictTimingAdviceTypes.ts` | 共有型 | 完了 |
| `lib/predict/buildPredictTimingAdviceV1.ts` | v1 優先度ルール + debug eval | 完了 |
| `lib/predict/formatPredictTimingAdvice.ts` | i18n フォーマット | 完了 |
| `lib/predict/predictTimingPreviewMocks.ts` | プレビュー用 mock | 完了 |
| `functions/src/updateUserStatsV2.ts` | daily + context_cache increment | 未 |
| `lib/predict/buildPredictTimingAdvice.ts` | レガシー（月次参照） | 本番未切替 |
| `lib/predict/usePredictTimingAdvice.ts` | データ取得・Pro 判定 | ドラフト（月次参照） |
| `app/component/predict/PredictTimingAdviceLine.tsx` | 1 行 UI | 完了 |
| `app/component/predict/dev/PredictTimingOverlayPreview.tsx` | オーバーレイ mock シェル | 完了 |
| `app/dev/predict-timing-preview/page.tsx` | dev プレビュー | **Phase A 完了** |
| `PredictionFormV2.tsx` | 本番配置 | Phase D |

---

### Layer C — 定期配信・記憶

| 機能 | 頻度 | 内容 |
|---|---|---|
| Shadow サマリー | 週 1 | 先週同帯との差、帯の動き |
| Pro Stats レポート | 月 1 | 月次の総合振り返り（既存 Subscribe リストの分析を 1 冊に） |
| **大会 / シーズン振り返り** | 大会終了時 | WC・NBA 等のシーズン締めレポート（後述） |
| 順位帯アラート | イベント | TOP100 入り、帯落ち等（将来） |

**月次レポートに含める候補（既存 Subscribe ページより）**

- レーダーチャート、分析タイプ
- 指標別パーセンタイル
- 今月の傾向サマリー
- 月間パフォーマンス比較（平均・上位ユーザー）
- Upset / Home-Away / Market / チーム別 / 月別パフォーマンス

→ 個別カードの羅列より **「毎月届く 1 冊」** に束ねる。

---

#### 大会 / シーズン振り返り

月次レポートの「年間版」。**大会やシーズンが終わったタイミング**で届く、期間固定の総括レポート。

**対象例**

| イベント | タイミング | 内容の例 |
|---|---|---|
| **FIFA WC** | 大会終了後 | 最終順位、ステージ別成績、ベスト試合、得点者的中、連勝記録 |
| **NBA シーズン** | プレーオフ終了後 | シーズン順位推移、ラウンド別精度、プレーオフ成績 |
| **月間ランキング** | 月初（任意） | 月次 Pro Stats と統合 or 短縮版 |

**レポートに含める候補**

- 期間中の **最終順位・ベスト順位・TOP% の推移**
- **指標ハイライト**（最高連勝、最大 Upset、完全的中数）
- **得意チーム / 苦手チーム** Top 3
- **Shadow 的な振り返り** — 「序盤の帯 vs 終盤の帯で何が変わったか」
- **シェア用サマリーカード**（Pro バッジ・大会ロゴ付き）
- トロフィールームへ **大会トロフィー自動追加**（後述）

**Free / Pro の切り方（案）**

| | Free | Pro |
|---|---|---|
| 振り返り | 1 枚サマリー（最終順位 + ベスト指標 1 つ） | フルレポート + シェアカード |
| トロフィールームへの反映 | 基本バッジのみ | 大会トロフィー + マイルストーン展示 |

→ 月次は「今月」、大会振り返りは「あのシーズンの自分」— **解約しても残る記憶** として Pro 価値が高い。

---

#### トロフィールーム（プロフィール）

プロフィールに **実績を飾る専用スペース** を追加。既存のバッジ画面（`app/mobile/badges/`）を発展させる形。

**コンセプト**

> 予想の履歴を「トロフィー」として展示する。ランキングは毎日変わるが、トロフィールームは **残る実績**。

**展示物の種類**

| 種類 | 例 | 取得タイミング |
|---|---|---|
| **バッジ** | 既存 `master_badges` / `user_badges` | 条件達成時 |
| **大会トロフィー** | WC 2026 · 最終 48位、WC グループステージ TOP10% | 大会振り返り確定時 |
| **マイルストーン** | 初 TOP100、初完全的中、12 連勝 | 達成時 |
| **月間表彰** | 月間 TOP10 入賞（LP 訴求のプレゼント連動） | 月初確定時 |
| **シーズン称号** | 「Upset ハンター」「精度の鬼」等（分析タイプ由来） | シーズン振り返り時 |

**Pro 独自の見せ方**

- **展示棚 UI** — グリッドではなく棚 / ケース風（ラグジュアリー路線と統一）
- **ピン留め** — プロフィール上部 or 公開プロフィールに最大 3 つ展示
- **大会トロフィーの 3D 風 / ゴールド枠** — Pro スキンと同系統
- **未獲得のシルエット** — 「次に狙えるトロフィー」でモチベーション（自分だけ見える）

**Free / Pro の切り方（案）**

| | Free | Pro |
|---|---|---|
| バッジ一覧 | ○（既存） | ○ |
| トロフィールーム UI | シンプル一覧 | 展示棚 + ピン留め |
| 大会トロフィー | 非表示 or サムネのみ | フル表示 + 振り返りリンク |
| 公開プロフィールへの展示 | なし or 1 つ | 最大 3 つピン留め |
| シェアカード | なし | トロフィー単体シェア可 |

**既存資産との関係**

- バッジ: `useUserBadges`, `useMasterBadges`, `app/component/badges/`
- プロフィール: `ProfilePageBaseV2`, `WebProfileViewV2`
- 新規: トロフィー種別マスタ、シーズン終了時の付与ジョブ

**導線**

```
プロフィール
├─ Overview（既存）
├─ Stats（既存・Pro 分析）
├─ Trophy Room（新規）  ← Pro は展示棚、Free はバッジ一覧へフォールバック
└─ 大会振り返りは Trophy Room 内 or 通知から遷移
```

---

## 3. 載せないもの（今回の方針）

| 機能 | 理由 |
|---|---|
| **Momentum 専用画面** | Progress 10 点 + 必要なら 7 日デルタ 1 行で足りる |
| **Position 専用画面** | My Rank の TOP% / ギャップ / Progress で十分 |
| **Timing 常設画面** | 予想フォーム連動で足りる |

---

## 4. 画面・導線マップ

```
My Rank カード（毎日）
├─ TOP%
├─ 順位帯ギャップ
├─ Ranking Progress（Free 3 / Pro 10）
├─ 指標 HUD · dayDelta
└─ [Gap を見る] → Gap 画面

Gap 画面（差の構造）
├─ 得点分解 vs 上位帯
├─ 指標別の不足 / 強み
└─ 1 行アドバイス

Shadow 画面（匿名ライバル帯）※週次
├─ 先週の同帯との今週の差
├─ 帯のタイプ・特徴
└─ どこで差がついたか

予想フォーム（文脈表示）
├─ 得意チーム / 苦手チーム
├─ 試合形式との相性
└─ 今週の帯で効いている要素

プロフィール Stats（既存・Pro 分析）
├─ レーダー、Home/Away、Market、チーム別 …
└─ 「予想の癖・質」— Rank Intel とは役割分担

プロフィール Trophy Room（新規）
├─ バッジ / 大会トロフィー / マイルストーン
├─ Pro: 展示棚 + ピン留め（公開プロフィールに最大 3）
└─ 大会振り返りレポートへのリンク

定期配信
├─ 週次 Shadow サマリー
├─ 月次 Pro Stats レポート
└─ 大会 / シーズン振り返り（終了時）
```

**プロフィール Stats vs Rank Intel**

| | プロフィール Stats | Rank Intel |
|---|---|---|
| 問い | 自分の予想の質・癖は？ | 競争上、今どこにいて何が足りない？ |
| 例 | Home/Away、Market 傾向 | Gap、Shadow、帯比較 |

---

## 5. Free / Pro 境界（確定案）

| 機能 | Free | Pro |
|---|---|---|
| 試合予想・参加 | ○ | ○ |
| ランキング閲覧・現在順位 | ○ | ○ |
| 基本 4 指標 | ○ | ○ |
| 基本プロフィール | ○ | ○ |
| Ranking Progress | 3 点 | 10 点 |
| TOP% | ブラー or 非表示 | ○ |
| 順位帯ギャップ | 非表示 or `+??pt` | ○ |
| Gap（差の構造） | なし | ○ |
| Shadow（匿名ライバル帯） | なし | ○ |
| 予想フォーム文脈アドバイス | なし or 1 行のみ | ○ |
| プロフィール深掘り分析 | 限定 | フル |
| 週次サマリー / 月次レポート | なし | ○ |
| **大会 / シーズン振り返り** | 1 枚サマリーのみ | フル + シェアカード |
| **トロフィールーム** | バッジ一覧 | 展示棚 + ピン留め + 大会トロフィー |
| Pro バッジ・カードスキン | なし | ○ |

LP 上の既存訴求（`planComparisonRows`）との対応:

- ランキング詳細ビュー: Free limited / Pro full
- ランキング推移トレンド: Free none / Pro full → Progress 10 点
- コミュニティ比較・世界順位: Free none / Pro full → Shadow / Position 要素

---

## 6. 実装フェーズ（提案）

### Phase 1 — My Rank で Pro が伝わる

- [ ] `displayTier` / `isPro` の本番配線（`app/mobile/rankings/page.tsx`）
- [ ] TOP% 常時表示
- [ ] 順位帯ギャップ（`rankTierGap`）
- [ ] Ranking Progress 10 点（`rankSnapshotHistory`）
- [ ] Gap 画面への入口（中身は最小でも可）

### Phase 2 — Rank Intel 本体

- [ ] Gap: 得点分解 vs 上位帯 + アドバイス 1 行
- [ ] Shadow: 週次スナップショット + 同帯比較
- [ ] 予想フォーム: 得意チーム / 形式の 1 行ヒント — **実装済み**（`PredictTimingAdviceLine` / `usePredictTimingAdvice`）

### Phase 3 — 継続課金・ステータス

- [ ] 週次 Shadow サマリー（通知 or インボックス）
- [ ] 月次 Pro Stats レポート
- [ ] プロフィールカード ラグジュアリー化
- [ ] 順位帯アラート（任意）

### Phase 4 — 記憶・実績（大会期・シーズン終了に効く）

- [ ] トロフィールーム UI（プロフィール新タブ）
- [ ] 大会トロフィー種別 + 付与ロジック
- [ ] 大会 / シーズン振り返りレポート
- [ ] 公開プロフィールへのピン留め展示
- [ ] 振り返り・トロフィーのシェアカード

---

## 7. 関連ファイル（実装時）

| 領域 | パス |
|---|---|
| My Rank カード | `app/component/rankings/MyRankCard.tsx` |
| Pro 枠 | `app/component/rankings/MyRankCardFrame.tsx` |
| Ranking Progress | `app/component/rankings/MyRankRankingProgress.tsx` |
| Progress データ | `lib/rankings/myRankRankingProgress.ts` |
| 順位帯ギャップ | `lib/rankings/rankTierMilestone.ts` |
| Pro バッジ | `app/component/common/ProCyberBadge.tsx` |
| プレビュー | `app/dev/my-rank-free-pro-preview/page.tsx` |
| Subscribe UI | `app/mobile/pro/subscribe/page.tsx` |
| プロフィール Stats | `app/component/profile/useUserStatsV2.ts` |
| 得点分解 | `SummaryForCardsV2`（base / upset / streak / goalScorer） |
| バッジ（既存） | `app/component/badges/`, `useUserBadges`, `useMasterBadges` |
| プロフィール shell | `app/component/profile/ProfilePageBaseV2.tsx` |
| Shadow / RIVAL API | `app/api/rankings/shadow/route.ts` |
| Shadow 取得・キャッシュ | `lib/rankings/server/fetchRankShadowAnalysis.ts`, `lib/rankings/server/rankShadowCache.ts` |
| 週次区切り（日曜 JST） | `lib/rankings/rankShadowWeek.ts` |
| 週次デルタ | `lib/rankings/readRankShadowAnchorMetrics.ts` |
| history `metricValues` 拡張 | `functions/src/rankings/buildCumulativeRankingSnapshot.ts` |
| RIVAL UI | `app/component/rankings/gap/RankShadowView.tsx` 他 |
| 予想タイミング | `lib/predict/buildPredictTimingAdvice.ts`, `PredictTimingAdviceLine.tsx` |

---

## 8. 未決・次に詰めること

### 直近キュー（詳細は checklist §0）

- [ ] **課金導線**: Weekly / Monthly / Season Pass の選択 UI・価格・できること説明・成功モーダル/ページ
  - [x] 説明文ドラフト（[`preview-to-prod-checklist.md` §0.1.a](preview-to-prod-checklist.md#01a-課金ページ説明文確定ドラフト--2026-07-16)）
  - [x] デモUIは作らない（1週間お試しで代替）
  - [x] 7日無料トライアル文言・ルール（§0.1.b · Monthly 入口）
  - [ ] プレビュー UI 仕上げ〜本番 IAP/Stripe 接続
- [ ] **ランキング**: Weekly + Monthly 軸
- [ ] **レポート**: 月次に加え Weekly レポート
- [ ] **ライブ**: ライブ試合カード → ライブスタッツ
- [ ] **Pro Stats**: UI ブラッシュアップ + 要否選定・機能追加
- [ ] **招待ページ**: 招待人数が分かる画面

一覧・順序: [`preview-to-prod-checklist.md` §0](preview-to-prod-checklist.md#0-次の作業キュー優先順)

### その他

- [ ] Gap 画面ワイヤー（分解バーの UI）
- [x] Shadow の週次スナップショット定義 — **帯 ±5 位、日曜 JST 区切り、週次デルタ**
- [ ] 上位帯の集計方法（TOP20 平均 vs 次のマイルストーン帯）
- [ ] 予想フォーム連動の表示ルール（常時 vs 条件付き）
- [ ] Weekly / Monthly / Season Pass の価格・特典差の確定（旧「年額プラン」は Season Pass に寄せて再定義）
- [ ] Native パリティ（Pro 機能は `docs/native-parity-gaps.md` に追記予定）
- [ ] トロフィー種別マスタの設計（バッジとの統合 vs 別コレクション）
- [ ] 大会振り返りの自動生成タイミング（大会終了バッチ vs 手動トリガー）
- [ ] 公開プロフィールのピン留め上限・表示ルール

---

## 9. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-16 | 直近キュー（課金 3 プラン / 週次・月次 / ライブ / Pro Stats / 招待）を checklist §0 へ。本書 §8 にリンク |
| 2026-07-06 | 初版。ステータス UI、競争インテリジェンス 3 柱、Free/Pro 境界、フェーズ案を整理 |
| 2026-07-06 | 大会 / シーズン振り返り、プロフィール トロフィールームを Layer C / Phase 4 に追加 |
