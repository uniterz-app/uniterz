"use client";

import type {
  PredictProBrief,
  ProBriefEdgeItem,
  ProBriefLineItem,
  ProBriefTeamCard,
} from "@/lib/predict/predictProBrief";
import {
  briefEdgeDetail,
  briefLineText,
} from "@/lib/predict/predictProBrief";
import {
  proInsightGateCopy,
  type ProInsightGateBulletIcon,
} from "@/lib/predict/proInsightGateCopy";
import type { Language } from "@/lib/i18n/language";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import type { ReactNode } from "react";
import {
  CalendarRange,
  MessageSquareText,
  Scale,
  Swords,
  Waypoints,
} from "lucide-react";

type Props = {
  brief?: PredictProBrief | null;
  language: Language;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  className?: string;
  /** Free: タイトル下をぼかして CTA */
  locked?: boolean;
  onPressUpgrade?: () => void;
};

type SectionTone = "matchup" | "schedule" | "context";

const EMPTY_CARD: ProBriefTeamCard = {
  edges: [],
  schedule: [],
  context: [],
};

const BULLET_ICONS: Record<ProInsightGateBulletIcon, typeof Swords> = {
  matchup: Swords,
  schedule: CalendarRange,
  context: Waypoints,
  edge: Scale,
  comment: MessageSquareText,
};

