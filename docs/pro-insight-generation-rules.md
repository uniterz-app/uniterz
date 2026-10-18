# Pro Insight — 生成前ルール（正）

LLM の前に **ファクト選定** で落とす。文章は `hintEn` + プロンプトに従い、**ゲート例と同じ「読み」トーン**（スタッツ読み上げ禁止）。

最終更新: 2026-10-18

---

## プレシーズンは材料にしない（全セクション共通）

レギュラー以降の試合の Insight では、**プレシーズンの試合を一切数えない**。直近の成績・連勝・接戦／大差・ホームスタンド／ロード何戦目・連戦・移動・36 分以上出場・長期離脱判定はすべてレギュラー以降の試合だけ。開幕戦は「直近の試合なし」として扱う（前季の数字だけで書く）。

- 実装: `ingestProInsightNarrativeBatch.ts` の `loadRecentNbaGamesAroundTeams`（`excludePreseason`）。厳しさのゲームログ（`buildTeamGameLogFromGames`）も同じくプレシーズン除外
- 例外: プレシーズン同士の確認用スモーク（`includePreseason`）だけは対象試合がプレシーズンなので残す

---

## 層

1. **選定**（コード）— 何を話すか。関係ない・片方自慢・偽 soft は出さない  
2. **骨格**（`hintEn`）— 英語1〜2文の **解釈**（順位は metrics/evidence）  
3. **翻訳**（LLM）— 9言語。数字・名前・status（OUT/questionable）を変えない。本文は解釈、evidence に数字

---

## MATCHUP（ロック）

### 三段ゲート（試合単位）

| 段 | いつ | 攻撃 | 相手穴 | 相手側文言 |
|---|---|---|---|---|
| Tier1 | 先に検索 | rank **1–6** | rank **25–30** | EN **looks vulnerable** / JA **脆い** · 締め **edge {TEAM} {where}** / JA **{TEAM} 有利**（強そうです禁止） |
| Tier2 | Tier1 が **0本** のときだけ | rank **1–8** | rank **23–30** | EN **give up a lot {where}** / JA **{where}を多く許す** · 同様に有利表現 |
| Tier3 | Tier2 も **0本** | gap=`oppRank−myRank` 最大の **1本**（攻撃 rank ≤ 12） | EN **clearest read tonight …** / JA **いちばん読みやすい**（または相性が良い） |
| 空 | Tier3 も不可 | — | MATCHUP 出さない |

- 片方自慢は出さない  
- **SOFT / ソフト / 柔らかい** は MATCHUP で使わない  
- Cap: Tier1/2 は試合最大2本。Tier3 は1本  
- **文体:** ゲート例（`proInsightGateSampleBrief`）と同じく **読み**。順位は evidence、本文は解釈（「#4 vs #26 で相性が良さそうです」禁止）

### 欠場（MATCHUP）

| ルール | 内容 |
|---|---|
| 前提 | 衝突／差ファクトがあるときだけ。欠場だけでは MATCHUP を作らない |
| mpg | **≥ 25** のみ（不明・未満は無視） |
| status | OUT / doubtful / questionable（Probable 除外） |
| 型オーナー | **その型の専用指標**（攻め / 守り別・下表）で leaders チーム内 Top2 の選手だけ。PTS / USG / PIE など総合指標ではオーナーにしない |
| 攻め側 | オーナー欠場 → **weakening**（uncertain edge） |
| 守り側 | オーナー欠場 → **amplify**（さらに脆い／さらに多く許す／差がさらに開きやすい） |
| leaders 無し | オーナー判定不可 → MATCHUP に欠場を折り込まない |
| INJURY IMPACT と同一選手 | **IMPACT 優先**。MATCHUP は欠場折り込みなし版に差し替え（衝突自体は残す）。プレイタイプ（欠場が前提）は出さない |
| 数字 | 折り込むときはオーナーの指標値とチーム内順位を本文・evidence に出す（例: `D.MITCHELL ISO 頻度 25.0%（チーム#1）`） |

型オーナー指標（`clashStyleOwner.ts` が正）:

