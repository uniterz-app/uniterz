"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { motion } from "framer-motion";
import { resultStatsMetricNumClass } from "@/lib/fonts";

const ROW_STAGGER = 0.09;
const BAR_DURATION = 0.72;
const BAR_AFTER_ROW = 0.06;

/** 左: ミント系ネオン（シアンより緑寄り） / 右: バイオレット系（マゼンタより青紫） */
const BAR_LEFT_HEX = "#5cf0b5";
const BAR_RIGHT_HEX = "#b388ff";
const BAR_LEFT_RGB = "92,240,181";
const BAR_RIGHT_RGB = "179,136,255";

type TeamDoc = {
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;

  homeGames: number;
  homeWins: number;
  awayGames: number;
  awayWins: number;

  conference: "east" | "west";

  vsEastGames: number;
  vsEastWins: number;
  vsWestGames: number;
  vsWestWins: number;

  ppgRank?: number;
  papgRank?: number;
};

type Props = {
  league: League;
  homeTeamId: string;
  awayTeamId: string;
  language?: "ja" | "en";
};

type ViewStats = {
  avgFor: number;
  avgAgainst: number;
  diff: number;

  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;

  homeWinPct: number;
  awayWinPct: number;

  vsEastW: number;
  vsEastL: number;
  vsEastPct: number;
  vsWestW: number;
  vsWestL: number;
  vsWestPct: number;

  ppgRank?: number;
  papgRank?: number;
};

function formatStatRank(rank: number | undefined, isEn: boolean): string | null {
  if (rank == null || rank < 1 || !Number.isFinite(rank)) return null;
  const r = Math.round(rank);
  return isEn ? `#${r}` : `${r}位`;
}

/** 数値が大きいほど良い: 大きい方を 100%、もう一方は比率で短く */
function barPctMaxNorm(h: number, a: number): [number, number] {
  const m = Math.max(h, a);
  if (m <= 0 || !Number.isFinite(m)) return [0, 0];
  return [
    Math.min(100, Math.max(0, Math.round((h / m) * 100))),
    Math.min(100, Math.max(0, Math.round((a / m) * 100))),
  ];
}

/** 数値が小さいほど良い（平均失点）: 小さい方を基準 100%、もう一方は min/値 で短く */
function barPctMinPaNorm(h: number, a: number): [number, number] {
  const lo = Math.min(h, a);
  const hi = Math.max(h, a);
  if (hi <= 0 || !Number.isFinite(hi)) return [0, 0];
  const left = h > 0 ? Math.min(100, Math.round((lo / h) * 100)) : 0;
  const right = a > 0 ? Math.min(100, Math.round((lo / a) * 100)) : 0;
  return [Math.max(0, left), Math.max(0, right)];
}

/** 得失点差: 高い方が良い。プラス含むときは max を 100%。両方マイナスだけ別スケール */
function barPctDiffNorm(h: number, a: number): [number, number] {
  const mPos = Math.max(h, a);
  if (mPos > 0) {
    return [
      Math.min(100, Math.max(0, Math.round((Math.max(0, h) / mPos) * 100))),
      Math.min(100, Math.max(0, Math.round((Math.max(0, a) / mPos) * 100))),
    ];
  }
  if (h === 0 && a === 0) return [0, 0];
  const worst = Math.min(h, a);
  const best = Math.max(h, a);
  const span = best - worst;
  if (span <= 0) return [50, 50];
  return [
    Math.min(100, Math.max(0, Math.round(((h - worst) / span) * 100))),
    Math.min(100, Math.max(0, Math.round(((a - worst) / span) * 100))),
  ];
}

