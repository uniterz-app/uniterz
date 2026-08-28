# NBA スタッツ — データ取得の正

二度手間を避けるためのメモ。詳細は `.cursor/rules/nba-stats-data-pipeline.mdc`（エージェント常時適用）。

## 正

```
BDL（サーバーのみ）
  → admin ingest
  → Firestore
  → 公開 /api/nba/*
  → Web / Native
```

公開 API がリクエストごとに BDL を叩くのは **禁止**。

## プレイヤー詳細

| 何 | ingest | Firestore | GET |
|---|---|---|---|
| 複数年契約 | `POST /api/admin/nba-player-contracts-ingest`（末尾で年俸ソート→`salaryRank`。BDL `rank` 不使用） | `nbaPlayerContracts/{season}/players/{id}` | `/api/nba/player-contract` |
| Season / Playoffs 成績 | `POST /api/admin/nba-player-career-seasons-ingest` | `nbaPlayerCareerSeasons/{id}` | `/api/nba/player-career-seasons` |
| 試合ログ（直近 ~20） | `POST /api/admin/nba-player-game-logs-ingest` | `nbaPlayerGameLogs/{season}/players/{id}` | `/api/nba/player-game-logs` |
| ショットゾーン | `POST /api/admin/nba-player-shot-zones-ingest`（リーグ by_zone 一括） | `nbaPlayerShotZones/{season}/players/{id}` | `/api/nba/player-shot-zones` |

先に rosters ingest が必要（対象プレイヤー一覧の正）。

### 部分実行例

```bash
# SGA だけ契約
curl -X POST .../api/admin/nba-player-contracts-ingest \
  -H "Authorization: Bearer <admin>" \
  -d '{"playerIds":["175"]}'

# SGA だけキャリア
curl -X POST .../api/admin/nba-player-career-seasons-ingest \
  -H "Authorization: Bearer <admin>" \
  -d '{"playerIds":["175"]}'

# SGA だけ試合ログ
curl -X POST .../api/admin/nba-player-game-logs-ingest \
  -H "Authorization: Bearer <admin>" \
  -d '{"playerIds":["175"]}'

# SGA だけショットゾーン
curl -X POST .../api/admin/nba-player-shot-zones-ingest \
  -H "Authorization: Bearer <admin>" \
  -d '{"playerIds":["175"]}'
```

`maxPlayers` でも上限を切れる。

## 日次更新（定時）

試合後に変わるもの（リーグ表・injury・試合・ゾーン等）は毎日まとめて回す。

| 何 | 時刻 | 入口 |
|---|---|---|
| daily | **毎日 18:00 JST**（Firebase `runNbaStatsDailyIngestCron`） | `POST /api/admin/nba-stats-daily-ingest` `{ "mode": "daily" }` |
| weekly | **毎週月曜 10:00 JST**（`runNbaStatsWeeklyIngestCron`） | `POST /api/admin/nba-stats-weekly-ingest` — ペイロール + 契約 |
| heavy（任意） | 手動 / 別スケジュール | 日次 URL `{ "mode": "heavy" }` — プレイヤー試合ログ全ロスター |

daily の中身（順）: rosters → games → league-stats → injuries → team-game-logs → player-shot-zones → **player-game-logs-incremental**（直近 NY 日付の box 出場者のみ → Last 10 更新）。

`league-stats`（チーム）は HOW THEY PLAY 用に base / advanced / opponent / scoring / hustle / tracking / clutch / playtype を取る。  
チーム `shooting/by_zone` は BDL 不可のため、リーグ表の RIM/C3 チップは非表示。チーム詳細の SHOT 枠は置かない。

**Last 10（追加 BDL なし）**

- Team: `games` のスコアから W–L / PPG / PAPG / DIFF のみ。UI もその指標に限定。
- Player: ingest 済み `nbaPlayerGameLogs` から box 指標を集計。daily の incremental で直近出場者を更新。全件は heavy。

前期シーズンへの公開 API フォールバックはしない（今季空なら empty）。

キャリア seasons は重いので手動。契約・ペイロールは週次 cron。

