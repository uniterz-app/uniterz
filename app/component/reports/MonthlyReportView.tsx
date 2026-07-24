"use client";

// 月次レポート（Pro）たたき台。
// 構成: 表紙（順位 + 称号）→ 既存 ProAnalysisView（数字/レーダー/クセ/相性/連勝）
//       → 月間ハイライト → 締めコメント。
// 分析カード群は既存 Pro Stats をそのまま流用し、レポート固有部分だけ新規。

import type { CSSProperties } from "react";
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { RankingsCyberPanel } from "@/app/component/rankings/RankingsCyberPanel";
import { ANALYSIS_TYPE_COLOR } from "@/shared/analysis/analysisTypeColor";
import { ANALYSIS_TYPE_META_JA } from "@/shared/analysis/analysisTypeMeta";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import type {
  MonthlyReportCover,
  MonthlyReportHighlights,
} from "@/lib/reports/monthlyReportPreviewMocks";

type Lang = "ja" | "en";

const COPY = {
  ja: {
    title: "MONTHLY REPORT",
    thisMonth: "今月の結果",
    participants: (n: number) => `${n}人中`,
    top: (p: string) => `TOP ${p}%`,
    posts: "投稿",
    wins: "勝",
    losses: "敗",
    typeLabel: "今月の分析タイプ",
    highlights: "月間ハイライト",
    bestPick: "ベスト予想",
    myPick: "自分の予想",
    bestDay: "ベストデー",
    bestDayLine: (w: number, p: number) => `${p}試合 ${w}勝`,
    streak: "最長連勝",
    streakUnit: "連勝",
    closing: (rank: number) =>
      `#${rank} で締めた1ヶ月。この記録は消えない。来月の1冊で更新しよう。`,
  },
  en: {
    title: "MONTHLY REPORT",
    thisMonth: "This Month",
    participants: (n: number) => `of ${n}`,
    top: (p: string) => `TOP ${p}%`,
    posts: "picks",
    wins: "W",
    losses: "L",
    typeLabel: "Analysis Type",
    highlights: "Highlights",
    bestPick: "Best Pick",
    myPick: "Your pick",
    bestDay: "Best Day",
    bestDayLine: (w: number, p: number) => `${w}W of ${p}`,
    streak: "Longest Streak",
    streakUnit: "wins",
    closing: (rank: number) =>
      `Closed the month at #${rank}. This one's on the record. Top it next month.`,
  },
} as const;

const PANEL_BG = "linear-gradient(170deg, rgba(14,20,32,0.98), rgba(6,10,16,1))";
const NOTCH_SM =
  "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)";

function fmtMonth(monthKey: string, lang: Lang): string {
  const [y, m] = monthKey.split("-");
  return lang === "ja" ? `${y}年${Number(m)}月` : `${y}-${m}`;
}

function fmtPt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function hexTint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      <span
        className={[
          nameOxanium.className,
          "inline-block bg-white px-2 py-[5px] text-[8px] font-black uppercase leading-none tracking-[0.18em] text-black",
        ].join(" ")}
      >
        {children}
      </span>
      <span
        className="pointer-events-none absolute -bottom-0.5 -left-1 text-[9px] leading-none text-white/30"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}

/* ============================================================
 * 表紙 — 月間順位 + 分析タイプ称号
 * ============================================================ */

