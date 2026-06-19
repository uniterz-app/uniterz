# Native Web 対応マップ（詳細）

## 共有ロジック（`lib/`）

| 領域 | パス |
|---|---|
| WC | `lib/wc/*` |
| Games | `lib/games/*` |
| Predict | `lib/predict/*` |
| Result | `lib/result/*` |
| Rankings | `lib/rankings/*` |
| Time | `lib/time/*` |

Native は `@/` ではなく相対パスで `lib/` を import。

## Games 主要対応

| Web | Native |
|---|---|
| `GamesPage.tsx` | `GamesHomeScreen.tsx` |
| `PredictionFormV2.tsx` | `PredictModal.tsx` |
| `GamesDrawerMenu.tsx` | `GamesDrawerMenuNative.tsx` |
| `MatchCard.tsx` | `GameCardList.tsx` + `MatchCard*` |
| `cyberMotion.ts` | `gamesCyberMotion.ts`, `gamesPageMotion.ts` |

## WC パネル

| Web (`app/component/predict/wc/`) | Native (`apps/native/src/features/games/wc/`) |
|---|---|
| `WcTeamProfilePanel.tsx` | `WcTeamProfilePanelNative.tsx` |
| `WcFormationPanel.tsx` | **未作成** |
| `WcStandingPanel.tsx` | `WcStandingPanelNative.tsx` |
| `WcMatchPreviewPanel.tsx` | `WcMatchPreviewPanelNative.tsx` |
| `WcGoalScorerPicker.tsx` | `WcGoalScorerPickerNative.tsx` |

統合先: `PredictModal.tsx`

## Results WC

| Web | Native |
|---|---|
| `WcMatchGoalScorersBlock` | `WcMatchGoalScorersBlockNative.tsx` |
| `WcGoalScorerResultRow` | `WcGoalScorerResultRowNative.tsx` |
| `WcGroupStandingRankBadge` | `WcGroupStandingRankBadgeNative.tsx` |

## UI 移植の置き換え

| Web | Native |
|---|---|
| Tailwind/CSS | `StyleSheet` + `packages/design-tokens` |
| framer-motion | Reanimated |
| CSS clip-path | Skia |
| `/flags/4x3/*.svg` | flagcdn PNG（`wcFlagImageUri.ts`） |

## API

| 操作 | Native |
|---|---|
| 予想 CRUD | `submitPredictionApi.ts` → `/api/posts_v2` |
| プロフィール統計 | `profileApi.ts` |
| IAP 検証 | `useNativeIap.ts` |

## i18n

- Web: `messages/` + `lib/i18n/t`
- Native Games: `gamesI18n.ts`（手動同期）
- Native Rankings: `rankingsTexts.ts`

## 除外（移植しない）

`app/admin/*`, `app/lp*`, `app/web/*`（dense=false）, Three.js, SSR
