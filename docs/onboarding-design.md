# オンボーディング設計（Native 初回体験）

2026-11-20 時点の整理。別チャットで続きを作るための引き継ぎ資料。

## 1. 背景と課題

- 初心者が知りたいこと: **予想のやり方 / どこに何があるか / Unit のもらい方 / Unit で何ができるか**
- 既存の初回チュートリアルは、予想の流れ（試合 → 予想 → 結果 → ランキング）は説明している
- 不足していたのは、**Unit の説明の位置** と **ランキングを見る動機（Unit がもらえる）**
- 「画面を見せる紹介（画像カルーセル）」は、画面が変わると古くなるため採用しない方針

## 2. 現状の構成（コードの事実）

### 実際に動いている流れ（2026-11-20 にコードで再確認）
新規登録 → プロフィール設定 → 試合タブ着地 の順に次のとおり。

1. **初期設定モーダル**（`FirstRunSetupModalNative`・`lib/onboarding/firstRunSetup.ts`）: 通知のオン / オフ + スコア表示（ライブ / 最終）。「はじめる」で OS の通知許可ダイアログへ
2. **試合タブのヒント 2 枚**（`GamesHomeScreen.tsx`）: `games`（カードを指す）→ `gamesPickup`（PICK UP の印を指す）。終わると `games` ヒント既読。モックの試合は出ない
3. **ほかのタブは初めて開いたときに 1 回だけ**（`TutorialLiveHostNative.tsx`・連鎖なし）
   - リザルト: 1 枚
   - ランキング: 2 枚（説明 + 「スコアの計算の仕方」ボタン → Pick Up / PRO LEAGUE の欄を指す）
   - グループ: 1 枚（作成ボタンを指す）
   - プロフィール: 3 枚（プロフィールとは → **UNIT とは**〔コインを指す〕→ キャリア。最後に「メニューから見直せる」）
4. スキップは確認ダイアログあり。**試合タブでスキップすると全タブのヒントが既読になる**（`completeTutorialFully`）
5. 既読は端末 + `users` のサーバー側フラグ（`fetchAppTutorialSeenNative`）

### 休眠しているもの（ファイルは残っているが、いまの入口からは出ない）
- ウェルカム 2 択（ヒントを見る / 新機能だけ）: `phase = "welcome"` を書くのは `horizon` の「戻る」だけで、`horizon` に入れるのはウェルカム 2 択だけ。つまり自己完結した死んだ経路。サイドメニュー再開も 2 択を挟まず試合タブのヒント先頭へ
- 練習ツアー `TutorialPracticeTourNative.tsx`（NBA モックで予想 → HIT/MISS）: どこからも import されていない
- `TutorialHybridIntroNative.tsx`・`tutorialCopy.ts`（旧スライド）も同様
- フェーズ型の `gamesStats` / `done`・`tutorial.practice.*` の tap / guide / result* / done* 系の文言は大半が未使用

### 新機能（horizon）のカード定義（`lib/tutorial/tutorialHorizonSteps.ts`）
- 実際に使われているのは **プロフィールのヒントが `buildHorizonFeatureSteps` を直接呼んでいる部分**（UNIT とは → キャリア）
- スクワッドバトルのカードは `HORIZON_INCLUDE_SQUAD_BATTLE = false` で非表示

### 再開
- サイドメニューの「チュートリアル」→ 既読・ピックを消して試合タブのヒント先頭から（`prepareTutorialRestartNative`）

### 文言の置き場所
- `messages/{ja,en,ko,zh,es,fr,de,pt,ar}.ts` の `tutorial.practice.*`（例: `rankingsBody`、`horizonUnitWhatTitle` / `horizonUnitWhatBody`）
- 旧 Web 用の `lib/tutorial/tutorialCopy.ts`（スライド定義）は Native の通常経路では使っていない

### 関連する既存の説明
- ASK（AI チャット）の Unit 説明: `lib/nba/ask/nbaAskKnowledge.ts`（Unit の額・上限は定数から組み立て）
- 交換カタログ: `lib/redemption/redemptionCatalog.ts`
- 期間ランキングの Unit 表: `lib/units/periodRankingUnitRewards.ts`

## 3. 今日の変更（完了）

### 3-1. Unit 説明を 1 枚にまとめた
- 「UNIT とは」と「UNIT の獲得」の 2 枚を、「UNIT とは」の 1 枚に統合
- 本文は次の 3 点（9 言語とも同じ意味）
  - 光るコインが UNIT 残高
  - ランキング上位・スクワッドバトル・友達招待などで貯まる
  - ユニフォーム・帽子などと交換できる。予想を外しても減らない
