"use client";

import { useState } from "react";
import CountryFlag from "@/app/component/games/CountryFlag";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import PredictProBriefPanel from "@/app/component/predict/PredictProBriefPanel";
import NbaInjuryReportPanel from "@/app/component/predict/NbaInjuryReportPanel";
import NbaTeamStatsPanel from "@/app/component/predict/NbaTeamStatsPanel";
import NbaRosterPanel from "@/app/component/predict/NbaRosterPanel";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { PredictTimingPreviewPreset } from "@/lib/predict/predictTimingPreviewMocks";
import { injuryReportForPreset } from "@/lib/predict/nbaInjuryReportPreviewMocks";
import { teamStatsForPreset } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { rosterForPreset } from "@/lib/predict/nbaRosterPreviewMocks";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { jp, matchScoreClass, nameOxanium } from "@/lib/fonts";
import {
  PREDICT_HUD_PRO_HAIRLINE,
  PREDICT_HUD_PRO_SHELL_CLASS,
} from "@/lib/predict/predictOverlayHud";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import PredictOverlayScoreFields from "@/app/component/predict/PredictOverlayScoreFields";
import {
  PREDICT_OVERLAY_CYBER_CARD_CLASS,
  PREDICT_OVERLAY_SUBMIT_BTN_CLASS,
} from "@/lib/ui/predictOverlayCyber";
import { PREDICT_OVERLAY_FORM_PANEL } from "@/lib/ui/matchOverlayGlass";

type NbaToolsTab = "injuries" | "stats" | "roster";

const NBA_TOOLS_TABS: { id: NbaToolsTab; labelKey: "injuries" | "teamStats" | "rosterTab" }[] = [
  { id: "injuries", labelKey: "injuries" },
  { id: "stats", labelKey: "teamStats" },
  { id: "roster", labelKey: "rosterTab" },
];

function PreviewTeamMark({ teamId }: { teamId: string }) {
  if (teamId.startsWith("nba-")) {
    return (
      <HalftoneJerseyMark
        accent={getTeamJerseyPrimaryColor("nba", teamId)}
        accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
        className="h-10 w-10"
      />
    );
  }
  return <CountryFlag teamId={teamId} className="aspect-[4/3] w-9" />;
}

type Props = {
  preset: PredictTimingPreviewPreset;
  language: Language;
  /** Preview: Pro 差分 / HOT·COLD の見え方確認用 */
  isPro?: boolean;
};

function ProHudCornerBrackets() {
  const corner =
    "pointer-events-none absolute z-[4] h-5 w-5 border-amber-300/70 sm:h-6 sm:w-6";
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} aria-hidden />
      <span className={`${corner} right-0 top-0 border-r border-t`} aria-hidden />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} aria-hidden />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} aria-hidden />
    </>
  );
}

function MarketBiasBar({
  label,
  homePct,
  awayPct,
  drawPct = 0,
  accent = "cyan",
}: {
  label: string;
  homePct: number;
  awayPct: number;
  drawPct?: number;
  accent?: "cyan" | "amber";
}) {
  const barAccent =
    accent === "amber" ? "from-amber-300/80" : "from-cyan-300/80";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-wider text-white/45">
          {label}
        </span>
        <span className="tabular-nums text-white/35">
          H {homePct}% · A {awayPct}%
          {drawPct > 0 ? ` · D ${drawPct}%` : ""}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-sm bg-white/8">
        <div
          className={`bg-linear-to-r ${barAccent} to-cyan-400/20`}
          style={{ width: `${homePct}%` }}
        />
        {drawPct > 0 ? (
          <div className="bg-white/25" style={{ width: `${drawPct}%` }} />
        ) : null}
        <div
          className="bg-linear-to-l from-white/30 to-white/10"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}

