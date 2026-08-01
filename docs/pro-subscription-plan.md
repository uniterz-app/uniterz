# Pro サブスクリプション計画書

> ステータス: **V1 方針確定（設計正）** — 本番未接続  
> 最終更新: 2026-07-23（Pro Plan 煮詰め反映）  
> **サービス全体設計（上位）:** [`docs/service-overview.md`](service-overview.md)  
> **Pro 課金設計（料金・状態・表現・実装データ）:** [`docs/pro-billing-design.md`](pro-billing-design.md)  
> 関連: `app/mobile/pro/subscribe/page.tsx`, `app/lp/_components/lp-data.ts`, `app/dev/weekly-report-preview/`, `app/dev/monthly-report-preview/`, `app/mobile/pro/skin/`  
> **プレビュー→本番の待ち・ゲート一覧:** [`docs/preview-to-prod-checklist.md`](preview-to-prod-checklist.md)  
> **課金プラン方針:** Weekly / Monthly / Season Pass の 3 種（価格・特典差は未確定。Shadow は旧案・V1 では Pro 本線から外す）

---

## 0. Pro の位置づけ（確定）

Pro は次の 4 軸で価値を出す。

| 軸 | 機能 | 役割 |
|---|---|---|
| **予想を助ける** | PRO INSIGHT、試合直前アラート | 予想を決める・見直す材料 |
| **自分を分析する** | 週次レポート、月次レポート | 振り返りと次の一手 |
| **継続して開く理由** | 毎週・毎月の更新（live / final） | 習慣化 |
| **課金者として目立てる** | Pro Skin、Pro バッジ、My Rank 専用表示 | ステータス |

### 鉄則（Pay to Win 回避）

- 予想参加・基本ランキングは **Free のまま**
- 他人の予想内容は **見せない**
- 順位そのものにボーナスを付けない
- **勝者を断言しない**（PRO INSIGHT は分析。推奨予想ではない）
- 「推奨予想」はしない

### V1 から外す / 保留

| 機能 | 扱い |
|---|---|
| Gap（差の構造） | **保留**（課金コピーからも除外済み） |
| Shadow（匿名ライバル帯） | **V1 不要**（週次・月次とも無し） |
| Momentum / Position / Timing 専用画面 | 作らない |
| 月内順位推移 | 月次 V2 候補 |

---

## 1. PRO INSIGHT（試合前の読み）

無料データから、**今回の試合で重要な結論を 3〜5 個だけ出す**機能。  
勝者を断言する機能ではなく、**ユーザーが予想を決めるための分析機能**。

### 画面構成

#### 1. 試合全体の要約

例:

> この試合の鍵はリバウンドです。ニックスはオフェンスリバウンドが強く、セルティックスは直近10試合で守備リバウンド率が低下しています。セルティックスがセカンドチャンスを抑えられるかが重要です。

#### 2. インサイトカードを 3〜5 枚

毎試合同じ項目を並べない。**AI が重要度を判定して上位 3〜5 個だけ表示**。重要な情報がない場合は無理にカードを作らない。

| カード種別 | 問い |
|---|---|
| **MATCHUP EDGE** | どちらが相手の弱点を突けるか |
| **RECENT CHANGE** | シーズン平均と直近 10 試合で何が変わったか |
| **INJURY IMPACT** | 欠場によって誰の役割やスタッツが増えるか |
| **SCHEDULE IMPACT** | 連戦、休養、移動、前戦の出場時間 |
| **UPSET / CLOSE GAME FACTOR** | 接戦や番狂わせが起きる理由 |

#### 3. 各カードには根拠を付ける

文章だけでなく、**使用した数字も小さく表示**する。

例（MATCHUP EDGE）:

> ニックスがインサイドで優位  
> ニックスはペイント内得点がリーグ5位。一方、セルティックスは直近10試合でペイント内失点が増えています。

根拠表示:

- ニックス：ペイント得点 52.8点
- セルティックス：直近10試合のペイント失点 51.4点

### V1 で最初に作るカード

1. 試合要約  
2. 最大のマッチアップ差（MATCHUP EDGE）  
3. 直近 10 試合の変化（RECENT CHANGE）  
4. 欠場の影響（INJURY IMPACT）  
5. 連戦・休養（SCHEDULE IMPACT）  
6. アップセット要因（UPSET FACTOR）

※ 上記は候補。**実際の表示は試合ごとに重要なものだけ 3〜5 枚**。

### カード例（数値は仮）

**RECENT CHANGE**

> ウォリアーズの攻撃が改善  
> シーズン平均と比べて、直近10試合では3P成功率が4.2％上昇。アシスト数も増えており、ボールの動きが改善しています。  
> 根拠: シーズン3P 35.1% → 直近10試合 39.3% / アシスト 26.1 → 29.4

**INJURY IMPACT**

> 主力ガード欠場でジェイレン・ウィリアムズの役割が増加  
> SGA欠場時は使用率とアシストが上昇。一方でチーム全体のターンオーバーも増えている。  
> 根拠: 使用率 24.8% → 30.2% / アシスト 4.7 → 7.1 / チームTO 12.4 → 15.0

**SCHEDULE IMPACT**

> レイカーズは疲労面で不利  
> 連戦で前日に主力3選手が38分以上出場。ナゲッツは2日間の休養。  
> 根拠: レイカーズ連戦 / 前日主力平均出場 39.6分 / ナゲッツ休養2日

**UPSET FACTOR**

> マジックにアップセットの可能性  
> 戦力ではバックス優勢だが、マジックはホーム守備が強く、バックスは連戦時に失点増。  
> 根拠: マジックホーム守備効率 リーグ4位 / バックス連戦時失点 +6.3 / 接戦指数 HIGH

### 表示ルール

- 固定スロット並べではなく、重要度上位のみ
- 情報不足ならカードを作らない（沈黙可）
- 勝者断言・推奨スコアはしない

---

## 2. 試合直前アラート

**予想を見直す必要がある変化だけ通知する**機能。  
試合開始通知だけでは課金価値が弱い。

### V1 で入れる通知

#### 1. 出場ステータス変更

例: ドンチッチが「Questionable」から「Out」に変更 → レイカーズ戦の予想を確認

対象:

- Probable → Questionable
- Questionable → Out
- Out → Available
- 試合直前の急な欠場

