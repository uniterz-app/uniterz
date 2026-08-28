# Pro Insight 設計

> **設計正** — 現行実装と差分があっても、本ドキュメントの方向で進める。  
> 最終更新: 2026-08-28  
> 対象: NBA 予想オーバーレイの INSIGHT タブ  
> UI: `PredictProBriefPanel` / `PredictProBriefPanelNative`  
> 関連: [`preview-to-prod-checklist.md`](preview-to-prod-checklist.md) · [`pro-subscription-plan.md`](pro-subscription-plan.md)

---

## 1. 何を出す場所か

名簿やスタッツ表のコピーではない。**今夜の読みを、HOME / AWAY で左右に最大 2 本**出す。

| タブ | 役割 |
|---|---|
| INJURY | 欠場者の名簿 |
| STATS / ROSTER | 表 |
| **INSIGHT** | それが今夜の試合をどう変えるか |

タブは Free でも見える。Pro は中身が読める。Free はぼかして「Pro を見る」。試合開始前の NBA 予想オーバーレイのみ。

見た目: 背景黒、枠は PRO バッジと同じ金（`UNITERZ_PRO_BADGE_GOLD.mid`）。

---

## 2. 出さないもの

- 「こっちが勝つ」
- 推奨スコア・鉄板・絶対
- 他ユーザーの予想
- Pro だけの加点・Unit 増量
- Injury Impact という 4 つ目の枠
- 短い移動の km（近所のロード）

Pay-for-Insight。Pay to Win はしない。LLM は使わない（テンプレ穴埋めのみ・コスト ≈ $0）。

---

## 3. シーズン進行フェーズ（スタッツの扱い）

`gamesPlayed = wins + losses`（今夜より前に消化した試合数）。

| フェーズ | 条件 | MATCHUP / CONTEXT の材料 |
|---|---|---|
| **opening** | `gamesPlayed === 0`（開幕戦） | **前季のみ**: 会場成績・H2H・上位対戦・前季型＋今夜の欠場 |
| **early** | `1 ≤ gamesPlayed ≤ 4`（今夜が 2〜5 試合目） | **今季累計**（1..N）。順位も出してよい。**カード全体にサンプル注記必須** |
| **full** | `gamesPlayed ≥ 5`（今夜が 6 試合目以降） | **今季スタッツ正式扱い**。注記なし |

### early 注記（カード全体に 1 回）

- ja: `※ 開幕{N}試合時点 · サンプル少 · 上振れの可能性あり`
- en: `※ Through {N} games · small sample · may regress`

`N = gamesPlayed`（消化済み試合数）。

### 積み上げは early も full も同じ

2 試合目→1 試合分、3 試合目→1〜2、… と累計。違うのは「正式シーズンとして断言してよいか」と注記の有無。

---

## 4. MATCHUP（型 vs 型）

相手の数字とぶつかった行だけが目玉。片方の自慢は STATS に任せる。

### 乗る道は 2 つ（OR。AND ではない）

1. **型の衝突が大きい** — 自分の得意 × 相手の穴（またはその逆）。欠場は無くてよい。
2. **欠場インパクトが大きい** — そのスタッツを厚く担う選手が OUT / QUES。相手とのランク差が小さくても出す。

差だけ見てから欠場を足す、ではない。衝突が弱い日は MATCHUP を 1 本にしてよい。

### 欠場の折り込み（全種類に共通）

ペイント / 3P / コーナー3 / リム / リバウンド / TO / FT / トランジション / プレイタイプのどれでも、その型を厚く担う選手が OUT / QUES なら **同じ 1 本に折り込む**。

薄い関与の欠場は MATCHUP に足さない → CONTEXT のローテ。  
Probable は型を消さない（「残る」まで）。  
同じケガを CONTEXT に繰り返さない。

### opening 専用の MATCHUP 候補

前季 `games` 集計（`nbaTeamSeasonRecords/{priorSeason}`）が正:

- 前季ホーム / アウェイ成績
- 前季 H2H（シリーズ・この会場）
- 前季カンファレンス上位6との会場成績（**試合時点の順位**）
- 前季 勝率5割以上 / 未満相手（**試合時点の相手勝率**。最終勝率では遡及しない）
- 前季の型ランク ＋ 今夜の欠場
- **エース欠場時 W–L**（`nbaTeamAceOutRecords`）— 今夜 OUT の選手がその季のチーム最高 PPG なら、欠場試合のチーム成績を MATCHUP / CONTEXT に折り込む

### エース欠場時 W–L（別 ingest）

BDL に専用フィールドは無い。自前集計:

1. エース = BDL leaders `pts` の PPG（所属は **season stats の出場チーム多数決**。leaders の `team_id` は現所属なので使わない）
2. curated キー選手（`aceOutCuratedPlayers.ts`）を同チームに追加。`preferAsAce` は主エース表示を上書き
3. BDL `/nba/v1/stats` でその選手がそのチームで出場した gameId（min>0）
4. チームのレギュラー確定試合 − 出場 = 欠場試合 → **W–L + 平均得点 + 平均失点**
5. Firestore `nbaTeamAceOutRecords/{season}` → 公開 API は読むだけ

Insight 表示: `欠場時 {W}-{L} · {得点}-{失点}`（例: Jokic OUT · 前季欠場時 11-6 · 109.9-110.1）

