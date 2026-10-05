# Matchup Difficulty（v1）

「このチームにとって、この試合がどれくらい厳しいか」を 0〜100 で表す。勝敗予測ではなく、**相手の強さ + 試合環境 + 日程負荷** を1つにまとめた指標。

- 実装: [`lib/nba/matchupDifficulty/`](../lib/nba/matchupDifficulty/)（`features.ts` / `model.ts` / 自動生成 `fittedCoefficients.ts`）
- 係数の実測: [`scripts/nba-matchup-difficulty-fit.ts`](../scripts/nba-matchup-difficulty-fit.ts) → [`docs/nba-matchup-difficulty-fit.json`](nba-matchup-difficulty-fit.json)

## 考え方

点数を手で配分しない。全要素を **期待点差（何点有利・不利か）** で測り、0〜100 への変換は最後に一度だけ。

```
M = -ratingScale x 相手レーティング  ±  homeCourt  +  ownRest[自休養]  +  oppRest[相手休養]
Difficulty = 100 x (1 - Phi(M / sigma))
```

- **自チームの強さは含めない**（「平均的なチームにとっての厳しさ」）。全チームで比較できる
- 平均的な相手・中立地・休養同じ = 50
- 係数・sigma・レーティングの混ぜ方はすべて過去試合から実測

## 実測値（学習 2021-22〜2024-25、4,940 試合）

| 項目 | 値（点） | SE | 意味 |
|---|---|---|---|
| ratingScale | 1.147 | 0.037 | 相手レーティング 1 点 → 期待点差 1.15 点 |
| homeCourt | 1.94 | 0.20 | ホーム +1.94 / アウェイ −1.94（差 3.9 点） |
| 自チーム B2B | −2.69 | 0.41 | 相手が B2B なら +2.69 |
| 自チーム休養2日 | +0.22 | 0.43 | 有意差なし（基準は休養1日） |
| 自チーム休養3日以上 | +1.19 | 0.87 | 境界的 |
| sigma | 13.8 | — | 1 試合の点差のばらつき |

50 付近では期待点差 1 点 ≒ Difficulty 約 3 点。

休養は「自休養の効果 = 相手休養の効果の符号反転」と仮定した（両方 B2B なら相殺）。制約なしで推定しても自 B2B −2.75 / 相手 B2B +2.62 とほぼ対称で、仮定は支持される。

## 12 項目の決定

1. **Base Opponent Strength**: 1 試合あたり得失点差（スコアだけで計算でき、過去季もボックススコア不要）
2. **Season と Last 10**: `rating = 0.8 x season + 0.2 x last10`（グリッドサーチで最良。Last 10 は少しだけ効く）
3. **0〜100 変換**: Base 単体も同じ式（休養・会場を除いた M）で表示。パーセンタイルや min-max は使わない
4. **Home/Away**: 実測 1.94 点。2019-20 / 2020-21（バブル・観客制限）は学習に使わない（2020-21 は前季値のみ）
5. **Rest Differential**: 両チームの休養区分（0日 = B2B / 1 / 2 / 3日以上）を差のダミーで推定
6. **B2B**: Rest に統合（休養0日）。表示は「B2B」ラベル
7. **Travel**: v2
8. **Time Zone**: v2
9. **Schedule Density**: v2
10. **0〜100 への収め方**: 正規 CDF で自動的に収まる。内訳は Base → Home/Away → Rest の順に足したときの Difficulty
11. **シーズン序盤**: `rating = (n x current + 20 x 0.4 x 前季) / (n + 20)`。今季の重みが前季値と並ぶのは 20 試合目。n < 10 は「サンプル少」（表示 `~72`）
12. **怪我人**: v1 は数字に入れず、主力欠場をラベル表示のみ（内訳に「怪我未反映」）

## 検証（holdout 2025-26、学習に未使用の 1,237 試合）

