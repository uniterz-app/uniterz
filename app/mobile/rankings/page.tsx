"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  METRICS,
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { motion, AnimatePresence } from "framer-motion";
import RankingCard from "@/app/component/rankings/RankingCard";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TopPodium from "@/app/component/rankings/TopPodium";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import RankingsDrawerMenu from "@/app/component/rankings/RankingsDrawerMenu";
import PlayoffRoundTabs from "@/app/component/rankings/PlayoffRoundTabs";
import WcRankingStageTabs from "@/app/component/rankings/WcRankingStageTabs";
import RankingsCategoryTabs, {
  type RankingsCategory,
} from "@/app/component/rankings/RankingsCategoryTabs";
import Header from "@/app/component/Header";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/useRanking";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { isPlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { t } from "@/lib/i18n/t";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import RankingsScheduleNotice from "@/app/component/rankings/RankingsScheduleNotice";
import { useSearchParams } from "next/navigation";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_ROUND_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
  isMobileMetricParam,
} from "@/lib/navigation/rankingsProfileFrom";
import BracketLeaderboardSection from "@/app/component/leaderboards/BracketLeaderboardSection";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { Menu } from "lucide-react";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";

export default function MobileRankingsPage() {
  const searchParams = useSearchParams();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("nba");
  const phase: RankingPhase = "playoffs";
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [wcStage, setWcStage] = useState<WcRankingStage>("overall");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const season = useMemo(() => getCurrentPlayoffSeason(), []);
  const effectiveRound: PlayoffRoundKey =
    rankingLeague === "worldcup" ? "overall" : round;
  const wcStageForHook: WcRankingStage | null =
    category === "playoffs" && rankingLeague === "worldcup"
      ? wcStage
      : null;

  const visibleMetrics: MobileMetric[] = [
    "totalScore",
    "winRate",
    "marginPrecision",
    "upsetScore",
    "streak",
  ];

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_X_THRESHOLD_PX = 42;
  const SWIPE_Y_TOLERANCE_PX = 24;

  const moveMetricBy = useCallback(
    (delta: number) => {
      if (visibleMetrics.length <= 1) return;
      const currentIndex = visibleMetrics.indexOf(metric);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        (safeIndex + delta + visibleMetrics.length) % visibleMetrics.length;
      setMetric(visibleMetrics[nextIndex]);
    },
    [metric, visibleMetrics]
  );

  const handleCardsTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const t = e.touches[0];
      if (!t) return;
      swipeStartRef.current = { x: t.clientX, y: t.clientY };
    },
    []
  );

  const handleCardsTouchEnd = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < SWIPE_X_THRESHOLD_PX) return;
      if (Math.abs(dy) > SWIPE_Y_TOLERANCE_PX && Math.abs(dy) > Math.abs(dx))
        return;
      if (dx < 0) {
        moveMetricBy(1);
        return;
      }
      moveMetricBy(-1);
    },
    [moveMetricBy]
  );

  /** プロフィールの「ランキングに戻る」で付いた rankPhase / rankMetric / rankRound を反映 */
  useLayoutEffect(() => {
    const m = searchParams.get(RANKINGS_TAB_METRIC_PARAM);
    if (isMobileMetricParam(m)) setMetric(m);
    const r = searchParams.get(RANKINGS_TAB_ROUND_PARAM);
    if (isPlayoffRoundKey(r)) setRound(r);
    const league = searchParams.get(RANKINGS_TAB_LEAGUE_PARAM);
    if (isRankingLeagueSource(league)) {
      setRankingLeague(league);
      if (league === "worldcup") setCategory("playoffs");
    }
    const stage = searchParams.get(RANKINGS_TAB_WC_STAGE_PARAM);
    if (isWcRankingStage(stage)) setWcStage(stage);
  }, [searchParams]);

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  const metricItems = useMemo(
    () => METRICS.filter((m) => visibleMetrics.includes(m.key)),
    [visibleMetrics]
  );

  const { listReady, personalPending, myUid, byMetric, ensureMetric } =
    useCumulativeRankingsBulk(phase, effectiveRound, wcStageForHook);

  const { user } = useMyRankingUser(myUid);
  const { language, countryCode } = useUserLanguage(myUid);
  const m = t(language);
  const langUi = language === "en" ? "en" : "ja";

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];
  useEffect(() => {
    void ensureMetric(apiKey);
  }, [apiKey, ensureMetric]);
  const rawRows = useMemo(
    () =>
      Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : [],
    [bundle?.rows]
  );

  const myRank = bundle?.myRank ?? null;
  const myRankDeltaPlaces = bundle?.myRankDeltaPlaces ?? null;
  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count)
      ? bundle.count
      : 0;

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return toMobileRows(metric, rawRows);
  }, [metric, rawRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;

    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    if (metric === "winRate") {
      const raw = myRawRow.winRate ?? 0;
      return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    }
    return myRawRow.activeWinStreak ?? 0;
  }, [metric, myRawRow]);
  const winRateMinPosts =
    rankingLeague === "worldcup"
      ? 1
      : phase === "playoffs" && (round === "overall" || round === "r1")
        ? 20
        : 1;

  const rankingHasNoEntries =
    listReady &&
    (rows.length === 0 ||
      (rankingLeague === "worldcup" && rankingListCount === 0));

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);

  const pageKey =
    rankingLeague === "worldcup"
      ? `${phase}-${effectiveRound}-${wcStage}-${metric}`
      : `${phase}-${effectiveRound}-${metric}`;
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  useEffect(() => {
    setTopDone(false);
  }, [pageKey]);

  const handleTopCountDone = useCallback(() => {
    if (pageKeyRef.current !== pageKey) return;
    setTopDone(true);
  }, [pageKey]);

  return (
    <div className="relative h-dvh overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0">
        <CyberPageBackground />
      </div>

      <div className="relative z-10 h-full overflow-y-auto overscroll-y-contain pb-bottom-nav">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        <div className="space-y-3 px-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRankingsDrawerOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition-colors hover:border-cyan-300/35 hover:bg-white/10 hover:text-white"
              aria-label={m.games.openMenu}
            >
              <Menu className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <span
              className={[
                nameBebas.className,
                "min-w-0 flex-1 text-center text-[14px] tracking-[0.26em] text-white/90",
              ].join(" ")}
            >
              {rankingLeague === "worldcup" ? "WORLD CUP" : "RANKINGS"}
            </span>
            <RankingsScheduleNotice
              phase={phase}
              language={language}
              countryCode={countryCode}
              compact
            />
          </div>

          <div className="space-y-0.5">
            {rankingLeague === "nba" ? (
              <RankingsCategoryTabs
                category={category}
                onChange={setCategory}
              />
            ) : null}

            {rankingLeague === "nba" && category === "playoffs" ? (
              <PlayoffRoundTabs
                round={round}
                onChange={setRound}
                isMobile
                language={language}
              />
            ) : null}

            {rankingLeague === "worldcup" ? (
              <WcRankingStageTabs
                stage={wcStage}
                onChange={setWcStage}
                isMobile
                language={language}
              />
            ) : null}

            {category === "playoffs" ? (
              <MyRankCard
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={user.displayName || "You"}
                photoURL={user.photoURL || null}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number"
                    ? myRawRow.totalPosts
                    : undefined
                }
                loading={!listReady}
                statsScramble={listReady && personalPending}
                language={language}
                isPro={user.plan === "pro"}
                mobileWide
                rankDeltaPlaces={
                  rankingHasNoEntries ? null : myRankDeltaPlaces
                }
              />
            ) : null}
          </div>

          {category === "playoffs" ? (
            <>
              <RankingsMetricRow
                metrics={metricItems}
                metric={metric}
                setMetric={setMetric}
                language={language}
                compactMobile
              />
              {metric === "winRate" && (
                <p className="px-1 text-[11px] leading-4 text-white/60">
                  {winRateMinPosts > 1
                    ? language === "en"
                      ? `Win Rate ranking requires at least ${winRateMinPosts} posts.`
                      : `勝率ランキングは${winRateMinPosts}投稿以上が対象です。`
                    : language === "en"
                      ? "No minimum posts requirement for this round."
                      : "このラウンドは投稿数の足切りはありません。"}
                </p>
              )}
            </>
          ) : null}
        </div>

        {category === "playoffs" && !listReady && (
          <div className="px-3 pt-2 text-[11px] text-white/40">
            loading...
          </div>
        )}

        {category === "bracket" ? (
          <div className="px-2 pb-bottom-nav pt-2">
            <BracketLeaderboardSection season={season} />
          </div>
        ) : rankingHasNoEntries ? (
          <div
            role="status"
            className="flex min-h-[min(62dvh,520px)] items-center justify-center px-4 text-center"
          >
            <p
              className={[
                nameBebas.className,
                "text-[clamp(1.75rem,10vw,2.7rem)] leading-none tracking-[0.22em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : listReady ? (
          <div onTouchStart={handleCardsTouchStart} onTouchEnd={handleCardsTouchEnd}>
            <AnimatePresence mode="wait">
              <motion.div key={pageKey} className="relative">
              <div className="relative z-10">
                <TopPodium
                  rows={top3}
                  metric={metric}
                  rankPhase={phase}
                  playoffRound={effectiveRound}
                  rankingLeague={rankingLeague}
                  wcStage={rankingLeague === "worldcup" ? wcStage : undefined}
                  onTopCountDone={handleTopCountDone}
                  intro={intro}
                  language={language}
                />
                <div className="h-[2px]" />
              </div>

              <motion.div
                key={`rest-${pageKey}`}
                className="px-2 pt-4"
                variants={restContainer}
                initial="hidden"
                animate={topDone ? "show" : "hidden"}
                style={{ pointerEvents: topDone ? "auto" : "none" }}
              >
                {restRows.length > 0 && (
                  <div className="space-y-2 pt-0.5">
                    {restRows.map((r, i) => (
                      <motion.div
                        key={`${metric}-${r.uid}`}
                        variants={restItem}
                        custom={i}
                      >
                        <RankingCard
                          row={r}
                          rank={i + 4}
                          metric={metric}
                          rankPhase={phase}
                          playoffRound={effectiveRound}
                          rankingLeague={rankingLeague}
                          wcStage={rankingLeague === "worldcup" ? wcStage : undefined}
                          language={language}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      <SideMenuDrawer
        open={rankingsDrawerOpen}
        onClose={() => setRankingsDrawerOpen(false)}
        variant="mobile"
      >
        <RankingsDrawerMenu
          variant="mobile"
          language={langUi}
          rankingLeague={rankingLeague}
          onSelectNbaPlayoffs={() => {
            setRankingLeague("nba");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
          onSelectWorldCup={() => {
            setRankingLeague("worldcup");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
        />
      </SideMenuDrawer>
    </div>
  );
}