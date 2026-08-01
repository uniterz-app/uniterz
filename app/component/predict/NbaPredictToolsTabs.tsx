"use client";

import { useState } from "react";
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
  className = "",
}: Props) {
  const m = t(language).predict;
  const [tab, setTab] = useState<NbaPredictToolsTab>("injuries");

  return (
    <div className={className} data-tutorial-target="predict-tools">
      <CyberSlantedTabBar fill aria-label="NBA predict tools">
        <CyberSlantedTab
          role="tab"
          label="INSIGHT"
          active={tab === "insight"}
          onClick={() => setTab("insight")}
          compact
          fontWeight={900}
        />
        <CyberSlantedTab
          role="tab"
          label="INJURY"
          active={tab === "injuries"}
          onClick={() => setTab("injuries")}
          compact
          fontWeight={900}
        />
        <CyberSlantedTab
          role="tab"
          label="STATS"
          active={tab === "stats"}
          onClick={() => setTab("stats")}
          compact
          fontWeight={900}
        />
        <CyberSlantedTab
          role="tab"
          label="ROSTER"
          active={tab === "roster"}
          onClick={() => setTab("roster")}
          compact
          fontWeight={900}
        />
      </CyberSlantedTabBar>

      <div className="mt-2.5 min-h-30">
        {tab === "insight" ? (
          !isPro ? (
            <PendingPanel text={m.insightProOnly} />
          ) : brief ? (
            <PredictProBriefPanel
              brief={brief}
              language={language}
              homeTeamId={homeTeamId ?? ""}
              awayTeamId={awayTeamId ?? ""}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />
          ) : (
            <PendingPanel text={m.panelDataPending} />
          )
        ) : tab === "injuries" ? (
          injuryReport ? (
            <NbaInjuryReportPanel report={injuryReport} language={language} />
          ) : (
            <PendingPanel text={m.panelDataPending} />
          )
        ) : tab === "stats" ? (
          teamStats ? (
            <NbaTeamStatsPanel data={teamStats} isPro={isPro} />
          ) : (
            <PendingPanel text={m.panelDataPending} />
          )
        ) : roster ? (
          <NbaRosterPanel report={roster} injuryReport={injuryReport} />
        ) : (
          <PendingPanel text={m.panelDataPending} />
        )}
      </div>
    </div>
  );
}
