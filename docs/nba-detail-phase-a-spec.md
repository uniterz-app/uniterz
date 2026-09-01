# NBA 詳細 Phase A — 実装仕様

> **目的:** 既存 ingest / API だけで、カジュアル向け要約・タグ・直近トレンドを Team / Player 詳細に追加する。  
> **対象外（Phase B 以降）:** LINEUPS · ON/OFF · SCHEDULE DIFFICULTY · MATCHUP PREVIEW · TRANSACTIONS  
> **原則:** ロジックは `lib/` · UI は Web `Nba*DetailPanel` + Native `*Native` · 新 BDL 取得なし

---

## 1. 共通アーキテクチャ

### 1.1 新規モジュール（共有）

| ファイル | 役割 |
|---|---|
| `lib/nba/detailInsights/detailInsightTypes.ts` | 出力型（Summary · IdentityTag · RoleTag · TrendDelta · KeyImpact · Consistency · RoleChange） |
| `lib/nba/detailInsights/rankBuckets.ts` | 30 チーム順位 → `elite` / `aboveAvg` / `belowAvg` / `bottom` |
| `lib/nba/detailInsights/buildTeamDetailInsights.ts` | チーム Summary / Identity / L10 Trend / Key Impact |
| `lib/nba/detailInsights/buildPlayerDetailInsights.ts` | プレイヤー Summary / Role / Role Change / Consistency / Usage strip |
| `lib/nba/detailInsights/teamIdentityCandidates.ts` | TEAM IDENTITY 候補プール（**30**）· 排他グループ · スコア |
| `lib/nba/detailInsights/playerRoleCandidates.ts` | ROLE 候補プール（**30**）· 排他グループ · スコア |
| `lib/nba/detailInsights/selectDetailChips.ts` | 候補 → 排他解決 → 上位 N 抽出（共有） |
| `lib/nba/detailInsights/fetchTeamAceOutClient.ts` | `GET /api/nba/team-ace-out-records`（既存 API · クライアント用 thin wrapper） |

### 1.2 順位バケット（全 Phase A 共通）

```ts
// 1-based rank, 30 teams
elite:      rank <= 8
aboveAvg:   rank <= 15
belowAvg:   rank >= 16
bottom:     rank >= 23
```

表示文言（JA / EN）:

| バケット | JA | EN |
|---|---|---|
| elite | リーグ上位 | top tier |
| aboveAvg | リーグ平均以上 | above average |
| belowAvg | リーグ平均以下 | below average |
| bottom | リーグ下位 | bottom tier |

### 1.3 UI 共通コンポーネント

| コンポーネント | 配置 |
|---|---|
| `DetailInsightSummary` | 1〜2 文 · 13px · `rgba(255,255,255,0.82)` · 行間 1.45 |
| `DetailIdentityChipRow` | 横スクロール · 最大 **4 チップ** · Cyber 斜めタブ風ではなく **細枠 pill**（accent 1px · 透明背景 · accent 文字） |
| `DetailTrendRow` | `LABEL · SEASON → L10 · Δ` · 上昇=teal · 下降=loss red |
| `DetailKeyImpactRow` | 選手名 · 1 行理由 · タップ → player detail |

Web: `app/component/detailInsights/*`  
Native: `apps/native/src/features/games/detailInsights/*Native.tsx`

### 1.4 空データ

| 条件 | 挙動 |
|---|---|
| 開幕前 / メトリクス全 0 | Summary 非表示（セクションごと省略） |
| L10 試合 0 | L10 Trend 非表示 · Summary の L10 文省略 |
| game logs 0 | Player Role Change / Consistency 非表示 |
| ace-out 未 ingest | Key Impact は roster ベースのみ · Summary の ace 文省略 |

**空 NO DATA カードは出さない**（既存 pipeline ルール踏襲）。

### 1.5 チップ選定アルゴリズム（Identity / Role 共通）

```
全候補を evaluate → score 付与 → 閾値未満は除外
→ 排他グループ内は最高 score のみ残す
→ score 降順 · tie-break 優先度 · カテゴリ上限
→ 表示上限で切る（Team 4 / Player 3）
```

