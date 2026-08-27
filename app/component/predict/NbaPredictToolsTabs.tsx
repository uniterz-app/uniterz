"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<NbaPredictToolsTab | null>("injuries");
  const router = useRouter();

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
  };

  /**
   * 一度開いたタブのデータは保持する（タブを閉じても再取得しない）。
   * 初期表示は injuries なので、STATS / ROSTER は開くまで取りに行かない。
   */
  const [visited, setVisited] = useState<Set<NbaPredictToolsTab>>(
    () => new Set(tab ? [tab] : [])
  );
  useEffect(() => {
    if (!tab) return;
    setVisited((cur) => (cur.has(tab) ? cur : new Set(cur).add(tab)));
  }, [tab]);

  /**
   * モックへは落とさない。`nbaProBriefPreviewMocks` は特定カード（開幕の
   * Celtics @ Pistons）だけ作り物の数字を返すため、本番で Pro に嘘の
   * Insight を見せることになる。brief 未配線なら PendingPanel を出す。
   */
  const resolvedBrief = brief;

  const { report: liveInjury, loading: injuryLoading } =
    useNbaMatchupInjuryReport({
      homeTeamId,
      awayTeamId,
      override: injuryReport,
      enabled: visited.has("injuries"),
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
      {/* 試合カードと同幅。skew 分だけ極小余白（大きくするとカードより狭く見える） */}
      <div className="w-full min-w-0 overflow-visible px-0.5 pb-1.5 pt-0">
        <CyberSlantedTabBar fill aria-label="NBA predict tools">
          <CyberSlantedTab
            role="tab"
            label="INSIGHT"
            active={tab === "insight"}
            onClick={() => selectTab("insight")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="INJURY"
            active={tab === "injuries"}
            onClick={() => selectTab("injuries")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="STATS"
            active={tab === "stats"}
            onClick={() => selectTab("stats")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="ROSTER"
            active={tab === "roster"}
            onClick={() => selectTab("roster")}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      {tab ? (
        <div className="mt-1.5 min-h-30 px-0.5">
          {tab === "insight" ? (
            isPro && !resolvedBrief ? (
              <PendingPanel text={m.panelDataPending} />
            ) : (
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
            )
          ) : tab === "injuries" ? (
            injuryLoading ? (
              <PendingPanel text={m.panelDataPending} />
            ) : resolvedInjury ? (
              <NbaInjuryReportPanel
                report={resolvedInjury}
                language={language}
                fromPredictGameId={fromPredictGameId}
                predictReturnMode={predictReturnMode}
              />
            ) : (
              <PendingPanel text={m.panelDataPending} />
            )
          ) : tab === "stats" ? (
            statsLoading ? (
              <PendingPanel text={m.panelDataPending} />
            ) : resolvedStats ? (
              <NbaTeamStatsPanel
                data={resolvedStats}
                isPro={isPro}
                language={language}
                fromPredictGameId={fromPredictGameId}
                predictReturnMode={predictReturnMode}
              />
            ) : (
              <PendingPanel text={m.panelDataPending} />
            )
          ) : rosterLoading ? (
            <PendingPanel text={m.panelDataPending} />
          ) : resolvedRoster ? (
            <NbaRosterPanel
              report={resolvedRoster}
              injuryReport={resolvedInjury}
              fromPredictGameId={fromPredictGameId}
              predictReturnMode={predictReturnMode}
            />
          ) : (
            <PendingPanel text={m.panelDataPending} />
          )}
        </div>
      ) : null}
    </div>
  );
}