```
npx tsx scripts/ingest-nba-team-ace-out-records.ts 2025-26 --force
```

今季（例: 2026-27）は開幕後に同じ指標を「今季」表記で使う。未開幕は集計しない。

### early / full の種類

同じ系統は 1 本まで（ペイントとリムはまとめる）。

| 種類 | 見る数字 | 衝突として出すとき |
|---|---|---|
| ペイント | ペイント得点 / 得点比 vs 相手のペイント失点・リム FG% | 差が大きい |
| 3P量 | 3PA率 vs 相手被3P / 被3P% | 量か精度の差が大きい |
| コーナー3 | コーナー3% vs 相手のコーナー守備 | 片方だけ極端 |
| リム | RA FG% vs 相手のリム守備・ブロック | サイズの衝突 |
| リバウンド | OREB% vs 相手 DREB% | ガラスが偏る |
| ターンオーバー | TOV% vs 相手の強制 TO | 雑さ vs 狩る側 |
| フリースロー | FTA率 vs 相手のファウル | 差が大きい |
| トランジション | FB得点 vs 相手の被FB | 走る側 vs 遅れる側 |
| プレイタイプ | ISO / PnR / ポストの頻度×PPP vs 相手のその守備 | 依存度が高い型だけ |
| Net / レーティング | NET / ORTG vs 相手 DRTG | 全体効率の差が明確 |

---

## 5. SCHEDULE（負荷）

カレンダーと会場。感想は書かない。差がある行だけ。プレシーズンは「プレ」。全フェーズ共通。

| 種類 | 出すとき | 例 |
|---|---|---|
| 休養差 | 片方が B2B、もう片方は 2 日以上 | B2B · 相手は休養 3 日 |
| 3-in-4 / 4-in-6 | 該当する側だけ | 4 日で 3 試合目 |
| ホーム / ロード連戦 | 3 試合以上 | ホーム連戦 3 試合目 |
| 今夜の移動 | **800km 以上** | `BOS→DET` / 移動距離 984km |
| 48 時間移動 | **2 本以上かつ合計 2,000km 以上** | `48時間` / 移動距離 4,270km |
| 時差 | 短休養で 2 ゾーン以上 | 東→西 · 時差 3 時間 |
| 高地 | アウェイが DEN | 高地 · DEN |
| 前試合の負荷 | 延長、または主力 2 人以上が 36 分超 | 前試合 OT · 主力 36 分超 |
| 開幕・プレ | 開幕戦のみ | 開幕戦 · プレ最終から 4 日 |
| ホーム | 移動なしのとき | ホーム · 移動なし |

短い移動は出さない。実装: `lib/nba/nbaArenaTravel.ts`。

---

## 6. CONTEXT（今夜の状況）

型の衝突ではないが、読みが変わるもの。MATCHUP に書いたケガは繰り返さない。

| 種類 | 出すとき | 例 |
|---|---|---|
| ローテ欠場 | 型を書き換えない OUT / QUES | Ausar QUES · 守備ローテが薄い |
| 復帰・デビュー | 初戦、長期離脱明け、分管理 | George QUES · デビューは負荷管理 |
| 直近の傾き | シーズンと直近 10 で NET / ORTG が明確にズレ | 直近 10 · NET がシーズンより下落 |
| 相手の強度 | 直近 3〜10 が格下続き、または強豪続き | 直近 3 · 相手は勝率 5 割未満 |
| 対上位 | 勝率 5 割超や上位に偏った成績 | 格上に直近 1-4 |
| ホーム / アウェイの偏り | 今の会場で極端 | 前季アウェイ強豪戦 25-16（opening） |
| 複数欠場 | スターター 2 人以上 OUT（MATCHUP に無いとき） | スターター 2 人 OUT · 作成が分散 |

---

## 7. 選び方・更新タイミング

種類ごとに点数（衝突の大きさ **または** 欠場インパクト）を付け、各サイド上位 2 本。言い回しをランダムに回さない。同じ試合は同じ行。穴埋め（`{rank}` `{player}` `{km}`）。

### 生成・保存（全ユーザー共通スナップショット）

```
前日フル生成 → games/{gameId}.proBrief
T-3h（試合開始 3 時間前）→ ケガ・連戦・移動だけ差し替え
クライアント → Firestore / 公開 API を読むだけ（開くたびに再計算しない）
```

| いつ | 何をする |
|---|---|
| **前日**（日次 ingest 後） | MATCHUP / SCHEDULE / CONTEXT をフル生成して保存 |
| **T-3h** | injury 折り込み・CONTEXT 欠場・SCHEDULE だけパッチ |

LLM なし。コスト ≈ $0（Cloud Functions / Next の CPU のみ）。

---

## 8. 実装メモ

- 生成: `lib/nba/insights/*`
- 完成品: `games/{gameId}.proBrief`（`liveStats` と同じ置き場）
- 公開: `GET /api/nba/matchup-insight?gameId=`
- 管理: `POST /api/admin/nba-pro-brief-ingest`（`mode: "full" | "patch"`）
- 表示前: `sanitizeProBriefForDisplay`
- Brief 型: `lib/predict/predictProBrief.ts`
- iOS / Web は同じ Firestore brief を読む