**スコア（rank ベース · 1-based · 30 チーム / リーグ順位）**

| パターン | 式（例: rank 3 → score 25） |
|---|---|
| 高いほど良い · elite 狙い | `max(0, 16 − rank)` when rank ≤ 15 |
| 低いほど良い · elite 狙い | `max(0, rank − 14)` when rank ≤ 15 |
| bottom 狙い（weak / prone） | `max(0, rank − 22)` when rank ≥ 23 |
| 比率閾値（pct） | 条件成立で固定 **12** · 上位 quartile で **+rank ボーナス** |

**カテゴリ上限（うるささ防止 · 表示前の最終フィルタ）**

| 面 | ルール |
|---|---|
| Team | 同一カテゴリから **最大 2**（`style` / `defense` / `risk` / `momentum`） |
| Player | 同一カテゴリから **最大 1**（`usage` / `offense_style` / `defense` / `big`） |

**排他グループ** — グループ内は **1 つだけ** 残す（最高 score）。

---

## 2. チーム詳細 Phase A

### 2.1 セクション配置（上 → 下）

```
HEADER（既存）
── divider ──
★ TEAM SUMMARY          ← 新規
★ TEAM IDENTITY         ← 新規（チップ行）
── divider ──
INJURIES（既存）
── divider ──
PERFORMANCE METRICS（既存）
...
★ KEY PLAYER IMPACT     ← 新規（HOW THEY PLAY の直前）
HOW THEY PLAY（既存）
★ RECENT FORM 強化      ← L10 TREND 行を Form 内に追加
...
```

`profileLean` / `profileNoteJa|En` は **非表示にせず残す** が、Hero 内の小さな OF/DF 寄り表示は Summary が主役になるよう **opacity を下げる（0.55）**。

### 2.2 TEAM SUMMARY

**入力**

| ソース | フィールド |
|---|---|
| `NbaTeamDetailPreview` | `last10Record` · `recentGames` · `metrics.season/last10` · `injuries` · `season` |
| `NbaLeagueTeamStatRow`（season） | `ortg` `drtg` `netrtg` `pace` `fg3Pct` · advanced: `pctPts3` `clutchNet` |
| `NbaTeamAceOutRecordsBundle` | `teams[teamId].players[]` · `teamOverall` |
| `rankTeamsByMetric` | 各指標 rank |

**生成（最大 3 文 · テンプレ合成 · 句点区切り）**

1. **Form 文**（L10 試合 ≥ 1）
   - JA: `直近10試合は{W}勝{L}敗。`
   - EN: `Last 10: {W}-{L}.`

2. **攻守文**（ORTG / DRTG rank あり）
   - ORTG elite & DRTG bottom → JA: `攻撃はリーグ上位だが、守備は下位。`
   - ORTG bottom & DRTG elite → 逆
   - \|ORTG rank − DRTG rank\| ≤ 3 → JA: `攻守ともリーグ平均付近。`
   - ORTG elite & DRTG elite → JA: `攻守ともリーグ上位。`
   - その他 → 既存 `resolveLean` 相当を自然文に: `攻撃は{bucket}、守備は{bucket}。`

3. **欠場影響文**（条件付き · 優先度順で 1 つだけ）
   - **A.** 現在 OUT/GTD の ace-out 選手（`findAceOutPlayerForInjury` · `gamesOut ≥ 3`）  
     JA: `{短名}欠場時は{W}-{L}（得点{ptsFor}–失点{ptsAgainst}）。`
   - **B.** OUT/GTD が 2 人以上で ace データなし  
     JA: `主力{ n }名が欠場・疑わしい状態。`
   - **C.** ace-out 最大影響選手が healthy だが whenOut の win% が teamOverall より **≥ 12pt 低い**  
     JA: `{短名}不在時の勝率が大きく落ちる。`

**出力型**

```ts
type TeamDetailSummary = {
  linesJa: string; // 1 ブロック
  linesEn: string;
};
```

### 2.3 TEAM IDENTITY

- **候補プール: 30**（`teamIdentityCandidates.ts`）
- **表示: 最大 4 チップ**（§1.5 アルゴリズム）
- データ: `NbaLeagueTeamStatRow` season + `detail.injuries` + L10 row（momentum 2 件のみ）

