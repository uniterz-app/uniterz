"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import { motion, AnimatePresence } from "framer-motion";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import RankingsDrawerMenu from "@/app/component/rankings/RankingsDrawerMenu";
import PlayoffRoundTabs from "@/app/component/rankings/PlayoffRoundTabs";
import WcRankingStageTabs from "@/app/component/rankings/WcRankingStageTabs";
import RankingsCategoryTabs from "@/app/component/rankings/RankingsCategoryTabs";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
import Header from "@/app/component/Header";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
import { useWebRankings } from "../_lib/useWebRankings";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { type PlayoffRoundKey, isPlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_ROUND_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
  WEB_RANKINGS_SCROLL_KEY,
  isMobileMetricParam,
} from "@/lib/navigation/rankingsProfileFrom";
import { t } from "@/lib/i18n/t";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import RankingsScheduleNotice from "@/app/component/rankings/RankingsScheduleNotice";
import BracketLeaderboardSection from "@/app/component/leaderboards/BracketLeaderboardSection";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import type { RankingsCategory } from "@/app/component/rankings/RankingsCategoryTabs";
import { Menu } from "lucide-react";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useApplyPreferredRankingLeague } from "@/lib/hooks/useApplyPreferredRankingLeague";
import { buildMyRankMiniMetrics, isMyRankMiniMetricsReady } from "@/lib/rankings/buildMyRankMiniMetrics";
import type { RankingRow } from "@/lib/rankings/useRanking";
import {
  buildRankingsPageKey,
  computeRankingHasNoEntries,
  computeWinRateMinPosts,
  getMyMetricValue,
} from "@/lib/rankings/rankingsPageShared";
import { useRankingsTopDone } from "@/lib/hooks/useRankingsTopDone";
import { useProgressiveRenderCount } from "@/lib/hooks/useProgressiveRenderCount";

export default function WebRankingsShell() {
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("worldcup");
  const phase: RankingPhase = "playoffs";
  const [round, setRound] = useState<PlayoffRoundKey>("overall");
  const [wcStage, setWcStage] = useState<WcRankingStage>("overall");
  const season = useMemo(() => getCurrentPlayoffSeason(), []);
  const effectiveRound: PlayoffRoundKey =
    rankingLeague === "worldcup" ? "overall" : round;
  const wcStageForHook: WcRankingStage | null =
    category === "playoffs" && rankingLeague === "worldcup"
      ? wcStage
      : null;
  const {
    listReady,
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
  } = useWebRankings(phase, effectiveRound, wcStageForHook);

  const myStatsRow =
    (byMetric?.totalPoints?.myRow as RankingRow | null | undefined) ?? myRow;

  const { user: sessionUser } = useRankingSessionUser(myUid);
  const language = sessionUser.language;
  const countryCode = sessionUser.countryCode;

  const m = t(language);
  const langUi = language === "en" ? "en" : "ja";

  const restoreScrollAfterListRef = useRef(false);

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
    restoreScrollAfterListRef.current = isMobileMetricParam(
      searchParams.get(RANKINGS_TAB_METRIC_PARAM)
    );
  }, [searchParams, setMetric]);

  useApplyPreferredRankingLeague(fUser?.uid, searchParams, setRankingLeague, () =>
    setCategory("playoffs")
  );

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
    metric: metric as MobileMetric,
    rankingLeague,
    wcStage,
  });
  const { handleTopCountDone } = useRankingsTopDone(pageKey);
  const visibleRestCount = useProgressiveRenderCount(
    restRows.length,
    pageKey,
    24,
    24
  );
  const visibleRestRows = restRows.slice(0, visibleRestCount);

  return (
    <div className="relative z-10 min-h-full w-full overflow-x-hidden">
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="mx-auto max-w-[920px] space-y-3 px-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRankingsDrawerOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition-colors hover:border-cyan-300/35 hover:bg-white/10 hover:text-white"
            aria-label={m.games.openMenu}
          >
            <Menu className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <div className="flex min-w-0 flex-1 justify-center">
            <RankingsPageTitleCyber
              variant="horizon-chrome"
              title={
                rankingLeague === "worldcup"
                  ? m.rankings.pageTitleWorldCup
                  : m.rankings.pageTitleRankings
              }
              size="sm"
            />
          </div>
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
              isMobile={false}
              language={language}
            />
          ) : null}

          {rankingLeague === "worldcup" ? (
            <WcRankingStageTabs
              stage={wcStage}
              onChange={setWcStage}
              isMobile={false}
              language={language}
            />
          ) : null}

          {category === "playoffs" ? (
            <MyRankCard
              rank={rankingHasNoEntries ? null : myRank}
              metric={metric as MobileMetric}
              value={myValue}
              displayName={sessionUser.displayName || "You"}
              photoURL={sessionUser.photoURL || null}
              totalPosts={myRow?.totalPosts}
              loading={!listReady}
              statsScramble={listReady && personalPending}
              language={language}
              isPro={sessionUser.plan === "pro"}
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
              barsReady={cardBarsReady}
              cardResetKey={pageKey}
              leagueLabel={rankingLeague === "worldcup" ? "WORLD CUP" : "NBA"}
              statsSource={myStatsRow}
            />
          ) : null}
        </div>

        {category === "playoffs" ? (
          <>
            <RankingsMetricRow
              metrics={visibleMetrics}
              metric={metric}
              setMetric={setMetric}
              language={language}
              gridColumns={rankingLeague === "worldcup" ? 3 : undefined}
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

        {category === "playoffs" && !listReady && (
          <div
            role="status"
            aria-live="polite"
            className="pt-2 text-sm text-white/40"
          >
            {m.common.loading}
          </div>
        )}

        {category === "bracket" ? (
          <div className="mx-auto w-full max-w-[960px]">
            <BracketLeaderboardSection season={season} />
          </div>
        ) : rankingHasNoEntries ? (
          <div
            role="status"
            className="flex min-h-[min(65dvh,520px)] items-center justify-center px-4 text-center"
          >
            <p
              className={[
                nameBebas.className,
                "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : listReady ? (
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
                  onTopCountDone={handleTopCountDone}
                  language={language}
                />

              <motion.div
                key={`rest-${pageKey}`}
                className="pb-bottom-nav"
                variants={restContainer}
                initial="hidden"
                animate="show"
                style={{ opacity: 1 }}
              >
                {restRows.length > 0 &&
                  visibleRestRows.map((r, i) => (
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
                        animateValue={i < 12}
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