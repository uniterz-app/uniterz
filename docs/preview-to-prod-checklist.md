# プレビュー → 本番 作業メモ（忘れ防止）

> 最終更新: 2026-08-15  
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
| 5 | **課金まわりの導線一式** | △ UI導線のみ | 本番 `/mobile/pro/subscribe` · 成功 → `/mobile/pro/skin` → マイページ。**Stripe/IAP・plan 更新は未接続** |

#### 0.1.c Pro Skin 本番導線（UI のみ · 2026-07-17）

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 1 | **サブスク成功 → スキンピッカー** | ✅ UI | `ProSubscribePreview` 成功 CTA → `/mobile/pro/skin` |
| 2 | **スキン選択・保存** | ✅ UI | `ProfilePlanProSkinPicker` production · `POST /api/me/pro-skin`（**Pro 判定なし・暫定**） |
| 3 | **マイページ反映** | ✅ UI | `planProBgVariant` をプロフィールカードに表示（**plan 未更新でも反映**） |
| 4 | **サイドメニュー** | ✅ UI | 「Pro Skin」→ `/mobile/pro/skin` |
| 5 | **ランキングリスト反映** | ✅ UI | Top リスト `RankingCard` · Medium · `mergeUserPlans*` で `planProBgVariant` 付与 |
| 6 | **Pro 限定ガード** | ⏳ 後回し | Stripe/IAP 接続後に `plan === "pro"` でガード復帰 |

本番ルート: `/mobile/pro/subscribe` · `/mobile/pro/skin`（web は `/web/pro/...`）  
プレビューは進行中の参照先のみ維持（探索済みショーケースは 2026-07-18 に削除。§7 参照）。

既存の参考: `app/mobile/pro/subscribe/page.tsx` · `docs/pro-subscription-plan.md`

#### 0.1.a 課金ページ説明文（確定ドラフト · 2026-07-16）

> 次ステップ: ~~説明文~~ · ~~デモUIなし~~ · **7日無料トライアル**（§0.1.b）→ プレビュー反映済み（文言）。決済接続は別。

**Pro 全体（1行）** — 正は [`pro-subscription-plan.md`](pro-subscription-plan.md) §0（2026-07-23 更新）

- JA: 予想を助け、自分を分析し、毎週開く理由があり、課金者として目立てる。
- EN: Better picks, clearer self-analysis, a reason to open weekly, and Pro status that shows.
- 補足（小さく）: 他人の予想内容は見せません。勝者は断言しません。

**機能説明（表示名 + 一言 + 補足）**

| 表示名 | 一言 | 補足 |
|---|---|---|
| **PRO INSIGHT** | この試合の重要結論が 3〜5 個分かる | 要約 + MATCHUP / RECENT / INJURY / SCHEDULE / UPSET。重要度で選出 |
| **直前アラート** | 予想を見直すべき変化だけ届く | 欠場・重要先発変更・締切・Insight 更新。開始通知だけでは弱い |
| **週次 / 月次レポート** | 振り返りが届く | 週＝競争の実況 / 月＝自分の分析。Stats タブは廃止 |
| **My Rank Pro** | 自分の位置がはっきり見える | TOP%、次の帯までの点数、進捗グラフが広がる |
| **Pro バッジ** | Pro だと分かる印 | プロフィールやランキングに表示（Skin とは別） |
| **Pro Skin** | 背景スキンで個性を出せる | 通常 18 種 + Achievement Skin。プロフィール＋ランキング行 |

~~Gap~~ / ~~Shadow~~ — **V1 では提供しない**（計画書 §0）。

**プラン差の言い方**

- 機能は同じ Pro が基本。違うのは **期間と価格**。
- **7日間無料トライアル** → §0.1.b（**Weekly / Monthly**。Season は対象外）。

**課金リスト用の短い並び（共通）**

1. PRO INSIGHT — 試合の重要結論 3〜5  
2. 直前アラート — 見直すべき変化だけ  
3. 週次 / 月次レポート — 競争の実況と自己分析  
4. My Rank Pro — TOP% と次の目標まで  
5. Pro バッジ — プロフィール／ランキング表示  
6. Pro Skin — 背景スキン（Achievement 含む）

#### 0.1.b 7日間無料トライアル（確定ドラフト · 2026-07-16）

