"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/lib/rankings/rankingMetrics";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import RankingCard from "@/app/component/rankings/RankingCard";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TopPodium from "@/app/component/rankings/TopPodium";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import RankingsDrawerMenu from "@/app/component/rankings/RankingsDrawerMenu";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";
import type { RankingsCategory } from "@/app/component/rankings/RankingsCategoryTabs.types";
import Header from "@/app/component/Header";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/cumulativeRankingRow";
import { buildMyRankMiniMetrics } from "@/lib/rankings/buildMyRankMiniMetrics";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { t } from "@/lib/i18n/t";
import RankingsScheduleNotice from "@/app/component/rankings/RankingsScheduleNotice";
import { CyberNoDataPage } from "@/app/component/common/CyberNoDataLabel";
import { useSearchParams } from "next/navigation";
import {
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_CATEGORY_PARAM,
  RANKINGS_TAB_PERIOD_PARAM,
  isMobileMetricParam,
  isRankingsCategoryParam,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  buildRankingsPageKey,
  computeRankingHasNoEntries,
  computeRankingListContentReady,
  computeWinRateMinPosts,
  getMyMetricValue,
  resolveMyRankForCard,
} from "@/lib/rankings/rankingsPageShared";
import { sortRankingRowsByMetric } from "@/lib/rankings/sortRankingRows";
import { useRankingsTopDone } from "@/lib/hooks/useRankingsTopDone";
import { visibleMetricsForLeague, buildRankingTabMetrics } from "@/lib/rankings/wcVisibleMetrics";
import { buildRankTierGapHint } from "@/lib/rankings/rankTierMilestone";
import { useMyRankProgress } from "@/lib/rankings/useMyRankProgress";
import { useMyRankCardFast } from "@/lib/rankings/useMyRankCardFast";
import {
  estimatePeriodRankingUnits,
  periodUnitRanksFromByMetric,
} from "@/lib/rankings/estimatePeriodRankingUnits";
import RankingsPeriodTabs from "@/app/component/rankings/RankingsPeriodTabs";
import RankingsPeriodLabelNav from "@/app/component/rankings/RankingsPeriodLabelNav";
import RankingsDivisionTabs from "@/app/component/rankings/RankingsDivisionTabs";
import RankingsProLeagueTeaser from "@/app/component/rankings/RankingsProLeagueTeaser";
import PlayoffRoundTabs from "@/app/component/rankings/PlayoffRoundTabs";
import {
  isRankingPeriod,
  periodWinRateMinPosts,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import {
  divisionFromNbaBoard,
  type NbaRankingBoard,
  type RankingDivision,
} from "@/lib/rankings/rankingDivision";
import { usePeriodRankingsBulk } from "@/lib/rankings/usePeriodRankingsBulk";
import { useOpenSeasonRankingsBulk } from "@/lib/rankings/useOpenSeasonRankingsBulk";
import { PRO_LEAGUE_TAB_THEME } from "@/lib/rankings/proLeagueAtmosphere";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";

export default function MobileRankingsPage() {
  const searchParams = useSearchParams();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const rankingLeague: RankingLeagueSource = "nba";
  const phase: RankingPhase = "playoffs";
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("weekly");
  /** NBA: レギュラー / プレーオフ / PRO LEAGUE */
  const [nbaBoard, setNbaBoard] = useState<NbaRankingBoard>("regular");
  const rankingDivision: RankingDivision = divisionFromNbaBoard(nbaBoard);
  /** 過去期間ラベル（null = 現在期間） */
  const [periodLabel, setPeriodLabel] = useState<string | null>(null);
  /** NBA Playoffs ラウンド（Regular / PRO LEAGUE では overall 固定） */
  const [playoffRound, setPlayoffRound] = useState<PlayoffRoundKey>("overall");
  const effectiveRound: PlayoffRoundKey =
    rankingLeague === "nba" && nbaBoard === "playoffs"
      ? playoffRound
      : "overall";
  /** NBA は Bracket カテゴリ廃止 — 常に playoffs（=ランキング本体） */
  const effectiveCategory: RankingsCategory = "playoffs";
  const wcStageForHook = null;

  const visibleMetrics = useMemo(
    () => visibleMetricsForLeague(rankingLeague),
    [rankingLeague]
  );

  /** プロフィールの「ランキングに戻る」で付いた rankMetric などを反映 */
  useLayoutEffect(() => {
    const m = searchParams.get(RANKINGS_TAB_METRIC_PARAM);
    if (isMobileMetricParam(m)) setMetric(m);
    const cat = searchParams.get(RANKINGS_TAB_CATEGORY_PARAM);
    if (isRankingsCategoryParam(cat)) setCategory(cat);
    const period = searchParams.get(RANKINGS_TAB_PERIOD_PARAM);
    if (isRankingPeriod(period)) setRankingPeriod(period);
  }, [searchParams]);

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  const metricItems = useMemo(
    () => buildRankingTabMetrics(rankingLeague),
    [rankingLeague]
  );

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

  const seasonBulk = useCumulativeRankingsBulk(
    phase,
    effectiveRound,
    wcStageForHook,
    !usePeriodBoard && !useOpenSeasonBoard
  );
  const openSeasonBulk = useOpenSeasonRankingsBulk(useOpenSeasonBoard);
  const periodBulk = usePeriodRankingsBulk(
    usePeriodBoard
      ? (rankingPeriod as Exclude<RankingPeriod, "season">)
      : null,
    periodLabel,
    useOpenPeriodBoard ? "open" : "standard"
  );

  /** 期間タブ・リーグ・区分を切り替えたら過去ラベル選択をリセット */
  useEffect(() => {
    setPeriodLabel(null);
  }, [rankingPeriod, rankingLeague, nbaBoard]);

  const {
    listReady,
    personalPending,
    myUid,
    byMetric,
    myMetricValueDeltas,
    ensureMetric,
  } = useOpenSeasonBoard
    ? openSeasonBulk
    : usePeriodBoard
      ? periodBulk
      : seasonBulk;

  const { user: sessionUser } = useRankingSessionUser(myUid);
  const language = sessionUser.language;
  const countryCode = sessionUser.countryCode;
  const m = t(language);
  const langUi = language === "en" ? "en" : "ja";

  /** PRO LEAGUE は Pro 以外にはロック（API 403 もフォールバック） */
  const openProLocked =
    rankingLeague === "nba" &&
    rankingDivision === "open" &&
    (sessionUser.plan !== "pro" ||
      openSeasonBulk.proRequired ||
      periodBulk.proRequired);

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

  const myRankCardFastEnabled =
    !usePeriodBoard &&
    !useOpenSeasonBoard &&
    rankingLeague === "nba" &&
    effectiveCategory === "playoffs";
  const cardFast = useMyRankCardFast(myUid, {
    enabled: myRankCardFastEnabled,
  });

  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const { myRank: listMyRank, myRankDeltaPlaces: listMyRankDelta } =
    resolveMyRankForCard({
      myUid,
      myRank: bundle?.myRank,
      myRankDeltaPlaces: bundle?.myRankDeltaPlaces,
      myRow: myRawRow,
      listRows: rawRows,
    });
  const myRank =
    (myRankCardFastEnabled && !cardFast.loading
      ? cardFast.myRank
      : null) ?? listMyRank;
  const myRankDeltaPlaces =
    (myRankCardFastEnabled ? cardFast.myRankDeltaPlaces : null) ??
    listMyRankDelta;
  /** 累積スコアは指標タブに依存しない — cardFast / totalPoints myRow */
  const myStatsRow =
    (myRankCardFastEnabled
      ? (cardFast.myRow as RankingRow | null)
      : null) ??
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ??
    myRawRow;
  const rankingListCount =
    typeof bundle?.count === "number" && Number.isFinite(bundle.count)
      ? bundle.count
      : 0;

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return sortRankingRowsByMetric(metric, toMobileRows(metric, rawRows));
  }, [metric, rawRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const myValue = useMemo(
    () => getMyMetricValue(metric, myRawRow ?? myStatsRow),
    [metric, myRawRow, myStatsRow]
  );
  /** プレイヤーカード 2×2 セル — 現在タブの rows には依存しない */
  const precApiKey = "totalGoalScorerHits";
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
    : computeWinRateMinPosts(rankingLeague);
  const winRateUsesPickupRate =
    usePeriodBoard && rankingPeriod === "monthly" && nbaBoard === "regular";

  const metricReady = bundle != null;
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

  /**
   * Free / Pro マイランクカード（プレビューと同系）。
   * Season 累計は cumulative_stats 1-read でカード先行。
   */
  const myRankCardTier: "free" | "pro" =
    cardFast.plan === "pro" || sessionUser.plan === "pro" ? "pro" : "free";
  const rankProgressHidden =
    rankingLeague === "nba" && rankingPeriod !== "season";
  const estimatedUnits =
    myRankCardTier === "pro" &&
    usePeriodBoard &&
    nbaBoard === "regular" &&
    (rankingPeriod === "weekly" || rankingPeriod === "monthly")
      ? estimatePeriodRankingUnits(
          rankingPeriod,
          periodUnitRanksFromByMetric(byMetric)
        )
      : null;
  const rankProgressEnabled =
    effectiveCategory === "playoffs" &&
    !rankProgressHidden &&
    myRankCardTier === "pro" &&
    metric === "totalScore" &&
    (rankingLeague === "nba" || sessionUser.plan === "pro");
  const { points: myRankProgressPoints, loading: myRankProgressLoading } =
    useMyRankProgress({
      uid: myUid,
      enabled: rankProgressEnabled,
      rankingLeague,
      wcStage: wcStageForHook,
      seedPoints: myRankCardFastEnabled ? cardFast.rankProgressPoints : null,
      seedComplete:
        myRankCardFastEnabled && cardFast.rankProgressSeedComplete,
    });

  const cardLoading =
    !listReady &&
    !(myRankCardFastEnabled && !cardFast.loading && cardFast.myRow != null);

  const pageKey =
    buildRankingsPageKey({
      metric,
    }) + `:${nbaBoard}:${rankingPeriod}:${effectiveRound}`;
  const prefersReducedMotion = useReducedMotion();
  const { skipCountUp, topDone, handleTopCountDone } = useRankingsTopDone(pageKey);

  return (
    <div
      className={[
        "relative min-h-svh max-w-full overflow-x-clip overflow-y-auto overscroll-y-contain pb-bottom-nav text-white",
        nbaBoard === "open" ? "rankings-atmosphere--pro-league" : "",
      ].join(" ")}
      style={{ touchAction: "pan-y" }}
    >
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="max-w-full space-y-3 overflow-x-clip px-3 pt-2">
          <div className="space-y-0.5">
            {nbaBoard === "regular" || nbaBoard === "open" ? (
              <RankingsDivisionTabs
                division={rankingDivision}
                onChange={(next) =>
                  setNbaBoard(next === "open" ? "open" : "regular")
                }
                language={language}
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
                activeLabel={periodBulk.activeLabel}
                availableLabels={periodBulk.availableLabels}
                onChange={setPeriodLabel}
                language={language}
              />
            ) : null}

            {rankingLeague === "nba" && nbaBoard === "playoffs" ? (
              <PlayoffRoundTabs
                round={playoffRound}
                onChange={setPlayoffRound}
                isMobile
                language={language}
              />
            ) : null}

            {effectiveCategory === "playoffs" && !openProLocked ? (
              <MyRankCard
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={sessionUser.displayName || "You"}
                photoURL={sessionUser.photoURL || null}
                uid={myUid}
                handle={sessionUser.handle}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number"
                    ? myRawRow.totalPosts
                    : undefined
                }
                loading={cardLoading}
                statsScramble={
                  listReady && personalPending && !cardFast.myRow
                }
                animateRank={!skipCountUp}
                language={language}
                isPro={myRankCardTier === "pro"}
                displayTier={myRankCardTier}
                rankTierGap={myRankCardTier === "pro" ? rankTierGap : null}
                rankProgress={
                  rankProgressEnabled ? (myRankProgressPoints ?? []) : undefined
                }
                rankProgressLoading={
                  rankProgressEnabled && myRankProgressLoading
                }
                hideRankProgress={rankProgressHidden}
                estimatedUnits={estimatedUnits}
                mobileWide
                rankDeltaPlaces={
                  rankingHasNoEntries ? null : myRankDeltaPlaces
                }
                totalEntries={
                  rankingHasNoEntries
                    ? null
                    : rankingListCount || rows.length || null
                }
                streak={myRawRow?.activeWinStreak ?? null}
                countryCode={countryCode}
                miniMetrics={myMiniMetrics}
                cardResetKey={pageKey}
                leagueLabel={
                  nbaBoard === "open"
                    ? "PRO LEAGUE"
                    : nbaBoard === "playoffs"
                      ? "PLAYOFFS"
                      : "NBA"
                }
                statsSource={myRawRow}
              />
            ) : null}
          </div>

          {effectiveCategory === "playoffs" && !openProLocked ? (
            <>
              <RankingsScheduleNotice language={language} className="px-1" />
              <RankingsMetricRow
                metrics={metricItems}
                metric={metric}
                setMetric={setMetric}
                language={language}
                rankingLeague={rankingLeague}
                compactMobile
                tabTheme={
                  nbaBoard === "open" ? PRO_LEAGUE_TAB_THEME : undefined
                }
              />
              {metric === "winRate" && (
                <p className="px-1 text-[11px] leading-4 text-white/60">
                  {winRateUsesPickupRate
                    ? m.rankings.winRatePickupRateRequired ??
                      m.rankings.minPostsRequired.replace(
                        "{n}",
                        String(winRateMinPosts)
                      )
                    : winRateMinPosts > 1
                      ? m.rankings.minPostsRequired.replace(
                          "{n}",
                          String(winRateMinPosts)
                        )
                      : m.rankings.noMinPosts}
                </p>
              )}
            </>
          ) : null}
        </div>

        {effectiveCategory === "playoffs" && openProLocked ? (
          <div className="px-2 pb-bottom-nav pt-2">
            <RankingsProLeagueTeaser
              language={language}
              onBackToPickUp={() => setNbaBoard("regular")}
            />
          </div>
        ) : effectiveCategory === "playoffs" && !listContentReady && (
          <CandleChartLoader className="px-3 pt-2" label={m.common.loading} />
        )}

        {openProLocked ? null : rankingHasNoEntries ? (
          <CyberNoDataPage
            variant={nbaBoard === "open" ? "rankingsPro" : "rankings"}
          />
        ) : listContentReady ? (
          <div className="max-w-full overflow-x-clip">
          <AnimatePresence mode="wait">
              <motion.div key={pageKey} className="relative">
              <div className="relative z-10 px-2">
                <div className="cyber-rank-list-panel">
                <TopPodium
                  rows={top3}
                  metric={metric}
                  rankPhase={phase}
                  playoffRound={effectiveRound}
                  rankingLeague={rankingLeague}
                  participantCount={rankingListCount || null}
                  onTopCountDone={handleTopCountDone}
                  countUpEnabled={!skipCountUp}
                  entranceEnabled={!prefersReducedMotion}
                  language={language}
                />
              <motion.div
                key={`rest-${pageKey}`}
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
          </div>
        ) : null}

      <ProfileMenuEdgeHandle
        onOpen={() => setRankingsDrawerOpen(true)}
        ariaLabel={m.games.openMenu}
        label="MENU"
        hidden={rankingsDrawerOpen}
        fadeIn
      />
      <SideMenuDrawer
        open={rankingsDrawerOpen}
        onClose={() => setRankingsDrawerOpen(false)}
        variant="mobile"
      >
        <RankingsDrawerMenu
          variant="mobile"
          language={langUi}
          rankingLeague={rankingLeague}
          nbaBoard={nbaBoard}
          onSelectNbaRegular={() => {
            setNbaBoard("regular");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
          onSelectNbaPlayoffs={() => {
            setNbaBoard("playoffs");
            setCategory("playoffs");
            setRankingsDrawerOpen(false);
          }}
        />
      </SideMenuDrawer>
      <TutorialLiveHost page="rankings" />
    </div>
  );
}