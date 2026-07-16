"use client";

import type {
  PredictProBrief,
  ProBriefTeamCard,
} from "@/lib/predict/predictProBrief";
import {
  briefEdgeDetail,
  briefLineText,
} from "@/lib/predict/predictProBrief";
import type { Language } from "@/lib/i18n/language";
import { nameOxanium } from "@/lib/fonts";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";

type Props = {
  brief: PredictProBrief;
  language: Language;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  className?: string;
};

function teamDisplayName(teamId: string, fallback: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallback;
}

function teamAccent(teamId: string): string {
  const league = teamId.startsWith("nba-") ? "nba" : "wc";
  return getTeamJerseyPrimaryColor(league, teamId);
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function SectionLabel({
  children,
  tone,
}: {
  children: string;
  tone: "matchup" | "schedule" | "context";
}) {
  const color =
    tone === "matchup"
      ? "text-emerald-300/80"
      : tone === "schedule"
        ? "text-amber-200/80"
        : "text-cyan-300/75";
  return (
    <p
      className={[
        nameOxanium.className,
        "text-[8px] font-extrabold uppercase tracking-[0.16em]",
        color,
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function TeamBriefCard({
  side,
  teamId,
  teamName,
  card,
  language,
}: {
  side: "home" | "away";
  teamId: string;
  teamName: string;
  card: ProBriefTeamCard;
  language: Language;
}) {
  const lang = language === "ja" ? "ja" : "en";
  const sideLabel = side === "home" ? "HOME" : "AWAY";
  const primary = teamAccent(teamId);
  const border = hexToRgba(primary, 0.55);
  const fill = hexToRgba(primary, 0.06);
  const divider = hexToRgba(primary, 0.2);

  return (
    <article
      className="col-span-1 row-span-4 grid min-w-0 grid-rows-subgrid overflow-hidden bg-[rgba(6,11,18,0.92)]"
      style={{
        border: `1px solid ${border}`,
        boxShadow: `inset 0 1px 0 ${hexToRgba(primary, 0.28)}`,
        background: `linear-gradient(165deg, ${fill} 0%, rgba(6,11,18,0.94) 48%)`,
        clipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)",
      }}
    >
      <header className="px-2 py-1.5" style={{ borderBottom: `1px solid ${divider}` }}>
        <p
          className={[
            nameOxanium.className,
            "text-[7px] font-bold uppercase tracking-[0.2em]",
          ].join(" ")}
          style={{ color: hexToRgba(primary, 0.85) }}
        >
          {sideLabel}
        </p>
        <p
          className={[
            nameOxanium.className,
            "truncate text-[12px] font-extrabold uppercase italic leading-none tracking-wide text-white",
          ].join(" ")}
        >
          {teamDisplayName(teamId, teamName)}
        </p>
      </header>

      <div className="px-2 py-2">
        <SectionLabel tone="matchup">Matchup</SectionLabel>
        {card.edges.length > 0 ? (
          <ul className="mt-1 space-y-1.5">
            {card.edges.map((edge, i) => {
              const detail = briefEdgeDetail(edge, lang);
              return (
                <li key={`e-${i}`} className="min-w-0">
                  <p
                    className={[
                      nameOxanium.className,
                      "text-[11px] font-extrabold uppercase leading-snug tracking-[0.04em] text-white/92",
                    ].join(" ")}
                  >
                    {edge.label}
                  </p>
                  {detail ? (
                    <p className="mt-0.5 text-[10px] leading-snug text-white/45">
                      {detail}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-1 text-[10px] text-white/35">—</p>
        )}
      </div>

      <div className="px-2 py-2" style={{ borderTop: `1px solid ${divider}` }}>
        <SectionLabel tone="schedule">Schedule</SectionLabel>
        {card.schedule.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {card.schedule.map((item, i) => (
              <li
                key={`s-${i}`}
                className="text-[11px] font-medium leading-snug text-amber-50/85"
              >
                {briefLineText(item, lang)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[10px] text-white/35">—</p>
        )}
      </div>

      <div className="px-2 py-2" style={{ borderTop: `1px solid ${divider}` }}>
        <SectionLabel tone="context">Context</SectionLabel>
        {card.context.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {card.context.map((item, i) => (
              <li
                key={`c-${i}`}
                className="text-[11px] font-medium leading-snug text-cyan-50/80"
              >
                {briefLineText(item, lang)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[10px] text-white/35">—</p>
        )}
      </div>
    </article>
  );
}

/** 予想オーバーレイ — Pro Insight（HOME / AWAY · MATCHUP / SCHEDULE / CONTEXT） */
export default function PredictProBriefPanel({
  brief,
  language,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  className,
}: Props) {
  return (
    <section
      className={[
        "relative overflow-hidden border border-cyan-400/22 bg-[rgba(5,10,18,0.72)] px-2.5 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ boxShadow: "inset 0 1px 0 rgba(34,211,238,0.12)" }}
    >
      <header className="mb-1.5">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/90",
          ].join(" ")}
        >
          Pro Insight
        </p>
      </header>

      {/* subgrid で MATCHUP / SCHEDULE / CONTEXT の高さを両カードで揃える */}
      <div className="grid grid-cols-2 grid-rows-[auto_auto_auto_auto] gap-1.5">
        <TeamBriefCard
          side="home"
          teamId={homeTeamId}
          teamName={homeTeamName}
          card={brief.home}
          language={language}
        />
        <TeamBriefCard
          side="away"
          teamId={awayTeamId}
          teamName={awayTeamName}
          card={brief.away}
          language={language}
        />
      </div>
    </section>
  );
}
