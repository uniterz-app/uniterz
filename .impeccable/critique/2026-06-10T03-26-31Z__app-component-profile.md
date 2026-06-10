---
target: profile
total_score: 24
p0_count: 2
p1_count: 2
timestamp: 2026-06-10T03-26-31Z
slug: app-component-profile
---
# Critique — Profile (app/component/profile)

Source-only review (no browser). Total: 24/40.

## Heuristic Scores
| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of system status | 2 |
| 2 | Match system/real world | 2 |
| 3 | User control & freedom | 3 |
| 4 | Consistency & standards | 3 |
| 5 | Error prevention | 2 |
| 6 | Recognition over recall | 2 |
| 7 | Flexibility & efficiency | 3 |
| 8 | Aesthetic & minimalist | 2 |
| 9 | Error recovery | 2 |
| 10 | Help & documentation | 3 |
| **Total** | | **24/40** |

## Anti-Patterns
LLM: moderate — every section repeats bg-[#050814]/80 + grid overlay + cyan edge glow; 6 identical hero-metric cards; uniform neon NO DATA; glassmorphism in shells/sheets; ProfileEditSheet save CTA cyan→fuchsia→violet gradient (direct PRODUCT.md anti-reference). Handle-scramble hero feels authored.
Deterministic scan: 1 hit — ProfileNbaPredictionMap.tsx:537 layout-transition = FALSE POSITIVE (SVG stroke-width, not width). Note: this component is built (~1400 lines) but NOT mounted anywhere.

## Priority Issues
- [P0] No first-prediction empty state for new users: 6 zero stat cards + triple neon NO DATA on one scroll reads broken. Fix: hero-band empty state + "Make your first pick" CTA; collapse charts until posts > 0.
- [P0] Overview cognitive overload: 6 equal-weight stat cards (SummaryCardsV2 2×3) violate "numbers are the hero". Fix: 1 headline metric (total points + rank) + 2×2 secondary.
- [P1] Incomplete prefers-reduced-motion: chart bar entrance CSS lacks media query; entrancePhase ignores reduceMotion; ProfilePlayoffRankTrendChart has no useReducedMotion; bracket blur reveal ungated.
- [P1] Tabs hardcoded EN ("Overview"/"Pro Stats"/"Bracket"); league switch is bare ◀/▶ with duplicate aria-labels, current league unlabeled.
- [P2] ProfileEditSheet save button purple gradient (from-cyan-500 via-fuchsia-500 to-violet-600) — anti-reference. Fix: solid cyan.
- [P3] ProfileNbaPredictionMap orphaned — integrate with progressive disclosure or remove.

## Cognitive Load
5/8 failures. Worst: SummaryCardsV2 6-card grid, no primary/secondary split.

## Personas
Casey: edit path menu(36px)→drawer→settings→sheet too deep; handle scramble looks glitchy mid-conversation; ~4 sections scroll before recent results; league invisible without tapping; no share affordance.
Jordan: six zero cards unexplained; triple NO DATA feels broken; "Pro Stats" tab implies paywall pre-first-pick; empty badge band min-h-14 dead space; root loading is unstyled text.

## Minor
ProfilePageBaseV2 loading/not-found bypass design system; labels text-[11px] white/85 AA risk; badges slice(0,10) no overflow count; zero RTL handling; ProfileEditSheet subtitle inline ja/en; animate-pulse lacks motion-reduce; MobileProfileHeaderV2 possible dead code.

## Questions
1. If numbers are the hero, why does identity animate before any stat is readable?
2. Is Overview one page or three? Would Casey reach the bottom?
3. Why is the most engineered widget (prediction map) not shipped?
