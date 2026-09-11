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

Insight 表示: `欠場時 {W}-{L} · {得点}-{失点} · OFF {Δ} · DEF {Δ}`
（通算平均得点/失点との差分。poss 未集計のため真正 ORTG/DRTG ではない）
例: Jokic OUT · 前季欠場時 11-6 · 109.9-110.1 · OFF −5.3 · DEF +1.8

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

カレンダーと会場。感想は書かない。**差ファクト優先 → 無ければ片側負荷**。詳細 kind は [`pro-insight-generation-rules.md`](./pro-insight-generation-rules.md)。  
会場 TZ: `lib/nba/nbaTeamVenueTz.ts`。終了時刻: `games.finalAt`。Cup / 次が強豪 / OT回数は対象外。

短い移動は出さない（800km / 48h·2000km）。実装: `lib/nba/nbaArenaTravel.ts` · facts: `buildScheduleFacts.ts`。

---

## 6. CONTEXT（今夜の状況）

型の衝突ではないが、読みが変わるもの。MATCHUP / INJURY のケガ詳細は繰り返さない。  
正: [`pro-insight-generation-rules.md`](./pro-insight-generation-rules.md) · `buildContextFacts.ts`。

| 種類 | 出すとき | 例 |
|---|---|---|
| 直近相手強度 | 直近相手の平均勝率が硬い / 柔らかい | hard SOS · 連敗中でも強豪続き |
| 連勝/連敗の質 | ≥3 + その期間の相手勝率帯 | 強豪消化の連勝 / 雑魚狩りの連勝 |
| 会場連勝・連敗 | 今夜の home/away 側が ≥3 連続 | ホーム3連勝 |
| 点差プロファイル | 直近≤10・接戦≤5 / 大差≥15 の偏り | 勝ちはほとんど接戦 |
| 対勝率帯 | 今夜相手の帯に応じた自成績が極端 | vs top6 · vs under .500 |
| last10 レーティング | season vs last10 の NET/ORTG/DRTG ズレ | OF 好調 / DF 崩壊 |
| クラッチ | clutchNet と season NET のズレ | クラッチだけ弱い |
| 直近 3P | last10 3P% が明確に上 | 3P ホット |
| 会場スプリット | 今夜会場の season が極端（低優先） | ホーム極端 |

復帰・デビュー・次が強豪・`multi_out` は今スコープ外（後者は INJURY）。

---

## 6.5. PLAYERS（選手単位）

チーム型の左右比較とは別に、**今夜効きそうな選手を各サイド最大 2 本**。Injury 名簿の代わりではない。

| 種類 | 見る数字 | 出すとき |
|---|---|---|
| PAINT EDGE | 選手ペイント得点 / PAINT% × 相手守備（`oppEfgPct` 代理） | 衝突スコアが高い |
| 3-POINT EDGE | 選手 3PM / 3P% × 相手被3P | 衝突スコアが高い |
| LAST 10 FORM | last10 得点順位 vs 今季 | 直近が明確に上振れ |
| HOT 3PT | last10 3P% | 直近 Top 寄り |

- ソース: `nbaLeaguePlayerStats` leaders（season + last10）+ チームリーグ表
- opening は出さない（選手今季サンプル不足）
- 勝者・「この選手が決める」は書かない
- ケガ名簿は INJURY タブ。PLAYERS に OUT 名を並べない（MATCHUP 折り込みと役割分担）

---

## 7. 選び方・更新タイミング

種類ごとに点数（衝突の大きさ **または** 欠場インパクト）を付け、各サイド上位 2 本。言い回しをランダムに回さない。同じ試合は同じ行。穴埋め（`{rank}` `{player}` `{km}`）。

### 生成・保存（全ユーザー共通スナップショット）

```
前日 20:00 JST Batch 投入 → games/{gameId}.proInsightNarrative（初版）
tip 1h 前 → injury 変更時のみ Chat 再生成
クライアント → Firestore / 公開 API を読むだけ（開くたびに再計算しない）
```

| いつ | 何をする |
|---|---|
| **毎日 20:00 JST** | 翌日窓の試合を OpenAI Batch でナラティブ初版投入（`batch_submit`）。**21:00 までに初版表示**を目標（15 分 poll）。**プレシーズンは対象外** |
| **tip 1h 前** | injury ステータス指紋が変わった試合だけ Chat で再生成（`narrative_patch`） |
| **15 分ごと** | Batch 完了ポーリング（`batch_poll`） |

公開 API: `GET /api/nba/matchup-insight?gameId=`（Pro · Bearer）→ `narrative` / `status`（`ready` | `pending` | `empty`）。全 Pro ユーザー共通スナップショット。

LLM なし。コスト ≈ $0（Cloud Functions / Next の CPU のみ）。

---

## 8. 実装メモ

- 生成: `lib/nba/insights/*`
- 完成品: `games/{gameId}.proBrief`（`liveStats` と同じ置き場）
- 公開: `GET /api/nba/matchup-insight?gameId=`
- 管理: `POST /api/admin/nba-pro-brief-ingest`（`mode: "batch_submit" | "batch_poll" | "narrative_patch" | "full" | "patch"`）
- 表示前: `sanitizeProBriefForDisplay`
- Brief 型: `lib/predict/predictProBrief.ts`
- iOS / Web は同じ Firestore brief を読む
