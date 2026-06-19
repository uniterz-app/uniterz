---
name: native-web-sync
description: >-
  モバイル Web を正として Native を自律同期する。機能・UI（7〜8割）まで確認なしで連続実行。
  トリガー: Cursor Automation、または「続けて」「ネイティブ同期」。
---

# Native Web 自律同期

## 起動時

1. [`docs/native-sync-state.json`](../../docs/native-sync-state.json) を読む
2. `parityComplete: true` → 即終了
3. `phase` でキューセクションを決定:
   - `functional` → `docs/native-parity-gaps.md` の機能キュー
   - `ui-polish` → UI磨き込みキュー

## 実行ループ（最大5件/セッション）

1. キュー先頭の `[ ]` を取得
2. Web 参照ファイルを読む（`app/mobile/` → `app/component/`）
3. **承認なしで実装**
   - 機能: 7ステップ（`AGENTS.md` 参照）
   - UI: Tailwind 値抽出 → StyleSheet 修正 → motion 突合 → 照合チェックリスト
4. `npm run native:typecheck`
5. キュー `[x]`、`native-parity.md` の status/uiStatus 更新、state 更新
6. 次の `[ ]` へ（ユーザーに聞かない）

## フェーズ切替

- 機能キューが空 → `phase: "ui-polish"`
- UI キューも空 → `parityComplete: true`

## Git（セッション終了時・必須）

**ユーザーに聞かず、毎セッション必ず `develop` にコミットして push する。** PR 作成は不要（push が主、PR はユーザーが明示したときだけ）。

1. `git status` / `git diff` で変更確認（`.env` / `.env.*` / 秘密鍵は **add しない**）
2. 関連ファイルのみ `git add`
3. 日本語コミットメッセージ（1〜2文、why 中心）。例:
   - `native-parity: [ui-polish] ui-games-home 等3件、残り8件`
4. `git push origin develop`
5. push 失敗時: 1回 `git pull --rebase origin develop` → 再 push。それでもダメなら `blockedItems` に記録して終了

**作業ブランチ:** 常に `develop` を checkout してから実装（`native-parity/*` や `cursor/*` は作らない）。

## PR（任意・通常は使わない）

- ユーザーまたは org ポリシーで PR 必須のときだけ作成
- ブランチ: `native-parity/YYYYMMDD-N`
- タイトル例: `native-parity: [ui-polish] 3件完了、残り8件`

## 停止条件

- `parityComplete: true`
- 設計判断が必要（`blockedItems` に記録してスキップ）
- 同一項目で typecheck 3回失敗

## 参照

詳細マップ: [reference.md](reference.md)
