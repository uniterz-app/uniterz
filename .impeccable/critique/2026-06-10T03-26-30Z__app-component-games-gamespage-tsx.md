---
target: games page
total_score: 24
p0_count: 2
p1_count: 2
timestamp: 2026-06-10T03-26-30Z
slug: app-component-games-gamespage-tsx
---
# Critique — Games Page (app/component/games/GamesPage.tsx + web/mobile routes)

Source-only review (no browser). Total: 24/40.

## Heuristic Scores
| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of system status | 3 |
| 2 | Match system/real world | 3 |
| 3 | User control & freedom | 2 |
| 4 | Consistency & standards | 2 |
| 5 | Error prevention | 2 |
| 6 | Recognition over recall | 2 |
| 7 | Flexibility & efficiency | 3 |
| 8 | Aesthetic & minimalist | 2 |
| 9 | Error recovery | 2 |
| 10 | Help & documentation | 2 |
| **Total** | | **24/40** |

## Anti-Patterns
LLM: moderate AI-slop risk — glass cards (backdrop-blur-xl) + cyan neon everywhere + tiny uppercase tracked micro-labels + stagger motion on every layer. Domain craft (jersey dot reveal, playoff rows, URL-synced filters) saves it. No border-l-4 / gradient-text found.
Deterministic scan: 1 hit — CountryFlag.tsx:37 broken-image = FALSE POSITIVE (comment text, real img has src).

## Priority Issues
- [P0] Silent empty schedule: ScheduleList.tsx ~593-601 returns null when no games & no filter hint; m.games.noGames exists but unused on web. Fix: render empty panel + next-game-day CTA.
- [P0] Logged-out card tap no-ops: MatchCard.tsx ~627-628 `if (!me) return;` while CTA styling still shows. Fix: route to login like handleMakePrediction ~742.
- [P1] Mobile header touch targets below 44pt + absolute-overlay collision with title (GamesPage.tsx ~943-981, filter min-h-7).
- [P1] League switching buried in hamburger drawer; LeagueTabs.tsx exists but unused. WC "!" badge lacks accessible name.
- [P2] Muted copy text-white/38–55 likely below 4.5:1 on #081116.
- [P2] English leakage: HOME / Bracket / VS / LIVE hardcoded.
- [P3] Redundant bottom predict CTA strip when full-card hit layer is active.
- [P3] Auto-advance off today when all games final (~656-664) disorients.

## Cognitive Load
5-6/8 failures. Worst decision point: DayStrip (6-10 visible dates + scroll-snap reselect).

## Personas
Casey: filter trigger min-h-7 top-right unreachable; menu 40px; snap-scroll can change date; league switch 3 steps; double-tap-month undiscoverable; logged-out tap silent.
Alex: no visible league tabs; filters hidden behind icon; 900ms intro on every league change; no keyboard day nav; no bulk view.

## Minor
dense px-0 vs skeleton px-4 jump; PL line color #a855f7 (purple anti-ref); tracking-[0.28em] hurts long titles; CountryFlag fallback lacks SR label.

## Questions
1. Why is league switching in a hamburger when LeagueTabs.tsx exists?
2. Is the 900ms arena intro worth it 10×/night? First-visit-only?
3. Should "today" ever auto-leave without consent?
