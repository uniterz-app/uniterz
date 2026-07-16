"use client";

import type { PredictProInfo } from "@/lib/predict/buildPredictProInfo";
import type { PredictSelfPattern } from "@/lib/predict/buildPredictProInfo";
import type { PredictTeamIntel, PredictTeamTone } from "@/lib/predict/predictTeamIntel";
import {
  pctFromRate,
  personalWinRate,
  teamPersonalTone,
  MIN_TEAM_PERSONAL_POSTS,
} from "@/lib/predict/predictTeamIntel";
import {
  teamContextRows,
  type TeamContextRowView,
} from "@/lib/predict/predictTeamContextDisplay";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { matchScoreClass, nameOxanium } from "@/lib/fonts";
import { PREDICT_HUD_HAIRLINE } from "@/lib/predict/predictOverlayHud";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";

type Tone = PredictTeamTone;

const TONE_TEXT: Record<Tone, string> = {
  up: "text-emerald-300",
  down: "text-rose-300",
  neutral: "text-white/88",
};

const TONE_ROW: Record<Tone, { border: string; bg: string; accent: string }> = {
  up: {
    border: "rgba(45,255,110,0.32)",
    bg: "rgba(45,255,110,0.06)",
    accent: "#7CFFB0",
  },
  down: {
    border: "rgba(255,45,120,0.35)",
    bg: "rgba(255,45,120,0.07)",
    accent: "#FF7AAA",
  },
  neutral: {
    border: "rgba(34,211,238,0.28)",
    bg: "rgba(34,211,238,0.05)",
    accent: "rgba(186,230,253,0.95)",
  },
};

function teamDisplayName(teamId: string, fallback: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallback;
}

function formatSelfPattern(
  pattern: PredictSelfPattern,
  language: Language
): string {
  const p = t(language).predict.timing;
  if (pattern.id === "awayWeak") {
    return p.awayWeak.replace("{userPct}", String(pattern.params.userPct));
  }
  return p.underdogStrong
    .replace("{hits}", String(pattern.params.hits))
    .replace("{picks}", String(pattern.params.picks));
}

function toneWord(tone: Tone, language: Language): string {
  const timing = t(language).predict.timing;
  if (tone === "up") return timing.strongLabel;
  if (tone === "down") return timing.weakLabel;
  return "";
}

function ContextRow({ row }: { row: TeamContextRowView }) {
  const colors = TONE_ROW[row.tone];

  return (
    <div
      className="min-w-0 px-2 py-1.5"
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.bg,
      }}
    >
      <p
        className={[
          nameOxanium.className,
          "text-[8px] font-bold uppercase leading-none tracking-[0.14em]",
        ].join(" ")}
        style={{ color: colors.accent }}
      >
        {row.title}
      </p>
      <p
        className={[
          matchScoreClass,
          "mt-1 text-[15px] font-black tabular-nums leading-none text-white",
        ].join(" ")}
      >
        {row.headline}
      </p>
      {row.detail ? (
        <p className="mt-0.5 text-[9px] font-medium leading-snug tabular-nums text-white/48">
          {row.detail}
        </p>
      ) : null}
    </div>
  );
}