軽微な変更は通知しない。

#### 2. スターター発表・変更

通常の先発発表を毎回通知しない。影響が大きい場合だけ:

- 主力の先発落ち
- 控え選手の先発起用
- スモールラインナップ
- 欠場に伴う変更

#### 3. 予想締切アラート

未予想試合のみ。設定候補: 60分前 / 30分前 / 10分前

#### 4. 重要情報による再確認

複数の変化をまとめて通知（5〜10 分以内の更新はまとめる）。

例:

> 試合前情報が更新されました。  
> ・主力ガード欠場  
> ・控え選手が先発  
> ・相手は連戦  
> 予想を再確認してください。

#### 5. PRO INSIGHT 更新

欠場反映などで **重要度や結論が変わった場合だけ**。文章の微修正では送らない。

### 通知しないもの

- 全試合の開始通知
- 毎回のスターター発表
- 軽微な怪我情報
- 数字が少し変わっただけの更新
- 同じ試合に短時間で複数通知
- すでに終了した試合の情報

### 通知設定（ユーザー切替）

- 欠場・出場情報
- スターター変更
- 予想締切
- PRO INSIGHT 更新
- お気に入りチームのみ
- 自分が予想した試合のみ
- 通知を受ける時間帯

初期設定は通知過多を避ける。

### Free / Pro

| | Free | Pro |
|---|---|---|
| 予想締切 30分前 | ○ | ○ |
| お気に入りチームの試合開始通知 | ○ | ○ |
| 出場ステータス変更 | — | ○ |
| スターター変更 | — | ○ |
| 重要情報のまとめ通知 | — | ○ |
| PRO INSIGHT 更新 | — | ○ |
| 通知時間の細かい設定 | — | ○ |
| 予想済み試合の再確認通知 | — | ○ |

### UX

通知タップ → **その試合の予想画面 or PRO INSIGHT** へ直接遷移。受け取りだけで終わらせない。

### V1 完成形（通知）

1. 出場ステータス変更  
2. 重要なスターター変更  
3. 未予想試合の締切通知  
4. 複数更新のまとめ通知  
5. PRO INSIGHT の重要更新  

---

## 3. 個人週次レポート（V1 完成形）

役割: **競争の実況**（結果 → 順位変動 → 次週の行動まで 1 画面）

| 項目 | 内容 |
|---|---|
| 期間 | 月曜 0:00〜日曜 23:59 JST |
| 進行中 | 毎日更新（`status: live`） |
| 確定 | 翌月曜に確定（`status: final`） |
| プッシュ | **確定時のみ** |
| トライアル | 7日間でも初日から閲覧可（進行中ビュー） |
| 対象 | NBA / Pro のみ |

### 画面の順番

1. 今週の結果  
2. 部門パフォーマンス  
3. 順位変動  
4. ライバル  
5. 今週の診断  

### 1. 今週の結果

最上部。

- 週間順位
- 前週からの順位変動（live は **前日比**、final は **前週比**）
- TOP%
- 獲得ポイント
- 予想数
- 勝敗

例: `週間142位　↑38 / TOP 12% / 47pt｜12予想｜8勝4敗`

### 2. 部門パフォーマンス

3 部門カード: **WIN / SCORER / UPSET**

各カード:

- 値（勝率 / 的中数または獲得 pt / 的中数または獲得 pt）
- 前週比
- 部門順位
- TOP10 なら専用バッジ

最低参加数未達時: `参考記録 / ランキング対象まであと N 予想`

### 3. 順位変動

「抜いた相手」と「抜かれた相手」を統合。

ヘッダー例: `今週は8人を抜き、3人に抜かれました`

| | 初期 | 展開 |
|---|---|---|
| 抜いた相手 | 最大 3 人 | 「もっと見る」で最大 30 人 |
| 抜かれた相手 | 最大 3 人 | 同上 |

比較基準（live / final 共通）: **先週終了時の順位 → 現在の順位**

### 4. ライバル

横並び。

- 次のターゲット: `@USERNAME / あと 2pt`
- 背後の脅威: `@USERNAME / 1pt差`
- 対象なしなら非表示

### 5. 今週の診断（2 段）

**今週の総括**

例: UPSET部門で前週より9pt多く獲得し、週間順位を38上げました。

**次週の焦点**

例: SCORER部門の参加数が少ないため、次週は得点者予想への参加を増やすと順位を伸ばせます。

診断の優先順位:

1. ターゲットまたは脅威と 2pt 以内  
2. 順位を大きく上げた／下げた要因  
3. 最も前週比が動いた部門  
4. 予想数の増減  
5. 特筆なし → 順位結果のみ  

深掘り分析・複数要因の列挙はしない（月次の役割）。

### 週次に入れないもの

- レーダー / 能力チャート
- ベスト予想（月次ハイライトへ）
- Shadow

### 保存・入口

- doc: `user_reports/{uid}_weekly_{月曜dateKey}`
- 入口: プロフィール **Report タブ**（Pro のみ。旧 Stats は廃止）
- 一覧先頭に「今週（進行中）」

---

## 4. 月次レポート（V1 案）

役割: **自分の分析**（週次と重複させない。月額課金の中心機能）

期間: 暦月 JST / 翌月 1 日の cron で確定・プッシュ / NBA / Pro のみ

### 画面の順番（完成形）

1. 表紙  
2. 数字で見る今月  
3. **獲得 Unit 内訳**（当月付与の内訳。履歴フルページは別）  
4. 能力チャート  
5. 予想のクセ  
6. チーム相性  
7. 月間ハイライト  
8. **今月のサマリー**（強み・改善・目標を1ブロックに統合）  

### 1. 表紙

月次の主役。

- 月間順位
- 今月の獲得 Unit
- TOP%
- 前月比
- 総合得点 / 勝率 / SCORER / UPSET（ミニカード）
- **分析タイプ称号** + 短い説明

例: `GIANT SLAYER / 月間8位｜Unit 80｜TOP 1.9%｜前月比 +7位`

分析タイプはプロフィールにも表示可能（称号露出）。27 種類は維持してよいが、最初は分類精度を確認する。

### 2. 数字で見る今月

「全体の中の自分」をここに統合。別セクションにしない。

載せる数字:

- 予想数 / 勝率 / 獲得 Unit / 総合得点 / SCORER 的中 / UPSET 獲得 pt
- 各数字の下に: 前月比 / 全体中央値 / 上位 10% 平均（レンジバーで可視化。平均は使わない）
- 指標内順位（斜めタグ `#N`）: 獲得 Unit / 総合得点 / SCORER / UPSET に表示。色は順位帯。**予想数・勝率は出さない**

例: `総合得点 298.4 [#8] / 前月比 +86.2 / 中央値 154.8 / 上位10% 398.2`

### 2b. 獲得 Unit 内訳

表紙・数字の「獲得 Unit」合計の内訳。**レポート内パート**（フル履歴ページは別途）。

| source | 内容 |
|---|---|
| `personal_weekly` / `personal_monthly` | 個人ランキング |
| `group_weekly` / `group_monthly` | グループランキング |
| `metric_rank` | **部門上位**（総合 / WIN% / SCORER / UPSET 等）にも Unit 配布予定 |
| `invite` | 招待 |
| `event` | 特別イベント（枠） |

各行: 付与量 · 期間ラベル · 順位（あれば）· 部門（metric_rank）。  
データは将来の Unit ledger。V1 UI はモック。合計は `unitsEarned` と一致させる。

ユーザー全体の獲得履歴ページは別画面（後続）。

### 3. 能力チャート

月次限定の目玉。レーダーは **5 軸・全体内パーセンタイル（0〜100）**。

| 軸 | 意味 | 生指標の例 |
|---|---|---|
| WIN | 勝敗予想の強さ | 勝率 |
| SCORER | 得点者的中 | SCORER 的中数 / 率 |
| UPSET | 番狂わせで稼ぐ力 | UPSET pt |
| ACTIVITY | 参加量 | 予想数（投稿数） |
| CONSISTENCY | 安定 / 耐性 | 連勝を活かし連敗の傷を抑える合成 |

**軸に入れない（確定）**

- 総合得点 — WIN + SCORER + UPSET + 量の合成結果で重複する
- 連敗単体 — CONSISTENCY に折り込む
- 獲得 Unit / 順位 — 能力ではなく結果
- SELECTIVITY（選球）— 「予想のクセ」側

「スコア精度」は廃止 → **SCORER への差し替えで確定**。

#### 表示 vs 判定

| | 内容 |
|---|---|
| レーダー表示 | 相対のみ（パーセンタイル 0–100）。連続値のまま。S/M/W は使わない |
| 強み判定 | **相対 ∩ 絶対** の両方を満たした軸だけ「強み」 |
| 分析タイプ | ハイブリッド（後述） |

#### 最低サンプル（レーダー / タイプ対象）

- 分母: その月に含まれる **ピックアップゲーム**（下記フローで指定）の合計
- 条件: ピックアップゲームの **半分以上** に予想していること
- 未達はレーダー参考扱い。分析タイプは **Prospect**。数字セクションは別途表示可

#### ピックアップ試合フロー（NBA Regular Season）

単位は **週（月曜 0:00〜日曜 23:59 JST）**。月次の分母は、その月に落ちたピックアップ試合の集合。

| 段階 | いつ | 何をする |
|---|---|---|
| 1. スケジュール投入 | NBA RS のスケジュール発表後 | 全試合スケジュールを先にデータ投入（ピックアップ前の土台） |
| 2. ピックアップ指定 | **対象週の前週水曜日** | 運営が、翌月曜〜日曜の試合からピックアップを指定 |
| 3. 公開・集計 | 対象週〜 | ユーザーはピックアップを予想対象の基準にし、週次/月次集計の分母に使う |

補足:

- スケジュールがないと指定できない → **必ず「全試合投入 → ピックアップ指定」の順**
- 水曜確定なので、ユーザーには対象週の数日前からピックアップが見える想定
- 月次 ACTIVITY / サンプル: `その月のピックアップ試合数` に対する予想参加率
- プレイオフ等は別途定義（V1 は RS を主対象）

#### ピックアップ スキーマ（案）

**結論: 試合にフラグだけ、ではなく「週ドキュメントを正」にする。**  
フラグ単体だと「どの週の指定か / 水曜に誰が確定したか / 訂正履歴」が弱い。

| | 内容 |
|---|---|
| **正** | `nba_pickup_weeks/{weekKey}` |
| **冗長（任意）** | `games/{gameId}.pickupWeekKey`（読み取り高速化用。書きは週 doc 確定時に同期） |

`weekKey`: その週の月曜 JST 日付 `YYYY-MM-DD`（例: `2026-10-26` = その月曜始まりの月〜日）

```
nba_pickup_weeks/{weekKey}
  league: "nba"
  weekKey: "2026-10-26"          // 月曜
  rangeStartJst: "2026-10-26"    // 月
  rangeEndJst: "2026-11-01"      // 日
  status: "draft" | "final"      // 水曜確定で final
  gameIds: string[]              // ピックアップ試合
  decidedAt: Timestamp | null
  decidedBy: string | null       // admin uid / 運用ID
  updatedAt: Timestamp
```

試合側（任意の同期フィールド）:

```
games/{gameId}
  ...既存フィールド...
  pickupWeekKey?: string | null  // ピックアップなら所属週。外したら null
```

**なぜフラグだけにしないか**

- 運営の単位が「週」なので、週 doc の方が指定 UI・確定タイミングと一致する
- `isPickup: true` だけだと、月跨ぎや訂正時に「いつの指定か」が曖昧
- 集計は `nba_pickup_weeks` を月で束ねるか、`pickupWeekKey != null` の試合を月でフィルタすればよい

**読み方（集計）**

- ある週のピックアップ: `nba_pickup_weeks/{weekKey}.gameIds`
- ある月の分母: その月に tip-off がある試合のうち `pickupWeekKey` があるもの（または該当 `weekKey` 群の `gameIds` 和集合）
- ユーザー参加率: 分母の gameId のうち、予想投稿がある数 / 分母

**運用手順（Cursor 指定フロー）**

Admin 画面は使わない。得点者投入と同じく **ユーザーが指示 → Cursor が JSON を書いてスクリプト実行**。