| kind | 攻め側 | 守り側 |
|---|---|---|
| paint | pts_paint / pct_pts_paint / restricted_pts / paint_touch_pts / drive_pts | blk / contested_shots / dreb |
| fb | pts_fb / trans_pts / trans_freq | —（選手に帰属しない） |
| off_tov | pts_tov / stl | — |
| second | oreb / oreb_pts | dreb / reb |
| three | fg3m / fg3a / pts_3 / cns_pts | — |
| glass | oreb / oreb_pct | dreb / reb_pct |
| tov | ast / ast_pct | stl / deflections |
| fta | fta / pts_ft / fta_rate | — |
| iso / pnr / post / spotup | 各 `*_freq` / `*_pts` | —（相手のプレイタイプ守備データは無い） |

### 表示（表 · 文章なし · LLM 不使用）

MATCHUP は文章にせず、**攻め × 相手の守りの順位差が大きい順に最大 5 行の表**を出す（`buildMatchupStatTable.ts`）。上の三段ゲート・欠場ルールは MATCHUP ファクト（INJURY IMPACT との選手重複除け・指紋）用に残すが、表示はこの表だけ。

| ルール | 内容 |
|---|---|
| 候補 | 下の指標ペア 8 種 × 攻め方向 2（AWAY→HOME / HOME→AWAY）。gap = 相手穴の順位 − 攻めの順位 |
| 採用 | gap **≥ 6**。担い手（上の型オーナー表）の OUT / questionable がある行は gap ≥ 1 で採用し、並びで +6 |
| 1 種 1 行 | 同じ種類は gap の大きい方向だけ |
| 並び | gap（+欠場ボーナス）降順 → 攻めの順位が良い順。最大 5 行（足りなければ少なくてよい） |
| 列 | 左 AWAY / 右 HOME（パネル見出しと同じ）。各セルは順位（大）+ 指標名と値（小）。**有利な側（攻め）の順位だけチーム色** |
| 注記 | 担い手の欠場は行の下に 1 行（`{TEAM} はこの武器の担い手 {P}（{指標}チーム{N}位）が OUT`） |
| 出典 | opening / early は前季の数字。表の下に `{シーズン} · 順位はリーグ30チーム中 · 色付きが有利な側` |
| 旧クライアント | 表を描けない版向けに `items` に 1 行ずつの文（`{場所}：{A} {指標} N位 × {B} {指標} M位`）も保存する |

`opp*` は「被〜」（許した側）で表記する。

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

`travel_load`（今夜の移動）は **本文をコードで決める**（`templateBody`。LLM に渡さない）。読みは休養日数で決める: 前に試合なし / 休養 2 日以上 → 「負担は軽め」、休養 1 日 + 2,500km 以上 → 「序盤は脚が重くなりやすい」、休養 1 日 → 「負担は少し増える」。距離だけで脚が重い・ペースを握ると書かない。

移動ホップ表記: **都市名**（`from MIAMI to TORONTO` / JA `MIAMIからTORONTO`）。ニックネーム `HEAT→RAPTORS` や三文字略 `MIA→TOR` は使わない。主語のチームはニックネームのまま。

### 低

`home_after_b2b`, `single_game_road_trip`, `soft_landing`, `home_stand`（3〜）, `minutes_36plus`, `altitude`, `dense_3in4` / `dense_4in5`（今夜過密＋シーズン同条件 W–L）

### データ

- 会場 TZ: [`lib/nba/nbaTeamVenueTz.ts`](../lib/nba/nbaTeamVenueTz.ts)（静的 IANA）
- 終了時刻: `games.finalAt`（live ingest で final 初回のみ）。無ければ late_* は出さない
- min36: 直前試合 `liveStats` box
- **シーズン実績の付与:** `nbaTeamInsightExtras`（B2B / rest 帯 / 高地 / 過密）。今夜の SCHEDULE kind が立ったときだけ metrics + hintEn に Mark を足す。opening は前季、early/full は今季（空なら前季）

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
| `multi_year_h2h` | `nbaTeamInsightExtras.h2hMultiYear` · ≥4試合（ホーム視点） | 15 |
| `vs_band_under500` | 相手勝率 <.500 かつ vsUnder500 が極端 | 15 |
| `vs_division` | 今夜同ディビジョンかつ vsDivision が極端 | 14 |
| `rating_last10_tilt` | season vs last10 の NET/ORTG/DRTG \|Δ\|≥3（チーム1本）。last10 は box 推定 poss 優先、無ければ pace 代理 | 14+ |
| `clutch_form` | clutchNet vs season NET \|Δ\|≥3 | 13 |
| `clutch_close5` | 点差≤5 のシーズン W–L が極端（extras） | 12 |
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
- extras: `nbaTeamInsightExtras`（多年 H2H · vsDivision · clutchClose5）。チーム詳細 UI には出さない

