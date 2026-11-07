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

Free × PREVIEW のある試合（ピックアップ）は、PREVIEW 第 1 段落の冒頭 1 文だけ見せて続きをぼかし、「7日無料で続きを読む」（Native 1.0.5〜・回数制限なし）。`/api/nba/matchup-insight?teaser=1` が Free に冒頭 1 文だけ返す（1 文目が短いときだけ 2 文目まで。続き・各セクションはサーバーから出さない）。PREVIEW の無い試合は従来のゲート（ボタンは「7日無料で試す」）。

見た目: 背景黒、枠は PRO バッジと同じ金（`UNITERZ_PRO_BADGE_GOLD.mid`）。

---

## 2. 出さないもの

- 「こっちが勝つ」
- 推奨スコア・鉄板・絶対
- 他ユーザーの予想
- Pro だけの加点・Unit 増量
- Injury Impact という 4 つ目の枠
- 短い移動の km（近所のロード）

Pay-for-Insight。Pay to Win はしない。選定はコード。MATCHUP の文章はテンプレ（コード）、SCHEDULE / CONTEXT / INJURY IMPACT の文章は OpenAI（Batch · `gpt-4o-mini`）で 9 言語化。

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

## 6.6. PREVIEW（展望の文章・INSIGHT の一番上）

**ピックアップの試合だけ**（`isNbaPickupGame`。それ以外は材料を読まず LLM も呼ばない）。スタッツを並べるのではなく、データをつないで一歩先の展望を 4 段落で書く（例: 「相手はガードに失点が多い × このガードはアイソ・ミドルがリーグ首位 → 大量得点の目」）。勝敗・最終スコアの断定はしない。個人の数字の見込みは理由付きなら書く。表・枠（MATCHUP 以下）はその下に残す。

| 段落 | 中身 |
|---|---|
| 1. 試合の形 | ペース（ポゼッション数）、攻守の質、最大の型の相性 → どんな試合になりやすいか |
| 2. 個人の狙い目 | 1〜3 人。得意（リーグ上位のプレー・使用率・直近 5 試合）× 今夜の相手のそのポジション / プレーへの弱さ × 欠場で増える負担 |
| 3. ディフィカルティと条件 | 欠場（何が抜けるか）・欠場込みの厳しさ・連戦・移動・長時間出場 → 終盤に何が変わるか |
| 4. 前回・前の試合から | 上の読みの裏付け / 反証と、今夜の注目点（試合中に見える兆し） |

- 分析材料（`lib/nba/insights/proInsightFacts/buildOutlookAnalysis.ts` + `loadOutlookAnalysis.ts`。生成時に計算して `proInsightFacts.preview.analysis` に保存）:
  - チーム: リーグ表の ORtg / DRtg / Net / ペース / 3PA / 3P% / 被3P% / TOV% / 強制TO の順位、L10
  - **ポジション別の失点**: 今季の全選手試合ログ（`nbaPlayerGameLogs/{season}/players`、1 ジョブ 1 回読み）を `oppTeamId` × ロスターのポジション（C を含む = C、F… = F、G… = G）で集計 → 1 試合あたりと 30 チーム順位
  - 主力 3 人（OUT / doubtful 除く・ppg 順）: 今季平均、直近 5 試合、シーズンハイ、`nbaPlayerSeasonMetrics` のリーグ 15 位以内の得意プレー（最大 4）、今季の対戦相手との平均、今夜の相手のそのポジションへの失点
  - **守りの読み**（`defensiveReads`）: そのポジションへの失点が 30 チーム中上位 5 で、同じポジションにブロック / スティール / リバウンドが全選手中 15 位以内の選手がいるとき、相手のそのポジションの得点源（平均 8 点以上・欠場除く・欠場者がいない試合での得点増も付ける）に厳しい、という 1 文。展望の 2 段落目に必ず入れる
  - 欠場: 平均 5 点以上の OUT / doubtful / questionable、**欠場時の得点の移り方**（欠場者が出ていない今季の試合での主力の平均 vs 出た試合。各 2 試合以上・差 3 点以上）
  - 順位には段階の語（top 5 / top 10 / middle — not a strength or weakness / bottom 10 / bottom 5、失点は「allows among the most — a clear weakness」等）を付けて渡す。中位を強み・弱みと書かせないため
  - MATCHUP 表の行は、攻めが上位 10 か守りが下位 10 のものだけ渡す（順位差だけで拾われた中位同士の行は外す）。各行は持ち主のチームを主語にした文（「PACERS give up a lot of second-chance points」）にし、同じ文を `teams[].styleStrengths` / `styleWeaknesses` にも入れる。片側が中位の行は「中位側を弱い・強いと書かない」を文に含める。どちらのチームの弱点かを LLM が取り違えないため
