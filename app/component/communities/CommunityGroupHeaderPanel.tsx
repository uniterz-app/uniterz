"use client";

import type { Language } from "@/lib/i18n/language";
import {
  leagueLabel,
  metricLabel,
  communityRankingPeriodValue,
  rankingTeamsLabel,
} from "@/lib/communities/labels";
import type { CommunityGroupSummary } from "@/app/component/communities/communityGroupDetailCache";
import { nameOxanium, jp } from "@/lib/fonts";
import { MATCH_LIST_CYBER_CARD_CLASS, MATCH_LIST_CYBER_GRID_CLASS } from "@/lib/ui/matchListCardCyber";
import { communityCrtMono } from "./CommunityCrtTheme";
import CommunityGroupZoneLabel from "./CommunityGroupZoneLabel";

type Props = {
  summary: CommunityGroupSummary;
  language: Language;
  compact?: boolean;
  overlay?: boolean;
};

type ConditionItem = {
  key: string;
  label: string;
  value: string;
  accent: "cyan" | "amber" | "emerald";
  wide?: boolean;
};

function ConditionChip({
  label,
  value,
  accent = "cyan",
  wide = false,
  overlay = false,
}: {
  label: string;
  value: string;
  accent?: "cyan" | "amber" | "emerald";
  wide?: boolean;
  overlay?: boolean;
}) {
  const hair =
    accent === "amber"
      ? "bg-amber-400/85 shadow-[0_0_8px_rgba(251,191,36,0.55)]"
      : accent === "emerald"
        ? "bg-emerald-400/85 shadow-[0_0_8px_rgba(52,211,153,0.55)]"
        : "bg-[#00F5FF]/85 shadow-[0_0_8px_rgba(0,245,255,0.55)]";
  const labelColor =
    accent === "amber"
      ? "text-amber-200/80"
      : accent === "emerald"
        ? "text-emerald-200/80"
        : "text-cyan-200/70";

  return (
    <div
      className={[
        "relative flex min-h-[52px] overflow-hidden border",
        overlay
          ? "border-cyan-400/20 bg-black"
          : "border-cyan-400/16 bg-black",
        wide ? "col-span-2 w-full" : "min-w-0 w-full",
      ].join(" ")}
    >
      <span className={["absolute inset-x-0 top-0 h-px", hair].join(" ")} aria-hidden />
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <span
          className={[
            "font-mono text-[8px] font-bold uppercase tracking-[0.16em]",
            labelColor,
            communityCrtMono.className,
          ].join(" ")}
        >
          {label}
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[13px] font-bold leading-4 text-cyan-50/95",
            wide ? "line-clamp-2" : "truncate",
          ].join(" ")}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/** Native `CommunityGroupHeaderPanelNative` 相当 — TITLE / MEMO / 競技条件 */
export default function CommunityGroupHeaderPanel({
  summary,
  language,
  compact = false,
  overlay = false,
}: Props) {
  const labels =
    language === "en"
      ? {
          title: "TITLE",
          memo: "MEMO",
          conditions: "CONDITIONS",
          members: "MEMBERS",
          league: "LEAGUE",
          metric: "METRIC",
          period: "PERIOD",
          teams: "TEAMS",
          ended: "This group has ended.",
        }
      : {
          title: "TITLE",
          memo: "MEMO",
          conditions: "競技条件",
          members: "参加人数",
          league: "リーグ",
          metric: "指標",
          period: "集計期間",
          teams: "対象チーム",
          ended: "このグループは終了しています。",
        };

  const teamsValue = rankingTeamsLabel(summary.rankingTeamIds ?? [], language);
  const conditions: ConditionItem[] = [
    {
      key: "members",
      label: labels.members,
      value: String(summary.memberCount ?? 0),
      accent: "emerald",
    },
    {
      key: "league",
      label: labels.league,
      value: leagueLabel(summary.rankingLeague ?? "all", language),
      accent: "cyan",
    },
    {
      key: "metric",
      label: labels.metric,
      value: metricLabel(summary.rankingMetric, language),
      accent: "amber",
    },
    {
      key: "period",
      label: labels.period,
      value: communityRankingPeriodValue(summary.rankingStartDateKey, language),
      accent: "cyan",
    },
  ];

  if (teamsValue) {
    conditions.push({
      key: "teams",
      label: labels.teams,
      value: teamsValue,
      accent: "cyan",
      wide: true,
    });
  }

  const panelBody = (
    <div
      className={[
        "relative z-[1] px-3.5",
        overlay ? "space-y-2.5 pt-2 pb-3" : "space-y-3 py-3.5",
      ].join(" ")}
    >
        <div className="space-y-2">
          <CommunityGroupZoneLabel>{labels.title}</CommunityGroupZoneLabel>
          <h1
            className={[
              nameOxanium.className,
              jp.className,
              "font-extrabold leading-tight tracking-[0.04em] text-slate-50",
              compact ? "text-[22px] sm:text-2xl" : "text-2xl sm:text-[26px]",
            ].join(" ")}
          >
            {summary.name}
          </h1>
        </div>

        <div className="h-px bg-cyan-400/12" aria-hidden />

        <div className="space-y-2">
          <CommunityGroupZoneLabel>{labels.memo}</CommunityGroupZoneLabel>
          <p className="whitespace-pre-wrap text-[13px] leading-[21px] text-white/68">
            {summary.description?.trim() || "—"}
          </p>
        </div>

        <div className="h-px bg-cyan-400/12" aria-hidden />

        <div className="space-y-2">
          <CommunityGroupZoneLabel>{labels.conditions}</CommunityGroupZoneLabel>
          <div className="grid grid-cols-2 gap-2">
            {conditions.map((item) => (
              <ConditionChip
                key={item.key}
                label={item.label}
                value={item.value}
                accent={item.accent}
                wide={item.wide}
                overlay={overlay}
              />
            ))}
          </div>
        </div>

        {summary.archived ? (
          <div className="flex items-center gap-2 border-t border-amber-400/18 pt-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/85" aria-hidden />
            <p className="text-xs font-semibold text-amber-400/90">{labels.ended}</p>
          </div>
        ) : null}
    </div>
  );

  if (overlay) {
    return panelBody;
  }

  return (
    <div
      className={[
        MATCH_LIST_CYBER_CARD_CLASS,
        "relative mb-4 overflow-hidden",
        compact ? "" : "",
      ].join(" ")}
    >
      <div
        className={[MATCH_LIST_CYBER_GRID_CLASS, "pointer-events-none absolute inset-0 opacity-[0.32]"].join(
          " "
        )}
        aria-hidden
      />
      {panelBody}
    </div>
  );
}