1. RS スケジュールを `games` に投入済みであること
2. ユーザー例: 「来週 10/26 週のピックアップを ○○ と △△ にして」
3. Cursor が `scripts/data/nba-pickup-{weekKey}.json` を作成/更新
4. `npx tsx scripts/set-nba-pickup-week.ts --file ... --dry-run` で確認
5. 同コマンド（dry-run なし）で `nba_pickup_weeks` + `games.pickupWeekKey` を反映

```bash
npx tsx scripts/set-nba-pickup-week.ts --file scripts/data/nba-pickup-2026-10-26.json --dry-run
npx tsx scripts/set-nba-pickup-week.ts --file scripts/data/nba-pickup-2026-10-26.json
```

タイミング目安: **対象週の前週水曜日** に final にする。

#### 強みの定義（設計中・仮置き）

- **相対:** その軸がコホート内 **p70 以上**（上位おおよそ 30%）
- **絶対:** 軸ごとに下限（例。本番前に実データで調整）

| 軸 | 絶対下限（V1 仮置き） | 意図 |
|---|---|---|
| WIN | 勝率 ≥ **52%** | 50%はコイントス。少し上を「当てている」とする |
| SCORER | 的中数 ≥ **月間コホート中央値** | 固定本数だと月の試合数でズレるので中央値に追従 |
| UPSET | UPSET pt ≥ **月間コホート中央値** かつ 機会 ≥ **5** | 機会不足・偶然の少数 pt を除外 |
| ACTIVITY | 参加率 ≥ **50%**（ピックアップ半分） | 最低サンプルと同じ。出ていればクリア |
| CONSISTENCY | 最大連敗 ≤ **5** | 「安定」なのに大崩れしている人を除外 |

補足: SCORER / UPSET の中央値は「その月の対象ユーザー集団」から計算。固定の「7的中」「25pt」などは持たない。

境界のヒステリシス（入る/出るで閾値をずらす）は **いったん見送り**。

#### 分析タイプ割当（ハイブリッド・骨格）

1. **オールラウンド** — 強みが **3 本以上**
2. **専門型** — 強み **1〜2 本**
3. **Prospect** — 次のいずれか
   - 強みが **0 本**（サンプル達成だが突出なし）
   - **ピックアップ半分未達**（サンプル不足）

旧 S/M/W（≥8 / ≥4）による判定は **廃止**。  
旧「強み3本の組み合わせ型」も **廃止** → 3本以上はオールラウンドへ統合。

#### 実装着手（集計）

1. **判定ロジック** — `monthlyRadarJudge.ts` ✅
2. **ピックアップ Cursor 指定** — `set-nba-pickup-week.ts` ✅
3. **集計スキーム + 組み立て層** — `monthlyReportAggregation.ts` / `buildMonthlyReportFromSources.ts` ✅
4. **Functions builder** — `functions/src/reports/buildMonthlyReportsCore.ts` ✅
   - daily 1 パス + `period_ranking_snapshots` + pickup 週 doc
   - cron: `rebuildMonthlyReportsCronV2`（**毎月1日 8:00 JST**）
   - 手動: `rebuildMonthlyReportsManualV2`
5. チーム相性・ハイライト・今月のサマリー — 集計接続 ✅（ピックアップ posts）
6. **配信 / Report 入口 / Unit（弁護士後）/ Pro Stats 廃止** — 下記「これから」キュー

**Pro Stats / 旧月次**

- 現状は参照あり → 移行完了まで残す
- **最終的に Pro Stats は廃止し、月次レポートへ一本化する**
- 新規の分析・集計は月次レポート側だけに足す。旧 doc は読まない

#### これからやるキュー（月次レポート残・優先順）

UI プレビューは一通り揃っている。次は **実データ接続・届く体験・Unit（弁護士後）**。

| # | 項目 | 状態 | 内容 |
|---|---|---|---|
| 1 | **予想のクセの集計接続** | 済 | posts 1パスで Home/Away・順当/逆張り → `buildMonthlyHabits` |
| 2 | **CONSISTENCY 本実装** | 済 | ピックアップ結果列の連勝/連敗 → stamina raw → コホート百分位 + maxLoseStreak 閾値 |
| 3 | **数字の前月比** | 済 | 前月 daily 合算から posts/winRate/points/scorer/upset の `prevDelta`（units は stub のまま null） |
| 4 | **cron を 1日 8:00 JST に変更** | 済 | `0 8 1 * *`（Asia/Tokyo） |
| 5 | **月次レポート確定プッシュ** | 未 | 集計後、Pro＋トークン持ちへ Expo push。「毎月1日朝に届く」体験。週次 final プッシュと同系 |
| 6 | **Report タブ入口** | △ | Stats → Report。週次・月次を user_reports から表示。一覧フル UI はあと |
| 7 | **Pro 閲覧ガード** | △ | Report タブは Pro のみ。厳密強化は余地 |
| 8 | **Unit ledger 接続** | 待ち | UI（内訳バー＋展開）済み。付与ロジック・ledger は **弁護士 OK 後**。内訳・表紙 `unitsEarned` を stub から切替 |
| 9 | **Unit 獲得履歴ページ** | 待ち | レポート内訳とは別。全期間の付与履歴 |
| 10 | **Pro Stats 廃止** | △ UI・cron 済 | Profile から ProAnalysis 除去、旧月次 cron export 停止。孤児 hook / データ整理は残 |

メモ:

- ピックアップ週指定（`nba_pickup_weeks`）は運用前提。未指定月は ACTIVITY / 相性 / ハイライト / クセが空または弱い
- **#1–#4 は完了。** 次は **#5 から**（プッシュ → Report 入口…）。Unit は弁護士 OK 後

#### 月次レポート集計スキーム

**方針: 既存の取り方を再利用し、追加スキャンを最小にする。**  
旧 `user_stats_v2_monthly` は Pro Stats 移行完了まで残すが、**レポート V1 では使わない**。

```
安い I/O
  period_ranking_snapshots (nba_monthly_{YYYY-MM}_{metric})  → 順位・prevRank
  user_stats_v2_daily 月合算（NBA スライス）                 → 値（posts/pt/勝率/SCORER/UPSET）
  pickupWeekKey / nba_pickup_weeks                         → 参加率の分母
  （1 パスのコホート計算）                                    → 中央値・上位10%・レーダー%
  monthlyRadarJudge                                        → 強み・分析タイプ
  Units                                                    → ledger 未接続のため stub 0/null

組み立て（I/O なし）
  buildMonthlyReportFromSources → MonthlyReport
  → user_reports/{uid}_monthly_{YYYY-MM}
```

