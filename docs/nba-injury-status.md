# NBA Injury — 状態（2026-09-02）

> **結論:** **完了**（予想 INJURY / チーム詳細 / プレイヤー詳細）。データは BDL → Firestore → 公開 API。

---

## データパイプライン

```
BDL player_injuries
 → 専用 ingest（下記スケジュール）
 → Firestore `nbaTeamInjuries/{season}`
 → GET /api/nba/team-injuries
 → クライアント（予想 / 詳細 overlay）
```

### 更新スケジュール（BDL fetch）

| タイミング (JST) | 内容 |
|---|---|
| **16:00** | ベースライン（**その日 NBA 試合がある日のみ** · ランキング更新と同タイミング） |
| **23:00** | ベースライン（今夜の試合向け） |
| **10分毎** | 試合 **T-3h / T-1h / T-30m**（±10分）のいずれかに該当するときだけ fetch |
| dedupe | pregame は直近 **20分** 以内に fetch 済みならスキップ |

- ユーザーがアプリを開いても **BDL は叩かない**（Firestore スナップショット読み取りのみ）
- 18:00 日次スタッツ ingest から injury ステップは **切り離し済み**
- Pro brief patch（毎時）は injury スナップショットを **読むだけ**（BDL 再 fetch なし）

| 項目 | 方針 |
|---|---|
| Available / Healthy | ingest で除外 |
| ステータス | `out` · `doubtful` · `questionable` · `probable` · `day-to-day`（旧 `gtd` → `questionable`） |
| 理由 | BDL `description`（英語）。UI は辞書ベース要約で **JA 表示** |
| 復帰見込み | BDL `return_date` → JA/EN 表示整形 |

---

## UI 接続

| 画面 | パス / コンポーネント | 状態 |
|---|---|---|
| 予想 INJURY タブ | `NbaInjuryReportPanel` / `*Native` | ✅ 実データ · 2カラム · 詳細展開 · 更新日時 |
| チーム詳細 INJURIES | `NbaTeamDetailPanel` | ✅ |
| プレイヤー詳細 欠場バナー | `NbaPlayerDetailPanel` | ✅ JA 理由 · 復帰日 |
| Roster 行ハイライト | `injuryStatusByPlayerId` | ✅ |

---

## 共有ロジック

| ファイル | 役割 |
|---|---|
| `lib/nba/teamInjuries/injuryReasonDisplay.ts` | JA/EN 理由ラベル · 復帰日 · 長文ニュース |
| `lib/nba/teamInjuries/injuryStatusDisplay.ts` | BDL/スナップショット status · 色 · availability 変換 |
| `lib/nba/predict/buildMatchupInjuryReport.ts` | 対戦2チーム合成 |
| `lib/predict/nbaInjuryReport.ts` | 予想タブ型 · 部位辞書 · ステータストーン |

---

## 意図的にやらない

- リーグ全体 injury 一覧ハブ（予想・チーム詳細で足りる）
- `reasonJa` の手翻訳 ingest（辞書要約で JA 対応）
- InjuryDesignPreview の別案 UI を本番へ（採用デザインは既存 2 カラム + 展開）

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-09-02 | 専用 cron（16:00 / 23:00 / 試合前窓）。日次 ingest・pro patch から BDL fetch 分離 |
| 2026-09-02 | 初版。ステータス粒度 · JA 理由 · 予想パネル polish · 完了宣言 |
