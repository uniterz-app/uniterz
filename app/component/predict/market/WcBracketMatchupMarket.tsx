"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountryFlag from "@/app/component/games/CountryFlag";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { pickCountForTeam } from "@/lib/wc/wc-bracket-market-aggregate";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { resolveWcQualLabelToTeamId } from "@/lib/wc/wc-knockout-bracket-utils";
import { coerceWcTeamId, teamIdToCountryName } from "@/lib/wc/wcCountry";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
} from "@/lib/wc/wc-bracket-input-phases";
import type { WcMatchupMarketEntry } from "@/lib/wc/wc-bracket-market-aggregate";

type Props = {
  entries: WcMatchupMarketEntry[];
  advancement: WcKnockoutAdvancement;
  language?: Language;
};

const CARD_CLASS = "wc-bracket-user-card relative px-2.5 py-2.5 sm:px-3";

function percent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function teamDisplayName(
  teamId: string | null,
  fallbackLabel: string,
  advancement: WcKnockoutAdvancement
): string {
  const resolvedId =
    (teamId ? coerceWcTeamId(teamId) ?? teamId : null) ??
    resolveWcQualLabelToTeamId(fallbackLabel, advancement);
  const id = resolvedId ? coerceWcTeamId(resolvedId) ?? resolvedId : null;
  if (id) {
    return (
      teamIdToCountryName(id, "en") ??
      id.replace(/^wc-/, "").toUpperCase()
    );
  }
  return fallbackLabel;
}

function flagTeamId(
  teamId: string | null,
  fallbackLabel: string,
  advancement: WcKnockoutAdvancement
): string | null {
  const resolved =
    (teamId ? coerceWcTeamId(teamId) ?? teamId : null) ??
    resolveWcQualLabelToTeamId(fallbackLabel, advancement);
  if (!resolved) return null;
  return coerceWcTeamId(resolved) ?? resolved;
}

function getPctTextClass(
  myPct: number,
  otherPct: number,
  hasData: boolean
): string {
  if (!hasData) return "text-white/45";
  if (myPct === otherPct) return "text-white";
  return myPct > otherPct ? "text-yellow-300" : "text-white/70";
}

function FlagBadge({
  teamId,
  label,
}: {
  teamId: string | null;
  label: string;
}) {
  if (teamId) {
    return (
      <span className="inline-flex h-9 w-12 overflow-hidden rounded-[2px] ring-1 ring-white/20 sm:h-10 sm:w-14">
        <CountryFlag
          teamId={flagTeamId(teamId)}
          variant="inline"
          className="block! h-full! w-full! ring-0!"
        />
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 w-12 items-center justify-center rounded-[2px] border border-dashed border-white/20 bg-white/4 text-[8px] font-bold tracking-wider text-white/35 sm:h-10 sm:w-14">
      {label.slice(0, 4)}
    </span>
  );
}

function DuelSplitBar({ pctA, pctB }: { pctA: number; pctB: number }) {
  const wA = Math.max(0, Math.min(100, pctA));
  const wB = Math.max(0, Math.min(100, pctB));

  return (
    <div className="flex h-[6px] w-full overflow-hidden rounded-[2px] bg-white/8">
      <div
        className="h-full bg-[#00F5FF]/85 shadow-[0_0_8px_rgba(0,245,255,0.35)]"
        style={{ width: `${wA}%` }}
      />
      <div
        className="h-full bg-white/28"
        style={{ width: `${wB}%` }}
      />
    </div>
  );
}

function MatchupCard({
  entry,
  index,
  advancement,
}: {
  entry: WcMatchupMarketEntry;
  index: number;
  advancement: WcKnockoutAdvancement;
}) {
  const homeName = teamDisplayName(entry.homeTeamId, entry.homeLabel, advancement);
  const awayName = teamDisplayName(entry.awayTeamId, entry.awayLabel, advancement);

  const homeId = flagTeamId(entry.homeTeamId, entry.homeLabel, advancement);
  const awayId = flagTeamId(entry.awayTeamId, entry.awayLabel, advancement);

  const countA = pickCountForTeam(entry.winnerPickCounts, homeId);
  const countB = pickCountForTeam(entry.winnerPickCounts, awayId);
  const pctA = percent(countA, entry.total);
  const pctB = percent(countB, entry.total);
  const pctClassA = getPctTextClass(pctA, pctB, entry.total > 0);
  const pctClassB = getPctTextClass(pctB, pctA, entry.total > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={CARD_CLASS}
    >
      <div className="relative z-10">
        <p
          className={[
            "mb-2 text-center text-[10px] font-semibold tracking-[0.18em] text-white/45",
            nameBebas.className,
          ].join(" ")}
        >
          {entry.matchId}
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <div className="flex min-w-0 flex-col items-center gap-1">
            <FlagBadge
              teamId={homeId}
              label={homeName || entry.homeLabel}
            />
            <div
              className={`${nameBebas.className} w-full truncate text-center text-[12px] leading-none tracking-[0.05em] text-white sm:text-[14px]`}
            >
              {homeName}
            </div>
          </div>

          <div
            className={`${nameBebas.className} px-0.5 text-[13px] tracking-[0.12em] text-white/55`}
          >
            VS
          </div>

          <div className="flex min-w-0 flex-col items-center gap-1">
            <FlagBadge
              teamId={awayId}
              label={awayName || entry.awayLabel}
            />
            <div
              className={`${nameBebas.className} w-full truncate text-center text-[12px] leading-none tracking-[0.05em] text-white sm:text-[14px]`}
            >
              {awayName}
            </div>
          </div>
        </div>

        <div className="mt-2.5">
          <div className="mb-1 flex justify-between gap-2 text-[10px] font-semibold sm:text-[11px]">
            <span
              className={`min-w-0 flex-1 text-left ${pctClassA} ${resultStatsMetricNumClass}`}
            >
              {entry.total > 0 ? `${pctA}%` : "--"}
            </span>
            <span
              className={`min-w-0 flex-1 text-right ${pctClassB} ${resultStatsMetricNumClass}`}
            >
              {entry.total > 0 ? `${pctB}%` : "--"}
            </span>
          </div>
          <DuelSplitBar pctA={pctA} pctB={pctB} />
        </div>
      </div>
    </motion.div>
  );
}

export default function WcBracketMatchupMarket({
  entries,
  advancement,
  language = "ja",
}: Props) {
  const m = t(language);
  const isJa = language === "ja";
  const [phase, setPhase] = useState<WcBracketInputPhase>("R32");

  const phaseEntries = useMemo(
    () => entries.filter((entry) => entry.phase === phase),
    [entries, phase]
  );

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/55">{m.common.noData}</p>
    );
  }

  return (
    <div className="space-y-2">
      <CyberSlantedTabBar fill aria-label="Matchup round">
        {WC_BRACKET_INPUT_PHASES.map((phaseDef) => (
          <CyberSlantedTab
            key={phaseDef.id}
            role="tab"
            label={phaseDef.tabLabel}
            active={phaseDef.id === phase}
            onClick={() => setPhase(phaseDef.id)}
            compact
            fontWeight={600}
          />
        ))}
      </CyberSlantedTabBar>

      {phaseEntries.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/55">
          {isJa ? "このラウンドのデータはありません" : "No data for this round"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {phaseEntries.map((entry, index) => (
            <MatchupCard
              key={entry.matchId}
              entry={entry}
              index={index}
              advancement={advancement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
