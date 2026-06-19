# Cursor Automation 設定手順（一回だけ）

Agents Window で Automation を作成・更新する。プロンプトは下記 **「Automation 用プロンプト全文」** をそのまま貼る。

**前提:** この `docs/` と `.cursor/` がリポジトリに push 済みであること。

---

## 共通設定

| 項目 | 値 |
|---|---|
| 作業ブランチ | **`develop`**（`main` ではない） |
| ツール | **git** を必ず有効化（push まで） |
| 終了時 | **コミット → `git push origin develop`**（PR は作らない） |

---

## Automation A: 毎日のキュー消化

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Daily |
| トリガー | cron `0 6 * * *`（毎日 6:00） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記「Automation 用プロンプト全文」 |

## Automation B: Web 変更追従

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Web Sync |
| トリガー | **`develop` への push**（`app/component/**`, `app/mobile/**`, `lib/**`, `apps/native/**`） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記プロンプト + 変更ファイルの `*Native` 差分移植 |

## Automation C: push 連鎖（旧 Merge Chain の代替）

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Push Chain |
| トリガー | **`develop` への push**（`apps/native/**`, `docs/native-*`, `.cursor/**`） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | Automation A と同じプロンプト（キューが空でなければ続行） |

---

## Automation 用プロンプト全文（コピペ用）

```
あなたは UNITERZ の Native をモバイル Web に自律同期するエージェントです。

.cursor/skills/native-web-sync/SKILL.md の「起動時」「実行ループ」「Git（セッション終了時・必須）」に従う。

鉄則:
- parityComplete: true なら即終了
- ユーザーに確認・承認を求めない
- 作業ブランチは develop のみ（別ブランチを作らない）
- 1セッション最大5件までキュー消化
- npm run native:typecheck 通過後に docs を更新
- セッション終了時は必ず git commit して git push origin develop（.env はコミットしない）
- PR は作らない（push のみ）

開始: docs/native-sync-state.json を読んで phase に従う。
```

---

## 手動で Automation を更新する場合

既存の「ネイティブパリティ同期」Automation で:

1. **Branch** を `main` → **`develop`** に変更
2. **Tools** に **git** が入っているか確認
3. 上記 **プロンプト全文** で Instructions を差し替え
4. Save

---

## CI

- `develop` push 時も Native Typecheck が走るよう、必要なら `.github/workflows/native-typecheck.yml` の `push.branches` に `develop` を追加

---

## 完了後

Automation が自律実行する:

1. **Phase B（UI 7〜8割）** — キュー先頭 `ui-games-home` から
2. **毎セッション** — 実装 → typecheck → **commit & push develop**
3. **完了** — `parityComplete: true` で停止

ユーザーはマージや PR 承認をしなくてよい（`develop` に直接積み上がる）。