- 材料シート（`buildPreviewOutlookSheet`・`lib/nba/insights/proInsightLlm/previewOutlook.ts`）: 上の分析 + MATCHUP 表（順位・欠場注記）、MATCHUP / SCHEDULE / CONTEXT / INJURY IMPACT の hintEn、Difficulty（会場込み・欠場込み）、連戦 2 日目のチーム、前回の対戦・前の試合の事実文（`previewTemplate.ts` の en。表示には使わない）
- 前回の対戦・前の試合の事実: `games`（2 チーム一致・終了・プレシーズン除く）+ `liveStats.box`。box が無い過去季は `nbaPlayerGameLogs/{season}` の `gameId` 一致行（無ければスコア・日付・対戦成績だけ）
- LLM: Chat 1 回で **ja / en だけ**（ほかの言語は表示側が en にフォールバック。出力が費用の大半のため。1 回 約 0.02 ドル）。モデル `OPENAI_PRO_INSIGHT_PREVIEW_MODEL`、既定 `gpt-4.1`。本文の Batch とは別。`writeNarrative` の保存直前に生成（Batch poll / 1h 前 patch / sync すべて）。poll は保存を並列化
- 長さ: 4 段落・各 2〜3 文・ja 1 段落 100〜150 字程度（2 段落目だけ 180 字まで・選手は 2〜3 人）・数字は 1 段落 4 つまで。全体 600 字前後（2026-11-08 ユーザー確定。90〜130 字は短すぎ、110〜180 字は長すぎ）
- ja の選手名はシートの形（「A.Edwards」）だけ。カタカナ・姓だけは禁止（表記が揃わず色付けも外れる）
- 生成タイミング: 20:00 の定時と、試合 1 時間前に injury 指紋が変わったときだけ。ルール変更後の手動作り直しは 1 試合で確認してから残り
- PREVIEW がある試合は CONTEXT の枠を出さない（材料は PREVIEW のシートに入っている）
- 保存は `mergeFields`（上位フィールドを丸ごと置き換え）。深いマージだと前回の preview の言語・消した枠が残る
- 数字ガード: シートに無い数字が出た言語は捨てて en を出す。ja / en が落ちたら 1 回だけ再生成（落ちた理由を渡す）、それでも駄目なら PREVIEW なし
- 「欠場なし」ガード: ja「離脱はない」「欠場がなく」「万全」等 / en「no absences」「full strength」等が出た言語も捨てる（injury の取り込み遅れで誤りになるため）
- 2 段落目は各チームの得点トップを必ず入れる（相手が中位でも本人の平均・直近 5・シーズンハイ・得意プレーで語る。「どこまで通用するか」等のぼかしは禁止）
- ポジション別の失点は上位 10 / 下位 10 だけシートに載せる（中位は `allowedByPosition` / `opponentVsPosition` から外す。載せると「平均的で弱点はない」と要らない一言を書くため）。それでも出た「弱点はない」「守備は平均的」「下位の失点を許す」は 1 回だけ書き直させ、2 回目は受け入れる
- ポジション守備の持ち主の照合: ja / en の「X のセンター守備は堅い」「X はフォワードへの失点が多い」をシートのポジション別失点と照合し、合わなければ書き直させる（エースの対比で相手チームの守りの評価を入れ替える誤りが半々で出る）。最後まで直らなければその文だけ削る
- 生成は最大 2 回（1 回目 + 書き直し 1 回）
- プロンプトで禁止: 勝者・最終スコア予想、材料に無い欠場の有無の断定、材料に無い選手の特徴（ドライブ等）、指標の取り違え（被 2nd チャンス = ディフェンスリバウンド）、中位を強み・弱みと書くこと、選手名のフルネーム展開（シートどおり「N.Jokic」）
- ファクトは `proInsightFacts.preview` に保存し、Batch poll で復元
- 見出し: LLM が段落ごとの要点（`previewHeads`・"\n" 区切り・数字なし・ja 22 字程度）を本文と同時に書く。段落数と合わないとき・ja / en が崩れたときは見出しなし。CONTEXT の hint（Tonight の向き）と矛盾させない
- 色付け: `previewNames`（主力 3 人 + 欠場者・"N.Jokic" 形式と所属）を保存。表示は大文字のチーム名・選手名（姓だけも。同姓が両チームにいれば姓だけは塗らない）を `getTeamAbbrBadgeColor` で塗る
- 表示（Native 1.0.5 ビルド 36〜）: 段落ごとに役割ラベル（試合の形 / 狙い目 / コンディション / 見どころ・4 段落のときだけ）→ 見出し → 本文。本文は斜体なし・JP 400・14/23。旧クライアントは `previewHeads` / `previewNames` を読まず従来どおり