| 欲しいもの | 既存ソース | コスト感 |
|---|---|---|
| 総合順位 / 前月順位 | `period_ranking_snapshots` totalPoints | 月あたり数 doc |
| SCORER / UPSET 順位 | 同 snapshots | 同上 |
| posts / points / wins / scorer / upset 値 | `user_stats_v2_daily` 合算（period builder と同系） | 日次は既にある。全ユーザーは **1 回の日付ループ**が最安 |
| 中央値・上位10%・レーダー% | 上記合算のコホート配列 | 追加 Firestore なし |
| ACTIVITY / サンプル | pickup 分母 + pickup への posts | pickup 指定済みが前提 |
| CONSISTENCY | ピックアップ結果列の連勝/連敗 → stamina → 百分位 | ハイライトと同一 posts 走査 |
| Units | **stub**（弁護士 OK 後に ledger） | 0 |
| 予想のクセ | posts 1パス → `buildMonthlyHabits` | サイド最低投稿未満は null |
| 月次プッシュ | **未実装** | 確定後 Expo push |

契約・組み立て:

- `lib/reports/monthlyReportAggregation.ts` — 段階の型
- `lib/reports/buildMonthlyReportFromSources.ts` — 取得済みデータ → `MonthlyReport`
- `lib/reports/monthlyRadarJudge.ts` — 強み・タイプ

**やらないこと**

- 旧 `rebuildUserMonthlyStatsCore` の削除（参照の最終整理までは orphan として残す）
- レポートのために旧 `radar10` を再利用
- ユーザーごとに daily を N 回バラバラ get（全ユーザー書くなら日付ループ一括）

#### 分析タイプ一覧（V1・19種）

軸略称: W=WIN / S=SCORER / U=UPSET / A=ACTIVITY / C=CONSISTENCY

**オールラウンド（3）**

| 条件 | ID | 表示名 |
|---|---|---|
| 強み 5 | GOAT | GOAT |
| 強み 4 | COMPLETE_PLAYER | Complete Player |
| 強み 3 | ALL_ROUNDER | All-Rounder |

**単軸（5）— 強みがちょうど1本**

| 強み | ID | 表示名 | 一言 |
|---|---|---|---|
| W | FINISHER | Finisher | 勝敗を取り切る |
| S | LASER | Laser | 得点者を射抜く |
| U | CHAOS_TAKER | Chaos Taker | 波乱を拾う |
| A | HIGH_MOTOR | High-Motor | 手数で押す |
| C | IRON_MAN | Iron Man | 崩れない |

**二軸（10）— 強みがちょうど2本（確定）**

| # | 強み（軸） | ID | 表示名 | 一言 |
|---|---|---|---|---|
| 1 | WIN + SCORER | TWO_WAY_PLAYER | Two-Way Player | 勝敗×得点者 |
| 2 | WIN + UPSET | BIG_GAME_HUNTER | Big-Game Hunter | 勝敗×波乱 |
| 3 | WIN + ACTIVITY | WALKING_BUCKET | Walking Bucket | 勝敗×量 |
| 4 | WIN + CONSISTENCY | HIGH_FLOOR | High Floor | 勝敗×安定 |
| 5 | SCORER + UPSET | CLUTCH | Clutch | 得点者×波乱 |
| 6 | SCORER + ACTIVITY | DEEP_BAG | Deep Bag | 得点者×量 |
| 7 | SCORER + CONSISTENCY | SHARPSHOOTER | Sharpshooter | 得点者×安定 |
| 8 | UPSET + ACTIVITY | CHAOS_RUNNER | Chaos Runner | 波乱×量 |
| 9 | UPSET + CONSISTENCY | CHAOS_ANCHOR | Chaos Anchor | 波乱×安定 |
| 10 | ACTIVITY + CONSISTENCY | SPARK_PLUG | Spark Plug | 量×安定 |

**Prospect（1）**

| 条件 | ID | 表示名 |
|---|---|---|
| 強み 0、またはピックアップ半分未達 | PROSPECT | Prospect |

合計 **19種**。レーダー見た目は後続。説明文は別途確定していく。

**廃止 / 改名した旧タイプ**

- 吸収: CHEAT_CODE / ELITE_ALLROUNDER / GIANT_SLAYER / HOT_HAND / UNICORN / ASSASSIN / KILLER_INSTINCT / SWISS_ARMY_KNIFE / TECHNICIAN / IRON_ENGINE
- 改名: BULLDOG → HIGH_FLOOR / SCRAPPER → CHAOS_ANCHOR
- 新設: GOAT / ALL_ROUNDER

「精度」表記はすべて **SCORER** に読み替え。

#### 分析タイプ説明文（ドラフト）

フォーマット: 中くらいの長さ。定義 → 中身 → 次の一手 → 名前回収。

**Prospect**
```
まだ特定の分析スタイルに固定されていない、伸びしろ優先のタイプです。
ピックアップへの参加が半分未満か、5軸のどれもまだ「強み」まで届いていない状態。型がないのではなく、これから作る途中にいます。
まずはピックアップの半分以上に参加し、手応えのある軸を1つ選んで強みラインまで押し上げましょう。参加が足りない月は、質より先に量の土台です。
何者にもなれる可能性を秘めた Prospect。
```

**GOAT**（強み5）
```
5軸すべてが強みの、月間における最高到達点のタイプです。
勝敗・得点者・波乱・参加量・安定のどれにも穴がなく、総合力で一段上にいます。
次に足すものより、この水準を翌月も落とさない運用がテーマ。参加のムラや連敗の傷に注意し、5軸のバランスを維持しましょう。
すべてを兼ね備えた頂点は、まさに GOAT。
```

**Complete Player**（強み4）
```
5軸中4つが強みの、ほぼ完成形の総合タイプです。
致命的な穴はなく、残る1軸だけが強みライン未達。いわば GOAT の一歩手前です。
来月は全部を均等に伸ばすより、未達の1軸だけを単一目標にして押し上げましょう。それが埋まれば GOAT 圏に届きます。
高い完成度で戦うスタイルは、まさに Complete Player。
```