#### 排他グループ（Team）

| group | 候補（1つのみ） |
|---|---|
| `pace` | `fast_pace` · `slow_pace` |
| `clutch` | `clutch_strong` · `clutch_weak` |
| `turnover` | `clean_ball` · `turnover_prone` |
| `ortg_drtg_identity` | `offense_first` · `defense_first` |
| `oreb` | `second_chance` · `rebound_strong` |
| `momentum` | `surging` · `free_fall` |

`injury_risk` は排他グループ外だが、**スコア +100 ブースト** · 表示枠を **1 つ予約**（他 3 枠と競合）。

#### 候補プール 30

| # | ID | ラベル | カテゴリ | 成立条件（season · rank  unless noted） |
|---|---|---|---|---|
| 1 | `fast_pace` | FAST PACE | style | pace rank ≤ 10 |
| 2 | `slow_pace` | SLOW PACE | style | pace rank ≥ 22 |
| 3 | `three_heavy` | 3PT HEAVY | style | fg3a rank ≤ 10 **or** pctPts3 ≥ 0.36 |
| 4 | `midrange_heavy` | MIDRANGE HEAVY | style | pctPtsMid rank ≤ 10 |
| 5 | `paint_attack` | PAINT ATTACK | style | pctPtsPaint rank ≤ 10 |
| 6 | `ft_line` | FT LINE | style | ftaRate rank ≤ 10 |
| 7 | `offense_first` | OFFENSE FIRST | style | ortg rank ≤ 8 |
| 8 | `defense_first` | DEFENSE FIRST | style | drtg rank ≤ 8 |
| 9 | `elite_net` | ELITE NET | style | netrtg rank ≤ 6 |
| 10 | `iso_heavy` | ISO HEAVY | style | isoFreq rank ≤ 10 |
| 11 | `pnr_heavy` | PNR HEAVY | style | avg(pnrBhFreq, pnrRollFreq) rank ≤ 10 |
| 12 | `spotup_team` | SPOTUP TEAM | style | spotupFreq rank ≤ 10 |
| 13 | `post_up` | POST UP | style | postFreq rank ≤ 10 |
| 14 | `transition` | TRANSITION | style | transFreq rank ≤ 10 |
| 15 | `cut_team` | CUTS HEAVY | style | cutFreq rank ≤ 10 |
| 16 | `ball_movement` | BALL MOVEMENT | style | passes rank ≤ 10 |
| 17 | `drive_heavy` | DRIVE HEAVY | style | drives rank ≤ 10 |
| 18 | `cns_heavy` | C&S HEAVY | style | cnsPts rank ≤ 10 **and** cnsFgPct rank ≤ 12 |
| 19 | `pullup_heavy` | PULLUP HEAVY | style | pullupPts rank ≤ 10 |
| 20 | `second_chance` | SECOND CHANCE | style | orebPct rank ≤ 8 |
| 21 | `rebound_strong` | REBOUND STRONG | style | orebPct rank ≤ 10（#20 と排他 · より extreme 方） |
| 22 | `fb_points` | FAST-BREAK PTS | style | pctPtsFb rank ≤ 10 |
| 23 | `clutch_strong` | CLUTCH STRONG | style | clutchNet rank ≤ 8 |
| 24 | `clutch_weak` | CLUTCH WEAK | style | clutchNet rank ≥ 23 |
| 25 | `perim_def` | PERIM DEF | defense | fg3PctAllowed rank ≤ 10（低い方が良い） |
| 26 | `rim_protect` | RIM PROTECT | defense | fgPctAllowed rank ≤ 10 |
| 27 | `force_tos` | FORCE TOs | defense | tovForced rank ≤ 10 |
| 28 | `hustle_team` | HUSTLE TEAM | defense | avg(deflections, charges, looseBalls) rank ≤ 10 |
| 29 | `clean_ball` | CLEAN BALL | style | tovPct rank ≤ 10（低い方が良い） |
| 30 | `turnover_prone` | TURNOVER PRONE | style | tovPct rank ≥ 23 |
| — | `surging` | SURGING | momentum | L10 netrtg − season netrtg ≥ **+4.0** |
| — | `free_fall` | FREE FALL | momentum | L10 netrtg − season netrtg ≤ **−4.0** |
| — | `injury_risk` | INJURY RISK | risk | OUT+GTD ≥ 2 **or** ace-out 対象が OUT/GTD |

