"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import {
  ROW_STAGGER,
  SymmetricalCompareRow,
  barPctDiffNorm,
  barPctMaxNorm,
  barPctMinPaNorm,
} from "./teamStatsCompare";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";


type TeamDoc = {
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;

  homeGames: number;
  homeWins: number;
  awayGames: number;
  awayWins: number;

  conference: "east" | "west";

  ppgRank?: number;
  papgRank?: number;
  diffRank?: number;
  ofrtgRank?: number;
  dfrtgRank?: number;
  netrtgRank?: number;

  /** 100 possessions 想定の攻撃・守備・NET（teams に手入力 or シード） */
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
};

type Props = {
  league: League;
  homeTeamId: string;
  awayTeamId: string;
  language?: Language;
};

/** teams に保存したリーグ順位（シーズン確定後は seed で一括書き込み） */
type StoredNbaStatRanks = {
  ppg?: number;
  papg?: number;
  diff?: number;
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
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

  ortg?: number;
  drtg?: number;
  netRtg?: number;

  nbaStatRanks?: StoredNbaStatRanks;
};

type CompareStatRow = {
  key: string;
  label: string;
  left: {
    primary: string;
    rank: string | null;
    rankBelow?: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  right: {
    primary: string;
    rank: string | null;
    rankBelow?: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  leftWin: boolean;
  rightWin: boolean;
};

function formatStatRank(rank: number | undefined, language: Language): string | null {
  if (rank == null || rank < 1 || !Number.isFinite(rank)) return null;
  const r = Math.round(rank);
  return language === "en" ? `#${r}` : `${r}位`;
}

function readNbaAdvancedRtg(t: TeamDoc): {
  ofrtg: number;
  dfrtg: number;
  netrtg: number;
} | null {
  if (
    typeof t.ofrtg !== "number" ||
    typeof t.dfrtg !== "number" ||
    typeof t.netrtg !== "number" ||
    !Number.isFinite(t.ofrtg) ||
    !Number.isFinite(t.dfrtg) ||
    !Number.isFinite(t.netrtg)
  ) {
    return null;
  }
  return { ofrtg: t.ofrtg, dfrtg: t.dfrtg, netrtg: t.netrtg };
}

export default function GameTeamStats({
  league,
  homeTeamId,
  awayTeamId,
  language = "ja",
}: Props) {
  const m = t(language);
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

        const rtg = readNbaAdvancedRtg(t);
        const nbaStatRanks: StoredNbaStatRanks | undefined =
          league === "nba"
            ? {
                ppg: t.ppgRank,
                papg: t.papgRank,
                diff: t.diffRank,
                ofrtg: t.ofrtgRank,
                dfrtg: t.dfrtgRank,
                netrtg: t.netrtgRank,
              }
            : undefined;
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

          ortg: rtg?.ofrtg,
          drtg: rtg?.dfrtg,
          netRtg: rtg?.netrtg,

          nbaStatRanks,
        };
      };

      setHome(build(homeDoc));
      setAway(build(awayDoc));
    };

    run();
  }, [homeTeamId, awayTeamId, league]);

  if (!home || !away) return null;

  const fmtDiff = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

  const rh = home.nbaStatRanks;
  const ra = away.nbaStatRanks;
  const rbPpgH =
    league === "nba" ? formatStatRank(rh?.ppg, language) : null;
  const rbPpgA =
    league === "nba" ? formatStatRank(ra?.ppg, language) : null;
  const rbPapgH =
    league === "nba" ? formatStatRank(rh?.papg, language) : null;
  const rbPapgA =
    league === "nba" ? formatStatRank(ra?.papg, language) : null;
  const rbDiffH =
    league === "nba" ? formatStatRank(rh?.diff, language) : null;
  const rbDiffA =
    league === "nba" ? formatStatRank(ra?.diff, language) : null;

  const [ppgBarL, ppgBarR] = barPctMaxNorm(home.avgFor, away.avgFor);
  const [papgBarL, papgBarR] = barPctMinPaNorm(home.avgAgainst, away.avgAgainst);
  const [diffBarL, diffBarR] = barPctDiffNorm(home.diff, away.diff);

  const fmtNet = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

  const ppgRow: CompareStatRow = {
    key: "ppg",
    label: m.predict.ptsPerGame,
    left: {
      primary: home.avgFor.toFixed(1),
      rank: null,
      rankBelow: rbPpgH,
      barPct: ppgBarL,
      recordBelow: null,
    },
    right: {
      primary: away.avgFor.toFixed(1),
      rank: null,
      rankBelow: rbPpgA,
      barPct: ppgBarR,
      recordBelow: null,
    },
    leftWin: home.avgFor > away.avgFor,
    rightWin: away.avgFor > home.avgFor,
  };

  const papgRow: CompareStatRow = {
    key: "papg",
    label: m.predict.oppPtsPerGame,
    left: {
      primary: home.avgAgainst.toFixed(1),
      rank: null,
      rankBelow: rbPapgH,
      barPct: papgBarL,
      recordBelow: null,
    },
    right: {
      primary: away.avgAgainst.toFixed(1),
      rank: null,
      rankBelow: rbPapgA,
      barPct: papgBarR,
      recordBelow: null,
    },
    leftWin: home.avgAgainst < away.avgAgainst,
    rightWin: away.avgAgainst < home.avgAgainst,
  };

  const diffRow: CompareStatRow = {
    key: "diff",
    label: m.predict.pointDiff,
    left: {
      primary: fmtDiff(home.diff),
      rank: null,
      rankBelow: rbDiffH,
      barPct: diffBarL,
      recordBelow: null,
    },
    right: {
      primary: fmtDiff(away.diff),
      rank: null,
      rankBelow: rbDiffA,
      barPct: diffBarR,
      recordBelow: null,
    },
    leftWin: home.diff > away.diff,
    rightWin: away.diff > home.diff,
  };

  const homeRow: CompareStatRow = {
    key: "home",
    label: m.predict.homeRecord,
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
  };

  const awayRow: CompareStatRow = {
    key: "away",
    label: m.predict.awayRecord,
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
  };

  let rows: CompareStatRow[];

  if (league === "nba") {
    const ho = home.ortg;
    const ao = away.ortg;
    const hd = home.drtg;
    const ad = away.drtg;
    const hn = home.netRtg;
    const an = away.netRtg;

    const rbOfH = formatStatRank(rh?.ofrtg, language);
    const rbOfA = formatStatRank(ra?.ofrtg, language);
    const rbDfH = formatStatRank(rh?.dfrtg, language);
    const rbDfA = formatStatRank(ra?.dfrtg, language);
    const rbNtH = formatStatRank(rh?.netrtg, language);
    const rbNtA = formatStatRank(ra?.netrtg, language);

    const bothO = ho != null && ao != null;
    const bothD = hd != null && ad != null;
    const bothN = hn != null && an != null;

    const [oL, oR] = bothO ? barPctMaxNorm(ho, ao) : [0, 0];
    const [dL, dR] = bothD ? barPctMinPaNorm(hd, ad) : [0, 0];
    const [nL, nR] = bothN ? barPctDiffNorm(hn, an) : [0, 0];

    const ofrtgRow: CompareStatRow = {
      key: "ofrtg",
      label: "OFRTG",
      left: {
        primary: ho != null ? ho.toFixed(1) : "—",
        rank: null,
        rankBelow: rbOfH,
        barPct: oL,
        recordBelow: null,
      },
      right: {
        primary: ao != null ? ao.toFixed(1) : "—",
        rank: null,
        rankBelow: rbOfA,
        barPct: oR,
        recordBelow: null,
      },
      leftWin: bothO && ho > ao,
      rightWin: bothO && ao > ho,
    };

    const dfrtgRow: CompareStatRow = {
      key: "dfrtg",
      label: "DFRTG",
      left: {
        primary: hd != null ? hd.toFixed(1) : "—",
        rank: null,
        rankBelow: rbDfH,
        barPct: dL,
        recordBelow: null,
      },
      right: {
        primary: ad != null ? ad.toFixed(1) : "—",
        rank: null,
        rankBelow: rbDfA,
        barPct: dR,
        recordBelow: null,
      },
      leftWin: bothD && hd < ad,
      rightWin: bothD && ad < hd,
    };

    const netrtgRow: CompareStatRow = {
      key: "netrtg",
      label: "NETRTG",
      left: {
        primary: hn != null ? fmtNet(hn) : "—",
        rank: null,
        rankBelow: rbNtH,
        barPct: nL,
        recordBelow: null,
      },
      right: {
        primary: an != null ? fmtNet(an) : "—",
        rank: null,
        rankBelow: rbNtA,
        barPct: nR,
        recordBelow: null,
      },
      leftWin: bothN && hn > an,
      rightWin: bothN && an > hn,
    };

    rows = [
      ppgRow,
      ofrtgRow,
      papgRow,
      dfrtgRow,
      diffRow,
      netrtgRow,
      homeRow,
      awayRow,
    ];
  } else {
    rows = [ppgRow, papgRow, diffRow, homeRow, awayRow];
  }

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
          emphasizedMetrics
        />
      ))}
    </section>
  );
}