**All-Rounder**（強み3）
```
5軸中3つが強みの、多面的に戦えるタイプです。
ひとつの武器に依存せず、複数の勝ち筋を同時に持てるのが強み。過半数がすでに機能しています。
さらに上を目指すなら、未達の2軸のうち優先の1本だけを伸ばしましょう。次の到達点は Complete Player（強み4）です。
局面を選ばず機能する総合力は、まさに All-Rounder。
```

**Finisher**（WIN）
```
WIN が唯一の強みの、勝敗予想に特化したタイプです。
試合の勝ち負けを高い水準で取り切る力が、今月の軸になっています。
さらに伸ばすなら SCORER か CONSISTENCY を足し、勝ちを得点と安定につなげましょう。次の二軸到達点は Two-Way Player か High Floor です。
最後に勝負を決める決定力は、まさに Finisher。
```

**Laser**（SCORER）
```
SCORER が唯一の強みの、得点者予想に特化したタイプです。
細部を射抜く精度が、今月の差別化ポイントになっています。
さらに伸ばすなら WIN か ACTIVITY を足し、的中を総得点に変えましょう。次の二軸到達点は Two-Way Player か Deep Bag です。
一点を狙う判断の鋭さは、まさに Laser。
```

**Chaos Taker**（UPSET）
```
UPSET が唯一の強みの、波乱攻略に特化したタイプです。
番狂わせを拾う読みが、今月の得点源になっています。
さらに伸ばすなら WIN か CONSISTENCY を足し、波乱を安定した勝ちにつなげましょう。次の二軸到達点は Big-Game Hunter か Chaos Anchor です。
カオスを恐れず価値に変える勝負勘は、まさに Chaos Taker。
```

**High-Motor**（ACTIVITY）
```
ACTIVITY が唯一の強みの、参加量に特化したタイプです。
手数と関与量で試合に入り続ける力が、今月の土台になっています。
さらに伸ばすなら WIN か SCORER を足し、量を質と結果に変えましょう。次の二軸到達点は Walking Bucket か Deep Bag です。
止まらず動き続ける推進力は、まさに High-Motor。
```

**Iron Man**（CONSISTENCY）
```
CONSISTENCY が唯一の強みの、安定運用に特化したタイプです。
大崩れしにくく、長い期間で水準を維持できるのが武器です。
さらに伸ばすなら WIN か SCORER を足し、安定を勝ちと的中に直結させましょう。次の二軸到達点は High Floor か Sharpshooter です。
最後まで強度を落とさない持久力は、まさに Iron Man。
```

**Two-Way Player**（WIN+SCORER）
```
WIN と SCORER が強みの、二刀流タイプです。
勝敗も得点者も高い水準で両立し、本筋の予想で差を作れます。
さらに上を目指すなら ACTIVITY か CONSISTENCY を伸ばし、再現の幅を広げましょう。次の到達点は All-Rounder（強み3）です。
攻守両面で試合を作る力は、まさに Two-Way Player。
```

**Big-Game Hunter**（WIN+UPSET）
```
WIN と UPSET が強みの、大勝負タイプです。
勝ち切る力と波乱を突く力を持ち、難局で流れを変えられます。
さらに上を目指すなら SCORER か CONSISTENCY を伸ばし、一撃を継続得点にしましょう。次の到達点は All-Rounder（強み3）です。
大舞台で獲物を仕留める勝負強さは、まさに Big-Game Hunter。
```

**Walking Bucket**（WIN+ACTIVITY）
```
WIN と ACTIVITY が強みの、量産タイプです。
手数を出しながら勝ちを積み、総量で差を作れます。
さらに上を目指すなら SCORER か UPSET を伸ばし、1試合あたりの上限を上げましょう。次の到達点は All-Rounder（強み3）です。
点を取り続ける攻撃力は、まさに Walking Bucket。
```

**High Floor**（WIN+CONSISTENCY）
```
WIN と CONSISTENCY が強みの、下限の高いタイプです。
勝ちを積みつつ大崩れしにくく、月間の床が高いのが特徴です。
さらに上を目指すなら SCORER か UPSET を伸ばし、天井も押し上げましょう。次の到達点は All-Rounder（強み3）です。
落ちにくい強さは、まさに High Floor。
```

**Clutch**（SCORER+UPSET）
```
SCORER と UPSET が強みの、勝負どころタイプです。
細部の精度と波乱の読みで、価値の高い一手を通せます。
さらに上を目指すなら WIN か ACTIVITY を伸ばし、決定機を増やしましょう。次の到達点は All-Rounder（強み3）です。
ここ一番で決め切る力は、まさに Clutch。
```

**Deep Bag**（SCORER+ACTIVITY）
```
SCORER と ACTIVITY が強みの、手札の多いタイプです。
手数を出しても得点者の質を落としにくく、長期で差が開きます。
さらに上を目指すなら WIN か CONSISTENCY を伸ばし、勝ちと安定を足しましょう。次の到達点は All-Rounder（強み3）です。
多彩な選択肢で優位を広げるスタイルは、まさに Deep Bag。
```

**Sharpshooter**（SCORER+CONSISTENCY）
```
SCORER と CONSISTENCY が強みの、精密安定タイプです。
得点者予想をブレにくく継続でき、再現性の高い判断が武器です。
さらに上を目指すなら WIN か UPSET を伸ばし、勝ち筋の幅を広げましょう。次の到達点は All-Rounder（強み3）です。
狙いを外さない再現性は、まさに Sharpshooter。
```

**Chaos Runner**（UPSET+ACTIVITY）
```
UPSET と ACTIVITY が強みの、展開攻略タイプです。
手数で機会を広げながら波乱を拾い、得点機会を増やせます。
さらに上を目指すなら WIN か SCORER を伸ばし、拾った流れを本筋の勝ちに変えましょう。次の到達点は All-Rounder（強み3）です。
カオスを得点に変える推進力は、まさに Chaos Runner。
```

**Chaos Anchor**（UPSET+CONSISTENCY）
```
UPSET と CONSISTENCY が強みの、波乱を支えるタイプです。
荒れた局面でも粘り強く価値を拾い続け、崩れにくいのが武器です。
さらに上を目指すなら WIN か SCORER を伸ばし、波乱を安定した勝ちに接続しましょう。次の到達点は All-Rounder（強み3）です。
カオスの中でも沈まない軸は、まさに Chaos Anchor。
```