export default function GameTeamStats({
  league: _league,
  homeTeamId,
  awayTeamId,
  language = "ja",
}: Props) {
  void _league;

  const isEn = language === "en";
  const [home, setHome] = useState<ViewStats | null>(null);
  const [away, setAway] = useState<ViewStats | null>(null);

  useEffect(() => {
    const run = async () => {
      const [hSnap, aSnap] = await Promise.all([
        getDoc(doc(db, "teams", homeTeamId)),
        getDoc(doc(db, "teams", awayTeamId)),
      ]);
      if (!hSnap.exists() || !aSnap.exists()) return;

      const homeDoc = hSnap.data() as TeamDoc;
      const awayDoc = aSnap.data() as TeamDoc;

      const build = (t: TeamDoc): ViewStats => {
        const avgFor = t.gamesPlayed > 0 ? t.pointsForTotal / t.gamesPlayed : 0;
        const avgAgainst =
          t.gamesPlayed > 0 ? t.pointsAgainstTotal / t.gamesPlayed : 0;

        const homeL = Math.max(0, (t.homeGames ?? 0) - (t.homeWins ?? 0));
        const awayL = Math.max(0, (t.awayGames ?? 0) - (t.awayWins ?? 0));

        const homeGames = t.homeGames ?? 0;
        const awayGames = t.awayGames ?? 0;
        const homeWinPct =
          homeGames > 0 ? (100 * (t.homeWins ?? 0)) / homeGames : 0;
        const awayWinPct =
          awayGames > 0 ? (100 * (t.awayWins ?? 0)) / awayGames : 0;

        const eg = t.vsEastGames ?? 0;
        const ew = t.vsEastWins ?? 0;
        const el = Math.max(0, eg - ew);
        const wg = t.vsWestGames ?? 0;
        const ww = t.vsWestWins ?? 0;
        const wl = Math.max(0, wg - ww);

        return {
          avgFor: Number(avgFor.toFixed(1)),
          avgAgainst: Number(avgAgainst.toFixed(1)),
          diff: Number((avgFor - avgAgainst).toFixed(1)),

          homeW: t.homeWins ?? 0,
          homeL,
          awayW: t.awayWins ?? 0,
          awayL,

          homeWinPct,
          awayWinPct,

          vsEastW: ew,
          vsEastL: el,
          vsEastPct: eg > 0 ? (100 * ew) / eg : 0,
          vsWestW: ww,
          vsWestL: wl,
          vsWestPct: wg > 0 ? (100 * ww) / wg : 0,

          ppgRank: typeof t.ppgRank === "number" ? t.ppgRank : undefined,
          papgRank: typeof t.papgRank === "number" ? t.papgRank : undefined,
        };
      };

      setHome(build(homeDoc));
      setAway(build(awayDoc));
    };

    run();
  }, [homeTeamId, awayTeamId]);

  if (!home || !away) return null;

  const fmtDiff = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

  const [ppgBarL, ppgBarR] = barPctMaxNorm(home.avgFor, away.avgFor);
  const [papgBarL, papgBarR] = barPctMinPaNorm(home.avgAgainst, away.avgAgainst);
  const [diffBarL, diffBarR] = barPctDiffNorm(home.diff, away.diff);

  const rows: Array<{
    key: string;
    label: string;
    left: {
      primary: string;
      rank: string | null;
      barPct: number;
      recordBelow: string | null;
    };
    right: {
      primary: string;
      rank: string | null;
      barPct: number;
      recordBelow: string | null;
    };
    leftWin: boolean;
    rightWin: boolean;
  }> = [
    {
      key: "ppg",
      label: isEn ? "PTS / G" : "平均得点",
      left: {
        primary: home.avgFor.toFixed(1),
        rank: formatStatRank(home.ppgRank, isEn),
        barPct: ppgBarL,
        recordBelow: null,
      },
      right: {
        primary: away.avgFor.toFixed(1),
        rank: formatStatRank(away.ppgRank, isEn),
        barPct: ppgBarR,
        recordBelow: null,
      },
      leftWin: home.avgFor > away.avgFor,
      rightWin: away.avgFor > home.avgFor,
    },
    {
      key: "papg",
      label: isEn ? "OPP PTS / G" : "平均失点",
      left: {
        primary: home.avgAgainst.toFixed(1),
        rank: formatStatRank(home.papgRank, isEn),
        barPct: papgBarL,
        recordBelow: null,
      },
      right: {
        primary: away.avgAgainst.toFixed(1),
        rank: formatStatRank(away.papgRank, isEn),
        barPct: papgBarR,
        recordBelow: null,
      },
      leftWin: home.avgAgainst < away.avgAgainst,
      rightWin: away.avgAgainst < home.avgAgainst,
    },
    {
      key: "diff",
      label: isEn ? "Point diff" : "得失点差",
      left: {
        primary: fmtDiff(home.diff),
        rank: null,
        barPct: diffBarL,
        recordBelow: null,
      },
      right: {
        primary: fmtDiff(away.diff),
        rank: null,
        barPct: diffBarR,
        recordBelow: null,
      },
      leftWin: home.diff > away.diff,
      rightWin: away.diff > home.diff,
    },
    {
      key: "home",
      label: isEn ? "Home" : "ホーム戦績",
      left: {
        primary: `${Math.round(home.homeWinPct)}%`,
        rank: null,
        barPct: Math.round(Math.min(100, Math.max(0, home.homeWinPct))),
        recordBelow: `${home.homeW}-${home.homeL}`,
      },
      right: {
        primary: `${Math.round(away.homeWinPct)}%`,
        rank: null,
        barPct: Math.round(Math.min(100, Math.max(0, away.homeWinPct))),
        recordBelow: `${away.homeW}-${away.homeL}`,
      },
      leftWin: home.homeWinPct > away.homeWinPct,
      rightWin: away.homeWinPct > home.homeWinPct,
    },
    {
      key: "away",
      label: isEn ? "Away" : "アウェイ戦績",
      left: {
        primary: `${Math.round(home.awayWinPct)}%`,
        rank: null,
        barPct: Math.round(Math.min(100, Math.max(0, home.awayWinPct))),
        recordBelow: `${home.awayW}-${home.awayL}`,
      },
      right: {
        primary: `${Math.round(away.awayWinPct)}%`,
        rank: null,
        barPct: Math.round(Math.min(100, Math.max(0, away.awayWinPct))),
        recordBelow: `${away.awayW}-${away.awayL}`,
      },
      leftWin: home.awayWinPct > away.awayWinPct,
      rightWin: away.awayWinPct > home.awayWinPct,
    },
    {
      key: "vsEast",
      label: isEn ? "VS EAST" : "VS EAST",
      left: {
        primary:
          home.vsEastW + home.vsEastL > 0
            ? `${Math.round(home.vsEastPct)}%`
            : "—",
        rank: null,
        barPct:
          home.vsEastW + home.vsEastL > 0
            ? Math.round(Math.min(100, Math.max(0, home.vsEastPct)))
            : 0,
        recordBelow:
          home.vsEastW + home.vsEastL > 0
            ? `${home.vsEastW}-${home.vsEastL}`
            : null,
      },
      right: {
        primary:
          away.vsEastW + away.vsEastL > 0
            ? `${Math.round(away.vsEastPct)}%`
            : "—",
        rank: null,
        barPct:
          away.vsEastW + away.vsEastL > 0
            ? Math.round(Math.min(100, Math.max(0, away.vsEastPct)))
            : 0,
        recordBelow:
          away.vsEastW + away.vsEastL > 0
            ? `${away.vsEastW}-${away.vsEastL}`
            : null,
      },
      leftWin:
        home.vsEastW + home.vsEastL > 0 &&
        away.vsEastW + away.vsEastL > 0 &&
        home.vsEastPct > away.vsEastPct,
      rightWin:
        home.vsEastW + home.vsEastL > 0 &&
        away.vsEastW + away.vsEastL > 0 &&
        away.vsEastPct > home.vsEastPct,
    },
    {
      key: "vsWest",
      label: isEn ? "VS WEST" : "VS WEST",
      left: {
        primary:
          home.vsWestW + home.vsWestL > 0
            ? `${Math.round(home.vsWestPct)}%`
            : "—",
        rank: null,
        barPct:
          home.vsWestW + home.vsWestL > 0
            ? Math.round(Math.min(100, Math.max(0, home.vsWestPct)))
            : 0,
        recordBelow:
          home.vsWestW + home.vsWestL > 0
            ? `${home.vsWestW}-${home.vsWestL}`
            : null,
      },
      right: {
        primary:
          away.vsWestW + away.vsWestL > 0
            ? `${Math.round(away.vsWestPct)}%`
            : "—",
        rank: null,
        barPct:
          away.vsWestW + away.vsWestL > 0
            ? Math.round(Math.min(100, Math.max(0, away.vsWestPct)))
            : 0,
        recordBelow:
          away.vsWestW + away.vsWestL > 0
            ? `${away.vsWestW}-${away.vsWestL}`
            : null,
      },
      leftWin:
        home.vsWestW + home.vsWestL > 0 &&
        away.vsWestW + away.vsWestL > 0 &&
        home.vsWestPct > away.vsWestPct,
      rightWin:
        home.vsWestW + home.vsWestL > 0 &&
        away.vsWestW + away.vsWestL > 0 &&
        away.vsWestPct > home.vsWestPct,
    },
  ];

  return (
    <section className="space-y-0">
      {rows.map((row, index) => (
        <SymmetricalCompareRow
          key={row.key}
          label={row.label}
          left={row.left}
          right={row.right}
          leftWin={row.leftWin}
          rightWin={row.rightWin}
          barDelay={index * ROW_STAGGER}
        />
      ))}
    </section>
  );
}