export default function PredictTimingOverlayPreview({
  preset,
  language,
  isPro = true,
}: Props) {
  const m = t(language).predict;
  const match = preset.match;
  const market = preset.market;
  const hudHairline = PREDICT_HUD_PRO_HAIRLINE;
  const [toolsTab, setToolsTab] = useState<NbaToolsTab>("injuries");
  const homeName =
    language === "en"
      ? (match.homeTeamNameEn ?? match.homeTeamName)
      : match.homeTeamName;
  const awayName =
    language === "en"
      ? (match.awayTeamNameEn ?? match.awayTeamName)
      : match.awayTeamName;

  return (
    <div className={[PREDICT_HUD_PRO_SHELL_CLASS, "min-h-[640px]"].join(" ")}>
      <ProHudCornerBrackets />
      <ShellGridOverlay roundedClassName="rounded-none" className="opacity-[0.28]" />

      <div
        className={[
          "relative z-[2] flex items-center justify-between gap-3 border-b px-3 py-2",
          nameOxanium.className,
        ].join(" ")}
        style={{ borderColor: hudHairline }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/75">
          {match.groupLabel ?? "NBA"}
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-white/42">
          {match.kickoffLabel ?? "7:30 PM ET"}
        </span>
      </div>

      {/* Mock MatchCard */}
      <div
        className={[
          "relative z-[2] px-3 py-4",
          PREDICT_OVERLAY_CYBER_CARD_CLASS,
        ].join(" ")}
      >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <PreviewTeamMark teamId={match.homeTeamId} />
                <span className={`${jp.className} text-sm font-bold text-white`}>
                  {homeName}
                </span>
                {match.homeRecord ? (
                  <span className="text-[10px] text-white/40">{match.homeRecord}</span>
                ) : null}
              </div>
              <div className="flex flex-col items-center gap-0.5 px-2">
                <span
                  className={[
                    matchScoreClass,
                    "text-2xl font-black tabular-nums text-white/90",
                  ].join(" ")}
                >
                  vs
                </span>
                {match.isKnockout ? (
                  <span className="text-[9px] font-bold uppercase text-amber-300/80">
                    {match.homeTeamId.startsWith("nba-") ? "PO" : "KO"}
                  </span>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <PreviewTeamMark teamId={match.awayTeamId} />
                <span className={`${jp.className} text-sm font-bold text-white`}>
                  {awayName}
                </span>
                {match.awayRecord ? (
                  <span className="text-[10px] text-white/40">{match.awayRecord}</span>
                ) : null}
              </div>
            </div>

            {market?.allUsers || market?.band ? (
              <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
                {market.allUsers ? (
                  <MarketBiasBar
                    label={language === "ja" ? "全員の予想 (Free)" : "All users (Free)"}
                    homePct={market.allUsers.homePct}
                    awayPct={market.allUsers.awayPct}
                    drawPct={market.allUsers.drawPct}
                    accent="cyan"
                  />
                ) : null}
                {market.band ? (
                  <MarketBiasBar
                    label={
                      language === "ja"
                        ? `同帯の予想 (Pro) · N=${market.band.bandN ?? "?"}`
                        : `Rival band (Pro) · N=${market.band.bandN ?? "?"}`
                    }
                    homePct={market.band.homePct}
                    awayPct={market.band.awayPct}
                    drawPct={market.band.drawPct}
                    accent="amber"
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {isPro ? (
            <div
              className="relative z-[2] border-t"
              style={{ borderColor: hudHairline }}
            >
              <PredictProBriefPanel
                brief={preset.proBrief}
                language={language}
                homeTeamId={match.homeTeamId}
                awayTeamId={match.awayTeamId}
                homeTeamName={homeName}
                awayTeamName={awayName}
              />
            </div>
          ) : null}

          <div
            className="relative z-[2] border-t px-3 py-2.5"
            style={{ borderColor: hudHairline }}
          >
            <CyberSlantedTabBar fill aria-label="Predict tools">
              {NBA_TOOLS_TABS.map((tab) => (
                <CyberSlantedTab
                  key={tab.id}
                  role="tab"
                  label={m[tab.labelKey]}
                  active={toolsTab === tab.id}
                  onClick={() => setToolsTab(tab.id)}
                  compact
                  fontWeight={900}
                />
              ))}
            </CyberSlantedTabBar>

            <div className="mt-2.5 min-h-[7.5rem]">
              {toolsTab === "injuries" ? (
                <NbaInjuryReportPanel
                  report={injuryReportForPreset(preset.id)}
                  language={language}
                />
              ) : toolsTab === "stats" ? (
                <NbaTeamStatsPanel
                  data={teamStatsForPreset(preset.id)}
                  isPro={isPro}
                />
              ) : (
                <NbaRosterPanel
                  report={rosterForPreset(
                    preset.id,
                    match.homeTeamId,
                    match.awayTeamId,
                    NBA_TEAM_NAME_BY_ID[match.homeTeamId] ?? match.homeTeamName,
                    NBA_TEAM_NAME_BY_ID[match.awayTeamId] ?? match.awayTeamName
                  )}
                  injuryReport={injuryReportForPreset(preset.id)}
                />
              )}
            </div>
          </div>

          <div
            className="relative z-[2] border-t"
            style={{ borderColor: hudHairline }}
          >
            <div className={`${PREDICT_OVERLAY_FORM_PANEL} space-y-3 px-4 py-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm font-semibold text-white/88">
                  {m.scorePrediction}
                  {match.isKnockout ? (
                    <span className="ml-0.5 align-super text-[10px] font-bold text-amber-300/90">
                      *
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
                  {m.scoringRulesChip}
                </span>
              </div>

              <PredictOverlayScoreFields
                home={{
                  label: homeName,
                  teamId: match.homeTeamId,
                  placeholder: "0",
                  readOnly: true,
                }}
                away={{
                  label: awayName,
                  teamId: match.awayTeamId,
                  placeholder: "0",
                  readOnly: true,
                }}
              />

              <button
                type="button"
                disabled
                className={`${PREDICT_OVERLAY_SUBMIT_BTN_CLASS} w-full py-3 text-sm font-bold opacity-80`}
              >
                {language === "ja" ? "予想を投稿" : "Submit prediction"}
              </button>
            </div>
          </div>
    </div>
  );
}
