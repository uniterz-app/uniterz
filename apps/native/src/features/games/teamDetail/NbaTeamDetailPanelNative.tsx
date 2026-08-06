/** Team Detail 再構築 — 参考ダッシュボード UI をそのまま再現（微調整前提） */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../lib/team-colors";
import {
  formatStreakLabel,
  getNbaTeamDetailPreview,
  type NbaTeamMetricWithRank,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import {
  METRIC_FONT,
} from "../../rankings/rankingsUiTheme";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../matchCardTypography";
import JerseyMarkSvg from "../JerseyMarkSvg";
import { NbaTeamRosterCardNative } from "../predict/NbaRosterPanelNative";

type Props = {
  language: "ja" | "en";
  teamId?: string;
};

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";
const OXANIUM = "Oxanium_800ExtraBold";
/** 予想入力 `NbaTeamStatsPanelNative` と同じ */
const LEAGUE_RANK_SEGMENTS = 6;
const BAR_OFFENSE = "#5cf0b5";
const BAR_DEFENSE = "#b388ff";
const OFFENSE_GLOW = "rgba(92,240,181,0.28)";
const DEFENSE_GLOW = "rgba(179,136,255,0.28)";

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** 予想入力と同じ: 順位 1–5 → 6/6 … 26–30 → 1/6 */
function leagueRankSegPct(rank: number | null | undefined): number {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return 0;
  const r = Math.min(30, Math.round(rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 5));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function RatingRow({
  label,
  value,
  rank,
  color,
  barAccent,
  replayKey,
}: {
  label: string;
  value: string;
  rank: number;
  color: string;
  barAccent: { border: string; glow: string; bg: string };
  replayKey: string;
}) {
  return (
    <View style={styles.ratingBlock}>
      <View style={styles.ratingTop}>
        <Text style={styles.ratingLabel}>{label}</Text>
        <Text style={[styles.ratingValue, { color }]}>
          {value}{" "}
          <Text style={[styles.ratingRank, { color }]}>
            ({ordinal(rank)})
          </Text>
        </Text>
      </View>
      <CyberSlantedSegBarNative
        pct={leagueRankSegPct(rank)}
        segments={LEAGUE_RANK_SEGMENTS}
        compact
        accent={barAccent}
        forceStatic
        replayKey={replayKey}
      />
    </View>
  );
}

function CornerMarks() {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </>
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
        { backgroundColor: win ? FORM_WIN : FORM_LOSS, opacity },
        last ? styles.formChipLast : null,
      ]}
    >
      <Text style={styles.formChipText}>{result}</Text>
    </View>
  );
}

