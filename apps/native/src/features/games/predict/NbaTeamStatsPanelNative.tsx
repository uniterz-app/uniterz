/** Web `NbaTeamStatsPanel` 相当（7指標 + Home/Away分割 + L10フォーム + Pro SZN±/順位） */
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
import type { GamesLanguage } from "../gamesI18n";

type WindowId = "season" | "last10";

type Props = {
  data: NbaTeamStatsBundle;
  isPro?: boolean;
  language: GamesLanguage;
};

// --- 純粋バー正規化（Web `teamStatsCompare` からコピー） ---
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

type MetaTone = "up" | "down" | "flat";

function CompareBar({
  leftPct,
  rightPct,
  leftWin,
  rightWin,
}: {
  leftPct: number;
  rightPct: number;
  leftWin: boolean;
  rightWin: boolean;
}) {
  return (
    <View style={styles.barRow}>
      <View style={[styles.barSide, leftWin && styles.barSideWin]}>
        <LinearGradient
          colors={["rgba(92,240,181,0.75)", "rgba(92,240,181,0.15)"]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={[styles.barFillLeft, { width: `${leftPct}%` }]}
        />
      </View>
      <View style={[styles.barSide, styles.barSideRight, rightWin && styles.barSideWin]}>
        <LinearGradient
          colors={["rgba(179,136,255,0.15)", "rgba(179,136,255,0.75)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.barFillRight, { width: `${rightPct}%` }]}
        />
      </View>
    </View>
  );
}

function toneStyle(tone: MetaTone) {
  return tone === "up"
    ? styles.metaUp
    : tone === "down"
      ? styles.metaDown
      : styles.metaFlat;
}

type RowSpec = {
  key: string;
  label: string;
  home: number;
  away: number;
  leftPct: number;
  rightPct: number;
  leftWin: boolean;
  rightWin: boolean;
  format: (n: number) => string;
  homeRankBelow: string | null;
  awayRankBelow: string | null;
  homeMeta: string | null;
  awayMeta: string | null;
  homeMetaTone: MetaTone;
  awayMetaTone: MetaTone;
  homeRecord: string | null;
  awayRecord: string | null;
};

function MetricRow({ row }: { row: RowSpec }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricValues}>
        <View style={styles.metricSide}>
          <Text style={[styles.metricValue, styles.valueLeft, row.leftWin && styles.metricValueWin]}>
            {row.format(row.home)}
          </Text>
          {row.homeMeta ? (
            <Text style={[styles.metaText, toneStyle(row.homeMetaTone)]}>{row.homeMeta}</Text>
          ) : null}
          {row.homeRankBelow ? <Text style={styles.rankBelow}>{row.homeRankBelow}</Text> : null}
          {row.homeRecord ? <Text style={styles.recordBelow}>{row.homeRecord}</Text> : null}
        </View>
        <Text style={styles.metricLabel}>{row.label}</Text>
        <View style={[styles.metricSide, styles.metricSideRight]}>
          <Text style={[styles.metricValue, styles.valueRight, row.rightWin && styles.metricValueWin]}>
            {row.format(row.away)}
          </Text>
          {row.awayMeta ? (
            <Text style={[styles.metaText, styles.metaRight, toneStyle(row.awayMetaTone)]}>
              {row.awayMeta}
            </Text>
          ) : null}
          {row.awayRankBelow ? (
            <Text style={[styles.rankBelow, styles.metaRight]}>{row.awayRankBelow}</Text>
          ) : null}
          {row.awayRecord ? (
            <Text style={[styles.recordBelow, styles.metaRight]}>{row.awayRecord}</Text>
          ) : null}
        </View>
      </View>
      <CompareBar
        leftPct={row.leftPct}
        rightPct={row.rightPct}
        leftWin={row.leftWin}
        rightWin={row.rightWin}
      />
    </View>
  );
}

function FormChip({ result, index, total }: { result: "W" | "L"; index: number; total: number }) {
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

function FormStrip({ left, right }: { left: Array<"W" | "L">; right: Array<"W" | "L"> }) {
  const leftWins = left.filter((r) => r === "W").length;
  const rightWins = right.filter((r) => r === "W").length;
  return (
    <View style={styles.formStrip}>
      <View style={styles.formRow}>
        <View style={styles.formChipsLeft}>
          {[...left].reverse().map((r, i) => (
            <FormChip key={`l-${i}`} result={r} index={left.length - 1 - i} total={left.length} />
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

function buildCoreRows(
  home: NbaTeamStatSide,
  away: NbaTeamStatSide,
  season: { home: NbaTeamStatSide; away: NbaTeamStatSide },
  windowId: WindowId,
  isPro: boolean
): RowSpec[] {
  const proL10 = isPro && windowId === "last10";

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
    seasonA: number
  ): RowSpec => {
    const homeRank = home.ranks?.[rankKey];
    const awayRank = away.ranks?.[rankKey];
    const homeMetaD = proL10 ? metricDelta(key, seasonH, h) : null;
    const awayMetaD = proL10 ? metricDelta(key, seasonA, a) : null;
    return {
      key,
      label,
      home: h,
      away: a,
      leftPct: pct[0],
      rightPct: pct[1],
      leftWin,
      rightWin,
      format,
      homeRankBelow: fmtRank(homeRank),
      awayRankBelow: fmtRank(awayRank),
      homeMeta: homeMetaD ? `SZN ${homeMetaD.label}` : null,
      awayMeta: awayMetaD ? `SZN ${awayMetaD.label}` : null,
      homeMetaTone: homeMetaD?.tone ?? "flat",
      awayMetaTone: awayMetaD?.tone ?? "flat",
      homeRecord: null,
      awayRecord: null,
    };
  };

  return [
    make("ppg", "PPG", home.ppg, away.ppg, barPctMaxNorm(home.ppg, away.ppg), home.ppg > away.ppg, away.ppg > home.ppg, (n) => n.toFixed(1), "ppg", season.home.ppg, season.away.ppg),
    make("ortg", "ORTG", home.ortg, away.ortg, barPctMaxNorm(home.ortg, away.ortg), home.ortg > away.ortg, away.ortg > home.ortg, (n) => n.toFixed(1), "ortg", season.home.ortg, season.away.ortg),
    make("papg", "PAPG", home.papg, away.papg, barPctMinPaNorm(home.papg, away.papg), home.papg < away.papg, away.papg < home.papg, (n) => n.toFixed(1), "papg", season.home.papg, season.away.papg),
    make("drtg", "DRTG", home.drtg, away.drtg, barPctMinPaNorm(home.drtg, away.drtg), home.drtg < away.drtg, away.drtg < home.drtg, (n) => n.toFixed(1), "drtg", season.home.drtg, season.away.drtg),
    make("diff", "DIFF", home.diff, away.diff, barPctDiffNorm(home.diff, away.diff), home.diff > away.diff, away.diff > home.diff, fmtDiff, "diff", season.home.diff, season.away.diff),
    make("netrtg", "NETRTG", home.netrtg, away.netrtg, barPctDiffNorm(home.netrtg, away.netrtg), home.netrtg > away.netrtg, away.netrtg > home.netrtg, fmtDiff, "netrtg", season.home.netrtg, season.away.netrtg),
    make("pace", "PACE", home.pace, away.pace, barPctMaxNorm(home.pace, away.pace), home.pace > away.pace, away.pace > home.pace, (n) => n.toFixed(1), "pace", season.home.pace, season.away.pace),
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
      home: hHome,
      away: aHome,
      leftPct: Math.round(Math.min(100, Math.max(0, hHome))),
      rightPct: Math.round(Math.min(100, Math.max(0, aHome))),
      leftWin: hHome > aHome,
      rightWin: aHome > hHome,
      format: pctFmt,
      homeRankBelow: null,
      awayRankBelow: null,
      homeMeta: null,
      awayMeta: null,
      homeMetaTone: "flat",
      awayMetaTone: "flat",
      homeRecord: `${home.homeW}-${home.homeL}`,
      awayRecord: `${away.homeW}-${away.homeL}`,
    },
    {
      key: "away",
      label: "AWAY",
      home: hAway,
      away: aAway,
      leftPct: Math.round(Math.min(100, Math.max(0, hAway))),
      rightPct: Math.round(Math.min(100, Math.max(0, aAway))),
      leftWin: hAway > aAway,
      rightWin: aAway > hAway,
      format: pctFmt,
      homeRankBelow: null,
      awayRankBelow: null,
      homeMeta: null,
      awayMeta: null,
      homeMetaTone: "flat",
      awayMetaTone: "flat",
      homeRecord: `${home.awayW}-${home.awayL}`,
      awayRecord: `${away.awayW}-${away.awayL}`,
    },
  ];
}

export default function NbaTeamStatsPanelNative({ data, isPro = false, language }: Props) {
  const [windowId, setWindowId] = useState<WindowId>("last10");
  const active = windowId === "season" ? data.season : data.last10;
  const { home, away } = active;

  const coreRows = buildCoreRows(home, away, data.season, windowId, isPro);
  const splitRows = windowId === "season" ? buildSplitRows(home, away) : [];
  const rows = [...coreRows, ...splitRows];

  const formLeft = home.formResults ?? [];
  const formRight = away.formResults ?? [];
  const showForm = windowId === "last10" && (formLeft.length > 0 || formRight.length > 0);

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

      {isPro && windowId === "last10" ? (
        <Text style={styles.proNote}>SZN DELTA · PRO</Text>
      ) : null}

      <View style={styles.body}>
        {rows.map((row) => (
          <MetricRow key={`${windowId}-${row.key}`} row={row} />
        ))}
        {showForm ? <FormStrip left={formLeft} right={formRight} /> : null}
      </View>
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  shell: { gap: 8 },
  body: { gap: 6 },
  teamHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  teamHeader: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#fff",
    textAlign: "center",
  },
  proNote: {
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.6,
    textAlign: "center",
    color: "rgba(252,211,77,0.7)",
    textTransform: "uppercase",
  },
  metricRow: {
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 5,
  },
  metricValues: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  metricSide: {
    flex: 1,
    alignItems: "flex-start",
  },
  metricSideRight: {
    alignItems: "flex-end",
  },
  metricValue: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  valueLeft: { color: "#5cf0b5" },
  valueRight: { color: "#b388ff" },
  metricValueWin: {},
  metaText: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "700",
    marginTop: 1,
  },
  metaRight: { textAlign: "right" },
  metaUp: { color: "rgba(45,255,110,0.9)" },
  metaDown: { color: "rgba(255,138,180,0.9)" },
  metaFlat: { color: "rgba(255,255,255,0.4)" },
  rankBelow: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.52)",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  recordBelow: {
    fontFamily: OXANIUM,
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    width: 48,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
  },
  barRow: {
    flexDirection: "row",
    height: 4,
    gap: 4,
  },
  barSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  barSideRight: { alignItems: "flex-end" },
  barSideWin: { borderColor: "rgba(255,255,255,0.18)" },
  barFillLeft: { height: "100%", alignSelf: "flex-end" },
  barFillRight: { height: "100%", alignSelf: "flex-start" },
  formStrip: {
    paddingTop: 4,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  formChipsLeft: {
    flex: 1,
    flexDirection: "row-reverse",
    gap: 2,
  },
  formChipsRight: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  formChip: {
    flex: 1,
    height: 15,
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
    fontSize: 7,
    fontWeight: "900",
    color: "#050508",
    transform: [{ skewX: "12deg" }],
  },
  formLabel: {
    width: 48,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.7)",
  },
  formRecordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  formRecord: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    fontVariant: ["tabular-nums"],
  },
  formRecordLeft: { textAlign: "right" },
  formRecordRight: { textAlign: "left" },
  formNewLabel: {
    width: 48,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.4)",
  },
});