**ルール**

| 項目 | 内容 |
|---|---|
| 期間 | **7日間**無料 |
| 対象プラン | **Weekly / Monthly**（Season Pass は対象外） |
| お試し中の機能 | **選んだプラン相当の Pro 機能一式**（Insight / アラート / レポート / Skin。Shadow・Gap は V1 対象外） |
| 回数 | **アカウント（＋ iOS は Apple ID）あたり初回のみ** |
| お試し後 | 解約しなければ **選んだプランに自動更新**（Weekly→週額 / Monthly→月額） |
| プラン切替 | お試し中・課金後とも、ストア／管理画面から **Weekly ⇔ Monthly** を変更可（次回更新から反映。詳細は Apple/Stripe 仕様に合わせる） |
| 解約 | お試し期間中に解約すれば **料金は発生しない** |
| CTA 後 | **説明モーダル**を出してから開始（使える機能・切替・課金タイミング） |
| 目的 | 実機で Pro を触って理解してもらう |

**画面文言（JA）**

- 主CTA: **7日間無料で試す**
- サブ（Weekly）: お試し後は週額 ¥280。期間中の解約で課金なし。
- サブ（Monthly）: お試し後は月額 ¥780。期間中の解約で課金なし。
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
| 6 | **ランキングを Weekly + Monthly に** | ✅ NBA タブ再構成済み | NBA は **Weekly / Monthly / Season + 指標タブのみ**（Playoffs/Bracket カテゴリタブ・1st/2nd 等ラウンドタブは廃止。mobile/web とも）。WC は従来どおり（WORLD CUP/Bracket + ステージタブ）。Season はシーズンキー式（`rankingBySeason["2026-27"]` + `s2026-27_*` snapshot）で毎年リセット不要 |
| 7 | **週次 / 月次レポート** | 月次 UI＋集計 #1–#4 済 | 画面順: 表紙→数字→Unit内訳→レーダー→クセ→相性→ハイライト→サマリー。次はプッシュ→Report入口（`pro-subscription-plan.md` キュー #5〜）。Unit は弁護士後。Stats→Report 一本化・Pro/NBA のみ |

#### NBA ランキング指標（確定）

| 指標 | キー | メモ |
|---|---|---|
| 総合得点 | `totalScore` | 維持 |
| 勝率 | `winRate` | 維持 |
| アップセット | `upsetScore` | 維持 |
| 最多得点者的中 | `goalScorerHits` | **新規（NBA）**。連勝・スコア精度は NBA タブから外す |

#### NBA 最多得点者予想（確定）

- **対象:** 試合ごとの最多得点者（その試合で最も得点した選手）
- **ボーナス:** 的中 **+2**（WC 得点者と同じ）
- **同点トップ:** 複数人いる場合はいずれも的中対象
- **保存:** `prediction.goalScorer = { playerId, teamId }`（WC と同形）
- **確定データ:** `games.leadingScorers`（候補は `games.topScorerCandidates`）
- **Admin:** `/api/admin/nba-top-scorers`
- **Preview:** `/mobile/nba-top-scorer-preview`
- **残:** 実ボックススコア自動投入（ゲート B / NBA API）

関連: Pro 計画の「週次 / 月次レポート」「PRO INSIGHT」「直前アラート」（`pro-subscription-plan.md` §1–4）

### 0.3 ライブ中の体験

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 8 | **ライブ中の表示** | ✅ 本番配線済み | NBA カード限定。オーバーレイ（`ScheduleList`）に `LiveGameStatsPanel` を表示。プレビュー: `/mobile/live-game-stats-preview` |
| 9 | **ライブ試合カード → ライブスタッツ** | ✅ 本番配線済み | Team / Box Score タブ。Roster UI 準拠のボックス（away 初期折りたたみ）。ヘッダーは実カード準拠の縦積み。**データ ingest は残**（下記） |

- **本番データフロー:** 外部データ → `PATCH /api/admin/nba-live-stats`（`games/{id}.liveStats` に保存）→ クライアントは `GET /api/games/live-stats?gameId=` で取得。ライブ中は 30 秒ポーリング（`useLiveGameStats`）、final で停止。`liveStats` 未登録の試合はパネル非表示。
- **残:** ライブ中の実データ自動投入（ゲート B / NBA API → admin ingest への接続）

