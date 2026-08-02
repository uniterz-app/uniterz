/** Web `NbaTeamStatsPanel` 相当（SymmetricalCompareRow レイアウト） */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type {
  NbaTeamStatsBundle,
  NbaTeamStatSide,
} from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { metricDelta } from "../../../../../../lib/predict/nbaTeamStatsForm";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import type { GamesLanguage } from "../gamesI18n";

type WindowId = "season" | "last10";
type MetaTone = "up" | "down" | "flat";

type Props = {
  data: NbaTeamStatsBundle;
  isPro?: boolean;
  language: GamesLanguage;
};

const LEAGUE_RANK_SEGMENTS = 6;
const BAR_LEFT = "#5cf0b5";
const BAR_RIGHT = "#b388ff";

function barPctMaxNorm(h: number, a: number): [number, number] {
  const m = Math.max(h, a);
  if (m <= 0 || !Number.isFinite(m)) return [0, 0];
  return [
    Math.min(100, Math.max(0, Math.round((h / m) * 100))),
    Math.min(100, Math.max(0, Math.round((a / m) * 100))),
  ];
}
function barPctMinPaNorm(h: number, a: number): [number, number] {
  const lo = Math.min(h, a);
  const hi = Math.max(h, a);
  if (hi <= 0 || !Number.isFinite(hi)) return [0, 0];
  const left = h > 0 ? Math.min(100, Math.round((lo / h) * 100)) : 0;
  const right = a > 0 ? Math.min(100, Math.round((lo / a) * 100)) : 0;
  return [Math.max(0, left), Math.max(0, right)];
}
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

function leagueRankSegPct(rank: number | null | undefined): number {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return 0;
  const r = Math.min(30, Math.round(rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 5));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function fmtDiff(d: number): string {
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
}
function fmtRank(rank: number | undefined): string | null {
  if (rank == null || rank < 1 || !Number.isFinite(rank)) return null;
  return `#${Math.round(rank)}`;
}
function winPct(w: number, l: number): number {
  const n = w + l;
  return n > 0 ? (100 * w) / n : 0;
}
function teamLabel(teamId: string, fallback: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return getMobileTeamName("nba", full).toUpperCase();
  return fallback.toUpperCase();
}

function CyberBarNative({
  value,
  grow,
  winGlow,
}: {
  value: number;
  grow: "left" | "right";
  winGlow: boolean;
}) {
  const v = Math.min(100, Math.max(0, value));
  const left = grow === "left";
  return (
    <View
      style={[
        styles.cyberBar,
        left ? styles.cyberBarLeftTint : styles.cyberBarRightTint,
        winGlow && (left ? styles.cyberBarWinLeft : styles.cyberBarWinRight),
      ]}
    >
      <LinearGradient
        colors={
          left
            ? ["rgba(92,240,181,0.33)", "rgba(92,240,181,0.87)", BAR_LEFT]
            : [BAR_RIGHT, "rgba(179,136,255,0.87)", "rgba(179,136,255,0.33)"]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.cyberBarFill,
          left
            ? { width: `${v}%`, alignSelf: "flex-end" }
            : { width: `${v}%`, alignSelf: "flex-start" },
        ]}
      />
    </View>
  );
}

function LeagueRankSegBarNative({
  rank,
  grow,
  replayKey,
}: {
  rank: number | null | undefined;
  grow: "left" | "right";
  replayKey: string;
}) {
  const pct = leagueRankSegPct(rank);
  const accent =
    grow === "left"
      ? {
          border: BAR_LEFT,
          glow: "rgba(92,240,181,0.28)",
          bg: BAR_LEFT,
        }
      : {
          border: BAR_RIGHT,
          glow: "rgba(179,136,255,0.28)",
          bg: BAR_RIGHT,
        };
  return (
    <View
      style={[
        styles.segWrap,
        grow === "left" ? styles.segWrapLeft : styles.segWrapRight,
      ]}
    >
      <View style={grow === "left" ? styles.segTrackReverse : undefined}>
        <CyberSlantedSegBarNative
          pct={pct}
          segments={LEAGUE_RANK_SEGMENTS}
          compact
          accent={accent}
          forceStatic
          replayKey={replayKey}
        />
      </View>
    </View>
  );
}