function TeamIntelCard({
  intel,
  language,
  tournamentAvgPct,
}: {
  intel: PredictTeamIntel;
  language: Language;
  tournamentAvgPct: number;
}) {
  const timing = t(language).predict.timing;
  const p = intel.personal;
  const posts = p?.posts ?? 0;
  const wins = p?.wins ?? 0;
  const hasData = Boolean(p) && posts >= MIN_TEAM_PERSONAL_POSTS;
  const tone: Tone = hasData ? teamPersonalTone(p) : "neutral";
  const pct = pctFromRate(personalWinRate(p) ?? 0);
  const formRows = teamContextRows(intel.contexts, language, intel.side, 3);
  const sideLabel = intel.side === "home" ? "HOME" : "AWAY";
  const affinity = toneWord(tone, language);

  return (
    <article
      className="relative flex min-w-0 flex-col overflow-hidden bg-[rgba(6,11,18,0.9)]"
      style={{
        border: `1px solid ${PREDICT_HUD_HAIRLINE}`,
        clipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
        aria-hidden
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[7px] w-[7px] bg-cyan-400/70"
        style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
      />

      <header className="border-b border-cyan-400/12 px-2 py-1.5">
        <p
          className={[
            nameOxanium.className,
            "text-[7px] font-bold uppercase tracking-[0.2em] text-cyan-300/55",
          ].join(" ")}
        >
          {sideLabel}
        </p>
        <p
          className={[
            nameOxanium.className,
            "truncate text-[13px] font-extrabold uppercase italic leading-none tracking-wide text-white",
          ].join(" ")}
        >
          {teamDisplayName(intel.teamId, intel.teamName)}
        </p>
      </header>

      {formRows.length > 0 ? (
        <div className="space-y-1 px-1.5 py-1.5">
          <p
            className={[
              nameOxanium.className,
              "px-0.5 text-[7px] font-bold uppercase tracking-[0.16em] text-white/38",
            ].join(" ")}
          >
            {timing.teamFormLabel}
          </p>
          <div className="space-y-1">
            {formRows.map((row, i) => (
              <ContextRow key={`${row.title}-${i}`} row={row} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto border-t border-cyan-400/12 px-2 py-2">
        <p
          className={[
            nameOxanium.className,
            "text-[7px] font-bold uppercase tracking-[0.16em] text-white/40",
          ].join(" ")}
        >
          {timing.yourHitsLabel}
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
          {affinity ? (
            <span
              className={[
                nameOxanium.className,
                "shrink-0 text-[9px] font-extrabold uppercase leading-none tracking-wide",
                TONE_TEXT[tone],
              ].join(" ")}
            >
              {affinity}
            </span>
          ) : null}
          <span
            className={[
              matchScoreClass,
              "text-[16px] font-black tabular-nums leading-none text-white",
            ].join(" ")}
          >
            {wins}/{posts}
          </span>
          <span
            className={[
              matchScoreClass,
              "text-[13px] font-black italic tabular-nums leading-none",
              hasData ? TONE_TEXT[tone] : "text-white/28",
            ].join(" ")}
          >
            {hasData ? `${pct}%` : timing.lowData}
          </span>
        </div>
        {hasData ? (
          <p className="mt-0.5 text-[8px] tabular-nums tracking-wide text-white/35">
            {intel.teamId.startsWith("nba-")
              ? language === "ja"
                ? `リーグ平均 ${tournamentAvgPct}%`
                : `League avg ${tournamentAvgPct}%`
              : language === "ja"
                ? `大会平均 ${tournamentAvgPct}%`
                : `Field avg ${tournamentAvgPct}%`}
          </p>
        ) : null}
      </div>
    </article>
  );
}

type Props = {
  data: PredictProInfo;
  language: Language;
  className?: string;
};

/** 予想オーバーレイ — Pro Info（チーム調子 → あなたの的中） */
export default function PredictProInfoPanel({ data, language, className }: Props) {
  const timing = t(language).predict.timing;
  const tournamentAvgPct = pctFromRate(data.tournamentAvgWinRate);

  return (
    <section
      className={[
        "relative overflow-hidden border border-cyan-400/20 bg-[rgba(5,10,18,0.72)] px-2.5 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        boxShadow: "inset 0 1px 0 rgba(34,211,238,0.12)",
      }}
    >
      <header className="mb-1.5 flex items-end justify-between gap-2">
        <div>
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/90",
            ].join(" ")}
          >
            {timing.proInfoTitle}
          </p>
          <p className="text-[10px] leading-tight text-white/42">
            {timing.proInfoSubtitle}
          </p>
        </div>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 border border-amber-300/35 bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-amber-200/85",
          ].join(" ")}
        >
          PRO
        </span>
      </header>

      <div className="grid grid-cols-2 gap-1.5">
        <TeamIntelCard
          intel={data.homeIntel}
          language={language}
          tournamentAvgPct={tournamentAvgPct}
        />
        <TeamIntelCard
          intel={data.awayIntel}
          language={language}
          tournamentAvgPct={tournamentAvgPct}
        />
      </div>

      {data.selfPattern ? (
        <p className="mt-1.5 border-t border-cyan-400/12 pt-1.5 text-[10px] font-medium leading-snug text-cyan-100/70">
          {formatSelfPattern(data.selfPattern, language)}
        </p>
      ) : null}
    </section>
  );
}
