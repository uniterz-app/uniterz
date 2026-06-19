# Native 同期状態

エージェントは毎セッション最初に [`native-sync-state.json`](native-sync-state.json) を読む。

## phase 遷移

1. `functional` — 機能キューを消化
2. `ui-polish` — UI磨き込みキューを消化
3. `parityComplete: true` — 完了、Automation 停止

## 更新ルール

タスク完了時にエージェントがこの JSON を更新する。