関連: `LiveGameStatsPanel` · `LiveGameTeamStatsPanel` · `LiveGameBoxScorePanel` · `lib/games/liveGameStats.ts` · `lib/games/useLiveGameStats.ts`

### 0.4 レポート統合 / 直前アラート / 招待

| # | 項目 | 状態 | メモ |
|---|---|---|---|
| 10 | **Pro Stats → 月次レポート統合** | V1 方針確定 | Stats タブ廃止。カード群は月次レポートへ再構成（`pro-subscription-plan.md` §4） |
| 11 | **試合直前アラート** | V1 方針確定 | 欠場・重要先発・締切・Insight 更新。開始通知は Free 程度（同 §2） |
| 12 | **招待ページ** | ✅ | `/mobile/invite` · Native `Invite` · スタンプボード |
| 13 | **Unit 履歴** | ✅ | `/mobile/units` · Native `UnitLedger` |
| 14 | **商品交換（カタログ・申請・進捗・Admin）** | ✅ LIVE | `REDEMPTION_UNITS_LIVE=true`（2026-08-13 弁護士 OK 後）。設計: `unit-redemption-design.md` |
| 15 | **グループページ UI を今のアプリの雰囲気に合わせる** | ✅ 第一弾 | 一覧・詳細・オーバーレイを Games / Rankings と同じ直角 HUD（シアン縁・IMPACT 系タグ・角丸なし）。機能変更なし。仕上げは #18 |
| 16 | **ヘッダー二重表示の解消** | ✅ | サブページ `CyberSubpageHeader` マウント中はグローバル棚を隠す。Games は一覧表示中、外の棚を隠してページ内 Header を出す |
| 17 | **文字デザインの統一** | ⏳ 次 | 見出し・ラベル・本文のフォント・サイズ・トラッキング・斜め titling を Games / Rankings / Result / Profile に揃える |
| 18 | **グループページの調整** | ⏳ 次 | #15 の続き。カード・余白・ラベル・モーダルを今の雰囲気にさらに寄せる。機能はそのまま |
| 19 | **チームスタッツ / プレイヤースタッツページの調整** | ⏳ 次 | TEAM STATS / PLAYER STATS（ハブ・一覧・詳細）を同じサイバー HUD に揃える。機能はそのまま |

### 0.5 グループページ UI

第一弾は直角 HUD に寄せ済み。**#18 で仕上げ**（余白・文字・カード・モーダル）。

| # | 対象 | メモ |
|---|---|---|
| 1 | グループ一覧 | Leaderboards / コミュニティ一覧 |
| 2 | グループ詳細 | `CommunityGroupDetailView`（ヘッダー・メンバー・ランキングカード） |
| 3 | グループオーバーレイ | `CommunityGroupOverlay` |
| 4 | Native 追従 | 同じ画面の `*Native`（ピクセル完璧は対象外、7〜8割） |

参照: `app/component/communities/CommunityGroup*` · `apps/native/src/features/leaderboards/CommunityGroup*`

### 0.6 ヘッダー二重表示

試合サブページ（TEAM DETAIL / TEAM STATS / PLAYER DETAIL など）で、上部ブランド棚とサブページ見出しが同時に出ないようにした。

| # | 対象 | メモ |
|---|---|---|
| 1 | グローバル棚 | `CyberSubpageHeader` マウント中は `acquireAppBrandShelfHidden` で隠す |
| 2 | サブページ見出し | `CyberSubpageHeader` / `CyberSubpageHeaderNative` が単独のページ見出し |
| 3 | ページ内の二重 `Header` | Games は一覧表示中、外の棚を隠してページ内 `Header` を出す（welcome カメラ用）。Rankings / Community detail は従来どおりページ側が所有 |

Web / Native 同じルール。Settings モーダルは SafeArea 済みのため棚は隠さない。

### 0.7 文字デザインの統一（次）

ページごとにフォント・字間・見出しの傾きが違うので、Games / Rankings / Result / Profile の titling に揃える。

| # | 対象 | メモ |
|---|---|---|
| 1 | ページ見出し | `RankingsPageTitleCyber` 系（斜め・Oxanium / Bebas） |
| 2 | ゾーンラベル | TITLE / MEMO / RANKING などの HUD ラベル |
| 3 | 本文・数字 | カード内の本文・スコア・順位 |
| 4 | Native 追従 | 同じトークン・サイズ |