> **evaluate 対象 32**（コア 30 + momentum 2）· **表示 4**。`injury_risk` はコア 30 に含めてもよい（実装では #30 固定 + momentum 2 の計 32 evaluate で可）。

metric 欠損 → その候補は evaluate スキップ（エラーにしない）。

**tie-break 優先度（同 score）:**  
`injury_risk` > `defense_first` / `offense_first` > `elite_net` > `surging` / `free_fall` > `fast_pace` > その他 style > defense 系。

### 2.4 LAST 10 TREND（RECENT FORM 内）

**入力:** `detail.metrics.season` vs `detail.metrics.last10`  
**表示:** Form チップの下にコンパクト表（最大 5 行）

| 指標 | id | 表示 | Δ 閾値（表示） |
|---|---|---|---|
| ORTG | ortg | `114.2 → 118.1` | \|Δ\| ≥ 1.0 |
| DRTG | drtg | 同上（**低い方が良い** · 改善=緑は符号反転） | \|Δ\| ≥ 1.0 |
| PACE | pace | 同上 | \|Δ\| ≥ 0.8 |
| 3P% | fg3Pct | `37.1% → 41.2%` | \|Δ\| ≥ 0.015 |
| NET | netrtg | 同上 | \|Δ\| ≥ 1.0 |

- L10 メトリクスが空（`last10RowHasData` false）→ トレンド行なし · Form チップのみ
- 欠場影響 1 行（任意）: 直近 OUT 選手が ace-out にいれば `★ {name} OUT in {k}/10`（game log から OUT 試合数は Phase A では **injuries のみ** · 試合ログ連携は Phase B）

### 2.5 KEY PLAYER IMPACT（3 行固定）

**入力**

| 優先 | ソース | ルール |
|---|---|---|
| 1 | ace-out `players[]` | `gamesOut ≥ 3` · whenOut win% − teamOverall win% 昇順（影響大） · 最大 2 |
| 2 | `rosterBlock.players` | `ppg` 降順 · 上位から ace と重複除外 · 残り枠を埋める |
| 3 | `leaderMetrics`（任意 · overlay で leaders fetch 追加時） | チーム所属の `usg` Top · 「Usage {x}% · #{rank}」 |

各行フォーマット:

```
[Impact]  J. Tatum — OUT時 4-7 · 得点 108–118  (tap → player)
[Usage]   J. Tatum — 28.4 USG · #4
[Minutes] D. White — 34.2 MPG · スターター
```

- `Impact` バッジ: ace-out / injury 連動
- `Usage` / `Minutes`: roster のみでも可
- 合計 **3 行**（ace 2 + roster 1 など）

**データ追加（overlay）**

`useNbaTeamDetailLiveOverlay` に ace-out fetch を **並列 6 本目** として追加:

```
GET /api/nba/team-ace-out-records?season=
→ client で teamId フィルタ
```

---

## 3. プレイヤー詳細 Phase A

### 3.1 セクション配置

```
PlayerIdCard（既存）
── divider ──
★ PLAYER SUMMARY       ← 新規
★ ROLE（チップ 1〜3）   ← 新規
★ USAGE STRIP          ← 新規（6 指標横並び）
AvailabilityBanner（既存 · OUT 時）
SeasonMetricsGrid（既存 · 変更なし）
...
★ RECENT ROLE CHANGE   ← 新規（HOW THEY PLAY 直前）
HOW THEY PLAY（既存）
...
★ CONSISTENCY          ← 新規（GAME LOGS 直前）
GAME LOGS（既存）
...
```

### 3.2 PLAYER SUMMARY

**入力:** `NbaPlayerDetailPreview` · `leaderMetrics` · `buildPlayerDetailInsights` 内 computed role

**テンプレ（最大 3 文）**

