---
target: rankings
total_score: 23
p0_count: 2
p1_count: 3
timestamp: 2026-06-10T03-26-31Z
slug: app-mobile-rankings-page-tsx
---
# Critique — Rankings (app/mobile/rankings + app/web/rankings + app/component/rankings)

Source-only review (no browser). Total: 23/40.

## Heuristic Scores
| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of system status | 2 |
| 2 | Match system/real world | 3 |
| 3 | User control & freedom | 2 |
| 4 | Consistency & standards | 2 |
| 5 | Error prevention | 2 |
| 6 | Recognition over recall | 3 |
| 7 | Flexibility & efficiency | 3 |
| 8 | Aesthetic & minimalist | 1 |
| 9 | Error recovery | 2 |
| 10 | Help & documentation | 3 |
| **Total** | | **23/40** |

## Anti-Patterns
LLM: assembled from HUD tropes — corner frames, bg-clip-text medal gradients, backdrop-blur metric pills, cyan glow stacks, grid overlay on every card, crown on #1. Product-specific logic saves it from generic slop.
Deterministic scan: 0 hits.

## Priority Issues (P0s VERIFIED in source by parent agent)
- [P0] goalScorerHits broken in TopPodium: ScoreText handles pts/streak/winRate then `return null` (TopPodium.tsx:378) → top-3 show BLANK scores on WC 得点者的中 tab. Fix: add goalScorerHits branch (integer + posts subline).
- [P0] goalScorerHits mislabeled in RankingCard: ValueText default branch appends "pts" with 1 decimal (RankingCard.tsx:268-299) → ranks 4+ show "3.0 pts". Fix: dedicated branch like MyRankCard.tsx:42-44 (Math.round, no pts).
- [P1] Tab dimension overload (WC): stage row (3) + MyRankCard + metric row (6) ≈ 10 controls before data. Fix: collapse or bottom-sheet metric picker, ≤4 visible.
- [P1] Touch targets below spec: PlayoffRoundTabs h-6 (24px), menu h-8 w-8, WcRankingStageTabs h-7. Fix: 44×44 min.
- [P1] No tablist semantics on any tab row (no role/aria-selected/aria-live). 
- [P2] Hardcoded English: "Playoffs"/"Bracket"/"WORLD CUP"/"RANKINGS"/"YOUR RANK"/"loading...".
- [P2] Decorative stack per list row (grid overlay + corner frame + flag fade + skew gloss) vs principle "structure stays calm". Keep chrome on podium only.
- [P3] RTL risk: fixed right-0 flag bg, -translate-x nudges, rotateY 3D metric buttons.

## Cognitive Load
6/8 failures. Worst: PlayoffRoundTabs 5 options grid-cols-5 h-6; WC web metric row 6 buttons.

## Personas
Casey: league only in drawer; goalScorerHits last of 6 (~5 swipes); center metric pill tap advances metric accidentally; top-3 blank on new tab; topDone gate delays list taps; 32px hamburger.
Sam: plain buttons not tabs; RankDeltaBadge aria EN-only; text-white/40 meta; profile links lack context labels; loading not announced; RTL breakage.

## Minor
goalScorerHits i18n falls back to EN in 7 locales; duplicate swipe handlers (metric row + list) both change metric; RankDeltaBadge hides delta=0; anim.ts stagger ignores reduced motion.

## Questions
1. Is goalScorerHits a primary metric or niche tiebreaker — does it deserve a 6th carousel slot?
2. Should NBA vs WC be a visible segmented control instead of drawer-only?
3. Does TopPodium earn ~200px of mobile chrome duplicating RankingCard?
