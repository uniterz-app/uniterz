# Pro Insight — 生成前ルール（正）

LLM の前に **ファクト選定** で落とす。文章は `hintEn` + プロンプトテンプレに従うだけ。

最終更新: 2026-09-12

---

## 層

1. **選定**（コード）— 何を話すか。関係ない・片方自慢・偽 soft は出さない  
2. **骨格**（`hintEn`）— 英語1〜2文の意味  
3. **翻訳**（LLM）— 7言語。数字・名前・status（OUT/questionable）を変えない  

---

## MATCHUP（ロック）

### 三段ゲート（試合単位）

| 段 | いつ | 攻撃 | 相手穴 | 相手側文言 |
|---|---|---|---|---|
| Tier1 | 先に検索 | rank **1–6** | rank **25–30** | EN **vulnerable** / JA **脆い** · 攻め側 EN **looks like a good matchup** / JA **相性が良さそうです**（強そうです禁止） |
| Tier2 | Tier1 が **0本** のときだけ | rank **1–8** | rank **23–30** | EN **gives up a lot on {skill} defense** / JA **{守備}を多く許す** · 同様に相性表現 |
| Tier3 | Tier2 も **0本** | gap=`oppRank−myRank` 最大の **1本**（攻撃 rank ≤ 12） | EN **clearest favorable matchup … vs {skill} defense** / JA **いちばん相性が良い** |
| 空 | Tier3 も不可 | — | MATCHUP 出さない |

- 片方自慢は出さない  
- **SOFT / ソフト / 柔らかい** は MATCHUP で使わない  
- Cap: Tier1/2 は試合最大2本。Tier3 は1本  

### 欠場（MATCHUP）

| ルール | 内容 |
|---|---|
| 前提 | 衝突／差ファクトがあるときだけ。欠場だけでは MATCHUP を作らない |
| mpg | **≥ 25** のみ（不明・未満は無視） |
| status | OUT / doubtful / questionable（Probable 除外） |
| 型オーナー | leaders チーム内 Top2 が clash kind の指標にヒットした選手だけ |
| 攻め側 | オーナー欠場 → **weakening**（uncertain edge） |
| 守り側 | オーナー欠場 → **amplify**（さらに脆い／さらに多く許す／差がさらに開きやすい） |
| leaders 無し | オーナー判定不可 → MATCHUP に欠場を折り込まない |

型オーナー指標例: paint → `pts_paint` / `reb` / `blk` 等（`clashStyleOwner.ts` が正）。

### 指標ペア（真の失点）

| 種類 | 攻め | 相手穴（BDL misc / 既存） |
|---|---|---|
| PAINT | ptsPaint | oppPtsPaint |
| FAST BREAK | ptsFb | oppPtsFb |
| PTS OFF TO | ptsTov | oppPtsOffTov |
| SECOND CHANCE | ptsSecondChance | oppPtsSecondChance |
| THREE | fg3a | oppFg3Pct |
| GLASS | orebPct | oppOrebPct |
| TOV | tovPct | oppTov |
| FTA | ftaRate | oppFtaRate |

- misc 4失点は `team_season_averages` `general/misc` から ingest  
- ドライブ失点は未取得 → 当面出さない（開幕後の差分パイプラインは今後）  
- DRTG 代理のペイント/トランジションは出さない  

---

## SCHEDULE（ロック）

| 優先 | 内容 |
|---|---|
| 1 | **差ファクト優先**。差が1本以上あれば片側負荷は出さない（cap 2） |
| 2 | 差が0本のときだけ片側負荷 |
| opening | 実データがあれば出す。オープナー埋め草は出さない |
| 出さない | Cup / 次が強豪（→CONTEXT）/ OT回数 / ホーム移動なし埋め草 |

### 高（差・複合）

| kind | 条件 |
|---|---|
| `rest_advantage` | 自 rest≥1 かつ 相手 rest=0 |
| `rest_disadvantage` | 自 rest=0 かつ 相手 rest≥1 |
| `away_b2b` | B2B の2戦目がアウェイ |
| `travel_b2b` | B2B + 今夜/48h 長距離移動 |
| `ot_b2b` / `ot_travel` / `ot_travel_b2b` | 前試合 OT + B2B / 移動 / 両方 |
| `late_to_early` | 前試合 `finalAt` 会場ローカル≥22時 かつ 今夜 tip&lt;15時 |

### 中

| kind | 条件 |
|---|---|
| `timezone_shift` | 72h 内で会場 TZ 差 ≥2h（`nbaTeamVenueTz`） |
| `eastbound_trip` | 東向き TZ + rest≤1 |
| `long_road_trip` | アウェイ連戦 **4** 試合目〜 |
| `road_trip_finale` | 連戦≥4 かつ次がホーム |
| `first_home_after_trip` | 今夜ホーム + 直前アウェイ連戦≥4 |
| `same_city_b2b_relief` | B2B だが長距離移動なし |
| `post_ot` / `late_ot` / `ot_minutes_load` | OT 系（複合が無いとき / 遅い終了 / 36+） |
| `travel_load` | 非B2B の長距離移動（800km / 48h ゲート） |

移動ホップ表記: **都市名**（`from MIAMI to TORONTO` / JA `MIAMIからTORONTO`）。ニックネーム `HEAT→RAPTORS` や三文字略 `MIA→TOR` は使わない。主語のチームはニックネームのまま。

### 低

`home_after_b2b`, `single_game_road_trip`, `soft_landing`, `home_stand`（3〜）, `minutes_36plus`, `altitude`

### データ

- 会場 TZ: [`lib/nba/nbaTeamVenueTz.ts`](../lib/nba/nbaTeamVenueTz.ts)（静的 IANA）
- 終了時刻: `games.finalAt`（live ingest で final 初回のみ）。無ければ late_* は出さない
- min36: 直前試合 `liveStats` box

