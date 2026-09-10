"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import PredictProBriefPanel from "@/app/component/predict/PredictProBriefPanel";
import NbaInjuryReportPanel from "@/app/component/predict/NbaInjuryReportPanel";
import NbaTeamStatsPanel from "@/app/component/predict/NbaTeamStatsPanel";
import NbaRosterPanel from "@/app/component/predict/NbaRosterPanel";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";
import { useNbaMatchupRoster } from "@/lib/nba/teamRosters/useNbaMatchupRoster";
import { useNbaMatchupInjuryReport } from "@/lib/nba/predict/useNbaMatchupInjuryReport";
import { useNbaMatchupTeamStats } from "@/lib/nba/predict/useNbaMatchupTeamStats";
import { useNbaMatchupProBrief } from "@/lib/nba/predict/useNbaMatchupProBrief";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

export type NbaPredictToolsTab = "insight" | "injuries" | "stats" | "roster";

type Props = {
  language: Language;
  /** Insight タブの中身は Pro 限定（タブ自体は常時表示） */
  isPro: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  /** データ未投入（ゲート B まで）は undefined/null → 準備中表示 */
  brief?: PredictProBrief | null;
  injuryReport?: NbaInjuryReport | null;
  teamStats?: NbaTeamStatsBundle | null;
  roster?: NbaRosterReport | null;
  /** 予想入力から STATS → チーム詳細へ行ったあと戻れるようにする */
  fromPredictGameId?: string;
  /** Games オーバーレイ vs /predict 専用ルート */
  predictReturnMode?: "overlay" | "route";
  className?: string;
};

function PendingPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/12 bg-white/2 px-4 py-8 text-center text-xs leading-relaxed text-white/40">
      {text}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center py-6" role="status">
      <CandleChartLoader className="scale-75" label={label} />
    </div>
  );
}

/**
 * NBA 予想フォームの情報タブ（本番）。
 * Insight (Pro) / Injury / Team Stats / Roster を常時タブで表示。
 * Injury / Stats / Roster は対戦チームの Firestore 公開 API（モックフォールバックなし）。
 */
