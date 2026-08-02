"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import RankingsDrawerMenu from "@/app/component/rankings/RankingsDrawerMenu";
import WcRankingStageTabs from "@/app/component/rankings/WcRankingStageTabs";
import RankingsCategoryTabs from "@/app/component/rankings/RankingsCategoryTabs";
import RankingsPeriodTabs from "@/app/component/rankings/RankingsPeriodTabs";
import RankingsPeriodLabelNav from "@/app/component/rankings/RankingsPeriodLabelNav";
import RankingsOpenProLock from "@/app/component/rankings/RankingsOpenProLock";
import PlayoffRoundTabs from "@/app/component/rankings/PlayoffRoundTabs";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
import Header from "@/app/component/Header";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
import { useWebRankings } from "../_lib/useWebRankings";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import {
  divisionFromNbaBoard,
  type NbaRankingBoard,
} from "@/lib/rankings/rankingDivision";
import {
  isRankingPeriod,
  periodWinRateMinPosts,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
  RANKINGS_TAB_CATEGORY_PARAM,
  RANKINGS_TAB_PERIOD_PARAM,
  WEB_RANKINGS_SCROLL_KEY,
  isMobileMetricParam,
  isRankingsCategoryParam,
} from "@/lib/navigation/rankingsProfileFrom";
import { t } from "@/lib/i18n/t";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import RankingsScheduleNotice from "@/app/component/rankings/RankingsScheduleNotice";
import WcBracketLeaderboardSection from "@/app/component/leaderboards/WcBracketLeaderboardSection";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { useWcBracketSubmitted } from "@/lib/wc/useWcBracketSubmitted";
import type { RankingsCategory } from "@/app/component/rankings/RankingsCategoryTabs";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import { PRO_LEAGUE_TAB_THEME } from "@/lib/rankings/proLeagueAtmosphere";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useApplyPreferredRankingLeague } from "@/lib/hooks/useApplyPreferredRankingLeague";
import { buildMyRankMiniMetrics } from "@/lib/rankings/buildMyRankMiniMetrics";
import type { RankingRow } from "@/lib/rankings/cumulativeRankingRow";
import {
  buildRankingsPageKey,
  computeRankingHasNoEntries,
  computeRankingListContentReady,
  computeWinRateMinPosts,
  getMyMetricValue,
} from "@/lib/rankings/rankingsPageShared";
import { useRankingsTopDone } from "@/lib/hooks/useRankingsTopDone";
import type { RankingApiRow } from "@/lib/rankings/rankingTransform";
import { buildRankTierGapHint } from "@/lib/rankings/rankTierMilestone";
import { useMyRankProgress } from "@/lib/rankings/useMyRankProgress";

