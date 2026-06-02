"use client";

import {
  useCallback,
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
import Header from "@/app/component/Header";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useWebRankings } from "../_lib/useWebRankings";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
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

function getMyMetricValue(metric: MobileMetric, row: any): number {
  if (!row) return 0;

  if (metric === "totalScore") return row.totalPoints ?? 0;
  if (metric === "marginPrecision") return row.totalPrecision ?? 0;
  if (metric === "upsetScore") return row.totalUpset ?? 0;

  if (metric === "winRate") {
    const raw = row.winRate ?? 0;
    return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  }

  return row.activeWinStreak ?? 0;
}

export default function WebRankingsShell() {
  const searchParams = useSearchParams();
  const [rankingsDrawerOpen, setRankingsDrawerOpen] = useState(false);
  const [category, setCategory] = useState<RankingsCategory>("playoffs");
  const [rankingLeague, setRankingLeague] =
    useState<RankingLeagueSource>("nba");
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
  } = useWebRankings(phase, effectiveRound, wcStageForHook);

  const { user } = useMyRankingUser(myUid);
  const { language, countryCode } = useUserLanguage(myUid);

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

  const myValue = useMemo(() => {
    return getMyMetricValue(metric as MobileMetric, myRow);
  }, [metric, myRow]);
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
    <div className="relative z-10 min-h-full w-full overflow-x-hidden">
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="mx-auto max-w-[860px] space-y-3 px-3 pt-2">
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
              "min-w-0 flex-1 text-center text-[15px] tracking-[0.28em] text-white/90 sm:text-base",
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
              displayName={user.displayName || "You"}
              photoURL={user.photoURL || null}
              totalPosts={myRow?.totalPosts}
              loading={!listReady}
              statsScramble={listReady && personalPending}
              language={language}
              isPro={user.plan === "pro"}
              rankDeltaPlaces={rankingHasNoEntries ? null : myRankDeltaPlaces}
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
          <div className="pt-2 text-sm text-white/40">
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
                <div className="h-[16px]" />
              </div>

              <motion.div
                key={`rest-${pageKey}`}
                className="mx-auto max-w-[860px] px-2 pb-bottom-nav pt-2"
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