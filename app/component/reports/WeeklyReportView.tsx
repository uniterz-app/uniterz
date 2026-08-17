"use client";

// 週次レポート（Pro）本体。docs/pro-subscription-plan.md §3 個人週次レポート。
// 画面順: 結果 / 部門 / 順位変動 / ライバル / 診断。
// 見た目はランキング画面の DATA SLAB 語彙（rankingsCyberTheme）に合わせる。

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDown, ChevronUp, Crosshair, ShieldAlert } from "lucide-react";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import { RankingsCyberPanel } from "@/app/component/rankings/RankingsCyberPanel";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import {
  PROFILE_FROM_PARAM,
  PROFILE_FROM_REPORT_VALUE,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  INITIAL_REPORT_RIVALS,
  type WeeklyReport,
  type WeeklyReportComment,
  type WeeklyReportCommentTone,
  type WeeklyReportDivision,
  type WeeklyReportRival,
} from "@/lib/reports/weeklyReportTypes";

type Lang = "ja" | "en";

/* ============================================================
 * copy（プレビュー段階のローカル辞書。本番配線時に messages/ へ移す）
 * ============================================================ */

const COPY = {
  ja: {
    title: "WEEKLY REPORT",
    live: "LEGACY",
    liveNote: "過去の進行中レポートです。いまは確定週のみ配信されます。",
    heroRank: "順位",
    heroScore: "スコア",
    participants: (n: number) => `${n}人中`,
    top: (p: string) => `TOP ${p}%`,
    posts: "投稿",
    wins: "勝",
    losses: "敗",
    firstWeekRank: "今週から参戦",
    divisions: "部門成績",
    divisionRank: (n: number) => `部門 #${n}`,
    divisionUnranked: "圏外",
    divisionReference: "参考記録",
    divisionPostsToQualify: (n: number) => `あと${n}予想`,
    overtaken: "抜いた相手",
    overtakenBy: "抜かれた相手",
    noOvertaken: "今週は誰も抜けなかった",
    noOvertakenBy: "誰にも抜かれなかった",
    moreRivals: (n: number) => `ほか ${n} 人`,
    showMore: (n: number) => `もっと見る（${n}人）`,
    showLess: "閉じる",
    firstWeekBattle: "今週から参戦。抜いた・抜かれたは来週から表示されます。",
    battleSummary: (passed: number, passedBy: number) =>
      `今週は${passed}人を抜き、${passedBy}人に抜かれました`,
    battleSection: "順位変動",
    nowRank: (n: number) => `現在 #${n}`,
    nextTarget: "次のターゲット",
    targetGapLabel: "抜くまであと",
    youAreTop: "あなたが首位。追われる側です。",
    threat: "背後の脅威",
    threatGapLabel: "背後に接近中",
    noThreat: "背後に脅威なし",
    proMember: "Pro会員",
    commentTone: {
      climbedBig: "圧巻の週。",
      climbed: "確実に順位を上げた。",
      held: "順位キープ。",
      dropped: "後退した週。",
      firstWeek: "初参戦の記録がここから始まる。来週は順位変動も表示される。",
    } satisfies Record<WeeklyReportCommentTone, string>,
    commentFactor: {
      targetGap: (rank: number, name: string, pt: string) =>
        `#${rank} ${name} まであと ${pt}pt。来週の数試合で届く。`,
      overtakenBy: (name: string) => `${name} に抜かれたまま終わるか、抜き返すか。`,
      divisionUp: (label: string) => `${label} の伸びが効いた。`,
      divisionDown: (label: string) => `${label} が足を引っ張った。`,
      lowVolume: (n: number) => `投稿 ${n} 件。まずは母数から。`,
    },
  },
  en: {
    title: "WEEKLY REPORT",
    live: "LEGACY",
    liveNote: "Legacy in-progress report. Weekly reports now ship as finals only.",
    heroRank: "Rank",
    heroScore: "Score",
    participants: (n: number) => `of ${n}`,
    top: (p: string) => `TOP ${p}%`,
    posts: "picks",
    wins: "W",
    losses: "L",
    firstWeekRank: "First week",
    divisions: "Divisions",
    divisionRank: (n: number) => `Div #${n}`,
    divisionUnranked: "Unranked",
    divisionReference: "Reference",
    divisionPostsToQualify: (n: number) => `${n} more picks`,
    overtaken: "Passed",
    overtakenBy: "Passed by",
    noOvertaken: "No one passed this week",
    noOvertakenBy: "Nobody passed you",
    moreRivals: (n: number) => `+${n} more`,
    showMore: (n: number) => `Show all (+${n})`,
    showLess: "Show less",
    firstWeekBattle: "First week in. Battle log starts next week.",
    battleSummary: (passed: number, passedBy: number) =>
      `Passed ${passed}, passed by ${passedBy} this week`,
    battleSection: "Rank Moves",
    nowRank: (n: number) => `now #${n}`,
    nextTarget: "Next Target",
    targetGapLabel: "To pass",
    youAreTop: "You lead the board.",
    threat: "Closing In",
    threatGapLabel: "Behind you",
    noThreat: "No threat behind",
    proMember: "Pro member",
    commentTone: {
      climbedBig: "A statement week.",
      climbed: "A solid climb.",
      held: "Held your ground.",
      dropped: "A step back.",
      firstWeek: "Your record starts here. Rank moves show next week.",
    } satisfies Record<WeeklyReportCommentTone, string>,
    commentFactor: {
      targetGap: (rank: number, name: string, pt: string) =>
        `${pt}pt to #${rank} ${name}. A few games away.`,
      overtakenBy: (name: string) => `Passed by ${name}. Pass back next week.`,
      divisionUp: (label: string) => `${label} carried the week.`,
      divisionDown: (label: string) => `${label} held you back.`,
      lowVolume: (n: number) => `${n} picks. Volume first.`,
    },
  },
} as const;