1. **Season 文**（GP ≥ 1）  
   JA: `今季{GP}試合 · 平均{PTS}/{REB}/{AST}。`

2. **Recent 文**（game logs ≥ 5）  
   - 直近 5 試合 MIN vs シーズン MIN:  
     Δ ≥ +15% → JA: `直近5試合で出場時間が増加。`  
     Δ ≤ −15% → JA: `直近5試合で出場時間が減少。`

3. **Role / 欠場文**（1 つ）  
   - ROLE 1位タグを自然文: `チームの{1st option 等}タイプ。`  
   - OUT/GTD → `現在{status}（{reason}）。`  
   - USG elite & チーム ace-out に名前あり → `主力欠場時は役割が増えるタイプ。`（Phase A: USG ≥ 28% かつ team ace-out データで近似）

### 3.3 ROLE

- **候補プール: 30**（`playerRoleCandidates.ts`）
- **表示: 最大 3 チップ**（§1.5 アルゴリズム）
- データ: `detail.leaderMetrics` · `detail.season` · roster `position` / `starter` / `mpg`（あれば）

#### 排他グループ（Player）

| group | 候補（1つのみ） |
|---|---|
| `usage_tier` | `first_option` · `second_option` · `third_option` |
| `creator` | `primary_handler` · `secondary_creator` · `playmaker` |
| `shooter_type` | `spot_up` · `floor_spacer` · `three_d` |
| `big_type` | `stretch_big` · `backup_big` · `roll_man` |
| `defense_type` | `pao_defender` · `rim_protector` · `def_anchor` |
| `scorer_type` | `volume_scorer` · `efficient_scorer` |
| `bench_role` | `sixth_man` · `low_usage` |

`low_usage` は `usage_tier` で `first`/`second`/`third` が付いたら **自動除外**。

#### 候補プール 30

| # | ID | ラベル | カテゴリ | 成立条件 |
|---|---|---|---|---|
| 1 | `first_option` | 1ST OPTION | usage | usg rank ≤ 8 **and** pts rank ≤ 12 |
| 2 | `second_option` | 2ND OPTION | usage | usg rank 9–16 **and** pts rank ≤ 18 |
| 3 | `third_option` | 3RD OPTION | usage | usg rank 17–22 **and** pts rank ≤ 22 |
| 4 | `primary_handler` | PRIMARY HANDLER | offense | pnr_bh_freq rank ≤ 10 **or** (ast rank ≤ 10 **and** usg rank ≤ 18) |
| 5 | `secondary_creator` | SECONDARY CREATOR | offense | ast rank ≤ 14 **and** usg rank 14–22 |
| 6 | `playmaker` | PLAYMAKER | offense | ast_pct rank ≤ 10 |
| 7 | `spot_up` | SPOT-UP SHOOTER | offense | spotup_freq rank ≤ 10 **and** usg rank ≥ 14 |
| 8 | `floor_spacer` | FLOOR SPACER | offense | fg3a rank ≤ 12 **and** usg rank 14–24 |
| 9 | `three_d` | 3&D WING | offense | fg3a rank ≤ 12 **and** (matchup_fg_pct **or** stl) rank ≤ 12 |
| 10 | `rim_runner` | RIM RUNNER | offense | restricted_fg_pct rank ≤ 10 **and** pct_pts_paint 上位 |
| 11 | `slasher` | SLASHER | offense | drives rank ≤ 10 |
| 12 | `paint_finisher` | PAINT FINISHER | offense | paint_touches rank ≤ 10 **and** restricted_fg_pct rank ≤ 12 |
| 13 | `post_scorer` | POST SCORER | offense | post_freq rank ≤ 10 |
| 14 | `cutter` | CUTTER | offense | cut_freq rank ≤ 10 |
| 15 | `off_ball_mover` | OFF-BALL MOVER | offense | offscreen_freq rank ≤ 10 **or** handoff_freq rank ≤ 10 |
| 16 | `transition_threat` | TRANSITION | offense | trans_freq rank ≤ 10 |
| 17 | `volume_scorer` | VOLUME SCORER | offense | fga rank ≤ 10 |
| 18 | `efficient_scorer` | EFFICIENT | offense | ts_pct rank ≤ 10 **and** usg rank ≥ 12 |
| 19 | `ft_magnet` | FT MAGNET | offense | fta_rate rank ≤ 10 |
| 20 | `closer` | CLOSER | offense | clutch_usg rank ≤ 10 **or** clutch_pts rank ≤ 10 |
| 21 | `pao_defender` | POA DEFENDER | defense | matchup_fg_pct rank ≤ 10 **or** stl rank ≤ 12 |
| 22 | `rim_protector` | RIM PROTECTOR | defense | blk rank ≤ 10 **or** opp_lt6_pct rank ≤ 10 |
| 23 | `def_anchor` | DEF ANCHOR | defense | drtg rank ≤ 10（低い方が良い） **and** min rank ≤ 15 |
| 24 | `glass_cleaner` | GLASS CLEANER | defense | reb_pct rank ≤ 10 |
| 25 | `hustle_energy` | HUSTLE | defense | avg(deflections, charges, loose_balls) rank ≤ 10 |
| 26 | `stretch_big` | STRETCH BIG | big | position C/PF **and** fg3a rank ≤ 15 |
| 27 | `roll_man` | ROLL MAN | big | pnr_roll_freq rank ≤ 10 |
| 28 | `backup_big` | BACKUP BIG | big | position C/PF **and** min rank ≥ 18 **and** usg rank ≥ 20 |
| 29 | `connector` | CONNECTOR | offense | ast rank ≤ 18 **and** usg rank ≥ 22 **and** ts_pct rank ≤ 12 |
| 30 | `sixth_man` | SIXTH MAN | usage | roster `starter === false` **and** mpg ≥ 24 |