type SideSpec = {
  primary: string;
  barPct: number;
  leagueRank: number | null;
  rankBelow: string | null;
  recordBelow: string | null;
  proMeta: string | null;
  proMetaTone: MetaTone;
};

type RowSpec = {
  key: string;
  label: string;
  left: SideSpec;
  right: SideSpec;
  leftWin: boolean;
  rightWin: boolean;
};

function toneStyle(tone: MetaTone) {
  return tone === "up"
    ? styles.metaUp
    : tone === "down"
      ? styles.metaDown
      : styles.metaFlat;
}

function SideMetricBlock({
  side,
  align,
  win,
}: {
  side: SideSpec;
  align: "left" | "right";
  win: boolean;
}) {
  const end = align === "right";
  return (
    <View style={[styles.sideBlock, end && styles.sideBlockEnd]}>
      <Text
        style={[
          styles.metricValue,
          end ? styles.valueLeft : styles.valueRight,
          win && styles.metricValueWin,
        ]}
      >
        {side.primary}
      </Text>
      {side.proMeta ? (
        <Text
          style={[
            styles.metaText,
            end && styles.textRight,
            toneStyle(side.proMetaTone),
          ]}
        >
          {side.proMeta}
        </Text>
      ) : null}
      {side.rankBelow ? (
        <Text style={[styles.rankBelow, end && styles.textRight]}>
          {side.rankBelow}
        </Text>
      ) : null}
      {side.recordBelow ? (
        <Text style={[styles.recordBelow, end && styles.textRight]}>
          {side.recordBelow}
        </Text>
      ) : null}
    </View>
  );
}