function teamNick(teamId: string, fallback: string): string {
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

function TitleWithBrandFonts({ title }: { title: string }) {
  return (
    <>
      {title.split(/(Pro)/).map((part, i) =>
        part === "Pro" ? (
          <span
            key={i}
            className={[
              nameOxanium.className,
              "font-extrabold uppercase tracking-[0.06em]",
            ].join(" ")}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SectionLabel({
  children,
  tone,
}: {
  children: string;
  tone: SectionTone;
}) {
  const color =
    tone === "matchup"
      ? "text-emerald-300/90"
      : tone === "schedule"
        ? "text-amber-200/90"
        : "text-cyan-300/90";
  return (
    <p
      className={[
        nameOxanium.className,
        "text-center text-[10px] font-extrabold uppercase tracking-[0.14em]",
        color,
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function EdgeBlock({
  edges,
  language,
  align,
}: {
  edges: ProBriefEdgeItem[];
  language: Language;
  align: "left" | "right";
}) {
  const lang = language === "ja" ? "ja" : "en";
  const textAlign = align === "right" ? "text-right" : "text-left";
  if (edges.length === 0) {
    return <p className={`text-[13px] text-white/35 ${textAlign}`}>—</p>;
  }
  return (
    <ul className="space-y-2">
      {edges.map((edge, i) => {
        const detail = briefEdgeDetail(edge, lang);
        return (
          <li key={`e-${i}`} className="min-w-0">
            <p
              className={[
                nameOxanium.className,
                textAlign,
                "text-[13px] font-extrabold uppercase leading-snug tracking-[0.03em] text-white/92",
              ].join(" ")}
            >
              {edge.label}
            </p>
            {detail ? (
              <p
                className={`mt-0.5 text-[12px] leading-snug text-white/50 ${textAlign}`}
              >
                {detail}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function LineBlock({
  items,
  language,
  align,
  tone,
}: {
  items: ProBriefLineItem[];
  language: Language;
  align: "left" | "right";
  tone: "schedule" | "context";
}) {
  const lang = language === "ja" ? "ja" : "en";
  const textAlign = align === "right" ? "text-right" : "text-left";
  const color =
    tone === "schedule" ? "text-amber-50/85" : "text-cyan-50/80";
  if (items.length === 0) {
    return <p className={`text-[13px] text-white/35 ${textAlign}`}>—</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li
          key={`${tone}-${i}`}
          className={`text-[13px] font-medium leading-snug ${color} ${textAlign}`}
        >
          {briefLineText(item, lang)}
        </li>
      ))}
    </ul>
  );
}

function CompareSection({
  label,
  tone,
  left,
  right,
}: {
  label: string;
  tone: SectionTone;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-x-1.5 border-b border-white/8 py-2.5 last:border-b-0">
      <div className="min-w-0">{left}</div>
      <div className="flex shrink-0 items-center justify-center px-0.5">
        <SectionLabel tone={tone}>{label}</SectionLabel>
      </div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

function PlaceholderBody() {
  return (
    <div className="space-y-2">
      <p className={[nameOxanium.className, "text-[13px] font-extrabold text-white/40"].join(" ")}>
        ······
      </p>
      <p className="text-[12px] text-white/30">······</p>
      <p className="text-[13px] text-white/30">······</p>
    </div>
  );
}

/** 予想オーバーレイ — Pro Insight（タイトル + PRO バッジ + 左右比較 / Free ぼかし CTA） */
export default function PredictProBriefPanel({
  brief = null,
  language,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  className,
  locked = false,
  onPressUpgrade,
}: Props) {
  const gateLang = language === "ja" ? "ja" : "en";
  const gate = proInsightGateCopy(gateLang);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = teamAccent(homeTeamId);
  const awayColor = teamAccent(awayTeamId);
  const home = brief?.home ?? EMPTY_CARD;
  const away = brief?.away ?? EMPTY_CARD;
  const usePlaceholder = brief == null;

  const body = (
    <>
      <CompareSection
        label="MATCHUP"
        tone="matchup"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <EdgeBlock edges={home.edges} language={language} align="right" />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <EdgeBlock edges={away.edges} language={language} align="left" />
          )
        }
      />
      <CompareSection
        label="SCHEDULE"
        tone="schedule"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={home.schedule}
              language={language}
              align="right"
              tone="schedule"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={away.schedule}
              language={language}
              align="left"
              tone="schedule"
            />
          )
        }
      />
      <CompareSection
        label="CONTEXT"
        tone="context"
        left={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={home.context}
              language={language}
              align="right"
              tone="context"
            />
          )
        }
        right={
          usePlaceholder ? (
            <PlaceholderBody />
          ) : (
            <LineBlock
              items={away.context}
              language={language}
              align="left"
              tone="context"
            />
          )
        }
      />
    </>
  );

  return (
    <section
      className={[
        "relative overflow-hidden border border-cyan-400/22 bg-[rgba(5,10,18,0.88)] px-2.5 py-2.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ boxShadow: "inset 0 1px 0 rgba(34,211,238,0.12)" }}
    >
      <div className="relative mb-2.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-white/12 pb-3">
        <div className="min-w-0">
          <p
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.16em]",
            ].join(" ")}
            style={{ color: hexToRgba(homeColor, 0.9) }}
          >
            HOME
          </p>
          <p
            className={[
              nameBebas.className,
              "truncate text-[18px] font-bold uppercase leading-none",
            ].join(" ")}
            style={{ ...matchCardTeamNameStyle(true), color: homeColor }}
          >
            {homeNick}
          </p>
        </div>

        <div
          className="flex shrink-0 items-center justify-center px-1"
          style={{ transform: "scale(1.18)" }}
        >
          <ProCyberBadge premium ariaLabel="PRO" />
        </div>

        <div className="min-w-0 text-right">
          <p
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.16em]",
            ].join(" ")}
            style={{ color: hexToRgba(awayColor, 0.9) }}
          >
            AWAY
          </p>
          <p
            className={[
              nameBebas.className,
              "truncate text-[18px] font-bold uppercase leading-none",
            ].join(" ")}
            style={{ ...matchCardTeamNameStyle(true), color: awayColor }}
          >
            {awayNick}
          </p>
        </div>
      </div>

      {locked ? (
        <div className="relative isolate min-h-[320px] overflow-hidden">
          <div
            aria-hidden
            className="select-none [mask-image:linear-gradient(180deg,#000_50%,transparent_100%)]"
          >
            {body}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 backdrop-blur-[12px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(4,8,14,0.22) 0%, rgba(4,8,14,0.62) 48%, rgba(4,8,14,0.82) 100%)",
            }}
          />
          <div className="absolute inset-0 z-1 flex items-start justify-center px-2 pb-6 pt-6 sm:pt-8">
            <div className="flex w-full max-w-[22rem] flex-col items-stretch gap-3 px-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <p
                  className={[
                    nameOxanium.className,
                    "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80",
                  ].join(" ")}
                >
                  {gate.eyebrow}
                </p>
                <span className="inline-flex origin-top scale-[1.45]">
                  <ProCyberBadge
                    {...proBadgeStaticMotion}
                    premium
                    ariaLabel={gateLang === "ja" ? "Pro会員" : "Pro member"}
                  />
                </span>
              </div>
              <h2 className="text-balance text-[17px] font-bold leading-snug text-white">
                <TitleWithBrandFonts title={gate.title} />
              </h2>
              <p className="text-pretty text-[13px] leading-relaxed text-white/72">
                {gate.body}
              </p>
              {onPressUpgrade ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={onPressUpgrade}
                    className={[
                      nameOxanium.className,
                      "min-h-10 min-w-[160px] border border-white/35 bg-[#00F5FF] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {gate.cta}
                  </button>
                </div>
              ) : null}
              <div className="w-full rounded-[2px] border border-orange-400/55 bg-orange-500/[0.07] px-3 py-2.5 text-left shadow-[0_0_18px_rgba(251,146,60,0.12)]">
                <ul className="list-none space-y-2">
                  {gate.bullets.map((item) => {
                    const Icon = BULLET_ICONS[item.icon];
                    return (
                      <li key={item.title} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border border-orange-400/45 bg-orange-500/15 text-orange-300"
                          aria-hidden
                        >
                          <Icon className="h-3 w-3" strokeWidth={2.4} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={[
                              nameOxanium.className,
                              "text-[11px] font-extrabold tracking-[0.04em] text-orange-100",
                            ].join(" ")}
                          >
                            {item.title}
                          </p>
                          <p className="mt-0.5 break-words text-[11px] leading-snug text-white/70">
                            {item.detail}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">{body}</div>
      )}
    </section>
  );
}