function CoverBlock({ cover, lang }: { cover: MonthlyReportCover; lang: Lang }) {
  const c = COPY[lang];
  const delta = cover.rankDeltaPlaces;
  const losses = cover.totalPosts - cover.totalWins;
  const typeColor = ANALYSIS_TYPE_COLOR[cover.analysisTypeId];
  const typeLabel = ANALYSIS_TYPE_META_JA[cover.analysisTypeId].label;

  return (
    <RankingsCyberPanel>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.16em] text-white/42",
            ].join(" ")}
          >
            {c.thisMonth}
          </p>
          {cover.topPercent != null ? (
            <span
              className={[
                nameOxanium.className,
                "rounded-[2px] border border-cyan-400/40 bg-cyan-400/8 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-cyan-300",
              ].join(" ")}
              style={{ textShadow: "0 0 12px rgba(34,211,238,0.35)" }}
            >
              {c.top(fmtPt(cover.topPercent))}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-end gap-3">
          <p
            className={[nameBebas.className, "leading-none text-white"].join(" ")}
            style={{
              fontSize: "3.6rem",
              transform: "skewX(-10deg)",
              letterSpacing: "0.02em",
              textShadow: "0 0 24px rgba(34,211,238,0.28)",
            }}
          >
            <span className="text-white/40" style={{ fontSize: "2.1rem" }}>
              #
            </span>
            {cover.rank}
          </p>
          {delta != null ? (
            <span
              className={[
                nameBebas.className,
                "mb-1 inline-flex items-center gap-0.5 leading-none",
              ].join(" ")}
              style={{
                fontSize: "1.7rem",
                transform: "skewX(-10deg)",
                color:
                  delta > 0 ? "#34d399" : delta < 0 ? "#fb923c" : "rgba(255,255,255,0.45)",
                textShadow:
                  delta !== 0
                    ? `0 0 16px ${delta > 0 ? "rgba(52,211,153,0.32)" : "rgba(251,146,60,0.32)"}`
                    : undefined,
              }}
            >
              {delta > 0 ? (
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.75} aria-hidden />
              ) : delta < 0 ? (
                <ArrowDown className="h-[18px] w-[18px]" strokeWidth={2.75} aria-hidden />
              ) : null}
              {delta === 0 ? "±0" : Math.abs(delta)}
            </span>
          ) : null}
          <span
            className={[
              nameOxanium.className,
              "mb-1.5 ml-auto text-[11px] font-bold uppercase tracking-[0.1em] text-white/40",
            ].join(" ")}
          >
            {c.participants(cover.participantCount)}
          </span>
        </div>

        <div
          className="mt-2.5 flex items-baseline gap-3 pt-2.5"
          style={{ borderTop: "1px solid rgba(34,211,238,0.16)" }}
        >
          <p className="flex items-baseline gap-1.5">
            <span
              className={[nameBebas.className, "text-xl leading-none text-cyan-300"].join(" ")}
              style={{ textShadow: "0 0 14px rgba(34,211,238,0.35)" }}
            >
              {fmtPt(cover.totalPoints)}
            </span>
            <span
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
              ].join(" ")}
            >
              PTS
            </span>
          </p>
          <p
            className={[
              nameOxanium.className,
              "ml-auto text-[11px] font-bold tabular-nums tracking-[0.08em] text-white/55",
            ].join(" ")}
          >
            {c.posts} {cover.totalPosts} · {cover.totalWins}
            {c.wins}
            {losses}
            {c.losses}
          </p>
        </div>

        {/* 分析タイプ称号 — 表紙の主役 */}
        <div
          className="mt-3 px-3.5 py-3"
          style={{
            border: `1px solid ${hexTint(typeColor, "66")}`,
            background: `linear-gradient(170deg, ${hexTint(typeColor, "1f")}, rgba(6,10,16,0.95) 75%), ${PANEL_BG}`,
            boxShadow: `inset 0 0 18px ${hexTint(typeColor, "14")}`,
            clipPath: NOTCH_SM,
            WebkitClipPath: NOTCH_SM,
          }}
        >
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.18em] text-white/45",
            ].join(" ")}
          >
            {c.typeLabel}
          </p>
          <p
            className={[nameBebas.className, "mt-1 leading-none"].join(" ")}
            style={{
              fontSize: "1.9rem",
              transform: "skewX(-8deg)",
              color: typeColor,
              textShadow: `0 0 22px ${hexTint(typeColor, "59")}`,
              letterSpacing: "0.04em",
            }}
          >
            {typeLabel}
          </p>
        </div>
      </div>
    </RankingsCyberPanel>
  );
}

/* ============================================================
 * 月間ハイライト
 * ============================================================ */

