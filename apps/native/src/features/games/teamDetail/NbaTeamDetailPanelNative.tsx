/** Team Detail 再構築 — 参考ダッシュボード UI をそのまま再現（微調整前提） */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  getTeamUiAccentColor,
} from "../../../../../../lib/team-colors";
import {
  formatStreakLabel,
  getNbaTeamDetailPreview,
  payrollDisplaySlices,
  type NbaTeamInjuryEntry,
  type NbaTeamMetricWithRank,
  type NbaTeamOpponentAllowedMetric,
  type NbaTeamPayroll,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import {
  availabilityStatusColor,
  formatAvailabilityStatus,
  formatSalaryUsd,
} from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
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
/** PERFORMANCE METRICS — 攻撃=ホットレッド / 守備=アイスブルー */
const METRIC_OFFENSE = "#FF3D5A";
const METRIC_DEFENSE = "#3BA0FF";
const METRIC_OFFENSE_GLOW = "rgba(255,61,90,0.34)";
const METRIC_DEFENSE_GLOW = "rgba(59,160,255,0.34)";
/** キャップ余裕・勝率など「良い」系 */
const POSITIVE_TEAL = "#5cf0b5";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

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

function CornerMarks({ color }: { color: string }) {
  const c = { borderColor: color };
  return (
    <>
      <View style={[styles.corner, styles.cornerTL, c]} />
      <View style={[styles.corner, styles.cornerTR, c]} />
      <View style={[styles.corner, styles.cornerBL, c]} />
      <View style={[styles.corner, styles.cornerBR, c]} />
    </>
  );
}

function SectionHeader({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) {
  return (
    <View style={styles.advTitleRow}>
      <Text style={[styles.advTitle, { color: hexToRgba(accent, 0.75) }]}>
        {title}
      </Text>
      <View
        style={[
          styles.advTitleLine,
          { backgroundColor: hexToRgba(accent, 0.35) },
        ]}
      />
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
  accent,
}: {
  games: NbaTeamRecentGame[];
  streak: NbaTeamStreak;
  accent: string;
}) {
  const results = games.slice(-10).map((g) => g.result);
  const wins = results.filter((r) => r === "W").length;
  const losses = results.length - wins;
  const streakLabel = formatStreakLabel(streak);
  const streakWin = streak.kind === "W";

  return (
    <View style={styles.formSection}>
      <View style={styles.formHeadPress}>
        <Text
          style={[styles.sectionTitleInline, { color: hexToRgba(accent, 0.75) }]}
        >
          RECENT FORM (LAST 10)
        </Text>
        <Text
          style={[
            styles.streakBadge,
            streakWin ? styles.streakWin : styles.streakLoss,
          ]}
        >
          {streakLabel}
        </Text>
      </View>
      <View style={styles.formBlock}>
        <View style={styles.formChips}>
          {results.map((r, i) => (
            <FormChip key={`f-${i}`} result={r} index={i} total={results.length} />
          ))}
        </View>
        <Text style={styles.formRecord}>
          {wins}-{losses}
        </Text>
      </View>
    </View>
  );
}

function GameLogsSection({
  games,
  accent,
}: {
  games: NbaTeamRecentGame[];
  accent: string;
}) {
  const list = [...games].slice(-10).reverse();
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  return (
    <View style={styles.schedSection}>
      <SectionHeader title={`GAME LOGS (LAST ${list.length})`} accent={accent} />
      <View style={[styles.gameList, { borderColor: frame }]}>
        <View
          style={[
            styles.gameRow,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: line,
            },
          ]}
        >
          <Text style={[styles.gameDate, styles.gameHead]}>DATE</Text>
          <Text style={[styles.gameVs, styles.gameHead]}>GAME</Text>
          <Text style={[styles.gameScore, styles.gameHead]}>SCORE</Text>
          <Text style={[styles.gameResult, styles.gameHead]}> </Text>
        </View>
        {list.map((g, i) => (
          <View
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            style={[
              styles.gameRow,
              i < list.length - 1
                ? {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: line,
                  }
                : null,
            ]}
          >
            <Text style={styles.gameDate}>{g.dateLabel}</Text>
            <Text style={styles.gameVs} numberOfLines={1}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
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
    </View>
  );
}

function InjuriesSection({
  injuries,
  accent,
  isJa,
}: {
  injuries: NbaTeamInjuryEntry[];
  accent: string;
  isJa: boolean;
}) {
  const frame = hexToRgba(accent, 0.35);
  return (
    <View style={styles.schedSection}>
      <SectionHeader title="INJURIES" accent={accent} />
      <View style={[styles.gameList, { borderColor: frame }]}>
        {injuries.length === 0 ? (
          <View style={styles.gameRow}>
            <Text style={styles.injuryEmpty}>
              {isJa ? "欠場者なし" : "No injuries"}
            </Text>
          </View>
        ) : (
          injuries.map((inj, i) => {
            const tone = availabilityStatusColor(inj.status);
            return (
              <View
                key={inj.playerId}
                style={[
                  styles.injuryRow,
                  i < injuries.length - 1
                    ? {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: hexToRgba(accent, 0.12),
                      }
                    : null,
                ]}
              >
                <View style={styles.injuryTop}>
                  <Text style={styles.injuryName}>{inj.name}</Text>
                  <Text style={[styles.injuryStatus, { color: tone }]}>
                    {formatAvailabilityStatus(inj.status)}
                  </Text>
                </View>
                <View style={styles.injuryMeta}>
                  <Text style={styles.injuryReason} numberOfLines={1}>
                    {inj.reason ?? "—"}
                  </Text>
                  {inj.returnEstimate ? (
                    <Text
                      style={[
                        styles.injuryReturn,
                        { color: hexToRgba(tone, 0.85) },
                      ]}
                    >
                      {inj.returnEstimate.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

function OpponentStatsSection({
  metrics,
  accent,
  isJa,
}: {
  metrics: NbaTeamOpponentAllowedMetric[];
  accent: string;
  isJa: boolean;
}) {
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.22);
  const [selectedId, setSelectedId] = useState(metrics[0]?.id ?? null);
  const selected =
    metrics.find((m) => m.id === selectedId) ?? metrics[0] ?? null;

  return (
    <View style={styles.schedSection}>
      <SectionHeader title="OPPONENTS STATS" accent={accent} />
      <Text style={styles.oppAllowedHint}>ALLOWED</Text>
      <Text style={styles.oppAllowedCaption}>
        {isJa
          ? "相手に許したスタッツ（TOV は誘発数）。順位は #1 が最良。"
          : "What opponents average vs this team (TOV = forced). Rank #1 is best."}
      </Text>
      <View style={[styles.oppAllowedGrid, { borderColor: frame }]}>
        {metrics.map((m, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const lastRow = Math.floor((metrics.length - 1) / 3);
          const active = selected?.id === m.id;
          const dirLabel = m.lowerIsBetter
            ? isJa
              ? "↓ 低ほど良"
              : "↓ lower"
            : isJa
              ? "↑ 高ほど良"
              : "↑ higher";
          return (
            <Pressable
              key={m.id}
              onPress={() => setSelectedId(m.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${m.short}. ${dirLabel}`}
              style={[
                styles.oppAllowedCell,
                active ? { backgroundColor: hexToRgba(accent, 0.08) } : null,
                col < 2
                  ? {
                      borderRightWidth: StyleSheet.hairlineWidth,
                      borderRightColor: line,
                    }
                  : null,
                row < lastRow
                  ? {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: line,
                    }
                  : null,
              ]}
            >
              <View style={styles.oppAllowedTop}>
                <Text style={styles.oppAllowedLabel}>{m.short}</Text>
                <Text
                  style={[
                    styles.oppAllowedRank,
                    {
                      color:
                        m.leagueRank <= 10
                          ? accent
                          : "rgba(255,255,255,0.35)",
                    },
                  ]}
                >
                  #{m.leagueRank}
                </Text>
              </View>
              <Text style={styles.oppAllowedValue}>{m.display}</Text>
              <Text
                style={[
                  styles.oppAllowedDir,
                  {
                    color: m.lowerIsBetter
                      ? "rgba(59,160,255,0.75)"
                      : "rgba(92,240,181,0.8)",
                  },
                ]}
              >
                {dirLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <Text style={styles.oppAllowedDetail}>
          {isJa ? selected.hintJa : selected.hintEn}
        </Text>
      ) : null}
    </View>
  );
}

function UpcomingScheduleSection({
  games,
  accent,
}: {
  games: NbaTeamUpcomingGame[];
  accent: string;
}) {
  if (games.length === 0) return null;
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  return (
    <View style={styles.schedSection}>
      <SectionHeader title="UPCOMING" accent={accent} />
      <View style={[styles.gameList, { borderColor: frame }]}>
        {games.map((g, i) => (
          <View
            key={`${g.dateLabel}-${g.oppAbbr}-${i}`}
            style={[
              styles.gameRow,
              i < games.length - 1
                ? {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: line,
                  }
                : null,
            ]}
          >
            <Text style={styles.gameDate}>{g.dateLabel}</Text>
            <Text style={styles.gameVs} numberOfLines={1}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
              {g.conferenceGame ? (
                <Text style={[styles.confTag, { color: hexToRgba(accent, 0.55) }]}>
                  {" "}
                  · CONF
                </Text>
              ) : null}
            </Text>
            <Text style={[styles.schedTip, { color: hexToRgba(accent, 0.85) }]}>
              {g.tipLabel}
            </Text>
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
  accent,
}: {
  label: string;
  wins: number;
  losses: number;
  labelColor?: string;
  accent: string;
}) {
  return (
    <View style={[styles.splitCard, { borderColor: hexToRgba(accent, 0.3) }]}>
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

function AdvancedMetricsGrid({
  metrics,
  accent,
}: {
  metrics: NbaTeamMetricWithRank[];
  accent: string;
}) {
  const byId = new Map(metrics.map((m) => [m.id, m]));
  const cells = ADVANCED_METRIC_IDS.map((id) => byId.get(id)).filter(
    (m): m is NbaTeamMetricWithRank => Boolean(m)
  );
  const cellLine = hexToRgba(accent, 0.22);

  return (
    <View style={styles.advWrap}>
      <SectionHeader title="ADVANCED METRICS" accent={accent} />
      <View
        style={[styles.advGrid, { borderColor: hexToRgba(accent, 0.4) }]}
      >
        {cells.map((m, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const tint = rankAccent(m.leagueRank);
          return (
            <View
              key={m.id}
              style={[
                styles.advCell,
                col < 2
                  ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: cellLine }
                  : null,
                row < 2
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cellLine }
                  : null,
              ]}
            >
              <LinearGradient
                colors={[tint.glow, tint.clear]}
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
                <Text
                  style={[
                    styles.advRank,
                    {
                      color:
                        m.leagueRank <= 10
                          ? accent
                          : rankTint(m.leagueRank),
                    },
                  ]}
                >
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

function PayrollSection({
  payroll,
  accent,
  isJa,
}: {
  payroll: NbaTeamPayroll;
  accent: string;
  isJa: boolean;
}) {
  const frame = hexToRgba(accent, 0.45);
  const overCap = payroll.capSpace < 0;
  const slices = payrollDisplaySlices(payroll.lines, accent, 5);

  return (
    <View style={styles.payrollWrap}>
      <SectionHeader title="PAYROLL" accent={accent} />
      <View style={[styles.payrollCard, { borderColor: frame }]}>
        <View style={styles.payrollTop}>
          <View style={styles.payrollSalaryBlock}>
            <Text style={styles.payrollLabel}>
              {isJa ? "総年俸" : "TOTAL"}
            </Text>
            <Text style={styles.payrollSalary}>
              {formatSalaryUsd(payroll.totalSalary)}
            </Text>
          </View>
          <View style={styles.payrollRankBlock}>
            <Text style={styles.payrollLabel}>RANK</Text>
            <Text style={[styles.payrollRank, { color: accent }]}>
              #{payroll.leagueRank}
            </Text>
          </View>
        </View>
        <View style={styles.payrollMetaRow}>
          <Text style={styles.payrollMeta}>
            CAP {formatSalaryUsd(payroll.salaryCap)}
          </Text>
          <Text style={[styles.payrollMetaDot, { color: hexToRgba(accent, 0.45) }]}>
            ·
          </Text>
          <Text style={styles.payrollMeta}>
            TAX LINE {formatSalaryUsd(payroll.taxLine)}
          </Text>
        </View>
        <Text
          style={[
            styles.payrollSpace,
            { color: overCap ? FORM_LOSS : POSITIVE_TEAL },
          ]}
        >
          {isJa ? "キャップ余裕" : "CAP SPACE"}{" "}
          {overCap ? "" : "+"}
          {formatSalaryUsd(payroll.capSpace)}
          {payroll.taxBill > 0
            ? `  ·  TAX ${formatSalaryUsd(payroll.taxBill)}`
            : ""}
        </Text>
        <Text style={[styles.payrollGuaranteed, { color: accent }]}>
          {isJa ? "保証額" : "GUARANTEED"}{" "}
          {formatSalaryUsd(payroll.guaranteed)}
        </Text>

        {/* Player composition stacked bar */}
        <Text style={styles.payrollBreakdownTitle}>
          {isJa ? "選手内訳" : "BY PLAYER"}
        </Text>
        <View style={styles.payrollStackWrap}>
          <View style={styles.payrollStack}>
            {slices.map((s) => (
              <View
                key={s.key}
                style={{
                  flexGrow: Math.max(s.share, 0.02),
                  flexBasis: 0,
                  height: "100%",
                  backgroundColor: s.color,
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.payrollLines}>
          {slices.map((s) => (
            <View key={s.key} style={styles.payrollLineRow}>
              <View
                style={[styles.payrollSwatch, { backgroundColor: s.color }]}
              />
              <Text style={styles.payrollLineName} numberOfLines={1}>
                {s.label}
              </Text>
              <Text style={styles.payrollLineSalary}>
                {formatSalaryUsd(s.salary)}
              </Text>
              <Text style={[styles.payrollLineShare, { color: accent }]}>
                {Math.round(s.share * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function NbaTeamDetailPanelNative({ language, teamId }: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const detail = useMemo(() => getNbaTeamDetailPreview(teamId), [teamId]);
  const jerseyPrimary = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", detail.teamId);
  /** 枠・文字用（暗いチーム色も読める） */
  const accent = getTeamUiAccentColor("nba", detail.teamId);
  const bottomPad = Math.max(12, insets.bottom);
  const dividerColor = hexToRgba(accent, 0.22);
  const frameColor = hexToRgba(accent, 0.4);

  const seasonMetrics = detail.metrics.season;
  const ortg = seasonMetrics.find((m) => m.id === "ortg");
  const drtg = seasonMetrics.find((m) => m.id === "drtg");

  const confLine =
    detail.conference === "east"
      ? "EASTERN CONFERENCE"
      : "WESTERN CONFERENCE";
  const divLine = `${detail.divisionLabelEn.toUpperCase()} DIVISION`;

  const winPctText = detail.season.winPct.toFixed(3).replace(/^0/, "");

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, { paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panel}>
        {/* HEADER */}
        <View style={[styles.headerCard, { borderColor: accent }]}>
          <View style={styles.header}>
            <View style={styles.jerseyFrame}>
              <CornerMarks color={accent} />
              <JerseyMarkSvg
                accent={jerseyPrimary}
                accentEnd={jerseySecondary}
                size={44}
              />
            </View>
            <View style={styles.headerText}>
              <Text
                style={[styles.confSeed, { color: hexToRgba(accent, 0.85) }]}
                numberOfLines={1}
              >
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
            <View
              style={[styles.recordRankCard, { borderColor: frameColor }]}
            >
              <Text style={styles.recordRankLabel}>RECORD</Text>
              <View style={styles.recordRankValues}>
                <Text style={styles.recordRankPrimary}>
                  {detail.season.wins}-{detail.season.losses}
                </Text>
                <Text style={[styles.recordRankAccent, { color: accent }]}>
                  {winPctText}
                </Text>
              </View>
            </View>
            <View
              style={[styles.recordRankCard, { borderColor: frameColor }]}
            >
              <Text style={styles.recordRankLabel}>RANK</Text>
              <View style={styles.recordRankValues}>
                <Text style={[styles.recordRankPrimary, { color: accent }]}>
                  #{String(detail.conferenceRank).padStart(2, "0")}
                </Text>
                <Text style={styles.recordRankAccentMuted}>Seed</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <InjuriesSection
          injuries={detail.injuries}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <SectionHeader title="PERFORMANCE METRICS" accent={accent} />
        <View style={[styles.perfCard, { borderColor: frameColor }]}>
          {ortg ? (
            <RatingRow
              label="OFFENSIVE RATING"
              value={ortg.display}
              rank={ortg.leagueRank}
              color={METRIC_OFFENSE}
              barAccent={{
                border: METRIC_OFFENSE,
                glow: METRIC_OFFENSE_GLOW,
                bg: METRIC_OFFENSE,
              }}
              replayKey={`${detail.teamId}-ortg`}
            />
          ) : null}
          {drtg ? (
            <RatingRow
              label="DEFENSIVE RATING"
              value={drtg.display}
              rank={drtg.leagueRank}
              color={METRIC_DEFENSE}
              barAccent={{
                border: METRIC_DEFENSE,
                glow: METRIC_DEFENSE_GLOW,
                bg: METRIC_DEFENSE,
              }}
              replayKey={`${detail.teamId}-drtg`}
            />
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <AdvancedMetricsGrid metrics={seasonMetrics} accent={accent} />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <OpponentStatsSection
          metrics={detail.opponentStats}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={[styles.sectionCard, { borderColor: frameColor }]}>
          <RecentFormSection
            games={detail.recentGames}
            streak={detail.streak}
            accent={accent}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <GameLogsSection games={detail.recentGames} accent={accent} />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <UpcomingScheduleSection
          games={detail.upcomingGames}
          accent={accent}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <SectionHeader title="SPLITS" accent={accent} />
        <View style={styles.splitRow}>
          <SplitCard
            label="HOME"
            wins={detail.homeAwaySplit.home.wins}
            losses={detail.homeAwaySplit.home.losses}
            accent={accent}
          />
          <SplitCard
            label="AWAY"
            wins={detail.homeAwaySplit.away.wins}
            losses={detail.homeAwaySplit.away.losses}
            accent={accent}
          />
        </View>
        <View style={[styles.splitRow, { marginTop: 8 }]}>
          <SplitCard
            label="VS EAST"
            wins={detail.conferenceSplit.vsEast.wins}
            losses={detail.conferenceSplit.vsEast.losses}
            labelColor="#EF3B24"
            accent={accent}
          />
          <SplitCard
            label="VS WEST"
            wins={detail.conferenceSplit.vsWest.wins}
            losses={detail.conferenceSplit.vsWest.losses}
            labelColor="#007AC1"
            accent={accent}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <PayrollSection
          payroll={detail.payroll}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <SectionHeader title="ROSTER" accent={accent} />
        <View style={[styles.rosterFrame, { borderColor: frameColor }]}>
          <NbaTeamRosterCardNative block={detail.rosterBlock} />
        </View>

        <Text
          style={[styles.footerAsOf, { color: hexToRgba(accent, 0.4) }]}
        >
          {detail.asOfLabel} · PREVIEW
        </Text>
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
  headerCard: {
    borderWidth: 1,
    backgroundColor: "#050808",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
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
    borderRadius: 0,
    backgroundColor: "rgba(8,8,12,0.45)",
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
  recordRankAccent: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  recordRankAccentMuted: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  perfCard: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  sectionCard: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rosterFrame: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.35)",
    overflow: "hidden",
  },
  payrollWrap: {
    gap: 10,
  },
  payrollCard: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  payrollTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  payrollSalaryBlock: { gap: 2 },
  payrollRankBlock: { alignItems: "flex-end", gap: 2 },
  payrollLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  payrollSalary: {
    fontFamily: OXANIUM,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  payrollRank: {
    fontFamily: METRIC_FONT,
    fontSize: 22,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  payrollMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  payrollMeta: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  payrollMetaDot: { fontSize: 11 },
  payrollSpace: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-6deg" }],
  },
  payrollGuaranteed: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    transform: [{ skewX: "-6deg" }],
  },
  payrollBreakdownTitle: {
    marginTop: 8,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  payrollStackWrap: {
    paddingHorizontal: 6,
    overflow: "hidden",
  },
  payrollStack: {
    flexDirection: "row",
    height: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 1,
    transform: [{ skewX: "-14deg" }],
  },
  payrollLines: {
    gap: 5,
    marginTop: 2,
  },
  payrollLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  payrollSwatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
    transform: [{ skewX: "-12deg" }],
  },
  payrollLineName: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  payrollLineSalary: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  payrollLineShare: {
    width: 36,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  sectionTitleInline: {
    fontFamily: METRIC_FONT,
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
    backgroundColor: "rgba(8,8,12,0.5)",
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
  gameHead: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  injuryRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  injuryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  injuryName: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
  },
  injuryStatus: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    transform: [{ skewX: "-8deg" }],
  },
  injuryMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  injuryReason: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  injuryReturn: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  injuryEmpty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "700",
  },
  oppAllowedHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    transform: [{ skewX: "-6deg" }],
  },
  oppAllowedCaption: {
    fontFamily: METRIC_FONT,
    color: "rgba(200,200,210,0.48)",
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  oppAllowedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.5)",
    overflow: "hidden",
  },
  oppAllowedCell: {
    width: "33.333%",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  oppAllowedTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  oppAllowedLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    transform: [{ skewX: "-6deg" }],
  },
  oppAllowedRank: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  oppAllowedValue: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  oppAllowedDir: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    transform: [{ skewX: "-6deg" }],
  },
  oppAllowedDetail: {
    fontFamily: METRIC_FONT,
    color: "rgba(200,200,210,0.55)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
  },
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  advTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  advGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(6,8,12,0.72)",
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
    borderRadius: 0,
    padding: 12,
    backgroundColor: "rgba(8,8,12,0.4)",
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
    color: POSITIVE_TEAL,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  footerAsOf: {
    marginTop: 18,
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