- 変更箇所: `lib/tutorial/tutorialHorizonSteps.ts`、`messages/*.ts`（`horizonUnitHow*` は削除）
- 型チェックで今回の変更箇所にエラーなし。**端末での目視確認はまだ**

### 3-2. PRO PICK の広告（モック）による「この試合だけ解除」
オンボーディングの「初心者に優しく」の一部として進めた。Free の導線に関わる。

決定事項（ユーザー確定）
- Pro は広告なし
- Free: 予想済みなら、**初回の 1 試合は無料**（アカウントで 1 回だけ）
- Free: 2 試合目以降は**試合ごとに広告 1 本**（1 日の上限はなし）
- 広告で Unit は付けない
- 「7 日無料で試す」の導線は残す

実装の場所
- サーバー判定: `lib/pro/proPickGameAccess.ts`
- API: `app/api/nba/pro-pick-unlock/route.ts`（`POST`）
- 中身の出し分け: `app/api/nba/matchup-insight/route.ts`（解除済みの Free は Pro と同じ中身）
- ネイティブ: `apps/native/src/features/games/predict/NbaPredictToolsTabsNative.tsx`、`PredictProBriefPanelNative.tsx`、`ProPickAdMockModalNative.tsx`（新規）
- 文言: `lib/predict/proPickAdCopy.ts`（新規、9 言語）
- 解除記録: `proPickGameUnlocks/{uid}_{gameId}`（クライアントからは読めない。既定の拒否を確認済み）
- 初回の無料の印: `users/{uid}.proPickLaunchFreeUsedAt`（新ビルド以降、Free の最初の PRO PICK が広告なし。予想済みは不問。クライアントは更新できない。許可リストを確認済み）

動かし方（モック）
- サーバーの環境変数 `PRO_PICK_AD_MOCK=1`（ルートの `.env.local` に設定済み）
- ボタンは **`__DEV__` のときだけ**出る（`PRO_PICK_AD_UI_ENABLED`）。本番では従来の導線のみ
- 解除の判定はサーバーだけ。モック広告は `PRO_PICK_AD_MOCK=1` のときしか解除できない（本番は 503）

注意
- 対象は「予想の材料（PRO PICK）がある試合」だけ。物語の文章だけの試合は従来どおり
- PRO PICK の材料は毎日 20:00（JST）ごろに翌日の試合分が作られる
- `.env.local` は**本番の Firebase**（`matchpik-7dbb1…`）につながる。ローカルの解除ボタンは本番に書き込む

### 3-3. AdMob SDK の導入（コードまで完了・端末とAdMob側は未確認）
- パッケージ: `react-native-google-mobile-ads@16.5.0`（固定。17 系は RN 0.86 以上が必要で、このプロジェクト（RN 0.81.5）では使えない）
- アプリ設定: `apps/native/app.config.js` にプラグインを追加。アプリ ID は環境変数 `ADMOB_ANDROID_APP_ID` / `ADMOB_IOS_APP_ID`。未設定は Google の公式テスト ID
- ネイティブの広告表示: `apps/native/src/features/ads/proPickRewardedAdNative.ts`（リワード。広告ユニット ID は PRO PICK が `EXPO_PUBLIC_ADMOB_REWARDED_ANDROID` / `_IOS`、トレード Buzz が `EXPO_PUBLIC_ADMOB_TRADE_BUZZ_REWARDED_ANDROID` / `_IOS`。未設定はテスト ID）
- 検証（SSV）: `app/api/ads/admob-ssv/route.ts`（GET）→ `lib/ads/admobSsvVerify.ts`（Google の公開鍵で署名を確認）。通ったものだけ `proPickAdRewards/{transaction_id}` に 1 回記録
- 解除: `POST /api/nba/pro-pick-unlock` が未使用の報酬（`claimed: false`）を消費して `via: "ad_sdk"` で解除。端末は解除の確定が遅れることがあるため、数回確認する
- 切り替え: 端末側 `EXPO_PUBLIC_PRO_PICK_AD_SDK=1` で SDK の広告。未設定の開発ビルドはモック、本番は非表示
- サーバー側の任意設定: `ADMOB_REWARDED_AD_UNIT_IDS`（PRO PICK の広告ユニット。カンマ区切り。設定すると、この一覧以外の PRO PICK 報酬を拒否）・`ADMOB_TRADE_BUZZ_AD_UNIT_IDS`（トレード Buzz の広告ユニット。設定すると、この一覧以外の Buzz 報酬を拒否。PRO PICK の報酬で Buzz 専用ユニットは受け付けない）
- **まだ必要なこと**
  1. SDK は**ネイティブの変更**。開発ビルドを作り直す（`npx expo run:ios` / EAS の dev build）。Expo Go では動かない
  2. AdMob の管理画面で SSV のコールバック URL を設定（本番: `https://www.uniterz.app/api/ads/admob-ssv`）。ローカルの API には AdMob から届かない
  3. 署名検証は Google の仕様に沿って実装したが、**実際のコールバックで 1 回通すまで未確認**
  4. iOS の ATT（トラッキングの許可）と、EU などの同意管理（UMP）は未実装。本番の前に必要（法務の確認と合わせる）
  5. プライバシーポリシーの改定（広告 SDK による情報の送信）
  6. 本番は EAS の環境変数で、アプリ ID と広告ユニット ID を本番の値にする。テスト ID のまま本番に出さない

