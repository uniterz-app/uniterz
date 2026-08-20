/** Web `NbaTeamStatsPanel` 相当（SymmetricalCompareRow レイアウト） */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";

type WindowId = "season" | "last10";
type MetaTone = "up" | "down" | "flat";

type Props = {
  data: NbaTeamStatsBundle;
  isPro?: boolean;
  language: GamesLanguage;
  onOpenTeamDetail?: (teamId: string) => void;
};

const STAT_WIN = "#5cf0b5";

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

type SideSpec = {
  primary: string;
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
  const rankEl = side.rankBelow ? (
    <Text
      style={[
        styles.rankBeside,
        styles.rankIdle,
      ]}
    >
      {side.rankBelow}
    </Text>
  ) : null;
  return (
    <View style={styles.sideBlock}>
      <View style={styles.valueRow}>
        {end ? rankEl : null}
        <Text
          style={[
            styles.metricValue,
            win ? styles.metricValueWin : styles.metricValueIdle,
          ]}
        >
          {side.primary}
        </Text>
        {!end ? rankEl : null}
      </View>
      {side.proMeta ? (
        <Text
          style={[
            styles.metaText,
            styles.textCenter,
            toneStyle(side.proMetaTone),
          ]}
        >
          {side.proMeta}
        </Text>
      ) : null}
      {side.recordBelow ? (
        <Text style={[styles.recordBelow, styles.textCenter]}>
          {side.recordBelow}
        </Text>
      ) : null}
    </View>
  );
}

/** Web `SymmetricalCompareRow` compactHud 相当 */
function MetricRow({ row }: { row: RowSpec }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricInner}>
        <View style={styles.metricHalfLeft}>
          <SideMetricBlock side={row.left} align="right" win={row.leftWin} />
        </View>

        <View style={styles.labelCol}>
          <Text style={styles.metricLabel}>{row.label}</Text>
        </View>

        <View style={styles.metricHalfRight}>
          <SideMetricBlock side={row.right} align="left" win={row.rightWin} />
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
        leagueRank: leftRank ?? null,
        rankBelow: leftRankBelow,
        recordBelow: null,
        proMeta: leftPro.proMeta,
        proMetaTone: leftPro.proMetaTone,
      },
      right: {
        primary: format(a),
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
      "netrtg",
      "NETRTG",
      home.netrtg,
      away.netrtg,
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
      "ortg",
      "ORTG",
      home.ortg,
      away.ortg,
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
      "drtg",
      "DRTG",
      home.drtg,
      away.drtg,
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
      "pace",
      "PACE",
      home.pace,
      away.pace,
      home.pace > away.pace,
      away.pace > home.pace,
      (n) => n.toFixed(1),
      "pace",
      season.home.pace,
      season.away.pace,
      last10.home.pace,
      last10.away.pace
    ),
    make(
      "ppg",
      "PPG",
      home.ppg,
      away.ppg,
      home.ppg > away.ppg,
      away.ppg > home.ppg,
      (n) => n.toFixed(1),
      "ppg",
      season.home.ppg,
      season.away.ppg,
      last10.home.ppg,
      last10.away.ppg
    ),
  ];
}

/** 今試合の条件: ホームの HOME 成績 vs アウェイの ROAD 成績 */
function buildSiteRow(home: NbaTeamStatSide, away: NbaTeamStatSide): RowSpec[] {
  const hSite = winPct(home.homeW, home.homeL);
  const aSite = winPct(away.awayW, away.awayL);
  const pctFmt = (n: number) => `${Math.round(n)}%`;
  return [
    {
      key: "site",
      label: "H/R",
      leftWin: hSite > aSite,
      rightWin: aSite > hSite,
      left: {
        primary: pctFmt(hSite),
        leagueRank: null,
        rankBelow: null,
        recordBelow: `${home.homeW}-${home.homeL}`,
        proMeta: null,
        proMetaTone: "flat",
      },
      right: {
        primary: pctFmt(aSite),
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
  language,
  onOpenTeamDetail,
}: Props) {
  const t = getGamesTexts(language);
  const [windowId, setWindowId] = useState<WindowId>("season");
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
  const splitRows = windowId === "season" ? buildSiteRow(home, away) : [];
  const rows = [...coreRows, ...splitRows];

  const formLeft = data.last10.home.formResults ?? [];
  const formRight = data.last10.away.formResults ?? [];
  const showForm = formLeft.length > 0 || formRight.length > 0;

  return (
    <View style={styles.shell}>
      <CyberSlantedTabBarNative fill>
        <CyberSlantedTabNative
          label="SEASON"
          active={windowId === "season"}
          onPress={() => setWindowId("season")}
          compact
          fontWeight="700"
        />
        <CyberSlantedTabNative
          label="LAST 10"
          active={windowId === "last10"}
          onPress={() => setWindowId("last10")}
          compact
          fontWeight="700"
        />
      </CyberSlantedTabBarNative>

      {onOpenTeamDetail ? (
        <Text style={styles.moreHint}>{t.teamStatsMoreHint}</Text>
      ) : null}

      <View style={styles.teamHeaderRow}>
        {onOpenTeamDetail && home.teamId ? (
          <Pressable
            onPress={() => onOpenTeamDetail(home.teamId)}
            style={styles.teamHeaderHit}
          >
            <Text style={[styles.teamHeader, styles.teamHeaderHome]} numberOfLines={1}>
              {teamLabel(home.teamId, home.teamName)} →
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.teamHeader} numberOfLines={1}>
            {teamLabel(home.teamId, home.teamName)}
          </Text>
        )}
        <View style={styles.labelCol} />
        {onOpenTeamDetail && away.teamId ? (
          <Pressable
            onPress={() => onOpenTeamDetail(away.teamId)}
            style={styles.teamHeaderHit}
          >
            <Text style={[styles.teamHeader, styles.teamHeaderAway]} numberOfLines={1}>
              {teamLabel(away.teamId, away.teamName)} →
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.teamHeader} numberOfLines={1}>
            {teamLabel(away.teamId, away.teamName)}
          </Text>
        )}
      </View>

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
  shell: {
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: "#000000",
  },
  body: { gap: 0 },
  teamHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  moreHint: {
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textAlign: "center",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  teamHeaderHit: {
    flex: 1,
  },
  teamHeaderHome: {
    color: "rgba(165,243,252,0.95)",
  },
  teamHeaderAway: {
    color: "rgba(221,214,254,0.95)",
  },
  teamHeader: {
    flex: 1,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    fontWeight: "400",
    letterSpacing: 1.2,
    lineHeight: 26,
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
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
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  metricHalfRight: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  labelCol: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  metricLabel: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    textTransform: "uppercase",
  },
  sideBlock: {
    minWidth: 36,
    alignItems: "center",
    gap: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  textCenter: { textAlign: "center" },
  metricValue: {
    fontFamily: OXANIUM,
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  metricValueIdle: { color: "#ffffff" },
  metricValueWin: { color: STAT_WIN },
  metaText: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
  },
  metaUp: { color: "rgba(45,255,110,0.9)" },
  metaDown: { color: "rgba(255,138,180,0.9)" },
  metaFlat: { color: "rgba(255,255,255,0.4)" },
  rankBeside: {
    fontFamily: OXANIUM,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  rankIdle: { color: "rgba(255,255,255,0.55)" },
  recordBelow: {
    fontFamily: OXANIUM,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
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
    width: 64,
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
    width: 64,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.4)",
  },
});
