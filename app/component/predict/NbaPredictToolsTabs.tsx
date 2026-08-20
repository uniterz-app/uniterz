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
import { proBriefForMatchup } from "@/lib/predict/nbaProBriefPreviewMocks";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import { injuryReportForMatchup } from "@/lib/predict/nbaInjuryReportPreviewMocks";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { teamStatsForMatchup } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";
import { rosterForMatchup } from "@/lib/predict/nbaRosterPreviewMocks";
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
 * Insight (Pro) / Injury / Team Stats / Roster を常時タブで表示し、
 * データがまだ無いタブは準備中プレースホルダを出す。
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
  const resolvedInjury =
    injuryReport ?? injuryReportForMatchup(homeTeamId, awayTeamId);
  const resolvedStats = teamStats ?? teamStatsForMatchup(homeTeamId, awayTeamId);
  const resolvedBrief = brief ?? proBriefForMatchup(homeTeamId, awayTeamId);
  const resolvedRoster = roster ?? rosterForMatchup(homeTeamId, awayTeamId);

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
          resolvedInjury ? (
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
          resolvedStats ? (
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