**Spark Plug**（ACTIVITY+CONSISTENCY）
```
ACTIVITY と CONSISTENCY が強みの、推進力タイプです。
高い稼働を長く維持でき、試合数が増えるほど存在感が出ます。
さらに上を目指すなら WIN か SCORER を伸ばし、エンジンを得点に変えましょう。次の到達点は All-Rounder（強み3）です。
チームに火をつけ続けるエネルギーは、まさに Spark Plug。
```

### 4. 予想のクセ

ユーザーが最も分析価値を感じやすい部分。**Pro Stats ハイブリッド**: スタイルマップ + 勝率 + 短文。

#### V1 構成

1. **スタイルマップ** — 自分の今月1点のみ（他ユーザーは出さない）
   - 横軸: Away ←→ Home（選球比バイアス）
   - 縦軸: 順当 ←→ 逆張り（市場バイアス）
   - 点の大きさ: 総合勝率
2. **Home / Away 勝率** + 選球比
3. **順当 / 逆張り 勝率** + 選球比
4. **短文** — 象限ラベル + 1〜2文（必ず文章で解説）

チーム相性は別セクション。ハイライトは V1 から外す方向。

バイアス定義は Pro Stats（`homeAwayBias` / `marketBias`）と同一。

サンプル: 各サイド投稿 ≥ 3。不足時はセクションをサンプル不足表示。

#### V1 では出さない

- 本命・中間・穴の細分化
- 自信度成功率
- 曜日
- 他ユーザーの点 / コホート雲
- 外しやすいパターンの自動列挙

実装: `lib/reports/buildMonthlyHabits.ts` → `MonthlyReportHabits`。  
UI: `MonthlyReportView` HabitsBlock。

### 5. チーム相性

残す。**ピックアップ試合のみ**・**自分が推した側のチームのみ**（対戦相手はカウントしない）。

想定母数: ピックアップは毎日 2〜4 試合・月あたりおおよそ 60 試合。

#### 並びの正（V1）

| 側 | 定義 |
|---|---|
| 得意 | そのチームを推して得た **総合得点（pt）合計** の上位・最大 3 |
| 苦手 | 同上の下位・最大 3（得意と重複なし） |

- **勝率では並べない**（表示用の勝敗だけ出す）
- 最低試合数: **同一チームへの推した回数 ≥ 2**（1試合だけの大物／全滅を除外）
- 条件を満たすチームが少なければ **出る分だけ**（枠を無理に埋めない）
- 総合得点は極端な大勝ちが起きにくい前提なので、合計 pt ソートでよい（試合あたりにはしない）

表示例: `OKC 2試合 1–1｜+18.5pt`

実装: `lib/reports/buildMonthlyTeamAffinity.ts`（純関数）+ `functions/src/reports/buildMonthlyReportsCore.ts`（ピックアップ posts 1 パス）。  
Pro Stats 旧ロジック（全投稿・勝率・最低5）とは別。レポートは上記に従う。

### 6. 月間ハイライト

「連勝」をここに統合。**価値の高いものを最大 3 個だけ**出す（種別は重複させない）。

候補プール:

| kind | 取り方 |
|---|---|
| `bestPick` | ピックアップ posts で `pointsV3` 最大の1本 |
| `bestDay` | 日付（JST）ごとの pt 合計が最大の日 |
| `upset` | `upsetPoints` 最大の1本 |
| `winStreak` | ピックアップ内の最長連勝（長さ ≥ 3 のみ候補） |
| `divisionTop10` | 月次 period 順位で WIN% / SCORER / UPSET のいずれか ≤10 |

選定: 種別ごとに価値スコアを付け、上位最大3。UI 都合で `bestPick` があれば先頭。

**対象はピックアップ試合のみ**（チーム相性と同じ posts 1 パス）。

実装: `lib/reports/buildMonthlyHighlights.ts` + builder。

### 7. 今月のサマリー

旧「来月への分析」を統合。**強み / 改善 / 目標を分けず、1本のサマリー文**にする。

#### 生成（V1・テンプレ）

LLM なし。骨格は固定:

> **[強み]。一方 [改善]。来月は [目標]。**

| スロット | 選び方 |
|---|---|
| 強み軸 | `strengths` 内でレーダー%最大。無ければ全軸最大 |
| 改善軸 | 強み以外でレーダー%最低。ACTIVITY が半分未満なら参加を優先 |
| 目標 | 改善軸に連動した行動文 |

**強みに載せる数字の優先:**  
1. **パーセンタイル / 上位%**（最優先）  
2. 前月比（あれば添える）  
3. 部門順位（あれば）

例外:

- サンプル不足 → 参加半分未満の定型文（型より量）
- 強み5本 → 穴ほぼなし・維持がテーマ

型: `outlook: { summary: string }`  
実装: `lib/reports/buildMonthlyOutlookSummary.ts` + builder。

### 削る・統合するもの

| 旧 | 新 |
|---|---|
| 全体の中の自分 | → 数字で見る今月へ統合 |
| 連勝セクション | → 月間ハイライトへ統合 |
| 抽象的な締めコメント | → 今月のサマリー（1本文） |
| Shadow | V1 不要 |
| 月内順位推移 | V2 |

### 保存・入口

- doc: `user_reports/{uid}_monthly_{YYYY-MM}`
- Report タブ（週次と同じ一覧）

---

## 5. Pro Skin 計画

### 目的

Pro ユーザーがプロフィールやランキング上で個性を出せる、限定ビジュアル機能。

**反映先**

- プロフィールカード
- ランキングリスト行
- 将来: 投稿カード、トロフィールーム

保存先: `users.planProBgVariant`  
導線: 課金成功後 → `/mobile/pro/skin` / サイドメニュー「Pro Skin」

### 通常 Pro Skin

Pro 加入中に自由選択できる背景スキン。初期採用 **18 種**。

| カテゴリ | 数 |
|---|---|
| サイバー空間 | 2 |
| 爬虫類 | 8 |
| 獣皮 | 2 |
| 素材 | 4 |
| 幾何学 | 2 |

- 解約後: 選択履歴は保存、表示は通常背景へ戻す
- 再加入時: 以前のスキンを自動復元

### Achievement Skin

