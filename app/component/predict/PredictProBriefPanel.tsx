"use client";

import type { Language } from "@/lib/i18n/language";
import type {
  PredictProBrief,
  ProBriefEdgeItem,
  ProBriefLineItem,
  ProBriefPlayerItem,
  ProBriefTeamCard,
} from "@/lib/predict/predictProBrief";
import {
  briefEdgeDetail,
  briefLineText,
  briefPlayerDetail,
  briefSampleNote,
  splitBriefLineLead,
} from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";
import {
  proInsightGateCopy,
  type ProInsightGateBulletIcon,
} from "@/lib/predict/proInsightGateCopy";
import { PRO_INSIGHT_GATE_SAMPLE_BRIEF } from "@/lib/predict/proInsightGateSampleBrief";
import { UNITERZ_PRO_BADGE_GOLD } from "@/lib/units/uniterzProBadge";
import { nameOxanium, jp } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import { resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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

type SectionTone = "matchup" | "schedule" | "context" | "players";

const EMPTY_CARD: ProBriefTeamCard = {
  edges: [],
  schedule: [],
  context: [],
  players: [],
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
      {title.split(/(PRO INSIGHT|Pro)/).map((part, i) => {
        if (!part) return null;
        if (part === "PRO INSIGHT" || part === "Pro") {
          return (
            <span
              key={i}
              className={[
                nameOxanium.className,
                "font-extrabold uppercase tracking-[0.06em]",
              ].join(" ")}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
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
        : tone === "context"
          ? "text-cyan-300/90"
          : "text-violet-300/90";
  return (
    <p
      className={[
        nameOxanium.className,
        "relative inline-block bg-black px-2 whitespace-nowrap text-center text-[10px] font-extrabold uppercase tracking-[0.18em]",
        color,
      ].join(" ")}
      style={{ transform: "skewX(-6deg)" }}
    >
      {children}
    </p>
  );
}

const ITEM_LABEL =
  "text-[13px] font-extrabold leading-snug tracking-[0.04em] text-white/92";
const ITEM_LABEL_SKEW = { transform: "skewX(-6deg)" } as const;
const ITEM_DETAIL = "mt-0.5 text-[12px] leading-snug tracking-[0.02em]";

function detailFontClass(lang: LocalizedLang): string {
  return lang === "ja" ? jp.className : nameOxanium.className;
}

function labelFontClass(lang: LocalizedLang): string {
  return [
    nameOxanium.className,
    ITEM_LABEL,
    lang === "en" ? "uppercase" : "",
  ]
    .filter(Boolean)
    .join(" ");
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
  const lang = resolveLocalizedLang(language);
  const textAlign = align === "right" ? "text-right" : "text-left";
  if (edges.length === 0) {
    return (
      <p
        className={[
          detailFontClass(lang),
          "text-[13px] text-white/35",
          textAlign,
        ].join(" ")}
      >
        —
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {edges.map((edge, i) => {
        const detail = briefEdgeDetail(edge, lang);
        return (
          <li key={`e-${i}`} className="min-w-0">
            <p
              className={[labelFontClass(lang), textAlign].join(" ")}
              style={ITEM_LABEL_SKEW}
            >
              {edge.label}
            </p>
            {detail ? (
              <p
                className={[
                  detailFontClass(lang),
                  ITEM_DETAIL,
                  "font-semibold text-white/72",
                  textAlign,
                ].join(" ")}
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
  const lang = resolveLocalizedLang(language);
  const textAlign = align === "right" ? "text-right" : "text-left";
  const bodyColor =
    tone === "schedule" ? "text-amber-50/82" : "text-cyan-50/82";
  if (items.length === 0) {
    return (
      <p
        className={[
          detailFontClass(lang),
          "text-[13px] text-white/35",
          textAlign,
        ].join(" ")}
      >
        —
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const { label, body } = splitBriefLineLead(briefLineText(item, lang));
        return (
          <li key={`${tone}-${i}`} className="min-w-0">
            {label ? (
              <>
                <p
                  className={[labelFontClass(lang), textAlign].join(" ")}
                  style={ITEM_LABEL_SKEW}
                >
                  {label}
                </p>
                <p
                  className={[
                    detailFontClass(lang),
                    ITEM_DETAIL,
                    "font-semibold",
                    bodyColor,
                    textAlign,
                  ].join(" ")}
                >
                  {body}
                </p>
              </>
            ) : (
              <p
                className={[
                  detailFontClass(lang),
                  ITEM_DETAIL,
                  "font-semibold",
                  bodyColor,
                  textAlign,
                ].join(" ")}
              >
                {body}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PlayerBlock({
  players,
  language,
  align,
}: {
  players: ProBriefPlayerItem[];
  language: Language;
  align: "left" | "right";
}) {
  const lang = resolveLocalizedLang(language);
  const textAlign = align === "right" ? "text-right" : "text-left";
  if (players.length === 0) {
    return (
      <p
        className={[
          detailFontClass(lang),
          "text-[13px] text-white/35",
          textAlign,
        ].join(" ")}
      >
        —
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {players.map((player, i) => {
        const detail = briefPlayerDetail(player, lang);
        return (
          <li key={`p-${player.playerId ?? i}`} className="min-w-0">
            <p
              className={[labelFontClass(lang), textAlign].join(" ")}
              style={ITEM_LABEL_SKEW}
            >
              {player.playerName} · {player.label}
            </p>
            {detail ? (
              <p
                className={[
                  detailFontClass(lang),
                  ITEM_DETAIL,
                  "font-semibold text-white/72",
                  textAlign,
                ].join(" ")}
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
    <div className="border-b border-white/8 py-2.5 last:border-b-0">
      <div className="relative z-1 mb-2 flex justify-center">
        <SectionLabel tone={tone}>{label}</SectionLabel>
      </div>
      <div className="grid grid-cols-2 items-start gap-x-4">
        <div className="min-w-0">{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
    </div>
  );
}

function PlaceholderBody() {
  return (
    <div className="space-y-2">
      <p
        className={[
          nameOxanium.className,
          "text-[13px] font-extrabold text-white/40",
        ].join(" ")}
      >
        ······
      </p>
      <p className="text-[12px] text-white/30">······</p>
      <p className="text-[13px] text-white/30">······</p>
    </div>
  );
}

function TitleRow({
  homeNick,
  awayNick,
  homeColor,
  awayColor,
}: {
  homeNick: string;
  awayNick: string;
  homeColor: string;
  awayColor: string;
}) {
  return (
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
            nameOxanium.className,
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
            nameOxanium.className,
            "truncate text-[18px] font-bold uppercase leading-none",
          ].join(" ")}
          style={{ ...matchCardTeamNameStyle(true), color: awayColor }}
        >
          {awayNick}
        </p>
      </div>
    </div>
  );
}

/** 予想オーバーレイ — Pro Insight（HOME | AWAY 2カラム · Free ゲート CTA） */
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
  const gate = proInsightGateCopy(language);
  const [ctaPressed, setCtaPressed] = useState(false);
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = teamAccent(homeTeamId);
  const awayColor = teamAccent(awayTeamId);
  const safeBrief = useMemo(() => sanitizeProBriefForDisplay(brief), [brief]);
  /** Free ゲート下は実データ or サンプルで実画面例を見せる */
  const displayBrief =
    safeBrief ?? (locked ? PRO_INSIGHT_GATE_SAMPLE_BRIEF : null);
  const home = displayBrief?.home ?? EMPTY_CARD;
  const away = displayBrief?.away ?? EMPTY_CARD;
  const homePlayers = home.players ?? [];
  const awayPlayers = away.players ?? [];
  const hasPlayers = homePlayers.length > 0 || awayPlayers.length > 0;
  const usePlaceholder = displayBrief == null;

  const body = (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 bg-[rgba(0,245,255,0.38)]"
      />
      <div className="relative z-1">
        <CompareSection
          label="MATCHUP"
          tone="matchup"
          left={
            usePlaceholder ? (
              <PlaceholderBody />
            ) : (
              <EdgeBlock edges={home.edges} language={language} align="left" />
            )
          }
          right={
            usePlaceholder ? (
              <PlaceholderBody />
            ) : (
              <EdgeBlock edges={away.edges} language={language} align="right" />
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
                align="left"
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
                align="right"
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
                align="left"
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
                align="right"
                tone="context"
              />
            )
          }
        />
        {hasPlayers && !usePlaceholder ? (
          <CompareSection
            label="PLAYERS"
            tone="players"
            left={
              <PlayerBlock
                players={homePlayers}
                language={language}
                align="left"
              />
            }
            right={
              <PlayerBlock
                players={awayPlayers}
                language={language}
                align="right"
              />
            }
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <section
      className={[
        "relative overflow-hidden border bg-black px-2.5 py-2.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: UNITERZ_PRO_BADGE_GOLD.mid,
        boxShadow: `inset 0 1px 0 ${UNITERZ_PRO_BADGE_GOLD.deep}55`,
      }}
    >
      {!locked ? (
        <TitleRow
          homeNick={homeNick}
          awayNick={awayNick}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      ) : null}

      {!locked &&
      !usePlaceholder &&
      (safeBrief?.sampleNoteJa || safeBrief?.sampleNoteEn) ? (
        <p
          className={[
            nameOxanium.className,
            "mb-2 text-[10px] font-semibold leading-snug text-amber-200/75",
          ].join(" ")}
        >
          {briefSampleNote(safeBrief, language)}
        </p>
      ) : null}

      {locked ? (
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col items-center px-1 pb-1 pt-2">
            <div className="flex w-full max-w-[22rem] flex-col items-stretch gap-3 px-1 text-center">
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-[168px] max-w-[72%]">
                  <UniterzLogo width="100%" title="UNITERZ" />
                </div>
                <span className="inline-flex origin-top scale-[1.45]">
                  <ProCyberBadge
                    {...proBadgeStaticMotion}
                    premium
                    ariaLabel={gate.proMemberAria}
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
                    onPointerDown={() => setCtaPressed(true)}
                    onPointerUp={() => setCtaPressed(false)}
                    onPointerLeave={() => setCtaPressed(false)}
                    onPointerCancel={() => setCtaPressed(false)}
                    className={[
                      nameOxanium.className,
                      "inline-flex min-h-11 min-w-[168px] items-center justify-center border px-[18px] py-2.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out",
                      ctaPressed
                        ? "scale-[0.94] border-amber-200 bg-amber-300/20 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.35)]"
                        : "scale-100 border-amber-300/75 bg-[#050508] text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.18)] hover:border-amber-200 hover:bg-amber-300/10 hover:text-amber-100",
                    ].join(" ")}
                  >
                    {gate.cta}
                  </button>
                </div>
              ) : null}
              <div className="w-full rounded-none border border-orange-400/55 bg-orange-500/[0.07] px-3 py-2.5 text-left shadow-[0_0_18px_rgba(251,146,60,0.12)]">
                <ul className="list-none space-y-2">
                  {gate.bullets.map((item) => {
                    const Icon = BULLET_ICONS[item.icon];
                    return (
                      <li key={item.title} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-none border border-orange-400/45 bg-orange-500/15 text-orange-300"
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

          <div aria-hidden className="flex flex-col gap-2 pt-1">
            <p
              className={[
                nameOxanium.className,
                "text-center text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85",
              ].join(" ")}
            >
              {gate.exampleLabel}
            </p>
            <div className="border border-white/14 bg-black/55 px-2 py-2.5">
              <TitleRow
                homeNick={homeNick}
                awayNick={awayNick}
                homeColor={homeColor}
                awayColor={awayColor}
              />
              {body}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">{body}</div>
      )}
    </section>
  );
}
