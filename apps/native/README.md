# UNITERZ Native

React Native (Expo) で iOS/Android アプリを開発するためのディレクトリです。

## 起動

リポジトリルートで実行:

- `npm run native:start`
- `npm run native:ios`
- `npm run native:android`

## 環境変数

- `apps/native/.env.example` をコピーして `apps/native/.env` を作成
- Firebase の値を `EXPO_PUBLIC_FIREBASE_*` として設定
- Web で使っている Firebase プロジェクトと同じ値を利用
- 予想の投稿・更新は Next.js の `POST/PATCH /api/posts_v2` 経由のため、デプロイ済み Web のオリジンを **`EXPO_PUBLIC_UNITERZ_API_BASE_URL`** に設定する（末尾スラッシュなし。例: `https://your-domain.com`）

## 現在の方針

- UIテイストは Web を維持
- サイズ・余白・タイポはモバイル向けに最適化
- 共通ロジックは `packages/shared` へ段階移行
- デザイントークンは `packages/design-tokens` へ集約