### 3-3. 初回の UNIT 案内（実装済み・端末未確認）
方針: 説明スライドは作らず、必要な場面で 1 枚ずつ出す。文言は `lib/onboarding/unitIntroCopy.ts`（9 言語・数字は `periodRankingUnitRewards` から）。
1. **登録直後（通知の前）**: `FirstRunSetupModalNative` の前に `FirstRunUnitIntroNative`（3 行 → 次へ）
2. **最初の予想の投稿直後**: `FirstPostUnitModalNative`（UNIT の一言 + 「ランキングを見る」）。新規登録の初期設定を終えた人だけ（`firstPostUnitNative.ts` の印。既存ユーザーには出ない）。この回は次の試合の案内・投稿後の招待を出さない
3. **ランキングの初回ヒント**: 本文を `unitIntroCopy().rankingsBody` に差し替え（週間 20 位・月間 50 位・1 位の額）。`messages/*.ts` の `tutorial.practice.rankingsBody` は未使用になった

未確認: 端末での見た目、9 言語の文の長さ（ar の折り返し）、既存の `rankingsBody` の削除。

## 4. 未決事項（次のチャットで決めること）

### 4-1. ランキングの吹き出しの文言（保留中）
現状（`messages/ja.ts` の `rankingsBody`）
> 予想の**スコア**で順位が並ぶ画面です。勝率はピックアップの **65%以上** に予想した人が対象です。

案（提案済み・未採用）
> 予想のスコアで順位が並びます。**週間は上位 20 位、月間は上位 50 位**に UNIT が付きます（期間が終わると自動で付与）。
> **UNIT** は NBA の **T シャツ（600）** や **ジャージ（1,000）** と交換できます。

- 「65% 以上」の条件は、吹き出しから外して「スコアの計算の仕方はこちら」側へ移す案
- 画像の紹介（カルーセル）は採用しない案。代わりに、**データから描く小さな賞品・Unit のカード**を初回のランキング画面に出す案（おすすめ）
- 選択肢（未回答）: ①文章だけ直す ②文章 + 賞品カード（推奨） ③今のまま

### 4-2. Unit の報酬の事実（確認用）
- 週間・総合: 上位 20 位（1 位 50、2 位 40、3 位 30、4 位 25、5 位 20、6–10 位 15、11–20 位 10）
- 月間・総合: 上位 50 位（1 位 250、2 位 200、3 位 175 … 10 位 75、11–15 位 60、16–20 位 55、21–30 位 50、31–40 位 45、41–50 位 40）
- 月間・部門（アップセット / 得点者的中）: 上位 20 位
- 付与タイミング: 週間は月曜、月間は毎月 1 日の日本時間 16 時過ぎ
- 交換の例: NBA の T シャツ 600 Unit、ジャージ 1,000 Unit（`lib/redemption/redemptionCatalog.ts`）
- Unit は失効しない。予想を外しても減らない（交換したときだけ減る）

### 4-3. 初回の無料の定義
- 今の実装: 「**予想済みのユーザーが最初に解除を押した 1 試合**」
- 「初めて予想した試合そのもの」にするかは未決（必要なら `posts` の最初の投稿の試合を参照する）

### 4-4. 広告 SDK（AdMob）
- アカウント作成・アプリ登録・ad unit の発行は**あなたの作業**
- 次の順番を推奨: ①法務の確認（プライバシーポリシー改定、外部送信の表示、ATT、賭博広告の除外）→ ②SDK の導入（ストアビルド必要、OTA 不可）→ ③AdMob の SSV（サーバー検証）で解除を確定 → ④`__DEV__` 限定を外す
- 法務の方針: `docs/legal-risk-review.md`（「賭博広告なし」「見るだけで稼げる」の表現は避ける）

