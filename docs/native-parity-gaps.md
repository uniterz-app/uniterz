# Native パリティ作業キュー

エージェントは **上から順に** 実行する。ユーザーへの確認は不要。

`phase: functional` の間は機能キューのみ。空になったら `phase: ui-polish` に切替。Phase B 完了後に `partial` / `gap` が残る場合は `phase: phase-c` で Phase C を消化。

---

## 機能キュー（Phase A）

- [x] `wc-formation-panel` P0 | Web: `app/component/predict/wc/WcFormationPanel.tsx` → Native: 新規 `WcFormationPanelNative.tsx`、`PredictModal` に配線
- [x] `wc-team-profile-rich` P0 | Web: `WcTeamProfilePanel.tsx` → Native: `WcTeamProfilePanelNative.tsx` 拡充（key players, formation, club meta, nickname）
- [x] `wc-scoring-rules` P0 | Web: `predictionScoringRules.tsx` → Native: 新規、PredictModal に表示
- [x] `preferred-league-init` P1 | Web: `useUserPreferredLeague` → Native: `GamesHomeScreen` 初期リーグに反映
- [x] `legal-refund-law` P1 | Web: `app/mobile/refund/page.tsx`, `law/page.tsx` → Native: `LegalScrollScreenNative` 系で新規画面
- [x] `legal-contact` P1 | Web: `app/mobile/contact/page.tsx` → Native: 新規または WebView
- [x] `games-predictions-list` P1 | Web: `games/[id]/predictions/page.tsx` → Native: `GameDetailModal` 拡充
- [x] `profile-password-screen` P2 | Web: `settings/password/page.tsx` → Native: 専用画面
- [x] `profile-public-handle` P2 | Web: `u/[handle]/page.tsx` → Native: 公開プロフィール
- [x] `shared-package-migration` P2 | `apps/native/src/shared/` → `packages/shared` へ統合
- [x] `i18n-provider` P2 | Web: `lib/i18n` + `useUserLanguage` → Native: Provider 一元化

---

## UI磨き込みキュー（Phase B — 機能キュー完了後）

- [x] `ui-games-home` | `GamesHomeScreen` vs `GamesPage` — 月ヘッダー、日付ストリップ、カード余白、LIVE ピル
- [x] `ui-predict-modal` | `PredictModal` vs `PredictionFormV2` — HUD タブ、スコア入力、オーバーレイ、motion
- [x] `ui-match-card` | `MatchCard*` 系 vs Web — market bar、entry scan、cyber grid、CTA
- [x] `ui-result-home` | `ResultHomeScreen` vs `ResultCard` — glass shell、バッジ、日付パイプ
- [x] `ui-rankings` | `RankingsHomeScreen` — cyber list、seg bar、WC ステージタブ
- [x] `ui-profile` | `ProfileHomeScreen` — summary cards、チャート、streak tracker
- [x] `ui-wc-panels` | `Wc*Native` 全般 — 国旗サイズ、得点者ピッカー、順位表 typography
- [x] `ui-playoff-bracket` | `PlayoffBracket*` — シリーズカード、スコアインライン
- [x] `ui-glowing-rim` | `GlowingRimFrame` 相当 — Skia で発光近似
- [x] `ui-auth-screens` | Login/Signup/Onboarding — フォーム余白、ボタンスタイル
- [x] `ui-legal-screens` | Legal 系 — スクロール、ヘッダー、リンクスタイル

---

## Phase C キュー（機能 gap + UI partial → done）

- [x] `gap-leaderboards-detail` P0 | Web: `app/mobile/communities/[groupId]/page.tsx` → Native: コミュニティ詳細画面（`LeaderboardsHomeScreen` 詳細モード or 専用画面）
- [x] `gap-team-detail` P0 | Web: `app/mobile/teams/[teamId]/page.tsx` → Native: `TeamDetailScreenNative` 機能・UI 完成
- [x] `gap-pro-success` P1 | Web: `app/mobile/pro/success/page.tsx` → Native: Pro 成功専用画面
- [ ] `gap-cancel-complete` P1 | Web: `app/mobile/cancel-complete/page.tsx` → Native: 解約完了専用画面
- [ ] `ui-games-predictions` | `GamePredictionsScreenNative` + `GameDetailModal` vs Web — partial → done（照合チェックリスト 6項目中5以上）
- [ ] `ui-result-detail` | `ResultDetailScreen` vs Web — partial → done
- [ ] `ui-leaderboards` | `LeaderboardsHomeScreen` vs Web — partial → done
- [ ] `ui-profile-password` | `ProfilePasswordScreenNative` vs Web — partial → done
- [ ] `ui-badges` | `MobileBadgesScreen` vs Web — partial → done
- [ ] `ui-announcements` | `MobileAnnouncementsScreen` vs Web — partial → done
- [ ] `ui-announcement-detail` | `AnnouncementDetailScreenNative` vs Web — partial → done
- [ ] `ui-pro-subscribe` | `MobileProSubscribeScreen` vs Web — partial → done
- [ ] `ui-plan-status` | `MobilePlanStatusScreen` vs Web — partial → done
- [ ] `ui-plan-change` | `PlanChangeScreenNative` 系 vs Web — partial → done
- [ ] `ui-plan-change-complete` | `PlanChangeCompleteScreenNative` vs Web — partial → done
- [ ] `ui-cancel-plan` | `CancelPlanScreenNative` vs Web — partial → done
- [ ] `ui-standings` | `StandingsScreenNative` vs Web — partial → done
- [ ] `ui-bracket-market` | `BracketMarketScreenNative` vs Web — partial → done

---

## キュー運用

- 先頭の `[ ]` を必ず次の作業とする
- 完了 → `[x]` + `docs/native-sync-state.json` 更新
- 新ギャップ発見 → 適切なセクション末尾に追記
- 設計判断が必要 → `blockedItems` に記録してスキップ