export default function WebRankingsShell() {
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("worldcup");
  const phase: RankingPhase = "playoffs";
  const [wcStage, setWcStage] = useState<WcRankingStage>("main");
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("season");
  /** NBA: レギュラー / プレーオフ / PRO LEAGUE */
  const [nbaBoard, setNbaBoard] = useState<NbaRankingBoard>("regular");
  const rankingDivision = divisionFromNbaBoard(nbaBoard);
  /** 過去期間ラベル（null = 現在期間） */
  const [periodLabel, setPeriodLabel] = useState<string | null>(null);
  /** NBA Playoffs ラウンド（Regular / PRO LEAGUE では overall 固定） */
  const [playoffRound, setPlayoffRound] = useState<PlayoffRoundKey>("overall");
  const effectiveRound: PlayoffRoundKey =
    rankingLeague === "nba" && nbaBoard === "playoffs"
      ? playoffRound
      : "overall";
  /** NBA は Bracket カテゴリ廃止 — 常に playoffs（=ランキング本体） */
  const effectiveCategory: RankingsCategory =
    rankingLeague === "nba" ? "playoffs" : category;
  const wcStageForHook: WcRankingStage | null =
    effectiveCategory === "playoffs" && rankingLeague === "worldcup"
      ? wcStage
      : null;
  const usePeriodBoard =
    rankingLeague === "nba" &&
    (nbaBoard === "regular" || nbaBoard === "open") &&
    rankingPeriod !== "season";
  const useOpenSeasonBoard =
    rankingLeague === "nba" &&
    rankingDivision === "open" &&
    rankingPeriod === "season";
  const useOpenPeriodBoard =
    rankingLeague === "nba" &&
    rankingDivision === "open" &&
    rankingPeriod !== "season";

  /** WC ブラケット未入力なら Bracket タブに ! を表示 */
  const { shouldPromptInput: wcBracketNeedsInput } =
    useWcBracketSubmitted(WC_KNOCKOUT_SEASON);
  const {
    listReady,
    metricReady,
    personalPending,
    metric,
    setMetric,
    visibleMetrics,
    rows,
    top3,
    restRows,
    myRank,
    myRankDeltaPlaces,
    myRow,
    myUid,
    rankingListCount,
    byMetric,
    myMetricValueDeltas,
    periodAvailableLabels,
    periodActiveLabel,
    proRequired,
  } = useWebRankings(
    phase,
    effectiveRound,
    wcStageForHook,
    usePeriodBoard
      ? (rankingPeriod as Exclude<RankingPeriod, "season">)
      : null,
    periodLabel,
    useOpenPeriodBoard ? "open" : "standard",
    useOpenSeasonBoard
  );

  const myStatsRow =
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ?? myRow;

  const { user: sessionUser } = useRankingSessionUser(myUid);
  const language = sessionUser.language;
  const countryCode = sessionUser.countryCode;

  const m = t(language);
  const langUi = language === "en" ? "en" : "ja";

  /** PRO LEAGUE は Pro 以外にはロック（API 403 もフォールバック） */
  const openProLocked =
    rankingLeague === "nba" &&
    rankingDivision === "open" &&
    (sessionUser.plan !== "pro" || proRequired);

  const restoreScrollAfterListRef = useRef(false);

  /** プロフィールの「ランキングに戻る」で付いた rankMetric / rankLeague などを反映 */
  useLayoutEffect(() => {
    const m = searchParams.get(RANKINGS_TAB_METRIC_PARAM);
    if (isMobileMetricParam(m)) setMetric(m);
    const league = searchParams.get(RANKINGS_TAB_LEAGUE_PARAM);
    const cat = searchParams.get(RANKINGS_TAB_CATEGORY_PARAM);
    if (isRankingsCategoryParam(cat)) setCategory(cat);
    if (isRankingLeagueSource(league)) {
      setRankingLeague(league);
      if (league === "worldcup" && !isRankingsCategoryParam(cat)) {
        setCategory("playoffs");
      }
    }
    const stage = searchParams.get(RANKINGS_TAB_WC_STAGE_PARAM);
    if (isWcRankingStage(stage)) setWcStage(stage);
    const period = searchParams.get(RANKINGS_TAB_PERIOD_PARAM);
    if (isRankingPeriod(period)) setRankingPeriod(period);
    restoreScrollAfterListRef.current = isMobileMetricParam(
      searchParams.get(RANKINGS_TAB_METRIC_PARAM)
    );
  }, [searchParams, setMetric]);

  useApplyPreferredRankingLeague(fUser?.uid, searchParams, setRankingLeague, () =>
    setCategory("playoffs")
  );

  useEffect(() => {
    if (rankingLeague !== "nba" && rankingPeriod !== "season") {
      setRankingPeriod("season");
    }
    if (rankingLeague !== "nba" && nbaBoard !== "regular") {
      setNbaBoard("regular");
    }
  }, [rankingLeague, rankingPeriod, nbaBoard]);

  useEffect(() => {
    if (
      rankingLeague === "nba" &&
      nbaBoard === "playoffs" &&
      rankingPeriod !== "season"
    ) {
      setRankingPeriod("season");
    }
  }, [rankingLeague, nbaBoard, rankingPeriod]);

  useEffect(() => {
    if (nbaBoard !== "playoffs" && playoffRound !== "overall") {
      setPlayoffRound("overall");
    }
  }, [nbaBoard, playoffRound]);

  /** 期間タブ・リーグ・区分を切り替えたら過去ラベル選択をリセット */
  useEffect(() => {
    setPeriodLabel(null);
  }, [rankingPeriod, rankingLeague, nbaBoard]);

  useLayoutEffect(() => {
    if (!listReady || !restoreScrollAfterListRef.current) return;
    restoreScrollAfterListRef.current = false;
    const el = document.querySelector(
      "[data-web-rankings-scroll]"
    ) as HTMLElement | null;
    if (!el) return;
    try {
      const raw = sessionStorage.getItem(WEB_RANKINGS_SCROLL_KEY);
      if (raw == null) return;
      const y = Number(raw);
      if (!Number.isFinite(y) || y < 0) return;
      requestAnimationFrame(() => {
        el.scrollTop = y;
      });
    } catch {
      /* sessionStorage 不可時は無視 */
    }
  }, [listReady, searchParams, phase, metric, category, wcStage, rankingLeague]);

  useEffect(() => {
    const el = document.querySelector(
      "[data-web-rankings-scroll]"
    ) as HTMLElement | null;
    if (!el) return;
    let tid: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(tid);
      tid = setTimeout(() => {
        try {
          sessionStorage.setItem(WEB_RANKINGS_SCROLL_KEY, String(el.scrollTop));
        } catch {
          /* ignore */
        }
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(tid);
    };
  }, []);

  const myValue = useMemo(
    () => getMyMetricValue(metric as MobileMetric, myRow),
    [metric, myRow]
  );

  /** プレイヤーカード 2×2 セル — 現在タブの rows には依存しない */
  const precApiKey =
    rankingLeague === "worldcup" ? "totalExactHits" : "totalGoalScorerHits";
  const myMiniMetrics = useMemo(
    () =>
      buildMyRankMiniMetrics(
        myStatsRow,
        {
          ptsRows: byMetric?.totalPoints?.rows as RankingRow[] | undefined,
          precRows: byMetric?.[precApiKey]?.rows as RankingRow[] | undefined,
          upsetRows: byMetric?.totalUpset?.rows as RankingRow[] | undefined,
        },
        myMetricValueDeltas,
        rankingLeague
      ),
    [
      myStatsRow,
      myMetricValueDeltas,
      byMetric?.totalPoints?.rows,
      byMetric?.totalExactHits?.rows,
      byMetric?.totalGoalScorerHits?.rows,
      byMetric?.totalUpset?.rows,
      rankingLeague,
      precApiKey,
    ]
  );

  const winRateMinPosts = usePeriodBoard
    ? periodWinRateMinPosts(rankingPeriod as Exclude<RankingPeriod, "season">)
    : computeWinRateMinPosts(rankingLeague, wcStage);

  const listContentReady = computeRankingListContentReady({
    listReady,
    metricReady,
  });
  const rankingHasNoEntries = computeRankingHasNoEntries({
    listReady,
    metricReady,
    rowsLength: rows.length,
    rankingLeague,
    rankingListCount,
  });

  const myTotalPoints =
    typeof myStatsRow?.totalPoints === "number" ? myStatsRow.totalPoints : 0;

  const totalPointsRows = useMemo(
    () =>
      Array.isArray(byMetric?.totalPoints?.rows)
        ? (
            byMetric.totalPoints.rows as Array<
              RankingApiRow & { rank?: number }
            >
          ).map((row, index) => ({
            rank:
              typeof row.rank === "number" && Number.isFinite(row.rank)
                ? Math.floor(row.rank)
                : index + 1,
            totalPoints: row.totalPoints,
          }))
        : [],
    [byMetric?.totalPoints?.rows]
  );

  const rankTierGap = useMemo(() => {
    if (myRank == null || myRank < 1 || rankingHasNoEntries) return null;
    return buildRankTierGapHint({
      currentRank: myRank,
      myTotalPoints,
      cutoffRows: totalPointsRows,
    });
  }, [myRank, myTotalPoints, rankingHasNoEntries, totalPointsRows]);

  /** Ranking Progress — NBA は free/pro とも表示、WC は pro のみ（mobile と同方針） */
  const myRankCardTier: "free" | "pro" | undefined =
    sessionUser.plan === "pro"
      ? "pro"
      : rankingLeague === "nba"
        ? "free"
        : undefined;
  const rankProgressHidden =
    rankingLeague === "nba" && rankingPeriod !== "season";
  const rankProgressEnabled =
    effectiveCategory === "playoffs" &&
    !rankProgressHidden &&
    (rankingLeague === "nba" || sessionUser.plan === "pro");
  const { points: myRankProgressPoints, loading: myRankProgressLoading } =
    useMyRankProgress({
      uid: myUid,
      enabled: rankProgressEnabled,
      rankingLeague,
      wcStage: wcStageForHook,
    });

  const pageKey =
    buildRankingsPageKey({
      metric: metric as MobileMetric,
      rankingLeague,
      wcStage,
    }) + `:${nbaBoard}:${rankingPeriod}:${effectiveRound}`;
  const prefersReducedMotion = useReducedMotion();
  const { skipCountUp, topDone, handleTopCountDone } = useRankingsTopDone(pageKey);

  return (
    <div
      className={[
        "relative z-10 min-h-full w-full overflow-x-hidden",
        nbaBoard === "open" ? "rankings-atmosphere--pro-league" : "",
      ].join(" ")}
    >
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="mx-auto max-w-[920px] space-y-3 px-3 pt-2">
        <div className="flex items-start gap-2">
          <CyberMenuButton
            size="sm"
            onClick={() => setRankingsDrawerOpen(true)}
            aria-label={m.games.openMenu}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <RankingsPageTitleCyber
              variant="horizon-chrome"
              tone={nbaBoard === "open" ? "pro-league" : "default"}
              title={
                nbaBoard === "open"
                  ? m.rankings.divisionOpen
                  : nbaBoard === "playoffs" && rankingLeague === "nba"
                    ? m.rankings.nbaBoardPlayoffs
                    : rankingLeague === "nba"
                      ? m.rankings.nbaBoardRegular
                      : rankingLeague === "worldcup"
                        ? m.rankings.pageTitleWorldCup
                        : m.rankings.pageTitleRankings
              }
              size="sm"
            />
            <RankingsScheduleNotice language={language} />
          </div>
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </div>
        <div className="space-y-0.5">
          {rankingLeague === "worldcup" ? (
            <RankingsCategoryTabs
              category={category}
              onChange={setCategory}
              league={rankingLeague}
              bracketAlert={wcBracketNeedsInput}
            />
          ) : null}

          {rankingLeague === "nba" &&
          (nbaBoard === "regular" || nbaBoard === "open") ? (
            <RankingsPeriodTabs
              period={rankingPeriod}
              onChange={setRankingPeriod}
              language={language}
              tabTheme={
                nbaBoard === "open" ? PRO_LEAGUE_TAB_THEME : undefined
              }
            />
          ) : null}

          {usePeriodBoard ? (
            <RankingsPeriodLabelNav
              period={rankingPeriod as Exclude<RankingPeriod, "season">}
              activeLabel={periodActiveLabel}
              availableLabels={periodAvailableLabels}
              onChange={setPeriodLabel}
              language={language}
            />
          ) : null}

          {rankingLeague === "nba" && nbaBoard === "playoffs" ? (
            <PlayoffRoundTabs
              round={playoffRound}
              onChange={setPlayoffRound}
              language={language}
            />
          ) : null}

          {rankingLeague === "worldcup" && category === "playoffs" ? (
            <WcRankingStageTabs
              stage={wcStage}
              onChange={setWcStage}
              isMobile={false}
              language={language}
            />
          ) : null}

          {effectiveCategory === "playoffs" && !openProLocked ? (
            <MyRankCard
              rank={rankingHasNoEntries ? null : myRank}
              metric={metric as MobileMetric}
              value={myValue}
              displayName={sessionUser.displayName || "You"}
              photoURL={sessionUser.photoURL || null}
              totalPosts={myRow?.totalPosts}
              loading={!listReady}
              statsScramble={listReady && personalPending}
              animateRank={!skipCountUp}
              language={language}
              isPro={sessionUser.plan === "pro"}
              displayTier={myRankCardTier}
              rankTierGap={sessionUser.plan === "pro" ? rankTierGap : null}
              rankProgress={
                rankProgressEnabled ? (myRankProgressPoints ?? []) : undefined
              }
              rankProgressLoading={
                rankProgressEnabled && myRankProgressLoading
              }
              hideRankProgress={rankProgressHidden}
              mobileWide
              layout="web"
              rankDeltaPlaces={rankingHasNoEntries ? null : myRankDeltaPlaces}
              totalEntries={
                rankingHasNoEntries
                  ? null
                  : rankingListCount || rows.length || null
              }
              streak={myRow?.activeWinStreak ?? null}
              countryCode={countryCode}
              miniMetrics={myMiniMetrics}
              cardResetKey={pageKey}
              leagueLabel={
                nbaBoard === "open"
                  ? "PRO LEAGUE"
                  : nbaBoard === "playoffs" && rankingLeague === "nba"
                    ? "PLAYOFFS"
                    : rankingLeague === "worldcup"
                      ? "WORLD CUP"
                      : "NBA"
              }
              statsSource={myStatsRow}
            />
          ) : null}
        </div>

        {effectiveCategory === "playoffs" && !openProLocked ? (
          <>
            <RankingsMetricRow
              metrics={visibleMetrics}
              metric={metric}
              setMetric={setMetric}
              language={language}
              rankingLeague={rankingLeague}
              gridColumns={rankingLeague === "worldcup" ? 3 : undefined}
              tabTheme={
                nbaBoard === "open" ? PRO_LEAGUE_TAB_THEME : undefined
              }
            />
            {metric === "winRate" && (
              <p className="px-1 text-xs leading-5 text-white/60">
                {winRateMinPosts > 1
                  ? m.rankings.minPostsRequired.replace("{n}", String(winRateMinPosts))
                  : m.rankings.noMinPosts}
              </p>
            )}
          </>
        ) : null}

        {effectiveCategory === "playoffs" && openProLocked ? (
          <div className="pt-2">
            <RankingsOpenProLock language={language} />
          </div>
        ) : null}

        {effectiveCategory === "playoffs" &&
          !openProLocked &&
          !listContentReady && (
          <CandleChartLoader className="pt-2" label={m.common.loading} />
        )}

        {effectiveCategory === "bracket" ? (
          <div className="mx-auto w-full max-w-[960px]">
            <WcBracketLeaderboardSection season={WC_KNOCKOUT_SEASON} />
          </div>
        ) : openProLocked ? null : rankingHasNoEntries ? (
          <div
            role="status"
            className="flex min-h-[min(65dvh,520px)] items-center justify-center px-4 text-center"
          >
            <p
              className={[
                nameBebas.className,
                "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
                nbaBoard === "open" ? "rankings-pro-league-no-data" : "",
              ].join(" ")}
              style={nbaBoard === "open" ? undefined : cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : listContentReady ? (
          <AnimatePresence mode="wait">
            <motion.div key={pageKey} className="relative">
              <div className="mx-auto max-w-[860px] px-2 pt-3">
                <div className="cyber-rank-list-panel">
                <TopPodium
                  rows={top3}
                  metric={metric}
                  rankPhase={phase}
                  playoffRound={effectiveRound}
                  rankingLeague={rankingLeague}
                  wcStage={rankingLeague === "worldcup" ? wcStage : undefined}
                  participantCount={rankingListCount || null}
                  onTopCountDone={handleTopCountDone}
                  countUpEnabled={!skipCountUp}
                  entranceEnabled={!prefersReducedMotion}
                  language={language}
                />

              <motion.div
                key={`rest-${pageKey}`}
                className="pb-bottom-nav"
                variants={restContainer}
                initial={prefersReducedMotion ? "show" : "hidden"}
                animate={topDone || prefersReducedMotion ? "show" : "hidden"}
                style={{ opacity: topDone || prefersReducedMotion ? 1 : 0.35 }}
              >
                {restRows.length > 0 &&
                  restRows.map((r, i) => (
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
                        participantCount={rankingListCount || null}
                        language={language}
                        animateValue={!skipCountUp && i < 6}
                      />
                    </motion.div>
                  ))}
              </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      <SideMenuDrawer
        open={rankingsDrawerOpen}
        onClose={() => setRankingsDrawerOpen(false)}
        variant="web"
      >
        <RankingsDrawerMenu
          variant="web"
          language={langUi}
          rankingLeague={rankingLeague}
          nbaBoard={nbaBoard}
          onSelectNbaRegular={() => {
            setRankingLeague("nba");
            setNbaBoard("regular");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
          onSelectNbaPlayoffs={() => {
            setRankingLeague("nba");
            setNbaBoard("playoffs");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
          onSelectOpenweight={() => {
            setRankingLeague("nba");
            setNbaBoard("open");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
          onSelectWorldCup={() => {
            setRankingLeague("worldcup");
            setNbaBoard("regular");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
        />
      </SideMenuDrawer>
    </div>
  );
}