### 0.8 チーム / プレイヤースタッツ（次）

`LeagueStatsHub` · Team Stats · Player Stats を今のカード・ヘッダー・文字に合わせる。機能変更はしない。

| # | 対象 | メモ |
|---|---|---|
| 1 | STATS ハブ | TEAM / PLAYER 切替、検索バー |
| 2 | チームスタッツ一覧 | 指標ソート・カンファレンスタブ |
| 3 | プレイヤースタッツ一覧 | リーダボード |
| 4 | Native 追従 | `LeagueStatsHubScreenNative` ほか |

参照: `app/component/stats/` · `app/component/teamStats/` · `app/component/playerStats/` · `apps/native/src/features/games/stats/`

### 進め方メモ

- **キューは厳格な順番ではない。** その中から **1 つずつ** 選んで進める（課金・レポート・ライブなどを並行・入れ替え可）。
- WC 終わるまで（ゲート A）は、既存本番オーバーレイへの大胆差し替えはしない。上記キューは主に **新規導線・プレビュー / 独立ページ** で先行してよい。
- Weekly / Monthly / Season Pass の価格・特典差は決済実装前に `pro-subscription-plan.md` 側にも確定メモを追記する。
- **商品交換の公開**は `REDEMPTION_UNITS_LIVE=true`（2026-08-13 有効化済み）。
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

> 2026-07-18: **NBA は本番 `PredictionFormV2` に新4タブ配線済み**（`NbaPredictToolsTabs` = Insight(PRO) / Injury / Team Stats / Roster、常時表示）。旧ツールタブ（Team Stats / Market / Standings / H2H）・`NbaPostseasonMatchupPanel`・旧 `PredictProInfoPanel`（NBA 分）は削除。データ未投入タブは「データ準備中」表示 → ゲート B で実データ接続。

| 機能 | UI | 本番 `PredictionFormV2` | 実データ | 備考 |
|---|---|---|---|---|
| Injury Report | ✅ | ✅ タブ配線済み（NBA） | ✅ Firestore | BDL ingest 接続済み。JA 理由は辞書要約。詳細: [`nba-injury-status.md`](nba-injury-status.md) |
| Team Stats（SEASON / L10・順位セグ・L10 W/L） | ✅ | ✅ タブ配線済み（NBA） | ❌ | 同上 |
| Roster | ✅ | ✅ タブ配線済み（NBA） | ❌ | 同上 |
| Pro Insight（MATCHUP / SCHEDULE / CONTEXT） | ✅ | ✅ タブ配線済み（NBA・PRO バッジ） | ❌ | 設計正: [`docs/pro-insight-design.md`](pro-insight-design.md)。`PredictProBriefPanel`。非 Pro はロック。旧 `PredictProInfoPanel` は WC/他リーグのみ残存 |
| スコア入力（斜め HUD） | ✅ | △ オーバーレイのみ新UI | — | `PredictOverlayScoreFields`。スタンドアロンは旧入力のまま |
| Timing advice 1行 | UI ✅ / パイプライン未 | △ | context_cache 未 | 詳細は `docs/pro-subscription-plan.md` |
| Free / Pro ゲート（タブ・Insight） | △ Insight のみ `isPro` でロック | ✅ | — | `useUserPlan` 判定。課金 entitlement 接続後そのまま有効 |

**鉄則（確認済み）:** Pro Insight は Pay-for-Insight。採点倍率・推奨予想などの **Pay to Win はしない**。

---

## 4. My Rank / Gap / Shadow（Rank Intel）

| 機能 | プレビュー | 本番配線 | データ |
|---|---|---|---|
| My Rank Free / Pro カード | http://localhost:3000/dev/my-rank-free-pro-preview | ✅ 2026-07-18（mobile / web） | NBA: free/pro とも `displayTier` 適用 + Ranking Progress 実データ（`rankSnapshotHistory` → `/api/profile/rank-playoff-trend` → `useMyRankProgress`）。Weekly/Monthly ボードはプログレス非表示（`hideRankProgress`）。WC は pro のみ従来どおり + progress 実データ化 |
| Gap + Shadow（同一ページ） | http://localhost:3000/dev/rank-gap-preview | ⏸ **保留（2026-07-18 ユーザー判断・まだ入れない）** | Gap/Shadow API・キャッシュは一部あり。着手時に完成度監査から |

