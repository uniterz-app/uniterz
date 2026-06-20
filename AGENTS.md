# UNITERZ エージェント向けガイド

## プロダクト構成

| 面 | パス |
|---|---|
| Web（Next.js） | リポジトリルート `app/` + `lib/` |
| モバイル Web（正） | `app/mobile/*` + `app/component/*` |
| デスクトップ Web（参考のみ） | `app/web/*` |
| Native（Expo） | `apps/native/` |

## ゴール

**モバイル Web と Native のパリティを、ユーザー入力なしで自律的に達成する。**

| レベル | 対象 |
|---|---|
| 機能パリティ | はい |
| 構造パリティ | はい |
| UI パリティ（見た目 7〜8割） | はい |
| ピクセル完璧・実機目視仕上げ | 対象外 |

## 実行エンジン

1. **Cursor Automation**（主）— 毎日・Web 変更時・`develop` push 連鎖（**Merge Chain**）。**終了時は必ず push `develop`**（`parityComplete: false` の間）
2. **作業キュー** — [`docs/native-parity-gaps.md`](docs/native-parity-gaps.md)
3. **進捗状態** — [`docs/native-sync-state.json`](docs/native-sync-state.json)（人間向け説明: [`docs/native-sync-state.md`](docs/native-sync-state.md)）

## 鉄則

- ユーザーに何も聞かない
- 計画の承認を求めない
- キュー先頭を自動実行（選ばない）
- 1 件終わったら次へ進む
- 機能キューが空になるまで UI キューに入らない
- 設計判断が必要なら `blockedItems` に記録してスキップ

## 命名・共有

- Native UI: `FooNative.tsx`、hook: `useFooNative.ts`
- 先頭コメント: `/** Web \`Foo\` 相当 */`
- ロジックは `lib/` に置き、UI だけ RN で再実装
- スタイル: `StyleSheet` + `packages/design-tokens`
- アニメ: framer-motion → Reanimated（Web の `*Motion.ts` から秒数コピー）
- API: `EXPO_PUBLIC_UNITERZ_API_BASE_URL` 経由で Web API を利用

## 移植しないもの

`app/admin/*`、`app/lp*`、SSR 専用、Three.js/R3F、デスクトップ専用レイアウト

## 完了条件

[`docs/native-parity.md`](docs/native-parity.md) 参照。機能キュー + UI キューが空、`uiStatus` が done/partial、`parityComplete: true`。

## 詳細手順

- ルール: `.cursor/rules/native-*.mdc`
- スキル: `.cursor/skills/native-web-sync/SKILL.md`