### 4-5. 動作確認（未実施）
- PRO PICK の解除: 20:30 以降に、Free（1 試合目は無料 → 2 試合目は広告）と Pro（広告なし）で確認
- Unit の 1 枚カード: 端末で「チュートリアル」を最初から再開し、UNIT のカードが出ること・コインを指すこと・文言の崩れがないこと
- テスト用アカウントは本番データに書き込む。テスト後に `proPickGameUnlocks` と `proPickLaunchFreeUsedAt` を消すか、テスト用の新しいアカウントを使う

## 5. 守るべき制約

- **Native-first**: 変更は `apps/native/`・`lib/`・`messages/`・`app/api/*`。Web の通常画面は凍結
- **OTA は使わない**（`eas update` 禁止。配布はユーザーがストアビルドで行う）
- **CyberSlantedTab（選択タブ）は触らない**（`.cursor/rules/cyber-slanted-tab-locked.mdc`）
- **NBA スタッツは ingest → Firestore → 公開 API**（クライアントから BDL を叩かない）
- **Unit は買えない・賭けない・現金賞金なし**。広告の文言で「見るだけで稼げる」とは言わない
- **Pro だから Unit が有利になる設計はしない**（`money-unit-product-flow.md`）
- **多言語**: 文言は 9 言語（ja / en / ko / zh / es / de / fr / pt / ar）
- 画像の紹介（カルーセル）は、古くなるため使わない。データから描く部品を使う
- 「ツアーを長くしない」。必要なタイミングで 1 枚ずつ出し、いつでも見直せるようにする

## 6. 関連ファイル（一覧）

- 通常トラック / 新機能: `lib/tutorial/tutorialLivePhase.ts`、`lib/tutorial/tutorialGamesSubsteps.ts`、`lib/tutorial/tutorialHorizonSteps.ts`、`lib/tutorial/tutorialPageTips.ts`、`lib/tutorial/tutorialWelcomeAudience.ts`
- Native 表示: `apps/native/src/features/tutorial/TutorialLiveHostNative.tsx`、`TutorialWelcomeWorldCameraNative.tsx`、`TutorialPracticeTourNative.tsx`、`tutorialLivePhaseNative.ts`、`tutorialSeenNative.ts`、`tutorialRestartEventsNative.ts`
- 試合タブの入口: `apps/native/src/features/games/GamesHomeScreen.tsx`
- 文言: `messages/*.ts`（`tutorial.practice.*`）、`lib/predict/proPickAdCopy.ts`、`lib/predict/proInsightGateCopy.ts`
- 広告による解除（PRO PICK）: `lib/pro/proPickGameAccess.ts`、`app/api/nba/pro-pick-unlock/route.ts`、`app/api/nba/matchup-insight/route.ts`、`apps/native/src/features/games/predict/`
- 報酬と交換: `lib/units/periodRankingUnitRewards.ts`、`lib/redemption/redemptionCatalog.ts`、`lib/nba/ask/nbaAskKnowledge.ts`
- 法務・方針: `docs/legal-risk-review.md`、`docs/money-unit-product-flow.md`、`docs/pro-insight-design.md`、`.cursor/rules/pro-insight.mdc`

## 7. 作業の状態（コミット前の注意）

作業ツリーには今回と無関係な変更が多く残っている。コミットは分けること。今回の変更は次のとおり。

- 新規: `lib/pro/proPickGameAccess.ts`、`app/api/nba/pro-pick-unlock/route.ts`、`lib/nba/predict/proPickUnlockApi.ts`、`lib/predict/proPickAdCopy.ts`、`apps/native/src/features/games/predict/ProPickAdMockModalNative.tsx`、`docs/onboarding-design.md`
- 変更: `app/api/nba/matchup-insight/route.ts`、`lib/nba/predict/useNbaMatchupInsightTeaser.ts`、`apps/native/src/features/games/predict/NbaPredictToolsTabsNative.tsx`、`apps/native/src/features/games/predict/PredictProBriefPanelNative.tsx`、`messages/{ja,en,ko,zh,es,fr,de,pt,ar}.ts`、`lib/tutorial/tutorialHorizonSteps.ts`、`.cursor/rules/pro-insight.mdc`
- 環境変数（コミット対象外）: ルートの `.env.local` に `PRO_PICK_AD_MOCK=1` を追加済み
