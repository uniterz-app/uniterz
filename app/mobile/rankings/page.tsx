"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  METRICS,
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { motion, AnimatePresence } from "framer-motion";
import RankingCard from "@/app/component/rankings/RankingCard";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TopPodium from "@/app/component/rankings/TopPodium";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
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
import { buildMyRankMiniMetrics, isMyRankMiniMetricsReady } from "@/lib/rankings/buildMyRankMiniMetrics";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
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
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useApplyPreferredRankingLeague } from "@/lib/hooks/useApplyPreferredRankingLeague";
import {
  buildRankingsPageKey,
  computeRankingHasNoEntries,
  computeWinRateMinPosts,
  getMyMetricValue,
} from "@/lib/rankings/rankingsPageShared";
import { useRankingsTopDone } from "@/lib/hooks/useRankingsTopDone";
import { visibleMetricsForLeague } from "@/lib/rankings/wcVisibleMetrics";

export default function MobileRankingsPage() {
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
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

  const visibleMetrics = useMemo(
    () => visibleMetricsForLeague(rankingLeague),
    [rankingLeague]
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

  useApplyPreferredRankingLeague(fUser?.uid, searchParams, setRankingLeague, () =>
    setCategory("playoffs")
  );

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  const metricItems = useMemo(
    () => METRICS.filter((m) => visibleMetrics.includes(m.key)),
    [visibleMetrics]
  );

  const { listReady, personalPending, myUid, byMetric, myMetricValueDeltas, ensureMetric } =
    useCumulativeRankingsBulk(phase, effectiveRound, wcStageForHook);

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

  /** カードの 4 指標バー用 — タブ切替前に各指標のリーダー行を先読み */
  useEffect(() => {
    void ensureMetric("totalPoints");
    void ensureMetric("totalPrecision");
    void ensureMetric("totalUpset");
  }, [ensureMetric, phase, effectiveRound, wcStageForHook, rankingLeague]);
  const rawRows = useMemo(
    () =>
      Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : [],
    [bundle?.rows]
  );

  const myRank = bundle?.myRank ?? null;
  const myRankDeltaPlaces = bundle?.myRankDeltaPlaces ?? null;
  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;
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
    return toMobileRows(metric, rawRows);
  }, [metric, rawRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const myValue = useMemo(
    () => getMyMetricValue(metric, myRawRow),
    [metric, myRawRow]
  );
  /** プレイヤーカード 2×2 セル — 現在タブの rows には依存しない */
  const myMiniMetrics = useMemo(
    () =>
      buildMyRankMiniMetrics(
        myStatsRow,
        {
          ptsRows: byMetric?.totalPoints?.rows as RankingRow[] | undefined,
          precRows: byMetric?.totalPrecision?.rows as RankingRow[] | undefined,
          upsetRows: byMetric?.totalUpset?.rows as RankingRow[] | undefined,
        },
        myMetricValueDeltas
      ),
    [
      myStatsRow,
      myMetricValueDeltas,
      byMetric?.totalPoints?.rows,
      byMetric?.totalPrecision?.rows,
      byMetric?.totalUpset?.rows,
    ]
  );

  const cardBarsReady = isMyRankMiniMetricsReady(byMetric);

  const winRateMinPosts = computeWinRateMinPosts(
    rankingLeague,
    phase,
    effectiveRound
  );

  const rankingHasNoEntries = computeRankingHasNoEntries({
    listReady,
    rowsLength: rows.length,
    rankingLeague,
    rankingListCount,
  });

  const pageKey = buildRankingsPageKey({
    phase,
    effectiveRound,
    metric,
    rankingLeague,
    wcStage,
  });
  const { topDone, handleTopCountDone } = useRankingsTopDone(pageKey);

  return (
    <div
      className="relative min-h-svh max-w-full overflow-x-clip overflow-y-auto overscroll-y-contain pb-bottom-nav text-white"
      style={{ touchAction: "pan-y" }}
    >
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="max-w-full space-y-3 overflow-x-clip px-3 pt-2">
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
              {rankingLeague === "worldcup"
                ? m.rankings.pageTitleWorldCup
                : m.rankings.pageTitleRankings}
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
                displayName={sessionUser.displayName || "You"}
                photoURL={sessionUser.photoURL || null}
                totalPosts={
                  typeof myRawRow?.totalPosts === "number"
                    ? myRawRow.totalPosts
                    : undefined
                }
                loading={!listReady}
                statsScramble={listReady && personalPending}
                language={language}
                isPro={sessionUser.plan === "pro"}
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
                barsReady={cardBarsReady}
                cardResetKey={pageKey}
                leagueLabel={
                  rankingLeague === "worldcup" ? "WORLD CUP" : "NBA"
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

        {category === "playoffs" && !listReady && (
          <CandleChartLoader className="px-3 pt-2" label={m.common.loading} />
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
                  onTopCountDone={handleTopCountDone}
                  language={language}
                />
              <motion.div
                key={`rest-${pageKey}`}
                variants={restContainer}
                initial="hidden"
                animate={topDone ? "show" : "hidden"}
                style={{ opacity: topDone ? 1 : 0.35 }}
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
                          language={language}
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