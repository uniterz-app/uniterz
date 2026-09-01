# NBA チーム詳細 — 状態（2026-09-01）

> **結論:** **完了**。Native/Web パリティ · データ接続 · PREVIEW 表記除去 · レガシー redirect · `team-season-records` 日次 ingest 済み。

---

## ユーザー向け画面（正）

| 面 | パス / 画面 |
|---|---|
| **Web mobile** | `/mobile/team-detail-preview?teamId=` · `NbaTeamDetailPanel` |
| **Native** | `TeamDetailPreview` · `TeamDetailPreviewScreenNative` · `NbaTeamDetailPanelNative` |

**入口:** 順位表 · STATS ハブ · 予想 Team Stats · Games ドロワー

**レガシー:** `/mobile/teams/[teamId]` · Native `TeamDetail` → 上記 Preview へ **redirect**

---

## データ

```
useLeagueTeamStatsBundle() → GET /api/nba/league-team-stats
useNbaTeamDetailLiveOverlay()
  → team-rosters · team-payroll · team-game-log · team-injuries · team-season-records
```

| セクション | 状態 |
|---|---|
| Hero · INJURIES · METRICS · HOW THEY PLAY · Form/Logs/H2H/Upcoming | ✅ API |
| SPLITS HOME/AWAY · VS E/W | ✅ team-game-log |
| **VS .500+ / SUB-.500** | ✅ team-season-records（**日次 ingest**） |
| PAYROLL · ROSTER | ✅ |
| **DRAFT ASSETS** | ✅ 手 curated · **トレード都度更新**（`nbaDraftCapitalData.ts`） |

### チーム詳細 UI に出さない（確定）

- `opponentStats` — データ保持のみ
- エース欠場 W–L — **Pro Insight** で表示（ingest/API 維持）
- チーム SHOT / by_zone — 不要（BDL 不可）

---

## 運用

| スナップショット | 日次 18:00 JST | 週次 |
|---|---|---|
| team-season-records | ✅（`nbaStatsDailyIngest` · team-game-logs の直後） | |
| team-rosters · injuries · game-logs · league-stats | ✅ | |
| team-payroll | | ✅ 月曜 |
| draft capital | 手更新（トレード時） | |

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-09-01 | PREVIEW 除去 · レガシー redirect · team-season-records を日次 ingest に追加 |
| 2026-09-01 | ユーザー確定: DRAFT 完了 · ace-out/opponent/SHOT は詳細 UI 非表示 |
| 2026-09-01 | 初版 |