function HighlightsBlock({
  highlights,
  lang,
}: {
  highlights: MonthlyReportHighlights;
  lang: Lang;
}) {
  const c = COPY[lang];
  const pick = highlights.bestPick;
  const homeColor = pick ? getTeamPrimaryColor("nba", pick.home.teamId) : "";
  const awayColor = pick ? getTeamPrimaryColor("nba", pick.away.teamId) : "";

  const cellStyle: CSSProperties = {
    border: "1px solid rgba(34,211,238,0.28)",
    background: PANEL_BG,
    boxShadow: "inset 0 0 0 1px rgba(8,14,26,0.85)",
    clipPath: NOTCH_SM,
    WebkitClipPath: NOTCH_SM,
  };

  return (
    <section>
      <SectionBadge>{c.highlights}</SectionBadge>
      <div className="mt-2 grid gap-1.5">
        {pick ? (
          <div className="relative overflow-hidden px-4 py-3" style={cellStyle}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${homeColor}22 0%, transparent 32%, transparent 68%, ${awayColor}22 100%)`,
              }}
              aria-hidden
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p
                  className={[
                    nameOxanium.className,
                    "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
                  ].join(" ")}
                >
                  {c.bestPick} · {pick.dateKey.slice(5).replace("-", "/")}
                </p>
                <span
                  className={[nameBebas.className, "text-xl leading-none text-emerald-400"].join(
                    " "
                  )}
                  style={{
                    transform: "skewX(-10deg)",
                    textShadow: "0 0 16px rgba(52,211,153,0.32)",
                  }}
                >
                  +{fmtPt(pick.points)}pt
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <p
                  className={[
                    nameOxanium.className,
                    "truncate text-right text-sm font-extrabold uppercase tracking-[0.06em]",
                  ].join(" ")}
                  style={{ color: homeColor }}
                >
                  {pick.home.abbr}
                </p>
                <p
                  className={[
                    nameBebas.className,
                    "text-2xl leading-none text-white tabular-nums",
                  ].join(" ")}
                >
                  {pick.home.score}
                  <span className="mx-1 text-white/35">–</span>
                  {pick.away.score}
                </p>
                <p
                  className={[
                    nameOxanium.className,
                    "truncate text-left text-sm font-extrabold uppercase tracking-[0.06em]",
                  ].join(" ")}
                  style={{ color: awayColor }}
                >
                  {pick.away.abbr}
                </p>
              </div>
              <p
                className={[
                  nameOxanium.className,
                  "mt-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/45",
                ].join(" ")}
              >
                {c.myPick} {pick.myHome}–{pick.myAway}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-1.5">
          {highlights.bestDay ? (
            <div className="px-3 py-2.5" style={cellStyle}>
              <p
                className={[
                  nameOxanium.className,
                  "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
                ].join(" ")}
              >
                {c.bestDay} · {highlights.bestDay.dateKey.slice(5).replace("-", "/")}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span
                  className={[nameBebas.className, "text-[22px] leading-none text-cyan-300"].join(
                    " "
                  )}
                  style={{ textShadow: "0 0 14px rgba(34,211,238,0.35)" }}
                >
                  +{fmtPt(highlights.bestDay.points)}
                </span>
                <span
                  className={[
                    nameOxanium.className,
                    "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                  ].join(" ")}
                >
                  PT
                </span>
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "mt-1 text-[9px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45",
                ].join(" ")}
              >
                {c.bestDayLine(highlights.bestDay.wins, highlights.bestDay.posts)}
              </p>
            </div>
          ) : null}

          <div className="px-3 py-2.5" style={cellStyle}>
            <p
              className={[
                nameOxanium.className,
                "flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
              ].join(" ")}
            >
              <Flame className="h-3 w-3 text-orange-400" strokeWidth={2.5} aria-hidden />
              {c.streak}
            </p>
            <p className="mt-1 flex items-baseline gap-1">
              <span
                className={[nameBebas.className, "text-[22px] leading-none text-orange-300"].join(
                  " "
                )}
                style={{ textShadow: "0 0 14px rgba(251,146,60,0.32)" }}
              >
                {highlights.longestWinStreak}
              </span>
              <span
                className={[
                  nameOxanium.className,
                  "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                ].join(" ")}
              >
                {c.streakUnit}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * main
 * ============================================================ */

export default function MonthlyReportView({
  cover,
  highlights,
  analysisProps,
  language = "ja",
}: {
  cover: MonthlyReportCover;
  highlights: MonthlyReportHighlights;
  /** 既存 ProAnalysisView にそのまま渡す props（builder 配線時に整理） */
  analysisProps: Omit<
    React.ComponentProps<typeof ProAnalysisView>,
    "language" | "onChangeMonth"
  >;
  language?: Lang;
}) {
  const c = COPY[language];

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-2">
        <h2
          className={[
            nameOxanium.className,
            "text-sm font-extrabold uppercase tracking-[0.14em] text-white",
          ].join(" ")}
        >
          {c.title}
        </h2>
        <p
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/45",
          ].join(" ")}
        >
          {fmtMonth(cover.monthKey, language)}
        </p>
      </header>

      <CoverBlock cover={cover} lang={language} />

      {/* 既存 Pro Stats カード群（数字で見る今月 / レーダー / クセ / 相性 / 連勝） */}
      <ProAnalysisView
        {...analysisProps}
        language={language}
        onChangeMonth={() => {}}
        playSectionEntrance={false}
      />

      <HighlightsBlock highlights={highlights} lang={language} />

      <p
        className="px-3.5 py-3 text-[12.5px] leading-relaxed text-white/70"
        style={{
          border: "1px solid rgba(34,211,238,0.42)",
          background: `linear-gradient(170deg, rgba(34,211,238,0.08), rgba(6,10,16,0.98) 70%), ${PANEL_BG}`,
          boxShadow: "inset 0 0 16px rgba(34,211,238,0.08)",
          clipPath: NOTCH_SM,
          WebkitClipPath: NOTCH_SM,
        }}
      >
        {c.closing(cover.rank)}
      </p>
    </div>
  );
}