プレイヤー単位でループする ingest（game-logs / contracts / career-seasons）と
チーム 30 件を回す BDL fetch は `lib/async/forEachWithConcurrency` のワーカープールで走る。
直列 + `sleep` に戻さない（数百件でサーバーレスのタイムアウトに当たる）。
並列度は `NBA_INGEST_CONCURRENCY`。career は 1 人あたり年数 × 2 本出るので別途 3。

Functions 側 env:

- `NEXT_NBA_STATS_DAILY_INGEST_URL` … 本番 Next の日次 URL（**www** 付き）
- `NEXT_NBA_STATS_WEEKLY_INGEST_URL` … 週次 URL
- `NEXT_NBA_PRO_BRIEF_INGEST_URL` … Pro Insight ingest（任意。未設定なら DAILY URL のパスを置換）
- Secret `INTERNAL_JOB_SECRET` … Next と同じ値（ヘッダ `x-internal-job-secret`）

Pro Insight:

| 何 | 入口 |
|---|---|
| 前日 19:00 フル（初版） | Firebase `runNbaProBriefFullCron` → `POST /api/admin/nba-pro-brief-ingest` `{ "mode": "full" }` |
| tip 1h 前（ケガ反映の完全版） | Firebase `runNbaProBriefPatchCron`（毎時 :15 JST）`{ "mode": "patch" }` |
| 前季成績 | `nbaTeamSeasonRecords/{priorSeason}`（games から home/away・H2H・対.500・対カンファ上位6） |
| 公開 | `GET /api/nba/matchup-insight?gameId=` → `games/{id}.proBrief` |
| 保存 | `games/{id}.proBrief` |

前季スプリット再構築: `{ "mode": "full", "rebuildPriorRecords": true }`  
（今季 `2026-27` と前期 `2025-26` の両方を再集計。games が薄いときは **BDL `/nba/v1/games?seasons[]=`** から ingest）

手動:
```
npx tsx scripts/ingest-nba-team-season-records.ts 2025-26 --force
npx tsx scripts/ingest-nba-team-season-records.ts 2026-27 --force
```

## ライブ試合（スコア + box）

```
BDL /nba/v1/games?dates[]=… + /nba/v1/box_scores(/live)
  → POST /api/admin/nba-live-games-ingest
     （シーズン中 cron: 毎分 tick → ライブ枠の試合があるときだけ実行）
  → games/{nba-bdl-*}.status / scores / liveStats
  → GET /api/games/live-stats（クライアントは 60 秒ポーリング）
```

| 何 | 入口 |
|---|---|
| 手動 / cron | `POST /api/admin/nba-live-games-ingest` |
| Firebase | `runNbaLiveGamesIngestCron` — **オフシーズン停止中**。再開後は毎分 tick だが **ライブ枠の試合があるときだけ** Next/BDL を叩く（`shouldRunNbaLiveGamesIngest`） |
| 手動 | オフシーズンでも `POST` で試験可 |
| env | `NEXT_NBA_LIVE_GAMES_INGEST_URL`（**www** 付き本番 URL）+ `INTERNAL_JOB_SECRET` |
| URL 例 | `https://www.uniterz.app/api/admin/nba-live-games-ingest`（apex は 307） |

ライブ枠: tip が now±（-4h 〜 +20min）かつ final でない、または `status === live`。試合のない日・全試合終了後は BDL を呼ばない。

UI（Team / Box）は既存。`liveStats` が無い試合はパネル非表示のまま。

## 後回し

- **ライブ cron 再開**（シーズン開始時）: `functions/src/index.ts` で `runNbaLiveGamesIngestCron` を再 export → デプロイ。URL は www 付き。試合がある時間帯だけ BDL が走る。
- **プレイヤーキャリア seasons** の自動 ingest（重い）。週次はペイロール＋契約まで。キャリアは手動 / バッチ。
- **予想の topScorerCandidates**: `games` に載っていればそれを使う。無いときは対戦2チームのロスター（`/api/nba/team-rosters`）から PPG 順にクライアントで組む。先頭5人＋展開で残り。モックには落とさない。
- **Pro Insight（brief）**: 本番 brief が未配線のあいだは PendingPanel。`nbaProBriefPreviewMocks` は preview 画面専用。
- ~~Cloud Functions Node 20 → 22~~ → `functions/package.json` を 22 に更新済み。再デプロイで反映。