| 指標 | 値 |
|---|---|
| 勝敗的中 | 68.4% |
| Brier | 0.205（ホームコートのみ 0.247） |
| 点差 RMSE | 14.5 |

Difficulty 帯ごとの予測負け率と実際（両チーム視点、2,474 件）:

| 帯 | 件数 | 予測 | 実際 |
|---|---|---|---|
| 20-29 | 234 | 26% | 24% |
| 30-39 | 371 | 36% | 36% |
| 40-49 | 530 | 45% | 47% |
| 50-59 | 610 | 55% | 53% |
| 60-69 | 454 | 65% | 67% |
| 70-79 | 179 | 74% | 74% |
| 80-89 | 43 | 83% | 77% |

- 相手 10 試合以上（Established）はほぼ一致。サンプル少（相手 10 試合未満）はズレが大きい（例 60-69 帯: 予測 64% / 実際 78%、n = 51）→ v1 では `~` 表示で区別
- 80 以上の帯はやや過大（件数少）

## 表示 tier

全季・両視点の Difficulty 分布から決める（手で決めない）。

- **SOFT**: ≤ 40.6（下位 25%）
- **BALANCED**: その間
- **TOUGH**: ≥ 59.9（上位 25%）

## 計算例: LAL @ DEN（2025-26 終了時の DEN、LAL B2B / DEN 休養2日）

| 段階 | 期待点差 | Difficulty |
|---|---|---|
| Base（DEN レーティング +4.4） | −5.10 | 64 |
| アウェイ | −1.94 | 69 |
| 休養（LAL B2B −2.69 / DEN 休養2日 −0.22） | −2.91 | **76（TOUGH）** |

## 表示場所（実装は後続）

1. **チーム詳細 UPCOMING**（メイン）: 既存 `buildScheduleDifficulty`（相手平均勝率）を置き換え。各行に数字 + 3段階の色（既存 tier 色）、B2B / 主力欠場は薄字ラベル、サマリーのみ英字バッジ「次の10試合 · 平均 61 [TOUGH]」、タップで内訳。Web / Native 同じ
2. **試合カード / マッチアップ予想ツール**: 両チーム視点を並べる
3. **Pro Insight**: 極端な値のときだけ事実候補に追加

## ランタイム（実装済み: チーム詳細 UPCOMING）

- 新コレクションは作らず、`team-game-logs` ingest（日次 `nba-stats-daily-ingest` 内）が `nbaTeamGameLogs/{season}` の各 `upcomingGames[]` 行に `difficulty` を付与（[`upcomingMatchupDifficulty.ts`](../lib/nba/matchupDifficulty/upcomingMatchupDifficulty.ts)）。`/api/nba/team-detail` → Web / Native へそのまま流れる
- 入力は Firestore `games`（今季の得失点差・日程）と `nbaLeagueTeamStats/{前季}` の `diff`。BDL は呼ばない
- 休養日数は米東部の試合日付で数える（実測と同じ基準）。相手の強さは ingest 時点の値（先の試合も同じ）
- サマリー tier は連続 10 試合平均の分布（SOFT ≤ 47.3 / TOUGH ≥ 52.9）、行の色は 1 試合の分布（≤ 40.6 / ≥ 59.9）
- `difficulty` が無い旧スナップショットは従来の相手平均勝率表示にフォールバック
- 係数と tier 境目はシーズン中固定。オフに年 1 回スクリプトを再実行（最新季を学習に追加）
- 未対応: 主力欠場ラベル（相手チームの injury を UPCOMING に渡す配線が必要）、試合カード、Pro Insight

## v2（使われてから）

- Travel / Time Zone / Schedule Density（Rest に上乗せして有意なものだけ）
- 怪我 β 補正（相手の欠場シェア x 実測 β、`nbaPlayerGameLogs`）
- 信頼区間の表示（序盤のズレを幅で見せる）
- 時期別キャリブレーションの詳細