**`low_usage`（プール外だが evaluate）:** usg rank ≥ 26 · **`sixth_man` と排他**（`bench_role` グループ · 高 score 方のみ）。

metric / position / roster 欠損 → その候補スキップ。

**tie-break:** `usage_tier` 系 > `sixth_man` > `primary_handler` > `three_d` / `spot_up` > defense 系 > `low_usage`。

### 3.4 USAGE STRIP（Hero 直下）

`leaderMetrics` から 6 セル · 無い項目は `—`。

| 表示 | leaderMetrics key | フォーマット |
|---|---|---|
| USG% | `usg` | `28.4% · #4` |
| Drives | `drives` | `12.3/G` |
| Paint Touches | `paint_touches` | `8.1/G` |
| FGA | `fga` | `18.2` |
| 3PA | `fg3a` | `7.4` |
| FTA | `fta` | `5.1` |

- rank は `seasonMetrics` / leaderMetrics の `leagueRank`
- 2 行 × 3 列グリッド · Season Averages より **上** に置く（「どう使われるか」を先に）

### 3.5 RECENT ROLE CHANGE（game logs ≥ 8 推奨）

**窓:** logs は **新しい順** · `recent = [0..4]` · `prior = [5..9]`

| シグナル | 条件 | ラベル |
|---|---|---|
| `min_up` | recentAvg(min) ≥ priorAvg(min) × 1.15 | MIN ↑ |
| `min_down` | recentAvg(min) ≤ priorAvg(min) × 0.85 | MIN ↓ |
| `fga_up` | recentAvg(fga) ≥ prior × 1.20 | FGA ↑ |
| `pts_up` | recentAvg(pts) ≥ prior × 1.20 | PTS ↑ |
| `starter_push` | recent 3 試合 avg MIN ≥ season MIN × 1.25 **and** season MIN ≥ 20 | STARTER PUSH |
| `bench_slide` | recent 3 試合 avg MIN ≤ season MIN × 0.75 | BENCH SLIDE |

- 発火したシグナルを **最大 3 チップ** 表示
- 説明文 1 行: JA: `直近5試合: {MIN}分 · {PTS}点 · {FGA}本（前5試合比）`

**USG 変化:** game log に USG なし → Phase A では **FGA + MIN を proxy** · Phase B で leaders `last10` vs `season` USG 差分を追加

### 3.6 CONSISTENCY（game logs ≥ 5）