/* ============================================================
 * theme — ランキング画面と同じ語彙 + 部門アクセント
 * ============================================================ */

const PANEL_BG = "linear-gradient(170deg, rgba(14,20,32,0.98), rgba(6,10,16,1))";

/** 小さめのコーナーカット（部門セル・バトルパネル用） */
const NOTCH_SM = "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)";

type Accent = {
  main: string;
  border: string;
  tint: string;
  glow: string;
};

const ACCENT = {
  cyan: {
    main: "#22d3ee",
    border: "rgba(34,211,238,0.42)",
    tint: "rgba(34,211,238,0.08)",
    glow: "rgba(34,211,238,0.35)",
  },
  emerald: {
    main: "#34d399",
    border: "rgba(52,211,153,0.42)",
    tint: "rgba(52,211,153,0.08)",
    glow: "rgba(52,211,153,0.32)",
  },
  gold: {
    main: "#facc15",
    border: "rgba(250,204,21,0.4)",
    tint: "rgba(250,204,21,0.07)",
    glow: "rgba(250,204,21,0.3)",
  },
  orange: {
    main: "#fb923c",
    border: "rgba(251,146,60,0.42)",
    tint: "rgba(251,146,60,0.08)",
    glow: "rgba(251,146,60,0.32)",
  },
} as const satisfies Record<string, Accent>;

const DIVISION_META: Record<
  WeeklyReportDivision["key"],
  { label: string; accent: Accent }
> = {
  winRate: { label: "WIN%", accent: ACCENT.emerald },
  goalScorerHits: { label: "SCORER", accent: ACCENT.gold },
  upset: { label: "UPSET", accent: ACCENT.orange },
};

function slabStyle(accent: Accent, clip: string = NOTCH_SM): CSSProperties {
  return {
    border: `1px solid ${accent.border}`,
    background: `linear-gradient(170deg, ${accent.tint}, rgba(6,10,16,0.98) 70%), ${PANEL_BG}`,
    boxShadow: `inset 0 0 0 1px rgba(8,14,26,0.85), inset 0 0 16px ${accent.tint}`,
    clipPath: clip,
    WebkitClipPath: clip,
  };
}

/* ============================================================
 * parts
 * ============================================================ */

