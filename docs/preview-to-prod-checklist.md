# プレビュー → 本番 作業メモ（忘れ防止）

> 最終更新: 2026-07-16  
> 目的: UI だけ先に作った機能の **本番反映・データ接続・ルール確定** を忘れないための単一メモ。  
> **直近で順番に進める作業** → [§0 次の作業キュー](#0-次の作業キュー優先順)

---

## 0. 次の作業キュー（優先順）

> 2026-07-16 時点の「次にやる」合意。上から順に進める。  
> ゲート A（WC 7/20 以降の UI 本番配線）や API 契約（ゲート B）とは別レーンで、課金導線・レポート・ライブはプレビューから着手可。

### 0.1 課金導線（プラン選択 → 成功）

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 1 | **課金ページ / 課金メニュー** | ✅ プレビュー | http://localhost:3000/mobile/pro-subscribe-preview · `ProSubscribePreview` |
| 2 | **プランは 3 種** | 方針 ✅ / UI ✅ | **Weekly / Monthly / Season Pass**（価格・特典は仮） |
| 3 | **プラン内容の見せ方** | ✅ プレビュー | 説明文リスト。デモUIは無し（1週間お試しで体験） |
| 4 | **課金成功後の画面** | ✅ プレビュー | 模擬購入後に成功パネル。戻って再選択可 |
| 5 | **課金まわりの導線一式** | △ | プレビュー内のみ。本番入口・IAP/Stripe 未接続 |

既存の参考: `app/mobile/pro/subscribe/page.tsx` · `docs/pro-subscription-plan.md`

#### 0.1.a 課金ページ説明文（確定ドラフト · 2026-07-16）

> 次ステップ: ~~説明文~~ · ~~デモUIなし~~ · **7日無料トライアル**（§0.1.b）→ プレビュー反映済み（文言）。決済接続は別。

**Pro 全体（1行）**

- JA: 順位の理由が分かり、同じ帯の人と比べて、次の予想で何を意識すればいいかが分かる。
- EN: See why you rank where you do, compare with your band, and know what to focus on next.
- 補足（小さく）: 他人の予想内容は見せません。

**機能説明（表示名 + 一言 + 補足）**

| 表示名 | 一言 | 補足 |
|---|---|---|
| **Pro Insight（試合前の読み）** | この試合で見るべきポイントが分かる | マッチアップ・日程・状況を短く整理 |
| ~~Gap（差の構造）~~ | — | **課金コピーから一旦除外**（迷い中。実装・文言は保留） |
| **Shadow（ライバル帯）** | 先週同じ順位帯だった人との今週の差が分かる | 匿名の同帯比較。個人の予想は非公開。**Monthly / Season のみ**（Weekly には含めない） |
| **My Rank Pro** | 自分の位置がはっきり見える | TOP%、次の帯までの点数、進捗グラフが広がる |
| **Pro バッジ** | Pro だと分かる印 | プロフィールやランキングに表示 |
| **プロフィールのデザイン** | 見た目が Pro 向けに変わる | プロフィールカードのラグジュアリー化 |
| **週次 / 月次レポート** | 振り返りが届く | 週：帯の動きの要約／月：自分の傾向のまとめ |

**プラン差の言い方**

- 機能は同じ Pro が基本。違うのは **期間と価格**。ただし **Shadow は Monthly / Season のみ**（Weekly は体験向けで軽め）。
- **7日間無料トライアル** → §0.1.b（**Weekly / Monthly**。Season は対象外）。

**課金リスト用の短い並び（共通）**

1. Pro Insight — 試合前に見るべきポイント  
2. Shadow — 同帯ライバルとの今週比較（Monthly〜）  
3. My Rank Pro — TOP% と次の目標まで  
4. Pro バッジ — プロフィール／ランキング表示  
5. プロフィールのデザイン — Pro 向けの見た目  
6. レポート — 週／月の振り返り  

（Gap は保留）

#### 0.1.b 7日間無料トライアル（確定ドラフト · 2026-07-16）

**ルール**

| 項目 | 内容 |
|---|---|
| 期間 | **7日間**無料 |
| 対象プラン | **Weekly / Monthly**（Season Pass は対象外） |
| お試し中の機能 | **選んだプラン相当**（Weekly なら Shadow なし。Monthly なら Shadow・月次レポートあり） |
| 回数 | **アカウント（＋ iOS は Apple ID）あたり初回のみ** |
| お試し後 | 解約しなければ **選んだプランに自動更新**（Weekly→週額 / Monthly→月額） |
| プラン切替 | お試し中・課金後とも、ストア／管理画面から **Weekly ⇔ Monthly** を変更可（次回更新から反映。詳細は Apple/Stripe 仕様に合わせる） |
| 解約 | お試し期間中に解約すれば **料金は発生しない** |
| CTA 後 | **説明モーダル**を出してから開始（使える機能・切替・課金タイミング） |
| 目的 | 実機で Pro を触って理解してもらう |

**画面文言（JA）**

- 主CTA: **7日間無料で試す**
- サブ（Weekly）: お試し後は週額 ¥280。期間中の解約で課金なし。
- サブ（Monthly）: お試し後は月額 ¥600。期間中の解約で課金なし。
- モーダル見出し: **お試しの前に**
- モーダル要点（短文のみ・機能一覧なし）: 7日間無料 / 期間中解約で課金なし / お試し後は選んだプランへ自動切替 / Weekly⇔Monthly はいつでも変更可
- 成功画面: **Pro お試し開始**（7日間）

**実装メモ（後で）**

- Apple: Weekly / Monthly それぞれに introductory offer（無料7日）
- Web/Stripe: 同様
- entitlement: `plan: pro` + `trialEndsAt` + `planType: weekly|monthly`
- デモUIは作らない（このトライアルで代替）

### 0.2 ランキング・レポートの時間軸

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 6 | **ランキングを Weekly + Monthly に** | ❌ | いまの累計に加え、週次・月次ランキング軸 |
| 7 | **月間レポートに Weekly レポートを足す** | ❌ | 既存の月次 Pro Stats に加え、週次レポート |

関連: Pro 計画の「週次 Shadow サマリー / 月次 Pro Stats」（`pro-subscription-plan.md`）

### 0.3 ライブ中の体験

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 8 | **ライブ中の表示** | ❌ | 試合カード上のライブ状態の見せ方 |
| 9 | **ライブ試合カード → ライブスタッツ** | ❌ | ライブ中のカードを押すとライブスタッツが表示される |

### 0.4 Pro Stats / 招待

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 10 | **Pro Stats UI ブラッシュアップ** | ❌ | いまあるものの見た目調整 |
| 11 | **Pro Stats の要否選定・機能追加** | ❌ | 何が必要か / いらないかの選択、不足機能の追加 |
| 12 | **招待ページ** | ❌ | 自分が何人招待したかが分かるページ |

### 進め方メモ

- **キューは厳格な順番ではない。** その中から **1 つずつ** 選んで進める（課金・レポート・ライブなどを並行・入れ替え可）。
- WC 終わるまで（ゲート A）は、既存本番オーバーレイへの大胆差し替えはしない。上記キューは主に **新規導線・プレビュー / 独立ページ** で先行してよい。
- Weekly / Monthly / Season Pass の価格・特典差は決済実装前に `pro-subscription-plan.md` 側にも確定メモを追記する。

---

## 1. ゲート条件（いつやるか）

| ゲート | 条件 | 対象 |
|---|---|---|
| **A. UI 本番反映** | **2026-07-20 ワールドカップ終了以降** | 予想オーバーレイ新パネル、My Rank / Gap / Shadow の Pro UI、シーズン予想ページなど、プレビュー済み UI の本番配線 |
| **B. 外部スタッツ / Injury データ** | **NBA 系 API 契約完了以降** | Injury Report / Team Stats / Roster / Pro Insight の実データ取得・キャッシュ |
| **C. シーズン予想の締切・公式日程** | **開幕戦スケジュール公表以降** | 締切日時の実装・表示。編集可能期間の確定 |
| **D. シーズン予想の採点** | **未定（あとで決める）** | 順位予想・アワード予想のポイント表。今は決めなくてよい |

**方針メモ**

- WC が終わるまで、プレビュー UI を本番オーバーレイ／ランキングに大胆に差し替えない（他機能の揺れを避ける）。
- データ未契約でも UI・型・モックは進めてよい。接続は B 以降。
- 順位予想の締切ルール方針は決まっているが、**具体日時は開幕戦日程が出てから**埋める。

---

## 2. シーズン予想（順位 / アワード）

### 2.1 順位予想

| 項目 | 状態 | メモ |
|---|---|---|
| UI プレビュー | ✅ | http://localhost:3000/dev/season-standings-preview |
| パネル | ✅ | `NbaSeasonStandingsPredictPanel` |
| 型・ロジック | ✅ | `lib/predict/nbaSeasonStandingsPredict.ts` / `lib/nba/nbaConferenceTeams.ts` |
| East/West 1–15・チーム1回制限 | ✅ | |
| 帯表示 1–6 / 7–10 / 11–15 | ✅ | Straight in / Play-in / Out |
| **締切ルール** | 方針のみ | **開幕戦キックオフ前まで編集可**。開幕戦開始後はロック。スケジュール未公表のため日時未設定 |
| **採点** | ⏳ 後回し | 仮表記（exact / ±1 / ±2）はあるが本番ルール未確定。今は決めなくてよい |
| Firestore 提出・本人1通 | ❌ | |
| 公式最終順位の取り込み・照合 UI | ❌ | シーズン終了後 |
| 本番ページ（mobile/web） | ❌ | ゲート A 以降 |
| **提出後ビュー（出力 UI）** | ✅ プレビュー | http://localhost:3000/dev/season-picks-view-preview · `NbaSeasonStandingsViewPanel` / `NbaSeasonAwardsViewPanel` |

### 2.2 アワード予想

| 項目 | 状態 | メモ |
|---|---|---|
| UI プレビュー | ✅ | http://localhost:3000/dev/season-awards-preview |
| ピッカー UX | ✅（mock） | **入力なし → 他ユーザー人気ピック最大 5 人**。**入力あり → 前方一致**（N → NI → NIK…） |
| 選手 / コーチ名簿 | ❌ | **ゲート B（API 契約後）** に取得して差し替え。いまは `nbaSeasonAwardsPreviewMocks` |
| 人気ピック集計 | ❌ | 提出データの集計 API（アワードごと Top 5）。いまはモック固定 |
| 採点 | ⏳ 後回し | ゲート D |
| 本番配線 | ❌ | ゲート A 以降 |

**選手サジェスト仕様（確定）**

1. フィールドフォーカス / 空入力時: そのアワードで他ユーザーが多く選んでいる候補を **最大 5 人** 表示  
2. ユーザーが `N` / `NI` / `NIK` と打つたびに、名簿から **前方一致** で候補更新（氏名・姓優先）  
3. 名簿ソースは **API 契約後**（プレビューはモック）  
4. **COY** = クラッチオブザイヤー（選手）。**COTY** = 最優秀コーチ  

**提出後（出力）UI**

- 順位: **YOUR STANDING**・East/West・1–15 密着リスト・左サイドライン（1–6 シアン / 7–10 緑 / 11–15 グレー）・帯テキストラベルなし  
- アワード: **YOUR AWARDS**・`MVP | 選手名 | チーム色四角バッジ(DEN)` の1行・日本語補助なし  
- 公式結果後: 行に HIT/MISS（`official` prop 用意済み・プレビューでは未照合）  
- URL: http://localhost:3000/mobile/season-picks-view-preview  

---

## 3. 予想オーバーレイ系（Pro Insight / Free タブ）

プレビュー: http://localhost:3000/dev/predict-timing-preview

| 機能 | UI | 本番 `PredictionFormV2` | 実データ | 備考 |
|---|---|---|---|---|
| Injury Report | ✅ | ❌ | ❌（API 契約後） | mock。ゲート A + B。**モバイルはイニシャル四角非表示** |
| Team Stats（SEASON / L10・順位セグ・L10 W/L） | ✅ | ❌ | ❌ | mock。ゲート A + B |
| Roster | ✅ | ❌ | ❌ | mock。ゲート A + B |
| Pro Insight（MATCHUP / SCHEDULE / CONTEXT） | ✅ | ❌ | ❌ | `PredictProBriefPanel`。旧 `PredictProInfoPanel` が本番に残存 |
| スコア入力（斜め HUD） | ✅ | △ オーバーレイのみ新UI | — | `PredictOverlayScoreFields`。スタンドアロンは旧入力のまま |
| Timing advice 1行 | UI ✅ / パイプライン未 | △ | context_cache 未 | 詳細は `docs/pro-subscription-plan.md` |
| Free / Pro ゲート（タブ・Insight） | プレビュー切替のみ | ❌ | — | 課金 entitlement と一体 |

**鉄則（確認済み）:** Pro Insight は Pay-for-Insight。採点倍率・推奨予想などの **Pay to Win はしない**。

---

## 4. My Rank / Gap / Shadow（Rank Intel）

| 機能 | プレビュー | 本番配線 | データ |
|---|---|---|---|
| My Rank Free / Pro カード | http://localhost:3000/dev/my-rank-free-pro-preview | ❌（`displayTier` / `isPro` 等） | Progress・ギャップ等は設計済・接続段階 |
| Gap + Shadow（同一ページ） | http://localhost:3000/dev/rank-gap-preview | △ `/mobile/rankings/gap` 等あり、完成度要確認 | Gap/Shadow API・キャッシュは一部あり |

詳細フェーズは `docs/pro-subscription-plan.md` の Phase 1–4 を参照。

---

## 5. 次にやるときのチェックリスト

### ゲート A（7/20 WC 後・UI 本番反映）

- [ ] 予想オーバーレイに Injury / Team Stats / Roster / Pro Insight を本番配置（feature flag 推奨）
- [ ] 旧 `PredictProInfoPanel` → `PredictProBriefPanel` 切替方針の実行
- [ ] My Rank Pro 表示・Gap/Shadow 入口の本番揃え
- [ ] シーズン順位予想の本番ページ（締切日時はゲート C 待ちでもページ枠は可）
- [ ] アワード予想の本番ページ枠

### ゲート B（API 契約後）

- [ ] Injury / Team averages / 試合ログ由来 L10 / Roster の取得パイプライン
- [ ] Pro Insight 用 Brief の実計算（MATCHUP / SCHEDULE / CONTEXT）
- [ ] キャッシュ鮮度・障害時フォールバック
- [ ] **アワード予想: 選手・コーチ名簿の取得**（サジェスト用）
- [ ] **アワード予想: 他ユーザー選択の人気 Top 5 集計**（空入力時の初期候補）

### ゲート C（開幕戦スケジュール公表後）

- [ ] 順位予想・アワード予想の **締切日時** を設定（開幕戦開始前まで編集可）
- [ ] 締切表示・ロック UI
- [ ]（任意）リマインド通知

### ゲート D（採点を決めたあと）

- [ ] 順位予想ポイント表の確定実装
- [ ] アワード予想ポイント表
- [ ] シーズン終了バッチ / 照合 / ランキング or イベントへの反映

---

## 6. 関連パス（短い索引）

| 領域 | パス |
|---|---|
| プレビュー一覧（mobile） | http://localhost:3000/mobile/season-preview |
| 順位予想（入力） | `/mobile/season-standings-preview`（同内容 `/dev/...`） |
| アワード予想（入力） | `/mobile/season-awards-preview` |
| 提出後ビュー | `/mobile/season-picks-view-preview` |
| 順位予想 UI | `app/component/predict/season/NbaSeasonStandingsPredictPanel.tsx` |
| アワード UI | `app/component/predict/season/NbaSeasonAwardsPredictPanel.tsx` |
| 提出後ビュー | `NbaSeasonStandingsViewPanel` / `NbaSeasonAwardsViewPanel` |
| オーバーレイ preview | `/mobile/predict-timing-preview` |
| Pro 課金導線 preview | `/mobile/pro-subscribe-preview` · `ProSubscribePreview` |
| Pro 計画（設計の本編） | `docs/pro-subscription-plan.md` |

---

## 7. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-16 | **§0 次の作業キュー**を追加（課金導線 3 プラン / 週次・月次ランキング・レポート / ライブスタッツ / Pro Stats 整備 / 招待ページ） |
| 2026-07-16 | Pro 課金プレビュー追加（3プラン → 模擬購入 → 成功）。`/mobile/pro-subscribe-preview` |
| 2026-07-16 | 課金ページ説明文を §0.1.a に確定ドラフト（Insight / Gap / Shadow / My Rank / レポート） |
| 2026-07-16 | §0.1.b 成功カード: オフセット枠 + 外側 L ブラケット（戦術UI参照）にブラッシュアップ |
| 2026-07-15 | 初版。ゲート A–D、プレビュー一覧、シーズン予想（締切方針・採点後回し）を記録 |
| 2026-07-15 | アワード: 人気 Top5 + 前方一致サジェスト仕様を確定。プレビュー UI + チェックリスト更新 |
| 2026-07-15 | 提出後ビュー（順位表・アワード出力 UI）プレビュー追加 |
