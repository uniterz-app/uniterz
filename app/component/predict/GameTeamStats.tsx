"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import {
  ROW_STAGGER,
  SymmetricalCompareRow,
  barPctDiffNorm,
  barPctMaxNorm,
  barPctMinPaNorm,
} from "./teamStatsCompare";


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
