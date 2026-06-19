# Native パリティ作業キュー

エージェントは **上から順に** 実行する。ユーザーへの確認は不要。

`phase: functional` の間は機能キューのみ。空になったら `phase: ui-polish` に切替。

---

## 機能キュー（Phase A）

- [ ] `wc-formation-panel` P0 | Web: `app/component/predict/wc/WcFormationPanel.tsx` → Native: 新規 `WcFormationPanelNative.tsx`、`PredictModal` に配線
- [ ] `wc-team-profile-rich` P0 | Web: `WcTeamProfilePanel.tsx` → Native: `WcTeamProfilePanelNative.tsx` 拡充（key players, formation, club meta, nickname）
- [ ] `wc-scoring-rules` P0 | Web: `predictionScoringRules.tsx` → Native: 新規、PredictModal に表示
- [ ] `preferred-league-init` P1 | Web: `useUserPreferredLeague` → Native: `GamesHomeScreen` 初期リーグに反映
- [ ] `legal-refund-law` P1 | Web: `app/mobile/refund/page.tsx`, `law/page.tsx` → Native: `LegalScrollScreenNative` 系で新規画面
- [ ] `legal-contact` P1 | Web: `app/mobile/contact/page.tsx` → Native: 新規または WebView
- [ ] `games-predictions-list` P1 | Web: `games/[id]/predictions/page.tsx` → Native: `GameDetailModal` 拡充
- [ ] `profile-password-screen` P2 | Web: `settings/password/page.tsx` → Native: 専用画面
- [ ] `profile-public-handle` P2 | Web: `u/[handle]/page.tsx` → Native: 公開プロフィール
- [ ] `shared-package-migration` P2 | `apps/native/src/shared/` → `packages/shared` へ統合
- [ ] `i18n-provider` P2 | Web: `lib/i18n` + `useUserLanguage` → Native: Provider 一元化

---

## UI磨き込みキュー（Phase B — 機能キュー完了後）

- [ ] `ui-games-home` | `GamesHomeScreen` vs `GamesPage` — 月ヘッダー、日付ストリップ、カード余白、LIVE ピル
- [ ] `ui-predict-modal` | `PredictModal` vs `PredictionFormV2` — HUD タブ、スコア入力、オーバーレイ、motion
- [ ] `ui-match-card` | `MatchCard*` 系 vs Web — market bar、entry scan、cyber grid、CTA
- [ ] `ui-result-home` | `ResultHomeScreen` vs `ResultCard` — glass shell、バッジ、日付パイプ
- [ ] `ui-rankings` | `RankingsHomeScreen` — cyber list、seg bar、WC ステージタブ
- [ ] `ui-profile` | `ProfileHomeScreen` — summary cards、チャート、streak tracker
- [ ] `ui-wc-panels` | `Wc*Native` 全般 — 国旗サイズ、得点者ピッカー、順位表 typography
- [ ] `ui-playoff-bracket` | `PlayoffBracket*` — シリーズカード、スコアインライン
- [ ] `ui-glowing-rim` | `GlowingRimFrame` 相当 — Skia で発光近似
- [ ] `ui-auth-screens` | Login/Signup/Onboarding — フォーム余白、ボタンスタイル
- [ ] `ui-legal-screens` | Legal 系 — スクロール、ヘッダー、リンクスタイル

---

## キュー運用

- 先頭の `[ ]` を必ず次の作業とする
- 完了 → `[x]` + `docs/native-sync-state.json` 更新
- 新ギャップ発見 → 適切なセクション末尾に追記
- 設計判断が必要 → `blockedItems` に記録してスキップ