/** Web `SymmetricalCompareRow` compactHud 相当 */
function MetricRow({ row, replayKey }: { row: RowSpec; replayKey: string }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricInner}>
        <View style={styles.metricHalfLeft}>
          {row.left.leagueRank != null ? (
            <LeagueRankSegBarNative
              rank={row.left.leagueRank}
              grow="left"
              replayKey={`${replayKey}-L`}
            />
          ) : (
            <CyberBarNative
              value={row.left.barPct}
              grow="left"
              winGlow={row.leftWin}
            />
          )}
          <SideMetricBlock side={row.left} align="right" win={row.leftWin} />
        </View>

        <View style={styles.labelCol}>
          <Text style={styles.metricLabel}>{row.label}</Text>
        </View>

        <View style={styles.metricHalfRight}>
          <SideMetricBlock side={row.right} align="left" win={row.rightWin} />
          {row.right.leagueRank != null ? (
            <LeagueRankSegBarNative
              rank={row.right.leagueRank}
              grow="right"
              replayKey={`${replayKey}-R`}
            />
          ) : (
            <CyberBarNative
              value={row.right.barPct}
              grow="right"
              winGlow={row.rightWin}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function FormChip({
  result,
  index,
  total,
}: {
  result: "W" | "L";
  index: number;
  total: number;
}) {
  const win = result === "W";
  const last = total > 0 && index === total - 1;
  const t = total <= 1 ? 1 : index / (total - 1);
  const opacity = 0.34 + t * 0.66;
  return (
    <View
      style={[
        styles.formChip,
        { backgroundColor: win ? "#00F5FF" : "#FF2D78", opacity },
        last && styles.formChipLast,
      ]}
    >
      <Text style={styles.formChipText}>{result}</Text>
    </View>
  );
}

function FormStrip({
  left,
  right,
}: {
  left: Array<"W" | "L">;
  right: Array<"W" | "L">;
}) {
  const leftWins = left.filter((r) => r === "W").length;
  const rightWins = right.filter((r) => r === "W").length;
  return (
    <View style={styles.formStrip}>
      <View style={styles.formRow}>
        <View style={styles.formChipsLeft}>
          {left.map((r, i) => (
            <FormChip key={`l-${i}`} result={r} index={i} total={left.length} />
          ))}
        </View>
        <Text style={styles.formLabel}>L10</Text>
        <View style={styles.formChipsRight}>
          {right.map((r, i) => (
            <FormChip key={`r-${i}`} result={r} index={i} total={right.length} />
          ))}
        </View>
      </View>
      <View style={styles.formRecordRow}>
        <Text style={[styles.formRecord, styles.formRecordLeft]}>
          {leftWins}-{left.length - leftWins}
        </Text>
        <Text style={styles.formNewLabel}>←NEW→</Text>
        <Text style={[styles.formRecord, styles.formRecordRight]}>
          {rightWins}-{right.length - rightWins}
        </Text>
      </View>
    </View>
  );
}

function sideProExtras(
  isPro: boolean,
  windowId: WindowId,
  key: string,
  seasonVal: number,
  last10Val: number,
  last10Rank: number | undefined
): { proMeta: string | null; proMetaTone: MetaTone; proRank: string | null } {
  if (!isPro || windowId !== "last10") {
    return { proMeta: null, proMetaTone: "flat", proRank: null };
  }
  const d = metricDelta(key, seasonVal, last10Val);
  return {
    proMeta: `SZN ${d.label}`,
    proMetaTone: d.tone,
    proRank: fmtRank(last10Rank),
  };
}

function buildCoreRows(
  home: NbaTeamStatSide,
  away: NbaTeamStatSide,
  season: { home: NbaTeamStatSide; away: NbaTeamStatSide },
  last10: { home: NbaTeamStatSide; away: NbaTeamStatSide },
  windowId: WindowId,
  isPro: boolean
): RowSpec[] {
  const rh = home.ranks;
  const ra = away.ranks;
  const l10Rh = last10.home.ranks;
  const l10Ra = last10.away.ranks;

  const make = (
    key: string,
    label: string,
    h: number,
    a: number,
    pct: [number, number],
    leftWin: boolean,
    rightWin: boolean,
    format: (n: number) => string,
    rankKey: keyof NonNullable<NbaTeamStatSide["ranks"]>,
    seasonH: number,
    seasonA: number,
    lastH: number,
    lastA: number
  ): RowSpec => {
    const leftRank =
      windowId === "last10" ? l10Rh?.[rankKey] : rh?.[rankKey];
    const rightRank =
      windowId === "last10" ? l10Ra?.[rankKey] : ra?.[rankKey];
    const leftPro = sideProExtras(
      isPro,
      windowId,
      key,
      seasonH,
      lastH,
      l10Rh?.[rankKey]
    );
    const rightPro = sideProExtras(
      isPro,
      windowId,
      key,
      seasonA,
      lastA,
      l10Ra?.[rankKey]
    );
    const leftRankBelow =
      isPro && windowId === "last10"
        ? leftPro.proRank
        : fmtRank(leftRank);
    const rightRankBelow =
      isPro && windowId === "last10"
        ? rightPro.proRank
        : fmtRank(rightRank);

    return {
      key,
      label,
      leftWin,
      rightWin,
      left: {
        primary: format(h),
        barPct: pct[0],
        leagueRank: leftRank ?? null,
        rankBelow: leftRankBelow,
        recordBelow: null,
        proMeta: leftPro.proMeta,
        proMetaTone: leftPro.proMetaTone,
      },
      right: {
        primary: format(a),
        barPct: pct[1],
        leagueRank: rightRank ?? null,
        rankBelow: rightRankBelow,
        recordBelow: null,
        proMeta: rightPro.proMeta,
        proMetaTone: rightPro.proMetaTone,
      },
    };
  };

  return [
    make(
      "ppg",
      "PPG",
      home.ppg,
      away.ppg,
      barPctMaxNorm(home.ppg, away.ppg),
      home.ppg > away.ppg,
      away.ppg > home.ppg,
      (n) => n.toFixed(1),
      "ppg",
      season.home.ppg,
      season.away.ppg,
      last10.home.ppg,
      last10.away.ppg
    ),
    make(
      "ortg",
      "ORTG",
      home.ortg,
      away.ortg,
      barPctMaxNorm(home.ortg, away.ortg),
      home.ortg > away.ortg,
      away.ortg > home.ortg,
      (n) => n.toFixed(1),
      "ortg",
      season.home.ortg,
      season.away.ortg,
      last10.home.ortg,
      last10.away.ortg
    ),
    make(
      "papg",
      "PAPG",
      home.papg,
      away.papg,
      barPctMinPaNorm(home.papg, away.papg),
      home.papg < away.papg,
      away.papg < home.papg,
      (n) => n.toFixed(1),
      "papg",
      season.home.papg,
      season.away.papg,
      last10.home.papg,
      last10.away.papg
    ),
    make(
      "drtg",
      "DRTG",
      home.drtg,
      away.drtg,
      barPctMinPaNorm(home.drtg, away.drtg),
      home.drtg < away.drtg,
      away.drtg < home.drtg,
      (n) => n.toFixed(1),
      "drtg",
      season.home.drtg,
      season.away.drtg,
      last10.home.drtg,
      last10.away.drtg
    ),
    make(
      "diff",
      "DIFF",
      home.diff,
      away.diff,
      barPctDiffNorm(home.diff, away.diff),
      home.diff > away.diff,
      away.diff > home.diff,
      fmtDiff,
      "diff",
      season.home.diff,
      season.away.diff,
      last10.home.diff,
      last10.away.diff
    ),
    make(
      "netrtg",
      "NETRTG",
      home.netrtg,
      away.netrtg,
      barPctDiffNorm(home.netrtg, away.netrtg),
      home.netrtg > away.netrtg,
      away.netrtg > home.netrtg,
      fmtDiff,
      "netrtg",
      season.home.netrtg,
      season.away.netrtg,
      last10.home.netrtg,
      last10.away.netrtg
    ),
    make(
      "pace",
      "PACE",
      home.pace,
      away.pace,
      barPctMaxNorm(home.pace, away.pace),
      home.pace > away.pace,
      away.pace > home.pace,
      (n) => n.toFixed(1),
      "pace",
      season.home.pace,
      season.away.pace,
      last10.home.pace,
      last10.away.pace
    ),
  ];
}

function buildSplitRows(home: NbaTeamStatSide, away: NbaTeamStatSide): RowSpec[] {
  const hHome = winPct(home.homeW, home.homeL);
  const aHome = winPct(away.homeW, away.homeL);
  const hAway = winPct(home.awayW, home.awayL);
  const aAway = winPct(away.awayW, away.awayL);
  const pctFmt = (n: number) => `${Math.round(n)}%`;
  return [
    {
      key: "home",
      label: "HOME",
      leftWin: hHome > aHome,
      rightWin: aHome > hHome,
      left: {
        primary: pctFmt(hHome),
        barPct: Math.round(Math.min(100, Math.max(0, hHome))),
        leagueRank: null,
        rankBelow: null,
        recordBelow: `${home.homeW}-${home.homeL}`,
        proMeta: null,
        proMetaTone: "flat",
      },
      right: {
        primary: pctFmt(aHome),
        barPct: Math.round(Math.min(100, Math.max(0, aHome))),
        leagueRank: null,
        rankBelow: null,
        recordBelow: `${away.homeW}-${away.homeL}`,
        proMeta: null,
        proMetaTone: "flat",
      },
    },
    {
      key: "away",
      label: "AWAY",
      leftWin: hAway > aAway,
      rightWin: aAway > hAway,
      left: {
        primary: pctFmt(hAway),
        barPct: Math.round(Math.min(100, Math.max(0, hAway))),
        leagueRank: null,
        rankBelow: null,
        recordBelow: `${home.awayW}-${home.awayL}`,
        proMeta: null,
        proMetaTone: "flat",
      },
      right: {
        primary: pctFmt(aAway),
        barPct: Math.round(Math.min(100, Math.max(0, aAway))),
        leagueRank: null,
        rankBelow: null,
        recordBelow: `${away.awayW}-${away.awayL}`,
        proMeta: null,
        proMetaTone: "flat",
      },
    },
  ];
}

export default function NbaTeamStatsPanelNative({
  data,
  isPro = false,
}: Props) {
  const [windowId, setWindowId] = useState<WindowId>("last10");
  const active = windowId === "season" ? data.season : data.last10;
  const { home, away } = active;

  const coreRows = buildCoreRows(
    home,
    away,
    data.season,
    data.last10,
    windowId,
    isPro
  );
  const splitRows = windowId === "season" ? buildSplitRows(home, away) : [];
  const rows = [...coreRows, ...splitRows];

  const formLeft = home.formResults ?? [];
  const formRight = away.formResults ?? [];
  const showForm =
    windowId === "last10" && (formLeft.length > 0 || formRight.length > 0);

  return (
    <View style={styles.shell}>
      <CyberSlantedTabBarNative fill>
        <CyberSlantedTabNative
          label="LAST 10"
          active={windowId === "last10"}
          onPress={() => setWindowId("last10")}
          compact
          fontWeight="700"
        />
        <CyberSlantedTabNative
          label="SEASON"
          active={windowId === "season"}
          onPress={() => setWindowId("season")}
          compact
          fontWeight="700"
        />
      </CyberSlantedTabBarNative>

      <View style={styles.teamHeaderRow}>
        <Text style={styles.teamHeader} numberOfLines={1}>
          {teamLabel(home.teamId, home.teamName)}
        </Text>
        <Text style={styles.teamHeader} numberOfLines={1}>
          {teamLabel(away.teamId, away.teamName)}
        </Text>
      </View>

      <View style={styles.body}>
        {rows.map((row) => (
          <MetricRow
            key={`${windowId}-${row.key}`}
            row={row}
            replayKey={`${windowId}-${row.key}`}
          />
        ))}
        {showForm ? <FormStrip left={formLeft} right={formRight} /> : null}
      </View>
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  shell: {
    gap: 8,
    borderRadius: 2,
    backgroundColor: "rgba(6,10,16,0.96)",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  body: { gap: 0 },
  teamHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
  },
  teamHeader: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  metricRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 7,
  },
  metricInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricHalfLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  metricHalfRight: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  labelCol: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    textTransform: "uppercase",
  },
  sideBlock: {
    minWidth: 36,
    alignItems: "flex-start",
    gap: 1,
  },
  sideBlockEnd: {
    alignItems: "flex-end",
  },
  textRight: { textAlign: "right" },
  metricValue: {
    fontFamily: OXANIUM,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  valueLeft: { color: BAR_LEFT },
  valueRight: { color: BAR_RIGHT },
  metricValueWin: {},
  metaText: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
  },
  metaUp: { color: "rgba(45,255,110,0.9)" },
  metaDown: { color: "rgba(255,138,180,0.9)" },
  metaFlat: { color: "rgba(255,255,255,0.4)" },
  rankBelow: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.52)",
    fontVariant: ["tabular-nums"],
  },
  recordBelow: {
    fontFamily: OXANIUM,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  cyberBar: {
    flex: 1,
    minWidth: 32,
    maxWidth: 88,
    height: 3,
    overflow: "hidden",
    borderRadius: 1,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cyberBarLeftTint: { borderColor: "rgba(92,240,181,0.28)" },
  cyberBarRightTint: { borderColor: "rgba(179,136,255,0.28)" },
  cyberBarWinLeft: {
    borderColor: "rgba(92,240,181,0.55)",
  },
  cyberBarWinRight: {
    borderColor: "rgba(179,136,255,0.55)",
  },
  cyberBarFill: { height: "100%" },
  segWrap: {
    flex: 1,
    minWidth: 32,
    maxWidth: 88,
  },
  segWrapLeft: { alignItems: "flex-end" },
  segWrapRight: { alignItems: "flex-start" },
  segTrackReverse: {
    width: "100%",
    transform: [{ scaleX: -1 }],
  },
  formStrip: {
    paddingTop: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  formChipsLeft: {
    flex: 1,
    flexDirection: "row-reverse",
    gap: 1,
  },
  formChipsRight: {
    flex: 1,
    flexDirection: "row",
    gap: 1,
  },
  formChip: {
    flex: 1,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 1,
    transform: [{ skewX: "-12deg" }],
  },
  formChipLast: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  formChipText: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "900",
    color: "#050508",
    transform: [{ skewX: "12deg" }],
  },
  formLabel: {
    width: 56,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
  },
  formRecordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  formRecord: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    fontVariant: ["tabular-nums"],
  },
  formRecordLeft: { textAlign: "right" },
  formRecordRight: { textAlign: "left" },
  formNewLabel: {
    width: 56,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.4)",
  },
});
