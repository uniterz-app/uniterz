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

## プッシュ通知

- ログイン後、OS の通知権限を許可すると Expo Push Token が `POST /api/me/push-token` 経由で Firestore に登録されます
- 試合開始（15 分前）・試合終了・ランキング更新は Cloud Functions から予想投稿者へ送信されます
- 本番ビルドには [EAS Build](https://docs.expo.dev/build/introduction/) とプッシュ資格情報（APNs / FCM）の設定が必要です（`eas.json` 雛形あり）
- 開発中は [Expo Push Tool](https://expo.dev/notifications) で手動送信テストが可能です
- **`expo-notifications` 追加後は dev-client の再ビルドが必須**（Metro のリロードだけでは足りない）:
  - `npm run native:ios` または `npm run native:android`
  - 未ビルドだと `ExpoPushTokenManager` エラーになる（アプリは起動するがプッシュ登録はスキップ）

## 現在の方針

- UIテイストは Web を維持
- サイズ・余白・タイポはモバイル向けに最適化
- 共通ロジックは `packages/shared` へ段階移行
- デザイントークンは `packages/design-tokens` へ集約
