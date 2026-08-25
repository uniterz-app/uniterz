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
| heavy（任意） | 手動 / 別スケジュール | 同上 `{ "mode": "heavy" }` — プレイヤー試合ログ含む（重い） |

daily の中身（順）: rosters → games → league-stats → injuries → team-game-logs → player-shot-zones。

`league-stats`（チーム）は HOW THEY PLAY 用に base / advanced / opponent / scoring / hustle / tracking / clutch / playtype を取る。  
チーム `shooting/by_zone` は BDL 不可のため、チーム詳細の SHOT 枠は置かない。

**Last 10（追加 BDL なし）**

- Team: `games` のスコアから W–L / PPG / PAPG / DIFF のみ。UI もその指標に限定。
- Player: ingest 済み `nbaPlayerGameLogs` から box 指標を集計（league-stats / game-logs ingest 時）。Advanced は空。

前期シーズンへの公開 API フォールバックはしない（今季空なら empty）。

契約・キャリアはシーズン中ほぼ固定なので日次には入れない（変更時に手動 ingest）。

Functions 側 env:

- `NEXT_NBA_STATS_DAILY_INGEST_URL` … 本番 Next の上記 URL
- Secret `INTERNAL_JOB_SECRET` … Next と同じ値（ヘッダ `x-internal-job-secret`）

## ライブ試合（スコア + box）

```
BDL /nba/v1/games?dates[]=… + /nba/v1/box_scores(/live)
  → POST /api/admin/nba-live-games-ingest（60 秒 cron）
  → games/{nba-bdl-*}.status / scores / liveStats
  → GET /api/games/live-stats（クライアントは 60 秒ポーリング）
```

| 何 | 入口 |
|---|---|
| 手動 / cron | `POST /api/admin/nba-live-games-ingest` |
| Firebase | `runNbaLiveGamesIngestCron`（every 1 minutes, America/New_York） |
| env | `NEXT_NBA_LIVE_GAMES_INGEST_URL`（**www** 付き本番 URL）+ `INTERNAL_JOB_SECRET` |
| URL 例 | `https://www.uniterz.app/api/admin/nba-live-games-ingest`（apex は 307） |

UI（Team / Box）は既存。`liveStats` が無い試合はパネル非表示のまま。

## 後回し

- Cloud Functions の **Node.js 20 → 22（など最新 LTS）** 昇格。全関数に非推奨警告が出ている。`functions/package.json` の `engines.node` を上げてまとめて再デプロイ。期限目安: 2026-10 廃止前。
