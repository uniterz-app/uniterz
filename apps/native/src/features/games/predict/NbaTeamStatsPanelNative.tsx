/** Web `NbaTeamStatsPanel` 相当（SymmetricalCompareRow レイアウト） */
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import type {
  NbaTeamFormGame,
  NbaTeamStatsBundle,
  NbaTeamStatSide,
} from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { metricDelta } from "../../../../../../lib/predict/nbaTeamStatsForm";
import { useLiveGameStats } from "../../../../../../lib/games/useLiveGameStats";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { MATCH_CARD_DISPLAY_FONT, MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";
import LiveGameStatsPanelNative from "../live/LiveGameStatsPanelNative";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { db } from "../../../lib/firebase";

type WindowId = "season" | "last10";

/** Web と同じ — LAST 10 は box 由来（NET/ORTG/DRTG/PACE + FG%/3P%） */
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

const FORM_WIN = "#F5C518";
const FORM_LOSS = "#FF2D78";

function FormGameLine({
  game,
  align,
  onOpen,
}: {
  game: NbaTeamFormGame;
  align: "left" | "right";
  onOpen?: (gameId: string) => void;
}) {
  const venue = game.home ? "vs" : "@";
  const win = game.result === "W";
  const canOpen = Boolean(game.gameId && onOpen);
  const row = (
    <View
      style={[
        styles.formGameLine,
        align === "right" ? styles.formGameLineRight : styles.formGameLineLeft,
      ]}
    >
      <Text style={styles.formDate}>{game.dateLabel}</Text>
      <Text style={styles.formVenue}>{venue}</Text>
      <Text style={styles.formOpp} numberOfLines={1}>
        {game.oppAbbr}
      </Text>
      <Text style={styles.formScore}>
        {game.teamScore}-{game.oppScore}
      </Text>
      <Text style={[styles.formResult, { color: win ? FORM_WIN : FORM_LOSS }]}>
        {game.result}
      </Text>
    </View>
  );
  if (canOpen && game.gameId && onOpen) {
    return (
      <Pressable
        onPress={() => onOpen(game.gameId!)}
        accessibilityRole="button"
        accessibilityLabel={`Box score ${game.oppAbbr}`}
      >
        {row}
      </Pressable>
    );
  }
  return row;
}

async function loadGameDocForLiveStats(
  gameId: string
): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function FormGameBoxOverlay({
  gameId,
  language,
  onClose,
}: {
  gameId: string;
  language: GamesLanguage;
  onClose: () => void;
}) {
  const isJa = language === "ja";
  const { report, loading } = useLiveGameStats(gameId, true, {
    apiBaseUrl: getUniterzApiBaseUrl(),
    loadGameDoc: loadGameDocForLiveStats,
  });
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.boxOverlay}>
        <View style={styles.boxOverlayHeader}>
          <Text style={styles.boxOverlayTitle}>BOX SCORE</Text>
          <Pressable
            onPress={onClose}
            style={styles.boxOverlayClose}
            accessibilityRole="button"
          >
            <Text style={styles.boxOverlayCloseText}>
              {isJa ? "閉じる" : "Close"}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.boxOverlayScroll}
          showsVerticalScrollIndicator={false}
        >
          {loading && !report ? (
            <Text style={styles.boxOverlayEmpty}>
              {isJa ? "読み込み中…" : "Loading…"}
            </Text>
          ) : report ? (
            <LiveGameStatsPanelNative report={report} language={language} />
          ) : (
            <Text style={styles.boxOverlayEmpty}>
              {isJa ? "ボックススコアがありません" : "No box score yet"}
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function RecentFormGamesStrip({
  left,
  right,
  language,
}: {
  left: NbaTeamFormGame[];
  right: NbaTeamFormGame[];
  language: GamesLanguage;
}) {
  const [open, setOpen] = useState(false);
  const [boxGameId, setBoxGameId] = useState<string | null>(null);
  const rows = Math.max(left.length, right.length, 1);
  const hint = language === "ja" ? "タップ→BOXスコア" : "tap→box score";
  return (
    <View style={styles.recentForm}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.recentFormHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="LAST 5"
      >
        <View style={styles.recentFormTitleRow}>
          <Text style={styles.recentFormTitle}>LAST 5</Text>
          <Text
            style={[
              styles.recentFormChevron,
              open && styles.recentFormChevronOpen,
            ]}
          >
            ▼
          </Text>
        </View>
        <Text style={styles.recentFormHint}>{hint}</Text>
      </Pressable>
      {open ? (
        <View style={styles.recentFormGrid}>
          <View style={styles.recentFormCol}>
            {Array.from({ length: rows }, (_, i) =>
              left[i] ? (
                <FormGameLine
                  key={`l-${i}`}
                  game={left[i]}
                  align="right"
                  onOpen={setBoxGameId}
                />
              ) : (
                <View key={`l-${i}`} style={styles.formGameSpacer} />
              )
            )}
          </View>
          <View style={styles.recentFormDivider} />
          <View style={styles.recentFormCol}>
            {Array.from({ length: rows }, (_, i) =>
              right[i] ? (
                <FormGameLine
                  key={`r-${i}`}
                  game={right[i]}
                  align="left"
                  onOpen={setBoxGameId}
                />
              ) : (
                <View key={`r-${i}`} style={styles.formGameSpacer} />
              )
            )}
          </View>
        </View>
      ) : null}
      {boxGameId ? (
        <FormGameBoxOverlay
          gameId={boxGameId}
          language={language}
          onClose={() => setBoxGameId(null)}
        />
      ) : null}
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
      "fgPct",
      "FG%",
      pct(home.fgPct),
      pct(away.fgPct),
      pct(home.fgPct) > pct(away.fgPct),
      pct(away.fgPct) > pct(home.fgPct),
      fmtPct,
      "fgPct",
      pct(season.home.fgPct),
      pct(season.away.fgPct),
      pct(last10.home.fgPct),
      pct(last10.away.fgPct)
    ),
    make(
      "fg3Pct",
      "3P%",
      pct(home.fg3Pct),
      pct(away.fg3Pct),
      pct(home.fg3Pct) > pct(away.fg3Pct),
      pct(away.fg3Pct) > pct(home.fg3Pct),
      fmtPct,
      "fg3Pct",
      pct(season.home.fg3Pct),
      pct(season.away.fg3Pct),
      pct(last10.home.fg3Pct),
      pct(last10.away.fg3Pct)
    ),
  ];
}

function pct(n: number | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function fmtPct(n: number): string {
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}`;
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

  const formLeft =
    data.season.home.recentFormGames ??
    data.last10.home.recentFormGames ??
    [];
  const formRight =
    data.season.away.recentFormGames ??
    data.last10.away.recentFormGames ??
    [];
  const showRecentForm = formLeft.length > 0 || formRight.length > 0;

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
        {showRecentForm ? (
          <RecentFormGamesStrip
            left={formLeft}
            right={formRight}
            language={language}
          />
        ) : null}
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
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    lineHeight: 18,
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
  recentForm: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 10,
  },
  recentFormHeader: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginBottom: 6,
    paddingVertical: 2,
  },
  recentFormTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  recentFormTitle: {
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  recentFormChevron: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  recentFormChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  recentFormHint: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
    transform: [{ skewX: "-6deg" }],
  },
  boxOverlay: {
    flex: 1,
    backgroundColor: "#050508",
  },
  boxOverlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingTop: 54,
    paddingBottom: 12,
  },
  boxOverlayTitle: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  boxOverlayClose: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  boxOverlayCloseText: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
  },
  boxOverlayScroll: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 40,
  },
  boxOverlayEmpty: {
    marginTop: 24,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  recentFormGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  recentFormCol: {
    flex: 1,
    minWidth: 0,
  },
  recentFormDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "#ffffff",
  },
  formGameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    paddingVertical: 6,
  },
  formGameLineRight: {
    justifyContent: "flex-end",
  },
  formGameLineLeft: {
    justifyContent: "flex-start",
  },
  formGameSpacer: { height: 30 },
  formDate: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  formVenue: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  formOpp: {
    flexShrink: 1,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  formScore: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    fontVariant: ["tabular-nums"],
  },
  formResult: {
    width: 16,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 15,
    fontWeight: "800",
  },
});
