# NBA プレイヤー詳細 — 状態（2026-09-01）

> **結論:** **完了**。Native/Web パリティ · 合成 API 接続 · PREVIEW 表記除去。  
> **次の NBA 本線:** injury · チームスタッツ周辺 polish。

---

## ユーザー向け画面（正）

| 面 | パス / 画面 |
|---|---|
| **Web mobile** | `/mobile/player-detail-preview?playerId=` · `NbaPlayerDetailPanel` |
| **Native** | `PlayerDetailPreview` · `PlayerDetailPreviewScreenNative` · `NbaPlayerDetailPanelNative` |

**入口:** STATS ハブ（Player 検索・リーダー行）· チーム詳細ロスター · 予想 Roster / Injury

レガシー `/mobile/players/[id]` ルートは **なし**。

---

## データ

```
getNbaPlayerDetailPreview(playerId)   → 空シェル（デモ seed なし）
usePlayerStatLeadersBundle()            → GET /api/nba/player-stat-leaders
useLeagueTeamStatsBundle()              → GET /api/nba/league-team-stats
useNbaPlayerDetailLiveOverlay()
  → GET /api/nba/player-detail（合成 · Firestore のみ）
```

| セクション | スナップショット | 状態 |
|---|---|---|
| Hero / バイオ | team-rosters | ✅ 日次 |
| Injury | team-injuries | ✅ 日次 |
| シーズン平均 + 順位 | seasonMetrics + leaders | ✅ 日次 |
| HOW THEY PLAY | leaders + league-team-stats | ✅ |
| Home/Away · Vs Opponent | player-game-logs | ✅ **空なら非表示** |
| Career 表 | player-career-seasons | ✅ **手動 ingest** |
| Shot chart | player-shot-zones | ✅ 日次 |
| Game logs（UI 直近 20） | player-game-logs | ✅ 日次 incremental |
| Contract | player-contracts | ✅ **週次** |
| Awards | 手 curated | ✅ **都度更新**（`applyCuratedPlayerAwards`） |

### 意図的に非表示

- Home/Away · Vs Opponent — 試合ログ未 ingest 時は **セクションごと非表示**（空 NO DATA を出さない · pipeline ルール）

---

## 運用

| スナップショット | 日次 18:00 JST | 週次 | 手動 |
|---|---|---|---|
| rosters · injuries · league-stats · shot-zones | ✅ | | |
| player-game-logs | ✅ incremental | | heavy / `playerIds` で全件可 |
| player-contracts | | ✅ 月曜 | |
| player-career-seasons | | | ✅ `nba-player-career-seasons-ingest` |
| awards | | | 手更新 |

初回立ち上げ: career ingest + 必要なら game-logs **heavy**（全ロスター 82 試合）。

---

## 共有実装

- Hook: `lib/nba/playerDetail/useNbaPlayerDetailLiveOverlay.ts`
- 合成読み: `lib/nba/playerDetail/loadPlayerDetailBundle.ts`
- Native / Web 同一セクション構成（パリティ ~95%）

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-09-01 | PREVIEW 除去 · 本 doc 作成 |
| 2026-09-01 | 監査 — 合成 API 接続済みと確認 |