詳細フェーズは `docs/pro-subscription-plan.md` の Phase 1–4 を参照。

---

## 5. 次にやるときのチェックリスト

### ゲート A（7/20 WC 後・UI 本番反映）

- [x] 予想オーバーレイに Injury / Team Stats / Roster / Pro Insight を本番配置（2026-07-18 · NBA は `NbaPredictToolsTabs` 常時タブ）
- [x] 旧 `PredictProInfoPanel` → `PredictProBriefPanel` 切替方針の実行（NBA 完了。WC/他リーグは旧パネル継続 → WC 終了後に判断）
- [x] My Rank Free/Pro カードの本番揃え（2026-07-18 · mobile/web。Gap/Shadow ページ本体は**保留**、Pro の入口リンクのみ既存） 
- [ ] シーズン順位予想の本番ページ（締切日時はゲート C 待ちでもページ枠は可）
- [ ] アワード予想の本番ページ枠

### ゲート B（API 契約後）

**入れ物は契約前に用意済み（2026-08-20）。** クライアントは BDL を叩かない。ingest が Firestore に1回書き、全員が同じ公開 GET を読む。試合 doc に30チーム表は持たない。

| 面 | 入れ物（済み） | 中身 |
|---|---|---|
| リーグ Team Stats | `nbaLeagueTeamStats/{season}` → `GET /api/nba/league-team-stats` | seed / サーバーモック。ingest 未 |
| リーグ Player Leaders | `nbaLeaguePlayerStats/{season}` → `GET /api/nba/league-player-stats` | 同上 |
| チーム / プレイヤー詳細 | 上記 + overlay / 合成 API | **完了** — [`nba-team-detail-status.md`](nba-team-detail-status.md) · [`nba-player-detail-status.md`](nba-player-detail-status.md) |
| 予想 Injury / Roster / 2チーム STATS / Insight | なし（クライアントモック or 準備中） | 未 |

差し込み口: `lib/nba/ingest/nbaLeagueStatsIngest.ts`（`ingestNbaLeagueStatsFromProvider`）。seed は同じ writer（`writeLeagueTeamStatsSnapshot` / `writePlayerStatLeadersSnapshot`）。

**契約後にやること**

- [ ] **ingest 本体** — `ingestNbaLeagueStatsFromProvider` に BDL を繋ぎ、既存スナップショット doc を上書き（クライアントは触らない）
  - Team averages + Last 10 → `nbaLeagueTeamStats`
  - Player leaders（BDL `stat_type` + advanced）→ `nbaLeaguePlayerStats`
- [x] **詳細** — チーム・プレイヤー詳細完了（2026-09-01 · status doc 参照）
- [ ] **予想タブを同じパイプに載せる**
  - Injury Report（日付フィード。Available は出さない）
  - Roster（チーム単位。Injury を overlay）
  - 2チーム STATS — `nbaLeagueTeamStats` から HOME/AWAY を切る（別モックをやめる）
  - Pro Insight Brief — 仕様は [`docs/pro-insight-design.md`](pro-insight-design.md)。材料はリーグスナップショット、完成品は `games/{gameId}.proBrief`（前日 19:00 初版、tip 1h 前にケガ反映の完全版）
- [ ] **キャッシュ鮮度・障害時フォールバック** — CDN `s-maxage` の本番値、ingest 失敗時は直前スナップショットを出す（クライアントモックへ落とさない）
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
| Pro 課金導線 preview | `/mobile/pro-subscribe-preview` → **本番** `/mobile/pro/subscribe` · `ProSubscribePreview` |
| Pro Skin ピッカー（本番） | `/mobile/pro/skin` · `ProfilePlanProSkinPicker` production |
| Pro Skin ピッカー（dev） | `/mobile/profile-plan-pro-bg-picker-preview` |
| Pro 計画（設計の本編） | `docs/pro-subscription-plan.md` |
| リーグ Team Stats API | `GET /api/nba/league-team-stats` · `nbaLeagueTeamStats` |
| リーグ Player Leaders API | `GET /api/nba/league-player-stats` · `nbaLeaguePlayerStats` |
| スタッツ ingest 差し込み口 | `lib/nba/ingest/nbaLeagueStatsIngest.ts` |

