"use client";

/**
 * 新 Pro Insight UI — 試合1本 · 4枠短文 · 各枠2本。
 * HOME/AWAY 分割なし（Native `PredictProInsightNarrativePanelNative` 相当）。
 */
import { useMemo } from "react";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeKind,
} from "@/lib/predict/proInsightNarrativeTypes";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import type { Language } from "@/lib/i18n/language";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { nameOxanium, jp } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";

type Props = {
  brief: ProInsightNarrativeBrief;
  language: Language;
  homeTeamName?: string;
  awayTeamName?: string;
  className?: string;
};

const SECTION_ACCENT: Record<ProInsightNarrativeKind, string> = {
  MATCHUP: "rgba(110,231,183,0.95)",
  SCHEDULE: "rgba(253,230,138,0.95)",
  CONTEXT: "rgba(103,232,249,0.92)",
  "INJURY IMPACT": "rgba(251,113,133,0.95)",
};

function teamNick(teamId: string, fallbackName: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallbackName.trim();
}

function t(strings: UiStrings, language: Language): string {
  return L(resolveLocalizedLang(language), strings);
}

export default function PredictProInsightNarrativePanel({
  brief,
  language,
  homeTeamName = "",
  awayTeamName = "",
  className,
}: Props) {
  const homeNick = teamNick(brief.homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(brief.awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", brief.homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", brief.awayTeamId);

  const note = useMemo(() => {
    if (!brief.sampleNote) return null;
    return t(brief.sampleNote, language);
  }, [brief.sampleNote, language]);

  return (
    <div
      className={["bg-[#050508] border px-3 pt-3 pb-3.5", className]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: "rgba(212,175,90,0.35)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex origin-left scale-[0.92] shrink-0">
          <ProCyberBadge
            {...proBadgeStaticMotion}
            premium
            ariaLabel="Pro"
          />
        </span>
        <span
          className="min-w-0 shrink truncate uppercase"
          style={{
            ...matchCardTeamNameStyle(true),
            color: awayColor,
            fontSize: 15,
            letterSpacing: "0.08em",
            transform: "skewX(-8deg)",
          }}
        >
          {awayNick}
        </span>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 text-[11px] tracking-wide text-white/45 lowercase",
          ].join(" ")}
          style={{ transform: "skewX(-8deg)" }}
        >
          vs
        </span>
        <span
          className="min-w-0 shrink truncate uppercase"
          style={{
            ...matchCardTeamNameStyle(true),
            color: homeColor,
            fontSize: 15,
            letterSpacing: "0.08em",
            transform: "skewX(-8deg)",
          }}
        >
          {homeNick}
        </span>
      </div>

      {note ? (
        <p
          className={[
            jp.className,
            "mb-2.5 text-[11px] font-semibold leading-[15px] text-white/55",
          ].join(" ")}
        >
          {note}
        </p>
      ) : null}

      <div>
        {brief.sections.map((section, si) => {
          const accent = SECTION_ACCENT[section.kind];
          return (
            <div
              key={section.kind}
              className={[
                "flex flex-col gap-2 py-3",
                si < brief.sections.length - 1
                  ? "border-b border-white/[0.08]"
                  : "",
              ].join(" ")}
            >
              <div
                className="inline-flex self-start border bg-black px-2 py-0.5"
                style={{
                  borderColor: accent,
                  transform: "skewX(-6deg)",
                }}
              >
                <span
                  className={[
                    nameOxanium.className,
                    "text-[10px] font-extrabold uppercase tracking-[0.16em]",
                  ].join(" ")}
                  style={{ color: accent }}
                >
                  {section.kind}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {section.items.map((item, ii) => (
                  <div key={`${section.kind}-${ii}`} className="flex flex-col gap-1">
                    <p
                      className={[
                        jp.className,
                        "text-[13px] font-semibold leading-[19px] text-white/90",
                      ].join(" ")}
                      style={{ transform: "skewX(-4deg)" }}
                    >
                      {t(item.body, language)}
                    </p>
                    {item.evidence.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {item.evidence.map((ev, j) => (
                          <p
                            key={j}
                            className={[
                              nameOxanium.className,
                              "text-[12px] leading-4 tracking-wide text-white/50",
                            ].join(" ")}
                          >
                            · {t(ev, language)}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
