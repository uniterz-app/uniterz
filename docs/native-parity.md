# Native ↔ Mobile Web パリティ台帳

最終更新: 2026-06-19

## 完了定義

- **機能:** 全ルートが `status: done` または `native-only` / `skip`
- **UI:** 全画面が `uiStatus: done` または `partial`（7〜8割到達）
- **キュー:** `docs/native-parity-gaps.md` の機能・UI 両セクションが空
- **型:** `npm run native:typecheck` 通過

`partial` = 自動判定で 7〜8割。残り 2〜3割は手動仕上げ対象。

## UI 照合チェックリスト（6項目中5以上で done）

1. design-tokens の色・余白・fontSize が Web Tailwind と ±2px 以内
2. 主要テキストの行数・省略が同じ
3. 角丸・border が同系
4. motion duration/easing がコピー済み
5. Cyber 装飾（方眼・LIVE ピル・スラントタブ）が存在
6. アイコン・フラグ・ロゴのサイズ比が同程度

---

## 画面マップ

| ID | Mobile Web | Native | status | uiStatus |
|---|---|---|---|---|
| auth-login | `app/mobile/login/page.tsx` | `LoginScreenNative.tsx` | done | done |
| auth-signup | `app/mobile/signup/page.tsx` | `SignupScreenNative.tsx` | done | done |
| auth-reset | `app/mobile/reset/page.tsx` | `ResetPasswordScreenNative.tsx` | done | done |
| auth-onboarding | `app/mobile/onboarding/page.tsx` | `OnboardingScreenNative.tsx` | done | done |
| games-home | `app/mobile/games/page.tsx` → `GamesPage.tsx` | `GamesHomeScreen.tsx` | done | done |
| games-predict | `app/mobile/games/[id]/predict/page.tsx` | `PredictModal.tsx` | done | done |
| match-card | `MatchCard*` | `GameCardList` + `MatchCardListCtaNative` | done | done |
| games-predictions | `app/mobile/games/[id]/predictions/page.tsx` | `GamePredictionsScreenNative.tsx` + `GameDetailModal` | done | done |
| result-home | `app/mobile/result/page.tsx` | `ResultHomeScreen.tsx` | done | done |
| result-detail | `app/mobile/result/[postId]/page.tsx` | `ResultDetailScreen.tsx` | done | done |
| rankings | `app/mobile/rankings/page.tsx` | `RankingsHomeScreen.tsx` | done | done |
| leaderboards | `app/mobile/leaderboards/page.tsx` | `LeaderboardsHomeScreen.tsx` | done | done |
| leaderboards-detail | `app/mobile/communities/[groupId]/page.tsx` | `CommunityDetailScreenNative.tsx` | done | done |
| profile-settings | `app/mobile/settings/profile/page.tsx` | `ProfileHomeScreen.tsx` | done | done |
| profile-password | `app/mobile/settings/password/page.tsx` | `ProfilePasswordScreenNative.tsx` | done | done |
| profile-public | `app/mobile/u/[handle]/page.tsx` | `PublicProfileScreenNative.tsx` | done | done |
| badges | `app/mobile/badges/page.tsx` | `MobileBadgesScreen.tsx` | done | done |
| announcements | `app/mobile/announcements/page.tsx` | `MobileAnnouncementsScreen.tsx` | done | done |
| announcement-detail | `app/mobile/announcements/[id]/page.tsx` | `AnnouncementDetailScreenNative.tsx` | done | done |
| pro-subscribe | `app/mobile/pro/subscribe/page.tsx` | `MobileProSubscribeScreen.tsx` | done | done |
| pro-success | `app/mobile/pro/success/page.tsx` | `ProSuccessScreenNative.tsx` | done | done |
| plan-status | `app/mobile/plan-status/page.tsx` | `MobilePlanStatusScreen.tsx` | done | done |
| plan-change | `app/mobile/plan-change/page.tsx` | `PlanChangeScreenNative` 系 | done | partial |
| plan-change-complete | `app/mobile/plan-change-complete/page.tsx` | `PlanChangeCompleteScreenNative.tsx` | done | partial |
| cancel-plan | `app/mobile/cancel-plan/page.tsx` | `CancelPlanScreenNative.tsx` | done | partial |
| cancel-complete | `app/mobile/cancel-complete/page.tsx` | `CancelCompleteScreenNative.tsx` | done | done |
| standings | `app/mobile/standings/page.tsx` | `StandingsScreenNative.tsx` | done | partial |
| playoff | `app/mobile/playoff/page.tsx` | `PlayoffBracketPredictNative.tsx` | done | done |
| playoff-view | `app/mobile/playoff-bracket/view/page.tsx` | `PlayoffBracketViewNative.tsx` | done | done |
| bracket-market | `app/mobile/bracket-market/page.tsx` | `BracketMarketScreenNative.tsx` | done | partial |
| team-detail | `app/mobile/teams/[teamId]/page.tsx` | `TeamDetailScreenNative.tsx` | done | done |
| wc-formation | `WcFormationPanel.tsx` | `WcFormationPanelNative.tsx` | done | done |
| wc-team-profile | `WcTeamProfilePanel.tsx` | `WcTeamProfilePanelNative.tsx` | done | done |
| wc-standing | `WcStandingPanel.tsx` | `WcStandingPanelNative.tsx` | done | done |
| wc-preview | `WcMatchPreviewPanel.tsx` | `WcMatchPreviewPanelNative.tsx` | done | done |
| wc-goal-scorer | `WcGoalScorerPicker.tsx` | `WcGoalScorerPickerNative.tsx` | done | done |
| wc-scoring-rules | `predictionScoringRules.tsx` | `WcScoringRulesNative.tsx` | done | done |
| legal-terms | `app/mobile/terms/page.tsx` | `LegalScrollScreenNative` | done | done |
| legal-privacy | `app/mobile/privacy/page.tsx` | 同上 | done | done |
| legal-electronic | `app/mobile/electronic-notice/page.tsx` | `ElectronicNoticeScreenNative.tsx` | done | done |
| legal-help | `app/mobile/help/page.tsx` | Legal 系 | done | done |
| legal-guidelines | `app/mobile/guidelines/page.tsx` | Legal 系 | done | done |
| legal-community | `app/mobile/community-guidelines/page.tsx` | Legal 系 | done | done |
| legal-refund | `app/mobile/refund/page.tsx` | `RefundPolicyScreenNative.tsx` | done | done |
| legal-law | `app/mobile/law/page.tsx` | `CommercialLawScreenNative.tsx` | done | done |
| legal-contact | `app/mobile/contact/page.tsx` | `ContactScreenNative.tsx` | done | done |
| feature-request | `app/mobile/feature-request/page.tsx` | `FeatureRequestScreenNative.tsx` | done | done |
| glowing-rim-frame | `GlowingRimFrame` 相当 | `GlowingRimFrame.tsx` | done | done |
| lp | `app/mobile/lp/page.tsx` | skip | skip | skip |
| lp-v2 | `app/mobile/lp-v2/page.tsx` | skip | skip | skip |
| dev-preview | `app/mobile/bg-halftone-preview/page.tsx` | skip | skip | skip |

## WC 予想パネル（PredictModal 内）

| コンポーネント | Web | Native | status | uiStatus |
|---|---|---|---|---|
| チームプロフィール | `WcTeamProfilePanel.tsx` | `WcTeamProfilePanelNative.tsx` | done | done |
| フォーメーション | `WcFormationPanel.tsx` | `WcFormationPanelNative.tsx` | done | done |
| 順位表 | `WcStandingPanel.tsx` | `WcStandingPanelNative.tsx` | done | done |
| プレビュー | `WcMatchPreviewPanel.tsx` | `WcMatchPreviewPanelNative.tsx` | done | done |
| 得点者 | `WcGoalScorerPicker.tsx` | `WcGoalScorerPickerNative.tsx` | done | done |
| 得点ルール | `predictionScoringRules.tsx` | `WcScoringRulesNative.tsx` | done | done |