**今季全体（logs 全件）**

| 行 | 計算 |
|---|---|
| 20+ PTS games | count(pts ≥ 20) / GP |
| 10+ REB | count(reb ≥ 10) / GP |
| 5+ AST | count(ast ≥ 5) / GP |

**直近 10 試合**

| 行 | 計算 |
|---|---|
| PTS range | min–max |
| σ（標準偏差） | population stdev(pts) |
| タイプ | σ < 4.0 → `STABLE` · σ ≥ 7.0 → `VOLATILE` · 間 → `MIXED` |

表示例:

```
20+ PTS   12/58 (21%)
10+ REB    3/58 (5%)
L10 PTS   8–31 · STABLE
```

---

## 4. 実装順序（推奨）

| Step | 内容 | 検証 |
|---|---|---|
| **A-1** | `lib/nba/detailInsights/*` 純関数 + unit 可能な fixture test | 固定入力 → 固定 summary/tags |
| **A-2** | Team: Summary + Identity + overlay ace-out | Preview 1 チーム目視 |
| **A-3** | Team: L10 Trend in Form + Key Impact | |
| **A-4** | Player: Summary + Role + Usage strip | |
| **A-5** | Player: Role Change + Consistency | |
| **A-6** | Web / Native 共有 UI コンポーネント · パリティ | `npm run native:typecheck` |
| **A-7** | `docs/nba-team-detail-status.md` / `player` に Phase A 追記 | |

---

## 5. 触るファイル（実装時）

### lib（新規）

- `lib/nba/detailInsights/**`
- `lib/nba/detailInsights/__tests__/buildTeamDetailInsights.test.ts`（任意 · 推奨）

### lib（変更）

- `lib/nba/teamDetail/useNbaTeamDetailLiveOverlay.ts` — ace-out fetch

### Web UI

- `app/component/teamDetail/NbaTeamDetailPanel.tsx`
- `app/component/playerDetail/NbaPlayerDetailPanel.tsx`
- `app/component/detailInsights/*`

### Native UI

- `apps/native/src/features/games/teamDetail/NbaTeamDetailPanelNative.tsx`
- `apps/native/src/features/games/playerDetail/NbaPlayerDetailPanelNative.tsx`
- `apps/native/src/features/games/detailInsights/*Native.tsx`

### docs

- 本ファイル
- `docs/nba-team-detail-status.md` — Phase A セクション追記
- `docs/nba-player-detail-status.md` — 同上

---

## 6. 既存資産との関係

| 既存 | Phase A での扱い |
|---|---|
| `resolveLean` / `profileNote*` | Summary に統合 · Hero の lean 表示は薄く |
| `buildMatchupEdges` / Pro Brief | ロジック共有は **rankBuckets のみ** · Brief は変更なし |
| `averageRecentGameLogs` | Role Change / Summary で再利用 |
| HOW THEY PLAY | 変更なし · USG 等の **生データ源** |
| ace-out API | Team overlay に接続（初めて詳細 UI 露出） |

---

## 7. サンプル出力（LAL 想定 · 文案確認用）

**TEAM SUMMARY (JA)**  
`直近10試合は7勝3敗。攻撃はリーグ上位だが、守備は平均以下。アデイ・ダヴィス欠場時は4勝7敗（得点108–118）。`

**TEAM IDENTITY**（30 候補から 4 つ）  
`FAST PACE` · `3PT HEAVY` · `PNR HEAVY` · `INJURY RISK`

**PLAYER SUMMARY (JA)**  
`今季58試合 · 平均25.4/7.2/8.1。直近5試合で出場時間が増加。チームの1st optionタイプ。`

**ROLE**（30 候補から 3 つ）  
`1ST OPTION` · `PRIMARY HANDLER` · `CLOSER`

---

## 8. Phase B への接続点（参考）

- L10 Trend に「主力 OUT 試合数」を game log × injury 日付で接続
- Key Impact に `usePlayerStatLeadersBundle` 正式接続
- Role Change に leaders `last10.usg` vs `season.usg`
- SUMMARY 文面を予想 Pro Brief と共通化（`lib/nba/insights/` へ段階的移管）
