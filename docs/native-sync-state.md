# Native 同期状態

> **廃止（2026-11-07）:** Web とのパリティ同期はやめた（`native-sync-state.json` は `retired: true`）。以下は記録。方針: [`.cursor/rules/native-first.mdc`](../.cursor/rules/native-first.mdc)

エージェントは毎セッション最初に [`native-sync-state.json`](native-sync-state.json) を読む。

## phase 遷移

1. `functional` — 機能キューを消化
2. `ui-polish` — UI磨き込みキューを消化
3. `phase-c` — partial / gap 画面の機能・UI 仕上げ
4. `parityComplete: true` — 完了、Automation 停止

## 更新ルール

タスク完了時にエージェントがこの JSON を更新する。

## チェーン継続

`parityComplete: false` で Run を終えるとき:

1. `lastSessionAt` を当日に更新
2. `apps/native/**` に変更がなければ `apps/native/.parity-chain` の `lastPushAt` も更新
3. **必ず** `git push origin develop`（Merge Chain が次 Run を起動）
