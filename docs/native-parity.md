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
| auth-login | `app/mobile/login/page.tsx` | `LoginScreenNative.tsx` | done | partial |
| auth-signup | `app/mobile/signup/page.tsx` | `SignupScreenNative.tsx` | done | partial |
| auth-reset | `app/mobile/reset/page.tsx` | `ResetPasswordScreenNative.tsx` | done | partial |
| auth-onboarding | `app/mobile/onboarding/page.tsx` | `OnboardingScreenNative.tsx` | done | partial |
| games-home | `app/mobile/games/page.tsx` → `GamesPage.tsx` | `GamesHomeScreen.tsx` | done | partial |
| games-predict | `app/mobile/games/[id]/predict/page.tsx` | `PredictModal.tsx` | done | partial |
| games-predictions | `app/mobile/games/[id]/predictions/page.tsx` | `GameDetailModal.tsx` | partial | gap |
| result-home | `app/mobile/result/page.tsx` | `ResultHomeScreen.tsx` | done | partial |
| result-detail | `app/mobile/result/[postId]/page.tsx` | `ResultDetailScreen.tsx` | done | partial |
| rankings | `app/mobile/rankings/page.tsx` | `RankingsHomeScreen.tsx` | done | partial |
| leaderboards | `app/mobile/leaderboards/page.tsx` | `LeaderboardsHomeScreen.tsx` | done | partial |
| leaderboards-detail | `app/mobile/communities/[groupId]/page.tsx` | `LeaderboardsHomeScreen`（詳細） | partial | gap |
| profile-settings | `app/mobile/settings/profile/page.tsx` | `ProfileHomeScreen.tsx` | done | partial |
| profile-password | `app/mobile/settings/password/page.tsx` | Profile 設定内 | partial | gap |
| profile-public | `app/mobile/u/[handle]/page.tsx` | Profile タブ | partial | gap |
| badges | `app/mobile/badges/page.tsx` | `MobileBadgesScreen.tsx` | done | partial |
| announcements | `app/mobile/announcements/page.tsx` | `MobileAnnouncementsScreen.tsx` | done | partial |
| announcement-detail | `app/mobile/announcements/[id]/page.tsx` | `AnnouncementDetailScreenNative.tsx` | done | partial |
| pro-subscribe | `app/mobile/pro/subscribe/page.tsx` | `MobileProSubscribeScreen.tsx` | done | partial |
| pro-success | `app/mobile/pro/success/page.tsx` | Pro フロー内 | partial | gap |
| plan-status | `app/mobile/plan-status/page.tsx` | `MobilePlanStatusScreen.tsx` | done | partial |
| plan-change | `app/mobile/plan-change/page.tsx` | `PlanChangeScreenNative` 系 | done | partial |
| plan-change-complete | `app/mobile/plan-change-complete/page.tsx` | `PlanChangeCompleteScreenNative.tsx` | done | partial |
| cancel-plan | `app/mobile/cancel-plan/page.tsx` | `CancelPlanScreenNative.tsx` | done | partial |
| cancel-complete | `app/mobile/cancel-complete/page.tsx` | キャンセル完了 | partial | gap |
| standings | `app/mobile/standings/page.tsx` | `StandingsScreenNative.tsx` | done | partial |
| playoff | `app/mobile/playoff/page.tsx` | `PlayoffBracketPredictNative.tsx` | done | partial |
| playoff-view | `app/mobile/playoff-bracket/view/page.tsx` | `PlayoffBracketViewNative.tsx` | done | partial |
| bracket-market | `app/mobile/bracket-market/page.tsx` | `BracketMarketScreenNative.tsx` | done | partial |
| team-detail | `app/mobile/teams/[teamId]/page.tsx` | `TeamDetailScreenNative` 系 | partial | gap |
| wc-formation | `WcFormationPanel.tsx` | `WcFormationPanelNative.tsx` | done | partial |
| wc-team-profile | `WcTeamProfilePanel.tsx` | `WcTeamProfilePanelNative.tsx` | partial | gap |
| wc-standing | `WcStandingPanel.tsx` | `WcStandingPanelNative.tsx` | done | partial |
| wc-preview | `WcMatchPreviewPanel.tsx` | `WcMatchPreviewPanelNative.tsx` | done | partial |
| wc-goal-scorer | `WcGoalScorerPicker.tsx` | `WcGoalScorerPickerNative.tsx` | done | partial |
| wc-scoring-rules | `predictionScoringRules.tsx` | **なし** | gap | gap |
| legal-terms | `app/mobile/terms/page.tsx` | `LegalScrollScreenNative` | done | partial |
| legal-privacy | `app/mobile/privacy/page.tsx` | 同上 | done | partial |
| legal-electronic | `app/mobile/electronic-notice/page.tsx` | `ElectronicNoticeScreenNative.tsx` | done | partial |
| legal-help | `app/mobile/help/page.tsx` | Legal 系 | done | partial |
| legal-guidelines | `app/mobile/guidelines/page.tsx` | Legal 系 | done | partial |
| legal-community | `app/mobile/community-guidelines/page.tsx` | Legal 系 | done | partial |
| legal-refund | `app/mobile/refund/page.tsx` | **なし** | gap | gap |
| legal-law | `app/mobile/law/page.tsx` | **なし** | gap | gap |
| legal-contact | `app/mobile/contact/page.tsx` | **なし** | gap | gap |
| feature-request | `app/mobile/feature-request/page.tsx` | `FeatureRequestScreenNative.tsx` | done | partial |
| lp | `app/mobile/lp/page.tsx` | skip | skip | skip |
| lp-v2 | `app/mobile/lp-v2/page.tsx` | skip | skip | skip |
| dev-preview | `app/mobile/bg-halftone-preview/page.tsx` | skip | skip | skip |

## WC 予想パネル（PredictModal 内）

| コンポーネント | Web | Native | status | uiStatus |
|---|---|---|---|---|
| チームプロフィール | `WcTeamProfilePanel.tsx` | `WcTeamProfilePanelNative.tsx` | partial | gap |
| フォーメーション | `WcFormationPanel.tsx` | `WcFormationPanelNative.tsx` | done | partial |
| 順位表 | `WcStandingPanel.tsx` | `WcStandingPanelNative.tsx` | done | partial |
| プレビュー | `WcMatchPreviewPanel.tsx` | `WcMatchPreviewPanelNative.tsx` | done | partial |
| 得点者 | `WcGoalScorerPicker.tsx` | `WcGoalScorerPickerNative.tsx` | done | partial |
| 得点ルール | `predictionScoringRules.tsx` | なし | gap | gap |