---

## 7. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-09-01 | **プレイヤー詳細完了**: PREVIEW 除去 · `docs/nba-player-detail-status.md` |
| 2026-09-01 | **チーム詳細状態 doc**: `docs/nba-team-detail-status.md` — Preview パネル API 接続済み・残ギャップ明文化。Gate B 表・詳細チェックリストを更新 |
| 2026-08-20 | **スタッツ共有スナップショットの入れ物**: Player Leaders を Team Stats と同じ Firestore 1 doc + 公開 GET + CDN に。詳細の順位はリーグ表から切る。ingest はゲート B。チェックリスト §5 に契約後の残件をメモ |
| 2026-08-15 | **次キューに追加**: 文字デザインの統一（§0.4 #17 / §0.7）· グループページ調整（#18）· チーム/プレイヤースタッツ調整（#19 / §0.8） |
| 2026-08-15 | **グループページ UI をサイバー HUD に寄せる**（§0.4 #15 / §0.5）。機能変更なし。一覧・詳細・オーバーレイ + Native 追従 |
| 2026-07-27 | 月次レポート残作業を `pro-subscription-plan.md`「これからやるキュー」に整理（クセ接続→CONSISTENCY→前月比→8:00 cron→プッシュ→Report入口。Unit は弁護士後）。§0.2 #7 状態更新 |
| 2026-07-23 | **Pro Plan 煮詰め反映**: `pro-subscription-plan.md` を正として全面更新。§0.1.a 課金コピーを Insight/アラート/レポート/Skin 中心に差し替え。Shadow・Gap は V1 外。週次・月次 V1 完成形・Achievement Skin・直前アラートを計画書へ |
| 2026-07-18 | **26-27 シーズンキー移行 + ランキング大掃除**: ① 25-26 の `cumulative_ranking_snapshots` 全 52 doc を `cumulative_ranking_snapshots_archive/2025-26-playoffs/docs/` にコピー済み（`scripts/archive-cumulative-ranking-snapshots-2025-26.ts` 実行済み。`cumulative_stats` は温存 → バッジ影響なし）。② NBA 累計は `rankingBySeason["2026-27"]` バケットに精算加算（daily も同キー）、スナップショットは `s2026-27_<metric>` doc、snapshotRanks/履歴は `seasons.<key>` ブロック。Ranking Progress（trend API）もシーズンキーで絞り込み、7月の旧順位が混入しない。③ 削除: ラウンド別集計（`rankingByPlayoffRound`）・play_in 配管・NBA Bracket リーダーボード・旧 Monthly リーダーボード（cron/API/UI）・`useRanking` + `/api/cumulative-ranking` 単発版・Gap/Shadow の日次データ収集（`gapCohorts`。UI/API はライブ read で継続）。④ 一発運用スクリプト多数を `scripts/archive/` へ移動（tsconfig から除外） |
| 2026-07-18 | **NBA ランキングタブ再構成（シーズン制）**: NBA は Weekly / Monthly / Season + 指標タブのみに。Playoffs/Bracket カテゴリタブ・ラウンドタブ（1st/2nd/CF/Finals）を mobile/web から削除（`PlayoffRoundTabs` 削除、NBA Bracket リーダーボード導線廃止）。web にも期間タブ + `usePeriodRankingsBulk` 配線。サイドメニュー表記を「NBA プレーオフ」→「NBA」へ。**残**: 新シーズン開始時の Season 累計リセット |
| 2026-07-18 | **My Rank Free/Pro カード本番配線**（mobile/web）: NBA は free=`displayTier:"free"`（Progress 3件）/ pro（10件・TOP%・Tier Gap）。Progress は `rankSnapshotHistory` 実データ（`useMyRankProgress` + 既存 trend API）。Weekly/Monthly は Progress 非表示。**Gap/Shadow ページはユーザー判断で保留** |
| 2026-07-18 | **NBA 予想フォーム新4タブ本番化**: `NbaPredictToolsTabs`（Insight PRO / Injury / Team Stats / Roster 常時表示・データ未投入は準備中表示）。旧ツールタブ（Team Stats / Market / Standings / H2H）・`NbaPostseasonMatchupPanel` 配線・旧 `PredictProInfoPanel`（NBA 分）を削除。i18n 3キー ×9ロケール追加 |
| 2026-07-18 | **探索済みプレビュー 29 ページ削除**: Pro スキン全ラウンド・ランキング見た目実験・単発実験（cyber-bg-lab / event-modal / profile-v2 等）。残存: 課金・シーズン予想・predict-timing・rank 系・top-scorer・live-stats・bg-picker・ハブ。本番依存 CSS は `profile/pro` / `rankings` へ移設済み |
| 2026-07-18 | **ライブ試合スタッツ 本番配線**: NBA カード（live/final）タップ → オーバーレイに Team / Box Score。`liveStats` ingest（admin API）+ 公開 GET + 30 秒ポーリング |
| 2026-07-18 | **NBA Season / Weekly / Monthly ランキング**: 期間タブ + `/api/period-ranking/bulk`（日次集計）。Season は既存累計 |
| 2026-07-18 | **ライブ試合スタッツ プレビュー**: カードタップ → Team / Box Score。FINAL 対応。API 差し替え前提 mock |
| 2026-07-17 | **NBA 最多得点者予想**: 試合ごとトップスコアラー・+2・`goalScorerHits` 指標。候補/確定は admin API。ボックススコア自動投入は未 |
| 2026-07-17 | **NBA ランキング指標**: 総合 / 勝率 / アップセット / 最多得点者（連勝・スコア精度を外す） |
| 2026-07-17 | **ランキングリスト × Pro Skin**: Top リストに Medium で本番配線（`planProBgVariant` merge） |
| 2026-07-17 | **Pro Skin 本番 UI 導線**: subscribe → skin picker → save → mypage。Stripe/plan ガードは未接続 |
| 2026-07-17 | Pro Skin 採用18のユーザー向けカテゴリ: サイバー2 / 爬虫類8 / 獣皮2 / 素材4 / 幾何学2（No.順も更新） |
| 2026-07-17 | PRO 背景採用を 18 に整理: Hex Veil / Isometric Cubes 採用、Void Ripple 不採用（Form 他は候補外） |
| 2026-07-17 | PRO 背景 Form 幾何 16 案を採用候補に追加（Hex Veil 〜 Isometric Cubes） |
| 2026-07-17 | PRO 背景 Beast 採用 10: Panther / Crocodile / Drake / Viper / Shark / Carbon / Titanium / Chevron / Circuit Lace / Void Ripple |
| 2026-07-17 | PRO 背景第5R: Monogram Grid 〜 Void Ripple（ブランド・幾何・結線 +8） |
| 2026-07-17 | PRO 背景第4R: Carbon Weave 〜 Holographic Silk（素材・金属・布 +8） |
| 2026-07-17 | PRO 背景第3R: Golden Viper 〜 Turtle Armor（beast 系 +8） |
| 2026-07-17 | PRO 背景第2R: Midnight Panther 〜 Obsidian Marble（beast 系 8 案）ショーケース追加 |
| 2026-07-17 | PRO 背景採用候補: Light Shaft / Volume Cloud / Aurora / Mesh Blob を不採用（残り7） |
| 2026-07-16 | **§0 次の作業キュー**を追加（課金導線 3 プラン / 週次・月次ランキング・レポート / ライブスタッツ / Pro Stats 整備 / 招待ページ） |
| 2026-07-16 | Pro 課金プレビュー追加（3プラン → 模擬購入 → 成功）。`/mobile/pro-subscribe-preview` |
| 2026-07-16 | 課金ページ説明文を §0.1.a に確定ドラフト（Insight / Gap / Shadow / My Rank / レポート） |
| 2026-07-16 | §0.1.b 成功カード: オフセット枠 + 外側 L ブラケット（戦術UI参照）にブラッシュアップ |
| 2026-07-15 | 初版。ゲート A–D、プレビュー一覧、シーズン予想（締切方針・採点後回し）を記録 |
| 2026-07-15 | アワード: 人気 Top5 + 前方一致サジェスト仕様を確定。プレビュー UI + チェックリスト更新 |
| 2026-07-15 | 提出後ビュー（順位表・アワード出力 UI）プレビュー追加 |