Achievement Skin は、所定の実績達成によって解放される。**無料会員も解放条件を達成できるが、装着および表示には有効な Pro 利用権が必要となる。** Pro 終了後も解放履歴は保存し、再加入後に再び使用できる。

| 項目 | 内容 |
|---|---|
| 解放 | Free・Pro 共通で実績達成と解放は可能 |
| 装着・表示 | **Pro 加入中のみ** |
| Pro 解約後 | 解放履歴と選択状態は保存。表示は通常背景へ戻す |
| 再加入時 | 解放済み Achievement Skin を再び使用可能 |

解放条件例: 5 / 10 / 20 連勝、週間 / 月間 1 位、各部門 TOP10、シーズン TOP100 / 1 位、累計予想 100 回、継続利用 1 周年。

ランキング実績系は達成年月を表示可（例: `MONTHLY CHAMPION / NOV 2026`）。

### Pro との関係

| 種別 | 解放 | 装着・表示 |
|---|---|---|
| 通常 Pro Skin | Pro 加入中に選択 | Pro 加入中のみ |
| Achievement Skin | Free / Pro 共通（実績） | **Pro 加入中のみ** |

→ 通常 Pro Skin = 課金特典 / Achievement Skin = 競争と継続の報酬（ただし表示は Pro 期間のみ）

詳細の課金・状態管理・禁止表現は [`pro-billing-design.md`](pro-billing-design.md)。

### 別機能として管理するもの

課金画面では「Pro 限定ビジュアル」としてまとめて紹介してよいが、内部では別機能。

- Pro バッジ
- My Rank 専用ゴールド枠
- TOP% 表示
- 詳細 Progress（10 点）
- 分析タイプ称号
- トロフィールーム

### 今後の追加方針

- 新規: Pro 加入で使用可能 ≈ 50% / 実績解放 ≈ 50%
- 将来: シーズン限定・大会限定・周年限定
- 単なる背景変更ではなく、**課金・実績・継続を可視化するコレクション機能**として育てる

---

## 6. Free / Pro 境界（V1）

| 機能 | Free | Pro |
|---|---|---|
| 試合予想・基本ランキング | ○ | ○ |
| PRO INSIGHT | — | ○（重要カード 3〜5） |
| 試合直前アラート（重要変化） | 締切30分・お気に入り開始程度 | ○（欠場・先発・まとめ・Insight更新） |
| 週次 / 月次レポート | — | ○ |
| My Rank TOP% / ギャップ / Progress 10 | 制限 | ○ |
| Pro バッジ | — | ○ |
| 通常 Pro Skin | — | ○（加入中） |
| Achievement Skin | 解放可（装着は不可） | 解放可・装着可（加入中） |
| Gap / Shadow | — | V1 では提供しない |

---

## 7. 実装フェーズ（提案）

| Phase | 内容 |
|---|---|
| P0 | 課金導線（Weekly / Monthly / Season Pass）+ 7日トライアル + Pro ガード |
| P1 | PRO INSIGHT V1（要約 + 重要カード選出） |
| P2 | 試合直前アラート V1 |
| P3 | 週次レポート builder + UI（live / final） |
| P4 | 月次レポート builder + UI（1冊再構成） | UI・主要集計は進行中。残は計画書「これからやるキュー」 |
| P4b | クセ接続 → CONSISTENCY → 前月比 → 8:00 cron → 確定プッシュ → Report 入口 |
| P4c | Unit ledger（弁護士 OK 後）+ 履歴ページ |
| P5 | Stats タブ廃止 → Report タブ |
| P6 | Pro Skin 本番ガード + Achievement Skin 基盤 |
| P7 | 分析タイプ称号のプロフィール露出（月次確定後） |
| P8 | Pro Stats 完全廃止 |

詳細の待ちリスト: [`preview-to-prod-checklist.md` §0](preview-to-prod-checklist.md#0-次の作業キュー優先順)

---

## 8. 関連ファイル（実装時）

| 領域 | パス |
|---|---|
| 週次 UI / 型 | `app/component/reports/WeeklyReportView.tsx`, `lib/reports/weeklyReportTypes.ts` |
| 月次 UI / mock | `app/component/reports/MonthlyReportView.tsx`, `lib/reports/monthlyReportTypes.ts`, `lib/reports/monthlyReportPreviewMocks.ts` |
| 週次/月次プレビュー | `/dev/weekly-report-preview`, `/dev/monthly-report-preview` |
| Pro Skin ピッカー | `app/component/profile/pro/ProfilePlanProSkinPicker.tsx`, `/mobile/pro/skin` |
| Pro Skin 候補プレビュー（赤×黒） | `/dev/pro-skin-dark-fantasy-preview` · `/mobile/pro-skin-dark-fantasy-preview` |
| ランキング行 Skin | `app/component/rankings/RankingListProSkinFx.tsx` |
| Pro バッジ | `app/component/common/ProCyberBadge.tsx` |
| My Rank 枠 | `app/component/rankings/MyRankCardFrame.tsx` |
| Subscribe | `app/mobile/pro/subscribe/page.tsx` |
| 期間スナップショット | `period_ranking_snapshots` / `functions/src/rankings/buildNbaPeriodRankingSnapshots.ts` |

---

## 9. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-07-24 | Pro Skin 候補: ダークファンタジー赤×黒を拡充（Eclipse / Blood Rift 維持 + Chained Iron / Ink Hatch / Fang Row / Void Swirl / Jagged Plate / Crimson Veil）。`/dev/pro-skin-dark-fantasy-preview` |
| 2026-07-23 | **Pro Plan 煮詰めを計画書の正として全面更新**。PRO INSIGHT / 直前アラート / 週次・月次 V1 / Pro Skin（Achievement 含む）。Gap・Shadow は V1 外。旧 Layer A/B/C 構成を 4 軸（予想・分析・継続・ステータス）に再編 |
| 2026-07-23 | Achievement Skin: 解放は Free/Pro 共通、装着・表示は Pro 加入中のみに変更（`pro-billing-design.md` と整合） |
| 2026-07-19 | 週次/月次レポート要件、進行中ビュー、一言 2 段、称号・タイプ別バッジ構想を追記 |
| 2026-07-16 | 直近キューを checklist §0 へリンク |
| 2026-07-06 | 初版（ステータス UI・競争インテリジェンス 3 柱・Free/Pro 境界） |