function RecentFormSection({
  games,
  streak,
}: {
  games: NbaTeamRecentGame[];
  streak: NbaTeamStreak;
}) {
  const [open, setOpen] = useState(false);
  const results = games.slice(-10).map((g) => g.result);
  const wins = results.filter((r) => r === "W").length;
  const losses = results.length - wins;
  // 展開リストは新しい試合が上
  const list = [...games].slice(-10).reverse();
  const streakLabel = formatStreakLabel(streak);
  const streakWin = streak.kind === "W";

  return (
    <View style={styles.formSection}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.formHeadPress}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.sectionTitleInline}>RECENT FORM (LAST 10)</Text>
        <Text
          style={[
            styles.streakBadge,
            streakWin ? styles.streakWin : styles.streakLoss,
          ]}
        >
          {streakLabel}
        </Text>
        <Text style={styles.formChevron}>{open ? "▾" : "▸"}</Text>
      </Pressable>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.formBlock}
        accessibilityRole="button"
      >
        <View style={styles.formChips}>
          {results.map((r, i) => (
            <FormChip key={`f-${i}`} result={r} index={i} total={results.length} />
          ))}
        </View>
        <Text style={styles.formRecord}>
          {wins}-{losses}
        </Text>
      </Pressable>

      {open ? (
        <View style={styles.gameList}>
          {list.map((g, i) => (
            <View
              key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
              style={[
                styles.gameRow,
                i < list.length - 1 ? styles.gameRowBorder : null,
              ]}
            >
              <Text style={styles.gameDate}>{g.dateLabel}</Text>
              <Text style={styles.gameVs} numberOfLines={1}>
                {g.home ? "vs" : "@"} {g.oppAbbr}
                {g.conferenceGame ? (
                  <Text style={styles.confTag}> · CONF</Text>
                ) : null}
              </Text>
              <Text style={styles.gameScore}>
                {g.teamScore}-{g.oppScore}
              </Text>
              <Text
                style={[
                  styles.gameResult,
                  g.result === "W" ? styles.win : styles.loss,
                ]}
              >
                {g.result}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function UpcomingScheduleSection({ games }: { games: NbaTeamUpcomingGame[] }) {
  if (games.length === 0) return null;
  return (
    <View style={styles.schedSection}>
      <Text style={styles.sectionTitle}>UPCOMING</Text>
      <View style={styles.gameList}>
        {games.map((g, i) => (
          <View
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            style={[
              styles.gameRow,
              i < games.length - 1 ? styles.gameRowBorder : null,
            ]}
          >
            <Text style={styles.gameDate}>{g.dateLabel}</Text>
            <Text style={styles.gameVs} numberOfLines={1}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
              {g.conferenceGame ? (
                <Text style={styles.confTag}> · CONF</Text>
              ) : null}
            </Text>
            <Text style={styles.schedTip}>{g.tipLabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 参考 ADVANCED METRICS 3×3（リーグ順位つき） */
const ADVANCED_METRIC_IDS = [
  "ppg",
  "papg",
  "pace",
  "efgPct",
  "fg3Pct",
  "fg3a",
  "netrtg",
  "diff",
  "tovPct",
] as const;

const ADVANCED_LABEL: Record<(typeof ADVANCED_METRIC_IDS)[number], string> = {
  ppg: "PPG",
  papg: "PAPG",
  pace: "PACE",
  efgPct: "EFG%",
  fg3Pct: "3P%",
  fg3a: "3PA",
  netrtg: "NET",
  diff: "DIFF",
  tovPct: "TOV%",
};

function winPctLabel(wins: number, losses: number): string {
  const n = wins + losses;
  if (n <= 0) return ".000";
  return (wins / n).toFixed(3).replace(/^0/, "");
}

function SplitCard({
  label,
  wins,
  losses,
  labelColor,
}: {
  label: string;
  wins: number;
  losses: number;
  labelColor?: string;
}) {
  return (
    <View style={styles.splitCard}>
      <Text style={[styles.splitLabel, labelColor ? { color: labelColor } : null]}>
        {label}
      </Text>
      <View style={styles.splitValues}>
        <Text style={styles.splitValue}>
          {wins}-{losses}
        </Text>
        <Text style={styles.splitPct}>{winPctLabel(wins, losses)}</Text>
      </View>
    </View>
  );
}

function rankTint(rank: number): string {
  if (rank <= 6) return "rgba(110,231,183,0.95)";
  if (rank <= 10) return "rgba(252,211,77,0.92)";
  if (rank <= 20) return "rgba(255,255,255,0.45)";
  return "rgba(252,165,165,0.75)";
}

/** 左からフェードするグラデ用の色（上位=緑 / 下位=赤） */
function rankAccent(rank: number): {
  glow: string;
  clear: string;
} {
  if (rank <= 3) {
    return {
      glow: "rgba(92,240,181,0.22)",
      clear: "rgba(92,240,181,0)",
    };
  }
  if (rank <= 6) {
    return {
      glow: "rgba(92,240,181,0.14)",
      clear: "rgba(92,240,181,0)",
    };
  }
  if (rank <= 10) {
    return {
      glow: "rgba(252,211,77,0.12)",
      clear: "rgba(252,211,77,0)",
    };
  }
  if (rank <= 20) {
    return {
      glow: "rgba(255,255,255,0.04)",
      clear: "rgba(255,255,255,0)",
    };
  }
  if (rank <= 25) {
    return {
      glow: "rgba(252,165,165,0.12)",
      clear: "rgba(252,165,165,0)",
    };
  }
  return {
    glow: "rgba(255,77,106,0.18)",
    clear: "rgba(255,77,106,0)",
  };
}

function AdvancedMetricsGrid({ metrics }: { metrics: NbaTeamMetricWithRank[] }) {
  const byId = new Map(metrics.map((m) => [m.id, m]));
  const cells = ADVANCED_METRIC_IDS.map((id) => byId.get(id)).filter(
    (m): m is NbaTeamMetricWithRank => Boolean(m)
  );

  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>ADVANCED METRICS</Text>
        <View style={styles.advTitleLine} />
      </View>
      <View style={styles.advGrid}>
        {cells.map((m, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const accent = rankAccent(m.leagueRank);
          return (
            <View
              key={m.id}
              style={[
                styles.advCell,
                col < 2 ? styles.advCellBorderR : null,
                row < 2 ? styles.advCellBorderB : null,
              ]}
            >
              <LinearGradient
                colors={[accent.glow, accent.clear]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={styles.advCellTop}>
                <Text style={styles.advLabel}>
                  {ADVANCED_LABEL[m.id as (typeof ADVANCED_METRIC_IDS)[number]] ??
                    m.short}
                </Text>
                <Text style={[styles.advRank, { color: rankTint(m.leagueRank) }]}>
                  #{m.leagueRank}
                </Text>
              </View>
              <Text style={styles.advValue}>{m.display}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function NbaTeamDetailPanelNative({ language, teamId }: Props) {
  void language;
  const insets = useSafeAreaInsets();
  const detail = useMemo(() => getNbaTeamDetailPreview(teamId), [teamId]);
  const jerseyPrimary = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", detail.teamId);
  const bottomPad = Math.max(12, insets.bottom);

  const seasonMetrics = detail.metrics.season;
  const ortg = seasonMetrics.find((m) => m.id === "ortg");
  const drtg = seasonMetrics.find((m) => m.id === "drtg");

  const confLine =
    detail.conference === "east"
      ? "EASTERN CONFERENCE"
      : "WESTERN CONFERENCE";
  const divLine = `${detail.divisionLabelEn.toUpperCase()} DIVISION`;

  const winPctLabel = detail.season.winPct.toFixed(3).replace(/^0/, "");

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, { paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panel}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.jerseyFrame}>
            <CornerMarks />
            <JerseyMarkSvg
              accent={jerseyPrimary}
              accentEnd={jerseySecondary}
              size={44}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.confSeed} numberOfLines={1}>
              {confLine}  •  {divLine}
            </Text>
            <Text style={styles.city} numberOfLines={1}>
              {detail.cityEn.toUpperCase()}
            </Text>
            <Text style={styles.nick} numberOfLines={1}>
              {detail.nickEn.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.recordRankRow}>
          <View style={styles.recordRankCard}>
            <Text style={styles.recordRankLabel}>RECORD</Text>
            <View style={styles.recordRankValues}>
              <Text style={styles.recordRankPrimary}>
                {detail.season.wins}-{detail.season.losses}
              </Text>
              <Text style={styles.recordRankAccent}>{winPctLabel}</Text>
            </View>
          </View>
          <View style={styles.recordRankCard}>
            <Text style={styles.recordRankLabel}>RANK</Text>
            <View style={styles.recordRankValues}>
              <Text style={[styles.recordRankPrimary, styles.rankCyan]}>
                #{String(detail.conferenceRank).padStart(2, "0")}
              </Text>
              <Text style={styles.recordRankAccent}>Seed</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* PERFORMANCE METRICS */}
        <Text style={styles.sectionTitle}>PERFORMANCE METRICS</Text>
        {ortg ? (
          <RatingRow
            label="OFFENSIVE RATING"
            value={ortg.display}
            rank={ortg.leagueRank}
            color={BAR_OFFENSE}
            barAccent={{
              border: BAR_OFFENSE,
              glow: OFFENSE_GLOW,
              bg: BAR_OFFENSE,
            }}
            replayKey={`${detail.teamId}-ortg`}
          />
        ) : null}
        {drtg ? (
          <RatingRow
            label="DEFENSIVE RATING"
            value={drtg.display}
            rank={drtg.leagueRank}
            color={BAR_DEFENSE}
            barAccent={{
              border: BAR_DEFENSE,
              glow: DEFENSE_GLOW,
              bg: BAR_DEFENSE,
            }}
            replayKey={`${detail.teamId}-drtg`}
          />
        ) : null}

        <View style={styles.divider} />

        {/* RECENT FORM — tap to expand game list */}
        <RecentFormSection
          games={detail.recentGames}
          streak={detail.streak}
        />

        <View style={styles.divider} />

        <UpcomingScheduleSection games={detail.upcomingGames} />

        <View style={styles.divider} />

        <AdvancedMetricsGrid metrics={seasonMetrics} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>SPLITS</Text>
        <View style={styles.splitRow}>
          <SplitCard
            label="HOME"
            wins={detail.homeAwaySplit.home.wins}
            losses={detail.homeAwaySplit.home.losses}
          />
          <SplitCard
            label="AWAY"
            wins={detail.homeAwaySplit.away.wins}
            losses={detail.homeAwaySplit.away.losses}
          />
        </View>
        <View style={[styles.splitRow, { marginTop: 8 }]}>
          <SplitCard
            label="VS EAST"
            wins={detail.conferenceSplit.vsEast.wins}
            losses={detail.conferenceSplit.vsEast.losses}
            labelColor="#EF3B24"
          />
          <SplitCard
            label="VS WEST"
            wins={detail.conferenceSplit.vsWest.wins}
            losses={detail.conferenceSplit.vsWest.losses}
            labelColor="#007AC1"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.advTitleRow}>
          <Text style={styles.advTitle}>ROSTER</Text>
          <View style={styles.advTitleLine} />
        </View>
        <NbaTeamRosterCardNative block={detail.rosterBlock} />

        <Text style={styles.footerAsOf}>{detail.asOfLabel} · PREVIEW</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: 12, paddingTop: 4 },
  panel: {
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    zIndex: 1,
  },
  jerseyFrame: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: CYBER_TAB_CYAN,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  confSeed: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.05,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  city: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  nick: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "#FFFFFF",
    fontSize: 26,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    textTransform: "uppercase",
    marginBottom: 2,
    transform: [{ skewX: "-6deg" }],
  },
  recordRankRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    zIndex: 1,
  },
  recordRankCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    borderRadius: 4,
    backgroundColor: "rgba(0,16,28,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  recordRankLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  recordRankValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordRankPrimary: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  rankCyan: {
    color: CYBER_TAB_CYAN,
  },
  recordRankAccent: {
    fontFamily: METRIC_FONT,
    color: BAR_OFFENSE,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.18)",
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionTitleInline: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    flex: 1,
  },
  formSection: {
    zIndex: 1,
    gap: 10,
  },
  formHeadPress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formChevron: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 14,
    fontWeight: "800",
  },
  streakBadge: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    minWidth: 28,
    textAlign: "right",
    transform: [{ skewX: "-8deg" }],
  },
  streakWin: {
    color: FORM_WIN,
  },
  streakLoss: {
    color: FORM_LOSS,
  },
  formBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  formChips: {
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
  formRecord: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    minWidth: 36,
    textAlign: "right",
    transform: [{ skewX: "-8deg" }],
  },
  schedSection: {
    zIndex: 1,
  },
  schedTip: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 44,
    textAlign: "right",
    transform: [{ skewX: "-8deg" }],
  },
  gameList: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.14)",
    borderRadius: 4,
    backgroundColor: "rgba(0,16,28,0.5)",
    overflow: "hidden",
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  gameRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.1)",
  },
  gameDate: {
    width: 36,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  gameVs: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
  },
  confTag: {
    color: "rgba(0,245,255,0.55)",
    fontSize: 9,
    fontWeight: "700",
  },
  gameScore: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  gameResult: {
    width: 18,
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    transform: [{ skewX: "-8deg" }],
  },
  win: { color: FORM_WIN },
  loss: { color: FORM_LOSS },
  ratingBlock: {
    marginBottom: 14,
    gap: 8,
  },
  ratingTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  ratingValue: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  ratingRank: {
    fontWeight: "700",
  },
  advWrap: {
    zIndex: 1,
    gap: 10,
  },
  advTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  advTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  advTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.28)",
  },
  advGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    borderRadius: 2,
    backgroundColor: "rgba(4,14,24,0.72)",
    overflow: "hidden",
  },
  advCell: {
    width: "33.333%",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
    overflow: "hidden",
    position: "relative",
  },
  advCellBorderR: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,245,255,0.2)",
  },
  advCellBorderB: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.2)",
  },
  advCellTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  advLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(160,200,220,0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  advRank: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  advValue: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  splitRow: { flexDirection: "row", gap: 10 },
  splitCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.14)",
    borderRadius: 4,
    padding: 12,
    backgroundColor: "rgba(0,16,28,0.4)",
    gap: 4,
  },
  splitLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  splitValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  splitPct: {
    fontFamily: METRIC_FONT,
    color: BAR_OFFENSE,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  footerAsOf: {
    marginTop: 18,
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.35)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
