# Cursor Automation 設定手順（一回だけ）

Agents Window で以下 3 本を作成する。プロンプトには `.cursor/skills/native-web-sync/SKILL.md` の「実行ループ」全文を貼る。

**前提:** この `docs/` と `.cursor/` を main にコミット・push 済みであること。

---

## Automation A: 毎日のキュー消化

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Daily |
| トリガー | cron `0 6 * * *`（毎日 6:00） |
| ブランチ | `main` |
| ツール | git, PR 作成 |
| 指示 | SKILL.md の実行ループ + 「parityComplete なら即終了」 |

## Automation B: Web 変更追従

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Web Sync |
| トリガー | `main` への push（`app/component/**`, `app/mobile/**`, `lib/**`） |
| 指示 | 変更ファイルの `*Native` 対応を差分移植。対応なしは機能キュー末尾に追記して実装 |

## Automation C: マージ連鎖

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Merge Chain |
| トリガー | `native-parity/*` PR が `main` にマージ |
| 指示 | Automation A と同じ SKILL プロンプトを再実行 |

---

## GitHub 自動マージ（推奨）

1. Settings → General → Allow auto-merge を有効化
2. `native-parity/*` PR で auto-merge をオン
3. 必須チェック: `Native Typecheck`（`.github/workflows/native-typecheck.yml`）

---

## 完了後

あなたは何も言わなくてよい。Automation が以下を自律実行する:

1. **Phase A（機能）** — キュー先頭 `wc-formation-panel` から約 2 週間
2. **Phase B（UI 7〜8割）** — 約 2 週間
3. **完了** — `parityComplete: true` で停止
