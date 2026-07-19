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
import WcRankingStageTabs from "@/app/component/rankings/WcRankingStageTabs";
import RankingsCategoryTabs, {
  type RankingsCategory,
} from "@/app/component/rankings/RankingsCategoryTabs";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
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
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { t } from "@/lib/i18n/t";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import RankingsScheduleNotice from "@/app/component/rankings/RankingsScheduleNotice";
import { useSearchParams } from "next/navigation";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
  RANKINGS_TAB_CATEGORY_PARAM,
  RANKINGS_TAB_PERIOD_PARAM,
  isMobileMetricParam,
  isRankingsCategoryParam,
} from "@/lib/navigation/rankingsProfileFrom";
import WcBracketLeaderboardSection from "@/app/component/leaderboards/WcBracketLeaderboardSection";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { useWcBracketSubmitted } from "@/lib/wc/useWcBracketSubmitted";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useApplyPreferredRankingLeague } from "@/lib/hooks/useApplyPreferredRankingLeague";
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
import RankingsPeriodTabs from "@/app/component/rankings/RankingsPeriodTabs";
import RankingsPeriodLabelNav from "@/app/component/rankings/RankingsPeriodLabelNav";
import {
  isRankingPeriod,
  periodWinRateMinPosts,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import { usePeriodRankingsBulk } from "@/lib/rankings/usePeriodRankingsBulk";

export default function MobileRankingsPage() {
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("worldcup");
  const phase: RankingPhase = "playoffs";
  const [wcStage, setWcStage] = useState<WcRankingStage>("main");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>("season");
  /** 過去期間ラベル（null = 現在期間） */
  const [periodLabel, setPeriodLabel] = useState<string | null>(null);
  /** NBA はシーズン制に移行 — ラウンド概念なし */
  const effectiveRound: PlayoffRoundKey = "overall";
  /** NBA は Bracket カテゴリ廃止 — 常に playoffs（=ランキング本体） */
  const effectiveCategory: RankingsCategory =
    rankingLeague === "nba" ? "playoffs" : category;
  const wcStageForHook: WcRankingStage | null =
    effectiveCategory === "playoffs" && rankingLeague === "worldcup"
      ? wcStage
      : null;

  const visibleMetrics = useMemo(
    () => visibleMetricsForLeague(rankingLeague),
    [rankingLeague]
  );

  /** WC ブラケット未入力なら Bracket タブに ! を表示 */
  const { shouldPromptInput: wcBracketNeedsInput } =
    useWcBracketSubmitted(WC_KNOCKOUT_SEASON);

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
  }, [searchParams]);

  useApplyPreferredRankingLeague(fUser?.uid, searchParams, setRankingLeague, () =>
    setCategory("playoffs")
  );

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  useEffect(() => {
    if (rankingLeague !== "nba" && rankingPeriod !== "season") {
      setRankingPeriod("season");
    }
  }, [rankingLeague, rankingPeriod]);

  const metricItems = useMemo(
    () => buildRankingTabMetrics(rankingLeague),
    [rankingLeague]
  );

  const usePeriodBoard =
    rankingLeague === "nba" && rankingPeriod !== "season";

  const seasonBulk = useCumulativeRankingsBulk(
    phase,
    effectiveRound,
    wcStageForHook
  );
  const periodBulk = usePeriodRankingsBulk(
    usePeriodBoard
      ? (rankingPeriod as Exclude<RankingPeriod, "season">)
      : null,
    periodLabel
  );

  /** 期間タブ・リーグを切り替えたら過去ラベル選択をリセット */
  useEffect(() => {
    setPeriodLabel(null);
  }, [rankingPeriod, rankingLeague]);

  const {
    listReady,
    personalPending,
    myUid,
    byMetric,
    myMetricValueDeltas,
    ensureMetric,
  } = usePeriodBoard ? periodBulk : seasonBulk;

  const { user: sessionUser } = useRankingSessionUser(myUid);
  const language = sessionUser.language;
  const countryCode = sessionUser.countryCode;
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

  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
  const { myRank, myRankDeltaPlaces } = resolveMyRankForCard({
    myUid,
    myRank: bundle?.myRank,
    myRankDeltaPlaces: bundle?.myRankDeltaPlaces,
    myRow: myRawRow,
    listRows: rawRows,
  });
  /** 累積スコアは指標タブに依存しない — totalPoints 側の myRow を優先 */
  const myStatsRow =
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
    () => getMyMetricValue(metric, myRawRow),
    [metric, myRawRow]
  );
  /** プレイヤーカード 2×2 セル — 現在タブの rows には依存しない */
  const precApiKey =
    rankingLeague === "worldcup"
      ? "totalExactHits"
      : usePeriodBoard
        ? "totalGoalScorerHits"
        : "totalPrecision";
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
      byMetric?.totalPrecision?.rows,
      byMetric?.totalGoalScorerHits?.rows,
      byMetric?.totalUpset?.rows,
      rankingLeague,
      precApiKey,
    ]
  );

  const winRateMinPosts = usePeriodBoard
    ? periodWinRateMinPosts(rankingPeriod as Exclude<RankingPeriod, "season">)
    : computeWinRateMinPosts(rankingLeague, wcStage);

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
   * Ranking Progress（日次順位推移）。
   * NBA: Season ボードで free(3件)/pro(10件) とも表示。Weekly/Monthly は日次履歴が
   * 累計順位のため非表示。WC: 既存挙動を変えないよう pro のみ。
   */
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

  const pageKey = buildRankingsPageKey({
    metric,
    rankingLeague,
    wcStage,
  }) + `:${rankingPeriod}`;
  const prefersReducedMotion = useReducedMotion();
  const { skipCountUp, topDone, handleTopCountDone } = useRankingsTopDone(pageKey);

  return (
    <div
      className="relative min-h-svh max-w-full overflow-x-clip overflow-y-auto overscroll-y-contain pb-bottom-nav text-white"
      style={{ touchAction: "pan-y" }}
    >
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="max-w-full space-y-3 overflow-x-clip px-3 pt-2">
          <div className="flex items-start gap-2">
            <CyberMenuButton
              size="md"
              onClick={() => setRankingsDrawerOpen(true)}
              aria-label={m.games.openMenu}
            />
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <RankingsPageTitleCyber
                variant="horizon-chrome"
                title={
                  rankingLeague === "worldcup"
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

            {rankingLeague === "nba" ? (
              <RankingsPeriodTabs
                period={rankingPeriod}
                onChange={setRankingPeriod}
                language={language}
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

            {rankingLeague === "worldcup" && category === "playoffs" ? (
              <WcRankingStageTabs
                stage={wcStage}
                onChange={setWcStage}
                isMobile
                language={language}
              />
            ) : null}

            {effectiveCategory === "playoffs" ? (
              <MyRankCard
                rank={rankingHasNoEntries ? null : myRank}
                metric={metric}
                value={myValue}
                displayName={sessionUser.displayName || "You"}
                photoURL={sessionUser.photoURL || null}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number"
                    ? myRawRow.totalPosts
                    : undefined
                }
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
                  rankingLeague === "worldcup" ? "WORLD CUP" : "NBA"
                }
                statsSource={myRawRow}
              />
            ) : null}
          </div>

          {effectiveCategory === "playoffs" ? (
            <>
              <RankingsMetricRow
                metrics={metricItems}
                metric={metric}
                setMetric={setMetric}
                language={language}
                rankingLeague={rankingLeague}
                gridColumns={rankingLeague === "worldcup" ? 3 : undefined}
                compactMobile
              />
              {metric === "winRate" && (
                <p className="px-1 text-[11px] leading-4 text-white/60">
                  {winRateMinPosts > 1
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

        {effectiveCategory === "playoffs" && !listContentReady && (
          <CandleChartLoader className="px-3 pt-2" label={m.common.loading} />
        )}

        {effectiveCategory === "bracket" ? (
          <div className="px-2 pb-bottom-nav pt-2">
            <WcBracketLeaderboardSection season={WC_KNOCKOUT_SEASON} />
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
                  wcStage={rankingLeague === "worldcup" ? wcStage : undefined}
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
          </div>
        ) : null}

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