---

## 7. 選び方・更新タイミング

種類ごとに点数（衝突の大きさ **または** 欠場インパクト）を付け、各サイド上位 2 本。言い回しをランダムに回さない。同じ試合は同じ行。穴埋め（`{rank}` `{player}` `{km}`）。

### 生成・保存（全ユーザー共通スナップショット）

```
前日 20:00 JST Batch 投入 → gameProInsights/{gameId}.proInsightNarrative（初版）
tip 1h 前 → injury 変更時のみ Chat 再生成
クライアント → Firestore / 公開 API を読むだけ（開くたびに再計算しない）
```

| いつ | 何をする |
|---|---|
| **毎日 20:00 JST** | 翌日窓の試合を OpenAI Batch でナラティブ初版投入（`batch_submit`）。**21:00 までに初版表示**を目標（15 分 poll）。**プレシーズンは対象外** |
| **tip 1h 前** | injury ステータス指紋が変わった試合だけ Chat で再生成（`narrative_patch`） |
| **15 分ごと** | Batch 完了ポーリング（`batch_poll`） |

公開 API: `GET /api/nba/matchup-insight?gameId=`（Pro · Bearer）→ `narrative` / `status`（`ready` | `pending` | `empty`）。全 Pro ユーザー共通スナップショット。

コストは [`pro-insight-openai-cost.md`](pro-insight-openai-cost.md)。

---

## 8. 実装メモ

- 生成: `lib/nba/insights/*`
- 完成品: `gameProInsights/{gameId}`（`proInsightNarrative` / `proInsightFacts` / `proBrief`）。**`games/{id}` は誰でも読めるので置かない**。読み書きは `lib/nba/insights/gameProInsightStore.ts`、rules は `allow read, write: if false`
- 公開: `GET /api/nba/matchup-insight?gameId=`
- 管理: `POST /api/admin/nba-pro-brief-ingest`（`mode: "batch_submit" | "batch_poll" | "narrative_patch" | "full" | "patch"`）
- 表示前: `sanitizeProBriefForDisplay`
- Brief 型: `lib/predict/predictProBrief.ts`
- iOS / Web は同じ Firestore brief を読む