function fmtRange(startKey: string, endKey: string): string {
  const md = (k: string) => {
    const [, m, d] = k.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${md(startKey)} – ${md(endKey)}`;
}

function fmtPt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** MyRankCard フッターと同じ白ブロックのセクションバッジ */
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

function MicroLabel({
  children,
  color = "rgba(255,255,255,0.42)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <p
      className={[
        nameOxanium.className,
        "text-[9px] font-bold uppercase tracking-[0.16em]",
      ].join(" ")}
      style={{ color }}
    >
      {children}
    </p>
  );
}

/** ランキング一覧と同じ四角アバター（rounded-sm + 1px 枠） */
function Avatar({
  rival,
  size = 34,
  ringColor = "rgba(255,255,255,0.12)",
}: {
  rival: WeeklyReportRival;
  size?: number;
  ringColor?: string;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-sm"
      style={{ width: size, height: size, border: `1px solid ${ringColor}` }}
    >
      <RankingsAvatarCircle
        photoURL={rival.photoURL}
        displayName={rival.displayName}
        boxClassName="h-full w-full rounded-sm"
        shape="square"
        imageLoading="lazy"
        gateReady
      />
    </div>
  );
}

/* ============================================================
 * blocks
 * ============================================================ */

function HeroBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const delta = report.rankDeltaPlaces;
  const losses = Math.max(0, report.totalPosts - report.totalWins);

  return (
    <RankingsCyberPanel>
      <div className="relative z-10">
        {/* 左=順位 / 右=スコア。数字は同一テキスト行でベースライン共有 */}
        <div className="relative mt-1">
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
            style={{ background: "rgba(34,211,238,0.16)" }}
            aria-hidden
          />

          <div className="grid grid-cols-2">
            <div className="min-w-0 pr-3.5">
              <MicroLabel>{c.heroRank}</MicroLabel>
            </div>
            <div className="min-w-0 pl-3.5">
              <MicroLabel>{c.heroScore}</MicroLabel>
            </div>
          </div>

          <div className="mt-1.5 grid grid-cols-2 items-baseline">
            {/* 左: 順位 + 前週比 */}
            <p
              className={[nameBebas.className, "min-w-0 pr-3.5 leading-none text-white"].join(
                " "
              )}
              style={{
                fontSize: "3.2rem",
                transform: "skewX(-10deg)",
                letterSpacing: "0.02em",
                textShadow: "0 0 24px rgba(34,211,238,0.28)",
              }}
            >
              <span className="text-white/40" style={{ fontSize: "0.58em" }}>
                #
              </span>
              {report.rank}
              {delta != null ? (
                <span
                  style={{
                    marginLeft: "0.28em",
                    fontSize: "0.45em",
                    color:
                      delta > 0
                        ? ACCENT.emerald.main
                        : delta < 0
                          ? ACCENT.orange.main
                          : "rgba(255,255,255,0.45)",
                    textShadow:
                      delta > 0
                        ? `0 0 16px ${ACCENT.emerald.glow}`
                        : delta < 0
                          ? `0 0 16px ${ACCENT.orange.glow}`
                          : undefined,
                  }}
                >
                  {delta > 0 ? "↑" : delta < 0 ? "↓" : ""}
                  {delta === 0 ? "±0" : Math.abs(delta)}
                </span>
              ) : (
                <span
                  className={[
                    nameOxanium.className,
                    "ml-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                  ].join(" ")}
                  style={{ display: "inline-block", transform: "skewX(10deg)" }}
                >
                  {c.firstWeekRank}
                </span>
              )}
            </p>

            {/* 右: スコア + PTS */}
            <p
              className={[nameBebas.className, "min-w-0 pl-3.5 leading-none"].join(" ")}
              style={{
                fontSize: "3.2rem",
                transform: "skewX(-10deg)",
                letterSpacing: "0.02em",
                color: ACCENT.cyan.main,
                textShadow: `0 0 24px ${ACCENT.cyan.glow}`,
              }}
            >
              {fmtPt(report.totalPoints)}
              <span
                className={[
                  nameOxanium.className,
                  "font-bold uppercase tracking-[0.14em] text-white/40",
                ].join(" ")}
                style={{
                  marginLeft: "0.28em",
                  fontSize: "0.32em",
                  display: "inline-block",
                  transform: "skewX(10deg)",
                }}
              >
                PTS
              </span>
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2">
            <div className="flex h-5 items-center gap-1.5 pr-3.5">
              <span
                className={[
                  nameOxanium.className,
                  "text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-white/40",
                ].join(" ")}
              >
                {c.participants(report.participantCount)}
              </span>
              {report.topPercent != null ? (
                <span
                  className={[
                    nameOxanium.className,
                    "rounded-[2px] border px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none tracking-[0.14em]",
                  ].join(" ")}
                  style={{
                    color: ACCENT.cyan.main,
                    borderColor: ACCENT.cyan.border,
                    background: ACCENT.cyan.tint,
                    textShadow: `0 0 12px ${ACCENT.cyan.glow}`,
                  }}
                >
                  {c.top(fmtPt(report.topPercent))}
                </span>
              ) : null}
            </div>
            <p
              className={[
                nameOxanium.className,
                "flex h-5 items-center pl-3.5 text-[10px] font-bold tabular-nums leading-none tracking-[0.08em] text-white/55",
              ].join(" ")}
            >
              {c.posts} {report.totalPosts} · {report.totalWins}
              {c.wins}
              {losses}
              {c.losses}
            </p>
          </div>
        </div>
      </div>
    </RankingsCyberPanel>
  );
}

function DivisionsBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  return (
    <section>
      <SectionBadge>{c.divisions}</SectionBadge>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {report.divisions.map((d) => {
          const meta = DIVISION_META[d.key];
          const isReference =
            d.postsToQualify != null && d.postsToQualify > 0;
          const isTop10 = !isReference && d.rank != null && d.rank <= 10;
          const integer = d.key === "goalScorerHits";
          return (
            <div key={d.key} className="px-2.5 py-2" style={slabStyle(meta.accent)}>
              <div className="flex items-center justify-between gap-1">
                <MicroLabel color={meta.accent.main}>{meta.label}</MicroLabel>
                {isTop10 ? (
                  <span
                    className={[
                      nameOxanium.className,
                      "rounded-[2px] px-1 py-px text-[8px] font-extrabold uppercase tracking-[0.1em] text-black",
                    ].join(" ")}
                    style={{
                      background: meta.accent.main,
                      boxShadow: `0 0 10px ${meta.accent.glow}`,
                    }}
                  >
                    TOP10
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span
                  className={[nameBebas.className, "inline-block text-[27px] leading-none text-white"].join(
                    " "
                  )}
                  style={{
                    transform: "skewX(-10deg)",
                    ...(isTop10 ? { textShadow: `0 0 16px ${meta.accent.glow}` } : null),
                  }}
                >
                  {d.key === "winRate"
                    ? `${Math.round(d.value)}%`
                    : integer
                      ? Math.round(d.value)
                      : fmtPt(d.value)}
                </span>
              </div>
              {isReference ? (
                <div className="mt-1.5 space-y-0.5">
                  <p
                    className={[
                      lang === "ja" ? jp.className : nameOxanium.className,
                      "text-[10px] font-semibold leading-none text-white/55",
                    ].join(" ")}
                  >
                    {c.divisionReference}
                  </p>
                  <p
                    className={[
                      nameOxanium.className,
                      "text-[9px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/40",
                    ].join(" ")}
                  >
                    {c.divisionPostsToQualify(d.postsToQualify!)}
                  </p>
                </div>
              ) : (
                <p
                  className={[
                    nameOxanium.className,
                    "mt-1.5 text-[12px] font-bold uppercase tracking-[0.1em] tabular-nums",
                  ].join(" ")}
                  style={{
                    color: d.rank != null ? meta.accent.main : "rgba(255,255,255,0.35)",
                    opacity: d.rank != null ? 0.9 : 1,
                  }}
                >
                  {d.rank != null ? c.divisionRank(d.rank) : c.divisionUnranked}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function rivalProfileHref(pathname: string, rival: WeeklyReportRival): string {
  const base =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/") ? "/mobile" : "/web";
  const key = profilePathKeyFromRow(rival);
  const q = new URLSearchParams({
    [PROFILE_FROM_PARAM]: PROFILE_FROM_REPORT_VALUE,
  });
  return `${base}/u/${encodeURIComponent(key)}?${q.toString()}`;
}

function RivalRow({
  rival,
  lang,
  accent,
}: {
  rival: WeeklyReportRival;
  lang: Lang;
  accent: Accent;
}) {
  const c = COPY[lang];
  const pathname = usePathname() ?? "/mobile";
  const href = rivalProfileHref(pathname, rival);
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2.5 py-1.5 transition hover:bg-white/[0.04]"
      >
        <Avatar rival={rival} size={30} ringColor={accent.border} />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 truncate text-[13px] font-semibold text-white/88">
            {rival.displayName}
          </span>
          {rival.plan === "pro" ? (
            <ProCyberBadge
              {...proBadgeStaticMotion}
              compact
              ariaLabel={c.proMember}
            />
          ) : null}
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums",
          ].join(" ")}
          style={{ color: accent.main, opacity: 0.75 }}
        >
          {c.nowRank(rival.rank)}
        </span>
      </Link>
    </li>
  );
}

function BattlePanel({
  label,
  count,
  countIcon,
  accent,
  rivals,
  emptyText,
  lang,
}: {
  label: string;
  /** 実際の合計人数（rivals はその一部のことがある） */
  count: number;
  countIcon: "up" | "down";
  accent: Accent;
  rivals: WeeklyReportRival[];
  emptyText: string;
  lang: Lang;
}) {
  const c = COPY[lang];
  const CountIcon = countIcon === "up" ? ChevronUp : ArrowDown;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rivals : rivals.slice(0, INITIAL_REPORT_RIVALS);
  const hiddenInList = rivals.length - visible.length;
  /** doc の保存上限からあふれた分（展開しても出せない人数） */
  const overflowCount = Math.max(0, count - rivals.length);
  return (
    <div className="px-3.5 py-2.5" style={slabStyle(accent)}>
      <div className="flex items-center justify-between">
        <MicroLabel color={accent.main}>{label}</MicroLabel>
        {count > 0 ? (
          <span
            className={[nameBebas.className, "inline-flex items-center gap-0.5 text-xl leading-none"].join(
              " "
            )}
            style={{
              transform: "skewX(-10deg)",
              color: accent.main,
              textShadow: `0 0 14px ${accent.glow}`,
            }}
          >
            <CountIcon className="h-4 w-4" strokeWidth={2.75} aria-hidden />
            {count}
          </span>
        ) : null}
      </div>
      {rivals.length > 0 ? (
        <>
          <ul className="mt-1 divide-y divide-white/6">
            {visible.map((r) => (
              <RivalRow key={r.uid} rival={r} lang={lang} accent={accent} />
            ))}
          </ul>
          {expanded && overflowCount > 0 ? (
            <p
              className={[
                nameOxanium.className,
                "border-t border-white/6 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
              ].join(" ")}
              style={{ color: accent.main, opacity: 0.65 }}
            >
              {c.moreRivals(overflowCount)}
            </p>
          ) : null}
          {hiddenInList > 0 || (expanded && rivals.length > INITIAL_REPORT_RIVALS) ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={[
                nameOxanium.className,
                "mt-1 flex w-full items-center justify-center gap-1 border-t border-white/8 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:brightness-125",
              ].join(" ")}
              style={{ color: accent.main }}
            >
              {expanded ? c.showLess : c.showMore(hiddenInList)}
              <ChevronUp
                className={[
                  "h-3 w-3 transition-transform duration-200",
                  expanded ? "" : "rotate-180",
                ].join(" ")}
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-1.5 text-[12px] text-white/45">{emptyText}</p>
      )}
    </div>
  );
}

function BattleBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const firstWeek = report.rankDeltaPlaces == null && report.prevRank == null;

  if (firstWeek && report.overtaken.length === 0 && report.overtakenBy.length === 0) {
    return (
      <section className="px-3.5 py-3" style={slabStyle(ACCENT.cyan)}>
        <p className="text-[12px] leading-relaxed text-white/55">{c.firstWeekBattle}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-2">
      <div>
        <SectionBadge>{c.battleSection}</SectionBadge>
        <p
          className={[
            lang === "ja" ? jp.className : nameRajdhani.className,
            "mt-2 text-[13px] font-semibold leading-snug tracking-wide text-white/80",
          ].join(" ")}
        >
          {c.battleSummary(report.overtakenCount, report.overtakenByCount)}
        </p>
      </div>
      <BattlePanel
        label={c.overtaken}
        count={report.overtakenCount}
        countIcon="up"
        accent={ACCENT.emerald}
        rivals={report.overtaken}
        emptyText={c.noOvertaken}
        lang={lang}
      />
      <BattlePanel
        label={c.overtakenBy}
        count={report.overtakenByCount}
        countIcon="down"
        accent={ACCENT.orange}
        rivals={report.overtakenBy}
        emptyText={c.noOvertakenBy}
        lang={lang}
      />
    </section>
  );
}

/** ターゲット/脅威パネル右側のポイント差 — ヒーローの PTS と同じ「Bebas 数字 + Oxanium 単位」 */
function GapValue({
  label,
  points,
  accent,
}: {
  label: string;
  points: number;
  accent: Accent;
}) {
  return (
    <div className="shrink-0 text-right">
      <p
        className={[
          nameOxanium.className,
          "text-[8px] font-bold uppercase tracking-[0.16em]",
        ].join(" ")}
        style={{ color: accent.main, opacity: 0.75 }}
      >
        {label}
      </p>
      <p className="mt-0.5 flex items-baseline justify-end gap-1 leading-none">
        <span
          className={[nameBebas.className, "text-2xl leading-none tabular-nums"].join(" ")}
          style={{
            transform: "skewX(-10deg)",
            display: "inline-block",
            color: accent.main,
            textShadow: `0 0 16px ${accent.glow}`,
          }}
        >
          {fmtPt(points)}
        </span>
        <span
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.14em]",
          ].join(" ")}
          style={{ color: accent.main, opacity: 0.7 }}
        >
          PT
        </span>
      </p>
    </div>
  );
}

function TargetThreatBlock({ report, lang }: { report: WeeklyReport; lang: Lang }) {
  const c = COPY[lang];
  const pathname = usePathname() ?? "/mobile";

  const rivalLine = (rival: WeeklyReportRival, accent: Accent) => (
    <Link
      href={rivalProfileHref(pathname, rival)}
      className="mt-1 flex min-w-0 items-center gap-2 transition hover:brightness-110"
    >
      <Avatar rival={rival} size={26} ringColor={accent.border} />
      <span className="min-w-0 truncate text-[13px] font-semibold text-white/90">
        <span className={[nameOxanium.className, "mr-1 text-white/45"].join(" ")}>
          #{rival.rank}
        </span>
        {rival.displayName}
      </span>
      {rival.plan === "pro" ? (
        <ProCyberBadge {...proBadgeStaticMotion} compact ariaLabel={c.proMember} />
      ) : null}
    </Link>
  );

  return (
    <section className="grid gap-2">
      <div className="flex items-center gap-3 px-3.5 py-3" style={slabStyle(ACCENT.cyan)}>
        <Crosshair
          className="h-5 w-5 shrink-0"
          style={{ color: ACCENT.cyan.main, filter: `drop-shadow(0 0 6px ${ACCENT.cyan.glow})` }}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <MicroLabel color={ACCENT.cyan.main}>{c.nextTarget}</MicroLabel>
          {report.nextTarget ? (
            rivalLine(report.nextTarget.rival, ACCENT.cyan)
          ) : (
            <p className="mt-1 text-[12px] text-white/60">{c.youAreTop}</p>
          )}
        </div>
        {report.nextTarget ? (
          <GapValue
            label={c.targetGapLabel}
            points={report.nextTarget.pointsBehind}
            accent={ACCENT.cyan}
          />
        ) : null}
      </div>

      {report.threat ? (
        <div className="flex items-center gap-3 px-3.5 py-3" style={slabStyle(ACCENT.orange)}>
          <ShieldAlert
            className="h-5 w-5 shrink-0"
            style={{
              color: ACCENT.orange.main,
              filter: `drop-shadow(0 0 6px ${ACCENT.orange.glow})`,
            }}
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <MicroLabel color={ACCENT.orange.main}>{c.threat}</MicroLabel>
            {rivalLine(report.threat.rival, ACCENT.orange)}
          </div>
          <GapValue
            label={c.threatGapLabel}
            points={report.threat.pointsGap}
            accent={ACCENT.orange}
          />
        </div>
      ) : null}
    </section>
  );
}

/** 一言 = tone（総括）+ factor（一番効いた要因 or 次の一手）の合成 */
function commentText(comment: WeeklyReportComment, lang: Lang): string {
  const c = COPY[lang];
  const tone = c.commentTone[comment.tone];
  const f = comment.factor;
  const factor =
    f.kind === "targetGap"
      ? c.commentFactor.targetGap(f.rank, f.displayName, fmtPt(f.pointsBehind))
      : f.kind === "overtakenBy"
        ? c.commentFactor.overtakenBy(f.displayName)
        : f.kind === "divisionUp"
          ? c.commentFactor.divisionUp(DIVISION_META[f.division].label)
          : f.kind === "divisionDown"
            ? c.commentFactor.divisionDown(DIVISION_META[f.division].label)
            : f.kind === "lowVolume"
              ? c.commentFactor.lowVolume(f.posts)
              : null;
  return factor ? `${tone}${lang === "en" ? " " : ""}${factor}` : tone;
}

/* ============================================================
 * main
 * ============================================================ */

export type WeeklyReportPeriodOption = {
  id: string;
  label: string;
};

export default function WeeklyReportView({
  report,
  language = "ja",
  periods,
  selectedPeriodId,
  onSelectPeriod,
}: {
  report: WeeklyReport;
  language?: Lang;
  /** 過去週の切り替え。1件以下ならナビ非表示 */
  periods?: WeeklyReportPeriodOption[];
  selectedPeriodId?: string;
  onSelectPeriod?: (id: string) => void;
}) {
  const c = COPY[language];
  const periodList = periods ?? [];
  const selectedIdx = periodList.findIndex((p) => p.id === selectedPeriodId);
  const activeIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const canPrev = periodList.length > 1 && activeIdx < periodList.length - 1;
  const canNext = periodList.length > 1 && activeIdx > 0;
  const rangeLabel = fmtRange(report.range.startKey, report.range.endKey);

  return (
    <div className="space-y-3">
      <header className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-white",
          ].join(" ")}
        >
          {c.title}
          {report.status === "live" ? (
            <span
              className={[
                nameOxanium.className,
                "inline-flex items-center gap-1 rounded-[2px] border border-red-400/40 bg-red-500/12 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-red-300",
              ].join(" ")}
            >
              <span
                className="h-1 w-1 rounded-full bg-red-400 motion-safe:animate-pulse"
                aria-hidden
              />
              {c.live}
            </span>
          ) : null}
        </h2>

        <div className="flex items-center gap-1">
          {periodList.length > 1 ? (
            <button
              type="button"
              disabled={!canPrev}
              aria-label={language === "ja" ? "前の週" : "Previous week"}
              onClick={() => {
                if (!canPrev || !onSelectPeriod) return;
                onSelectPeriod(periodList[activeIdx + 1]!.id);
              }}
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition",
                canPrev
                  ? "border-white/18 bg-white/5 text-white/80 hover:border-cyan-300/40 hover:text-cyan-100"
                  : "border-white/8 bg-transparent text-white/20",
              ].join(" ")}
            >
              <ChevronUp className="h-4 w-4 -rotate-90" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}

          <p
            className={[
              nameOxanium.className,
              "min-w-0 flex-1 text-center text-[15px] font-extrabold uppercase tracking-[0.14em] tabular-nums text-white/85",
            ].join(" ")}
          >
            {rangeLabel}
          </p>

          {periodList.length > 1 ? (
            <button
              type="button"
              disabled={!canNext}
              aria-label={language === "ja" ? "次の週" : "Next week"}
              onClick={() => {
                if (!canNext || !onSelectPeriod) return;
                onSelectPeriod(periodList[activeIdx - 1]!.id);
              }}
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition",
                canNext
                  ? "border-white/18 bg-white/5 text-white/80 hover:border-cyan-300/40 hover:text-cyan-100"
                  : "border-white/8 bg-transparent text-white/20",
              ].join(" ")}
            >
              <ChevronUp className="h-4 w-4 rotate-90" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}
        </div>

        {periodList.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {periodList.map((p, i) => {
              const selected = i === activeIdx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPeriod?.(p.id)}
                  className={[
                    nameOxanium.className,
                    "shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition",
                    selected
                      ? "border-cyan-400/55 bg-cyan-400/14 text-cyan-100"
                      : "border-white/12 bg-white/4 text-white/55 hover:border-white/25",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {report.status === "live" ? (
        <p className="text-[11px] leading-relaxed text-white/45">{c.liveNote}</p>
      ) : null}

      <HeroBlock report={report} lang={language} />
      <DivisionsBlock report={report} lang={language} />
      <BattleBlock report={report} lang={language} />
      <TargetThreatBlock report={report} lang={language} />

      <p
        className="px-3.5 py-3 text-[12.5px] leading-relaxed text-white/70"
        style={slabStyle(ACCENT.cyan)}
      >
        {commentText(report.comment, language)}
      </p>
    </div>
  );
}
