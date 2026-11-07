# UNITERZ エージェント向けガイド

## プロダクト構成

**プロダクトは Native（Expo）だけ。** Web の通常画面は凍結（2026-11-07 ユーザー確定）。詳細: [`.cursor/rules/native-first.mdc`](.cursor/rules/native-first.mdc)

| 面 | パス | 扱い |
|---|---|---|
| Native（正） | `apps/native/` | 機能追加・UI 修正はここだけ |
| 共有ロジック | `lib/` | Native と API が共有 |
| API（Next.js） | `app/api/*` | Native のバックエンド。維持 |
| 規約・共有着地・`/get`・LP・管理画面 | `app/mobile/{terms,privacy,law,electronic-notice,help,u,result,communities,rankings,admin}`・`app/get`・`app/lp*`・`app/admin` | 維持（壊したら直す） |
| それ以外の Web 画面 | `app/mobile/*`・`app/web/*`・`app/component/*` | 凍結。触らない |

Web とのパリティ自動化（Cursor Automation の Daily / Web Sync / Merge Chain）は廃止。

## 命名・共有

- Native UI: `FooNative.tsx`、hook: `useFooNative.ts`
- ロジックは `lib/` に置き、UI は `apps/native/`
- スタイル: `StyleSheet` + `packages/design-tokens`
- API: `EXPO_PUBLIC_UNITERZ_API_BASE_URL` 経由で `app/api/*` を利用
- 型チェック: `npm run native:typecheck`
- 本番 OTA: `.cursor/rules/native-ota-production.mdc`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