### 多年 H2H の本文（コード）

`multi_year_h2h` は **本文をコードで決める**（`templateBody`。LLM に渡さない）。必ずホームの主語を書く（`PISTONS のホームでは 3-2`）。つなぎは勝敗の符号で決める: 通算と同じ向き → 「〜のホームでも」、五分 → 「ただ〜のホームでは 3-3 の五分」、逆向き → 「ただ〜のホームでは 3-2 と勝ち越し」。締めは通算の向き（`相性は {TEAM} 寄り` / 五分なら「どちらにも傾かず、今夜は他の要素で決まりやすい」）。

### 相手の順位（開幕前・序盤）

opening / early の「上位 6 相手」は前季の順位で判定する。相手の順位の数字は渡さず「25-26シーズン上位6」とだけ書く（今の順位に読めるため。`buildContextFacts.ts`）。full になったら今季の順位の数字を出す。

### シーズン表記

- 対帯 / venue / extras / カンファ順位の fact は出典季を metric（`statsSeason` / `seasonSource` / `oppConfRankSeason`）と hint（`in 2025-26`）に必ず載せる。多年 H2H は期間（`2023-24–2025-26`）
- 本文は「25-26シーズン」「2025-26」と明示。**今季 / this season は書かない**（プロンプト規則）
- 保険: 書き込み時 `rewriteThisSeasonLabels` — CONTEXT の出典季が試合の季と違えば「今季」等を明示季に置換（今季データのときは触らない）

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

### 文章（LLM）と後処理

- 本文は 2 ビート: ①事実（数字）②今夜の読み（傾き / 信頼度 / 見どころ のどれか）。②に新しい数字は足さない。「形が変わる」「厳しい試合が予想される」だけは不可（`prompt.ts`）
- 柱の意味（数字なし）: PTS→得点負担が回る · USG→攻撃の起点が変わる · AST→創出が細る · REB→ボード · STL→守備から走る形 · BLK→リム守備 · 3P→スペーシング · FT%→終盤のFT。hintEn に「if he sits, …」で指標ごとに渡す（`injuryShapeRoles.ts` の `PILLAR_MEANING`）。「柱が弱体化」は不可
- 欠場時 W–L の向きはコードで決める（`aceOutVerdict`）: 欠場時勝率がチーム全体 −5pt 以内 = held_up（普段の水準。「弱体化」「崩れる」禁止）、−15pt 以上 = sagged、その間 = dipped
- 後処理 `injuryNarrativeFixups.ts`: evidence は metrics から組み立て（`narrativeRoles` = 本文が使う柱 2 本 → 欠場時 W–L → OFF/DEF）。本文の OFF/DEF 符号は metrics で上書き。when-out が無い fact で W–L を書いた文は削除

### day-to-day は出さない

欠場として扱うのは OUT / doubtful / questionable だけ。day-to-day は復帰見込みなので INJURY IMPACT・欠場込みの厳しさ・MATCHUP の担い手注記に出さない（`isProInsightAbsenceStatus`）。

### 長期離脱

- 長期 = OUT / doubtful かつ（`returnEstimate` が tip から **21 日以上先** or 理由文に season-ending / miss the entire season 等）
- チームが **今季レギュラーで 3 試合連続**その選手抜き（`games.liveStats.box` に不在）なら **Insight 全体から外す**（IMPACT も MATCHUP の担い手注記も）。チームは適応済みで「形が変わる」は古い読み
- プレシーズンは数えない。box が無い試合で打ち切り（不明は欠場扱いしない）
- オフから離脱中の選手は開幕 3 試合だけ出る。名簿は INJURY タブに残る
- 実装: `longTermInjury.ts`（`dropStaleLongTermInjuries`）· 追加 BDL / Firestore 読みなし

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