# プレシーズン参加ボーナス（50 Unit）

ユーザー確定（2026-10-09）: **プレシーズン中にアプリを使った人 + 新規登録した人に 50 Unit を配布する。**  
（2026-09-11 の「予想者のみ・登録のみは配らない」から変更）

## 方針

| 項目 | 内容 |
|---|---|
| 期間 | JST 2026-10-08 0:00 〜 2026-10-21 4:00（開幕戦 セルティックス @ ピストンズ のティップオフ） |
| 対象 | 期間中に新規登録した、または期間中にアプリを使ったアカウント（`users/{uid}` に表示名があり、無効化されていない） |
| 除外 | 審査用・運営テスト用（ReviewerUser / testapple / uniterz_test）、表示名なし（初期設定未完了） |
| 付与 | **50 Unit / 1 アカウント 1 回** |
| 判定 | Firebase Auth の `creationTime` / `lastRefreshTime`（無ければ `lastSignInTime`） |
| 台帳 | reason `preseason_bonus`、冪等キー `preseason:2026-27:bonus:uid{uid}` |
| 演出 | `pending_unit_earns` に「プレシーズン参加ボーナス」 |

定数の正: `lib/units/preseasonBonus.ts`

## 実行

`lastRefreshTime` は上書き式でログイン履歴が残らないため、**開幕戦ティップオフ直後（JST 10/21 4:00 以降）に 1 回実行**する。遅れると、開幕後に初めて戻った既存ユーザーも含まれる。

```bash
DRY_RUN=1 npx tsx scripts/grant-preseason-participation-units.ts
npx tsx scripts/grant-preseason-participation-units.ts
```

再実行しても台帳キーで二重付与しない。

## 自動付与（開幕まで）

期間中は、ログイン・登録したユーザーにサーバーが自動で付与する（`lib/units/preseasonBonusServer.ts`、台帳キーは一括スクリプトと共通なので二重付与しない）。

| きっかけ | 経路 | 旧アプリ |
|---|---|---|
| アプリ / Web を開いた | `POST /api/me/preseason-bonus`（`PreseasonBonusClaimHost` / `PreseasonBonusClaimHostNative`） | 新コードのみ |
| 初期設定完了（新規登録） | `POST /api/me/profile`（`completeOnboarding`） | ○ |
| プロフィールの Unit 演出取得 | `GET /api/me/pending-unit-earns` | ○ |

開幕（`PRESEASON_BONUS_WINDOW_END_MS`）以降はクライアントが API を呼ばず、サーバーも付与しない。

## 実行記録

- [x] 1 回目（JST 2026-10-10 22:06）: 562 アカウントに付与（新規 318 / 既存 244）→ 28,100 Unit。表示名なし 13 は除外
- [ ] 2 回目（開幕戦ティップオフ直後 JST 10/21 4:00 以降）: 1 回目以降に登録・利用した人の分（付与済みは自動スキップ）

## 参考（2026-10-09 時点の dry-run）

Auth 3,521 中、対象 13（新規 0 / 既存 13）→ 650 Unit（開始 10/8・除外適用後）。