function SymmetricalCompareRow({
  label,
  left,
  right,
  leftWin,
  rightWin,
  barDelay,
}: {
  label: string;
  left: {
    primary: string;
    rank: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  right: {
    primary: string;
    rank: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  leftWin: boolean;
  rightWin: boolean;
  barDelay: number;
}) {
  const rowAnimDelay = barDelay;

  const leftNumClass = [
    resultStatsMetricNumClass,
    "text-right text-sm md:text-base",
    "text-[#5cf0b5]",
  ].join(" ");

  const rightNumClass = [
    resultStatsMetricNumClass,
    "text-left text-sm md:text-base",
    "text-[#b388ff]",
  ].join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rowAnimDelay, ease: "easeOut" }}
      className="border-b border-white/8 py-2.5 last:border-b-0"
    >
      <div className="flex items-center gap-1 md:gap-1.5">
        {/* 左: 外→中央 = バー | 順位 | 数字（下にレコード） */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:gap-1.5">
          <CyberBar
            value={left.barPct}
            grow="left"
            winGlow={leftWin}
            delay={barDelay + BAR_AFTER_ROW}
          />
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-right text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {left.rank ?? ""}
          </span>
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            <span
              className={leftNumClass}
              style={{
                textShadow: leftWin
                  ? "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)"
                  : undefined,
              }}
            >
              {left.primary}
            </span>
            {left.recordBelow ? (
              <span
                className={[
                  resultStatsMetricNumClass,
                  "text-[10px] text-white/45 md:text-[11px]",
                ].join(" ")}
              >
                {left.recordBelow}
              </span>
            ) : null}
          </div>
        </div>

        <div className="w-18 shrink-0 px-0.5 text-center md:w-21">
          <div className="text-[10px] font-medium leading-tight tracking-wide text-white/65 md:text-[11px]">
            {label}
          </div>
        </div>

        {/* 右: 中央→外 = 数字（下にレコード）| 順位 | バー */}
        <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <span
              className={rightNumClass}
              style={{
                textShadow: rightWin
                  ? "0 0 6px rgba(179,136,255,0.4), 0 0 2px rgba(179,136,255,0.52)"
                  : undefined,
              }}
            >
              {right.primary}
            </span>
            {right.recordBelow ? (
              <span
                className={[
                  resultStatsMetricNumClass,
                  "text-[10px] text-white/45 md:text-[11px]",
                ].join(" ")}
              >
                {right.recordBelow}
              </span>
            ) : null}
          </div>
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-left text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {right.rank ?? ""}
          </span>
          <CyberBar
            value={right.barPct}
            grow="right"
            winGlow={rightWin}
            delay={barDelay + BAR_AFTER_ROW}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CyberBar({
  value,
  grow,
  winGlow,
  delay,
}: {
  value: number;
  grow: "left" | "right";
  winGlow: boolean;
  delay: number;
}) {
  const v = Math.min(100, Math.max(0, value)) / 100;
  const origin = grow === "left" ? "right center" : "left center";
  const hex = grow === "left" ? BAR_LEFT_HEX : BAR_RIGHT_HEX;
  const rgb = grow === "left" ? BAR_LEFT_RGB : BAR_RIGHT_RGB;
  const borderTint =
    grow === "left" ? "border-[#5cf0b5]/28" : "border-[#b388ff]/28";
  const baseInset =
    grow === "left"
      ? "inset 0 0 6px rgba(92,240,181,0.07)"
      : "inset 0 0 6px rgba(179,136,255,0.07)";
  const fillBg =
    grow === "left"
      ? `linear-gradient(to right, ${hex}55 0%, ${hex}dd 45%, ${hex} 100%)`
      : `linear-gradient(to right, ${hex} 0%, ${hex}dd 55%, ${hex}55 100%)`;

  return (
    <div
      className={[
        "relative h-[3px] min-w-[56px] max-w-[min(36vw,132px)] flex-1 overflow-hidden rounded-[1px]",
        "md:h-1 md:min-w-[100px] md:max-w-[min(30vw,260px)]",
        "border bg-black/50",
        borderTint,
      ].join(" ")}
      style={{
        boxShadow: winGlow
          ? `${baseInset}, 0 0 8px ${hex}44, 0 0 3px ${hex}66`
          : baseInset,
      }}
    >
      {/* トラック全体を常に色で埋める（空白に見えないベース） */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1px]"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(${rgb},0.3),
            rgba(${rgb},0.12)
          )`,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1px]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: v }}
          transition={{ duration: BAR_DURATION, delay, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 z-1 w-full"
          style={{
            transformOrigin: origin,
            background: fillBg,
            boxShadow: winGlow
              ? `0 0 5px ${hex}55, 0 0 2px ${hex}77`
              : `0 0 2px ${hex}35`,
          }}
        />
      </div>
    </div>
  );
}