---

## CONTEXT（ロック）

今夜文脈のみ。cap **2**、空可。MATCHUP / INJURY のケガ詳細は繰り返さない。復帰・デビュー・次が強豪は今スコープ外。

### kind（優先順 · score 目安）

| kind | 条件 | score |
|---|---|---|
| `recent_sos_hard` | 直近相手勝率平均 ≥.55（≥2）。連敗中なら +1 | 20–21 |
| `streak_vs_quality` | 連勝/連敗 ≥3 + その期間の相手勝率（tough ≥.52 / weak ≤.42） | 14–19 |
| `home_win_streak` / `away_win_streak` | 今夜会場側の連勝 ≥3 | 18 |
| `home_loss_streak` / `away_loss_streak` | 今夜会場側の連敗 ≥3 | 17 |
| `recent_margin_profile` | 直近≤10・サンプル≥4。接戦≤5 / 大差≥15。勝ちor負けの過半が接戦or大差 | 16–17 |
| `vs_band_top6` | **今夜相手**がカンファ 1–6 のときだけ vsConfTop6 が極端 | 16 |
| `vs_band_under500` | 相手勝率 <.500 かつ vsUnder500 が極端 | 15 |
| `rating_last10_tilt` | season vs last10 の NET/ORTG/DRTG \|Δ\|≥3（チーム1本）。last10 は box 推定 poss 優先、無ければ pace 代理 | 14+ |
| `clutch_form` | clutchNet vs season NET \|Δ\|≥3 | 13 |
| `three_last10_hot` | last10 3P% ≥.38 かつ season より +.04（liveStats box 由来） | 12 |
| `vs_band_over500` | 相手 ≥.500・非 top6・vsOver500 極端 | 12 |
| `recent_sos_soft` | 直近相手平均 ≤.45 | 11 |
| `venue_split` | 今夜会場の season スプリットが極端（低優先） | 10 |

### 出さない

- `multi_out`（→ INJURY IMPACT）
- 相手強度なしの単独 overall 連勝/連敗
- シーズン総 W–L だけの埋め草

### データ

- streaks / venue streaks / margin: prior + `homeScore`/`awayScore`（`games.score` 可）から derive
- 点差なしの試合は margin 集計から除外
- 直近相手勝率: 既存 `recentOppWinPcts`
- 対帯: `nbaTeamSeasonRecords`（opening は prior）
- last10 ORTG/DRTG/NET: `liveStats.box` から Dean Oliver 推定 poss（FGA+0.44×FTA−OREB+TOV）。box が無い試合は PPG÷season pace 代理。追加 BDL **$0**
- last10 3P%: `games.liveStats` box（`m-a` プール）または teamStats.fg3。無ければ kind 不出
- Pro Insight 生成時も recent games で last10 の空レーティング/3P を補完

---

## INJURY IMPACT（ロック）

欠場でチームがどう変わるかの読み。名簿は INJURY タブ。队友バンプ／役割増加の予測は **出さない**。cap **2**、空可。

### 1 本に必要な材料（OR）

どちらも無い **ただの OUT は出さない**。

1. **Ace-out 実績**（`nbaTeamAceOutRecords` · **当該 teamId 配下**）
   - `gamesOut ≥ 3`
   - 欠場時 W–L
   - 欠場時平均得点 / 平均失点
   - 通算比 OFF/DEF 差分（得点ベース、`|Δ| ≥ 1` のときだけ。真正 ORTG ではない）
2. **形が薄くなる**（leaders チーム内 Top2）
   - ナラティブ優先 PTS / REB / AST / USG 等（hint 最大 2）
   - 「その柱が落ちる」— 誰が埋めるかは言わない

常に: 選手名 + status（英語のまま: out / doubtful / questionable）。Probable 除外。

### Ace-out シーズン

合算しない。同じ選手で前季・今季を 2 本並べない。

| phase | ソース |
|---|---|
| opening | **前季のみ** |
| early / full | **今季**。当該チームで `gamesOut < 3`（または今季ヒットなし）なら **同 teamId の前季にフォールバック** |

### 移籍

突合は `teamId` + `playerId`。例: ヤニス MIL→MIA でヒート欠場サンプル <3 のとき、前季バックス数字は **使わない**（ヒート prior 行にもいない）。ace-out なし → **shape（ヒート leaders）のみ**可。どちらも無ければ不出。

### 選定ゲート

| ルール | 内容 |
|---|---|
| status | OUT / doubtful 優先。無ければ QUES |
| 資格 | ace-out **または** shape |
| mpg | **shape のみ**のとき ≥ 25。ace ヒット時は mpg 不要。mpg 不明の shape のみは **team rank #1** があるときだけ |
| cap | 試合全体 2 |
| dedupe | `injury:{playerId}` — IMPACT 優先（MATCHUP 折り込みと二重にしない） |
| multi_out | 今は出さない |

### kind

| kind | 条件 |
|---|---|
| `ace_out_shape_impact` | ace + shape |
| `ace_out_impact` | ace のみ |
| `shape_leader_out` | shape のみ |
| `injury_out` | **廃止**（材料なしは候補にしない） |

### hintEn 骨格

`{Player} is {status}. [pillar]. {TEAM} are/were {W-L} when he was out ({ptsFor}-{ptsAgainst})[, OFF Δ/DEF Δ vs season].`

- prior / フォールバック時は were + last season 明示  
- when-out 無しの shape のみ可。捏造 W–L 禁止。「出場時」禁止  

### データ

injury · ace-out · leaders · mpg（ロスター）。新規 BDL 不要。

---

## PLAYERS / その他