export default function NbaPredictToolsTabs({
  language,
  isPro,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  brief = null,
  injuryReport = null,
  teamStats = null,
  roster = null,
  fromPredictGameId,
  predictReturnMode = "route",
  className = "",
}: Props) {
  const m = t(language).predict;
  const loadingLabel = t(language).common.loading;
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<NbaPredictToolsTab | null>("injuries");
  const router = useRouter();

  /**
   * Injury / Stats / Roster はオーバーレイ表示と同時に取りに行く。
   * タブ切替の一瞬だけ「データ準備中」と出さない（キャッシュがあれば即表示）。
   */
  const [visited, setVisited] = useState<Set<NbaPredictToolsTab>>(
    () => new Set<NbaPredictToolsTab>(["injuries", "stats", "roster"])
  );
  useEffect(() => {
    const pt = searchParams.get("predictTools");
    if (
      pt === "insight" ||
      pt === "injuries" ||
      pt === "stats" ||
      pt === "roster"
    ) {
      setTab(pt);
    }
  }, [searchParams]);
  const selectTab = (next: NbaPredictToolsTab) => {
    setTab((cur) => (cur === next ? null : next));
    setVisited((cur) => (cur.has(next) ? cur : new Set(cur).add(next)));
  };
  useEffect(() => {
    if (!tab) return;
    setVisited((cur) => (cur.has(tab) ? cur : new Set(cur).add(tab)));
  }, [tab]);

  /**
   * モックへは落とさない。本番は games.proBrief（前日 19:00 初版 / tip 1h 前ケガ反映）。
   * brief prop があれば優先（プレビュー用）。
   */
  const { brief: liveBrief, loading: briefLoading } = useNbaMatchupProBrief({
    gameId: fromPredictGameId,
    override: brief,
    enabled: visited.has("insight") && isPro,
  });
  const resolvedBrief = liveBrief;

  const { report: liveInjury, loading: injuryLoading } =
    useNbaMatchupInjuryReport({
      homeTeamId,
      awayTeamId,
      override: injuryReport,
      enabled: visited.has("injuries"),
      language: language === "ja" ? "ja" : "en",
    });
  const { stats: liveStats, loading: statsLoading } = useNbaMatchupTeamStats({
    homeTeamId,
    awayTeamId,
    override: teamStats,
    enabled: visited.has("stats"),
  });
  const { roster: liveRoster, loading: rosterLoading } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    override: roster,
    enabled: visited.has("roster"),
  });

  const resolvedInjury = liveInjury;
  const resolvedStats = liveStats;
  const resolvedRoster = liveRoster;

  const openProSubscribe = () => {
    router.push("/mobile/pro/subscribe");
  };

  return (
    <div className={className} data-tutorial-target="predict-tools">
      {/*
        親（PredictionFormV2）が overflow-x-hidden のため、skew(-14deg) の先端が
        端で四角く切れる。ランキング period タブ（px-3 + overflow-x-clip）と同じ横余白。
      */}
      <div className="w-full min-w-0 overflow-visible px-3 pb-1.5 pt-0">
        <CyberSlantedTabBar fill aria-label="NBA predict tools">
          <CyberSlantedTab
            role="tab"
            label="INSIGHT"
            active={tab === "insight"}
            onClick={() => selectTab("insight")}
            compact
          />
          <CyberSlantedTab
            role="tab"
            label="INJURY"
            active={tab === "injuries"}
            onClick={() => selectTab("injuries")}
            compact
          />
          <CyberSlantedTab
            role="tab"
            label="STATS"
            active={tab === "stats"}
            onClick={() => selectTab("stats")}
            compact
          />
          <CyberSlantedTab
            role="tab"
            label="ROSTER"
            active={tab === "roster"}
            onClick={() => selectTab("roster")}
            compact
          />
        </CyberSlantedTabBar>
      </div>

      {tab ? (
        <div className="mt-1.5 min-h-30 px-0.5">
          {tab === "insight" ? (
            resolvedBrief || !isPro ? (
              <PredictProBriefPanel
                brief={resolvedBrief}
                language={language}
                homeTeamId={homeTeamId ?? ""}
                awayTeamId={awayTeamId ?? ""}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                locked={!isPro}
                onPressUpgrade={openProSubscribe}
              />
            ) : briefLoading ? (
              <LoadingPanel label={loadingLabel} />
            ) : (
              <PendingPanel text={m.panelDataPending} />
            )
          ) : tab === "injuries" ? (
            resolvedInjury ? (
              <NbaInjuryReportPanel
                report={resolvedInjury}
                language={language}
                fromPredictGameId={fromPredictGameId}
                predictReturnMode={predictReturnMode}
              />
            ) : injuryLoading ? (
              <LoadingPanel label={loadingLabel} />
            ) : (
              <PendingPanel text={m.panelDataPending} />
            )
          ) : tab === "stats" ? (
            resolvedStats ? (
              <NbaTeamStatsPanel
                data={resolvedStats}
                isPro={isPro}
                language={language}
                fromPredictGameId={fromPredictGameId}
                predictReturnMode={predictReturnMode}
              />
            ) : statsLoading ? (
              <LoadingPanel label={loadingLabel} />
            ) : (
              <PendingPanel text={m.panelDataPending} />
            )
          ) : resolvedRoster ? (
            <NbaRosterPanel
              report={resolvedRoster}
              injuryReport={resolvedInjury}
              fromPredictGameId={fromPredictGameId}
              predictReturnMode={predictReturnMode}
            />
          ) : rosterLoading ? (
            <LoadingPanel label={loadingLabel} />
          ) : (
            <PendingPanel text={m.panelDataPending} />
          )}
        </div>
      ) : null}
    </div>
  );
}
