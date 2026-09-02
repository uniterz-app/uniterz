/** Team Detail 再構築 — 参考ダッシュボード UI をそのまま再現（微調整前提） */
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  type NbaApronStatus,
  type NbaTeamFuturePayrollYear,
  type NbaTeamHeadToHeadEntry,
  type NbaTeamInjuryEntry,
  type NbaTeamMetricWithRank,
  type NbaTeamPayroll,
  type NbaTeamRecentGame,
  type NbaTeamStreak,
  type NbaTeamUpcomingGame,
} from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import {
  recentFormRecord,
  teamStreakBadgeLabel,
  teamStreakBadgeTheme,
} from "../../../../../../lib/predict/nbaTeamDetailForm";
import {
  formatSalaryUsd,
} from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import {
  formatInjuryReturnEstimate,
  injuryReasonLabel,
} from "../../../../../../lib/nba/teamInjuries/injuryReasonDisplay";
import {
  formatTeamInjuryStatus,
  teamInjuryStatusColor,
} from "../../../../../../lib/nba/teamInjuries/injuryStatusDisplay";
import type { NbaTeamPayrollLine } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import {
  buildFuturePayrollYearsFromLines,
  buildSynchronizedTeamPayrollLines,
  nbaSalaryCapLinesForSeason,
  nbaTwoWaySalaryForSeason,
  resolveApronStatus,
} from "../../../../../../lib/nba/teamPayroll/mapBdlToTeamPayroll";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../matchCardTypography";
import JerseyMarkSvg from "../JerseyMarkSvg";
import { NbaTeamRosterCardNative } from "../predict/NbaRosterPanelNative";
import NbaTeamHowTheyPlayNative from "./NbaTeamHowTheyPlayNative";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { useNbaTeamDetailLiveOverlay } from "../../../../../../lib/nba/teamDetail/useNbaTeamDetailLiveOverlay";
import { buildTeamDetailInsights } from "../../../../../../lib/nba/detailInsights/buildTeamDetailInsights";
import {
  DetailIdentityChipRowNative,
  DetailInsightSummaryNative,
} from "../detailInsights/DetailInsightBlocksNative";
import { DetailTrendTableNative } from "../detailInsights/DetailTrendTableNative";
import { DetailScheduleSectionNative } from "../detailInsights/DetailScheduleSectionNative";
import type { DetailTrendDelta } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { playerCardName, type NbaRosterTeamBlock } from "../../../../../../lib/predict/nbaRoster";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { getNbaTeamDraftCapital } from "../../../../../../lib/nba/draftPicks/nbaDraftCapitalData";
import { resolveDraftPickOrigin } from "../../../../../../lib/nba/draftPicks/nbaDraftPickViaTrade";
import type {
  NbaDraftPickEntry,
  NbaDraftPickKind,
  NbaTeamDraftCapital,
} from "../../../../../../lib/nba/draftPicks/draftPicksTypes";

type Props = {
  language: "ja" | "en";
  teamId?: string;
  onSelectPlayer?: (playerId: string) => void;
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

function SectionHeader({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) {
  return (
    <View style={styles.advTitleRow}>
      <Text style={[styles.advTitle, { color: "rgba(255,255,255,0.75)" }]}>
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

function TeamHeroStreakBadgeNative({
  streak,
  last10,
  isJa,
}: {
  streak: NbaTeamStreak;
  last10: { wins: number; losses: number };
  isJa: boolean;
}) {
  const badge = teamStreakBadgeLabel(streak, isJa);
  const theme = teamStreakBadgeTheme(streak);

  return (
    <View style={styles.heroStreakWrap}>
      <View
        style={[
          styles.heroStreakBadge,
          {
            borderColor: theme.borderColor,
            backgroundColor: theme.backgroundColor,
          },
        ]}
      >
        {theme.showFireIcon ? (
          <MaterialCommunityIcons name="fire" size={14} color={theme.tagColor} />
        ) : theme.showColdIcon ? (
          <MaterialCommunityIcons
            name="snowflake"
            size={14}
            color={theme.tagColor}
          />
        ) : null}
        <Text style={[styles.heroStreakTag, { color: theme.tagColor }]}>
          {badge.tag}
        </Text>
        <Text style={[styles.heroStreakValue, { color: theme.headlineColor }]}>
          {badge.headline}
        </Text>
      </View>
      <Text style={styles.heroStreakL10}>
        L10 {last10.wins}-{last10.losses}
      </Text>
    </View>
  );
}

function RecentFormSection({
  games,
  streak,
  accent,
  isJa,
  trends = [],
}: {
  games: NbaTeamRecentGame[];
  streak: NbaTeamStreak;
  accent: string;
  isJa: boolean;
  trends?: DetailTrendDelta[];
}) {
  const results = games.slice(-10).map((g) => g.result);
  const wins = results.filter((r) => r === "W").length;
  const losses = results.length - wins;
  const streakLabel = formatStreakLabel(streak);
  const streakWin = streak.kind === "W";
  const emptyCopy = isJa ? "データがありません" : "No data yet";

  return (
    <View style={styles.formSection}>
      <View style={styles.formHeadPress}>
        <Text
          style={[styles.sectionTitleInline, { color: "rgba(255,255,255,0.75)" }]}
        >
          RECENT FORM (LAST 10)
        </Text>
        {results.length > 0 ? (
          <Text
            style={[
              styles.streakBadge,
              streakWin ? styles.streakWin : styles.streakLoss,
            ]}
          >
            {streakLabel}
          </Text>
        ) : null}
      </View>
      {results.length === 0 ? (
        <Text style={styles.injuryEmpty}>{emptyCopy}</Text>
      ) : (
        <View style={styles.formBlock}>
          <View style={styles.formChips}>
            {results.map((r, i) => (
              <FormChip
                key={`f-${i}`}
                result={r}
                index={i}
                total={results.length}
              />
            ))}
          </View>
          <Text style={styles.formRecord}>
            {wins}-{losses}
          </Text>
        </View>
      )}
      <DetailTrendTableNative trends={trends} />
    </View>
  );
}

function GameLogsSection({
  games,
  accent,
  isJa,
}: {
  games: NbaTeamRecentGame[];
  accent: string;
  isJa: boolean;
}) {
  const list = [...games].slice(-10).reverse();
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const emptyCopy = isJa ? "データがありません" : "No data yet";
  return (
    <View style={styles.schedSection}>
      <SectionHeader
        title={list.length > 0 ? `GAME LOGS (LAST ${list.length})` : "GAME LOGS"}
        accent={accent}
      />
      <View style={[styles.gameList, { borderColor: frame }]}>
        {list.length === 0 ? (
          <View style={styles.gameRow}>
            <Text style={styles.injuryEmpty}>{emptyCopy}</Text>
          </View>
        ) : (
          <>
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
          </>
        )}
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
              {isJa ? "データがありません" : "No data yet"}
            </Text>
          </View>
        ) : (
          injuries.map((inj, i) => {
            const tone = teamInjuryStatusColor(inj.status);
            const reasonLabel = injuryReasonLabel(inj.reason, isJa ? "ja" : "en");
            const returnLabel = formatInjuryReturnEstimate(
              inj.returnEstimate,
              isJa ? "ja" : "en"
            );
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
                    {formatTeamInjuryStatus(inj.status, isJa)}
                  </Text>
                </View>
                <View style={styles.injuryMeta}>
                  <Text style={styles.injuryReason} numberOfLines={1}>
                    {reasonLabel}
                  </Text>
                  {returnLabel ? (
                    <Text
                      style={[
                        styles.injuryReturn,
                        { color: hexToRgba(tone, 0.85) },
                      ]}
                    >
                      {returnLabel}
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

function HeadToHeadSection({
  rows,
  accent,
  isJa,
}: {
  rows: NbaTeamHeadToHeadEntry[];
  accent: string;
  isJa: boolean;
}) {
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const emptyCopy = isJa ? "データがありません" : "No data yet";
  return (
    <View style={styles.schedSection}>
      <SectionHeader title="HEAD-TO-HEAD" accent={accent} />
      <View style={[styles.gameList, { borderColor: frame }]}>
        {rows.length === 0 ? (
          <View style={styles.gameRow}>
            <Text style={styles.injuryEmpty}>{emptyCopy}</Text>
          </View>
        ) : (
          rows.map((row, i) => (
            <View
              key={row.oppTeamId}
              style={[
                styles.gameRow,
                i < rows.length - 1
                  ? {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: line,
                    }
                  : null,
              ]}
            >
              <Text style={[styles.gameVs, { flex: 1 }]}>{row.oppAbbr}</Text>
              <Text style={styles.gameScore}>
                {row.wins}-{row.losses}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}



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

function ApronBadge({
  status,
  isJa,
}: {
  status: NbaApronStatus;
  isJa: boolean;
}) {
  let label = "UNDER CAP";
  let color = "#00F5FF";
  let bg = "rgba(0,245,255,0.12)";
  let border = "rgba(0,245,255,0.45)";

  switch (status) {
    case "under_cap":
      label = isJa ? "CAP以下" : "UNDER CAP";
      color = "#00F5FF";
      bg = "rgba(0,245,255,0.12)";
      border = "rgba(0,245,255,0.45)";
      break;
    case "over_cap":
      label = isJa ? "CAP超過" : "OVER CAP";
      color = "#D8D8D8";
      bg = "rgba(255,255,255,0.08)";
      border = "rgba(255,255,255,0.3)";
      break;
    case "tax_payer":
      label = isJa ? "TAX超過" : "TAX PAYER";
      color = "#FFD000";
      bg = "rgba(255,208,0,0.14)";
      border = "rgba(255,208,0,0.5)";
      break;
    case "first_apron":
      label = isJa ? "1ST APRON超過" : "1ST APRON";
      color = "#FF8A00";
      bg = "rgba(255,138,0,0.16)";
      border = "rgba(255,138,0,0.55)";
      break;
    case "second_apron":
      label = isJa ? "2ND APRON超過" : "2ND APRON";
      color = "#FF2D78";
      bg = "rgba(255,45,120,0.18)";
      border = "rgba(255,45,120,0.6)";
      break;
  }

  return (
    <View style={[styles.apronBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.apronBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function PayrollSection({
  payroll,
  rosterBlock,
  accent,
  isJa,
}: {
  payroll: NbaTeamPayroll;
  rosterBlock?: NbaRosterTeamBlock | null;
  accent: string;
  isJa: boolean;
}) {
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const frame = hexToRgba(accent, 0.45);

  const seasonKeys = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];

  const seasonsList = seasonKeys.map((sKey, index) => {
    const capInfo = nbaSalaryCapLinesForSeason(sKey);
    const futureYearData =
      index > 0
        ? (payroll.futureYears ?? []).find((fy) => fy.seasonKey === sKey)
        : null;

    const sourceLines = futureYearData ? futureYearData.lines : payroll.lines;
    const linesRaw = buildSynchronizedTeamPayrollLines(
      rosterBlock?.players,
      sourceLines,
      sKey
    );
    const totalSalary = linesRaw.reduce((s, l) => s + l.salary, 0);
    const lines =
      totalSalary > 0
        ? linesRaw.map((l) => ({ ...l, share: l.salary / totalSalary }))
        : linesRaw;

    return {
      key: sKey,
      label: sKey,
      isCurrent: index === 0,
      totalSalary,
      salaryCap: capInfo.salaryCap,
      taxLine: capInfo.taxLine,
      firstApron: capInfo.firstApron,
      secondApron: capInfo.secondApron,
      capSpace: capInfo.salaryCap - totalSalary,
      taxSpace: capInfo.taxLine - totalSalary,
      firstApronSpace: capInfo.firstApron - totalSalary,
      secondApronSpace: capInfo.secondApron - totalSalary,
      apronStatus: resolveApronStatus(totalSalary, capInfo),
      taxBill: 0,
      guaranteed: totalSalary,
      lines,
      leagueRank: index === 0 ? payroll.leagueRank : null,
    };
  });

  const active = seasonsList[selectedSeasonIdx] ?? seasonsList[0];
  const overCap = active.capSpace < 0;
  const slices = payrollDisplaySlices(active.lines, accent);

  return (
    <View style={styles.payrollWrap}>
      <SectionHeader title="PAYROLL" accent={accent} />

      {/* Year Selection Tabs */}
      <View style={styles.payrollYearTabsRow}>
        {seasonsList.map((s, idx) => {
          const isSelected = idx === selectedSeasonIdx;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSelectedSeasonIdx(idx)}
              style={[
                styles.payrollYearTab,
                isSelected && {
                  borderColor: accent,
                  backgroundColor: hexToRgba(accent, 0.18),
                },
              ]}
            >
              <Text
                style={[
                  styles.payrollYearTabText,
                  isSelected && { color: accent, fontWeight: "800" },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Season Detail Card with Animation */}
      <Animated.View
        key={active.key}
        entering={FadeInDown.duration(200)}
        style={[styles.payrollCard, { borderColor: frame }]}
      >
        <View style={styles.payrollTop}>
          <View style={styles.payrollSalaryBlock}>
            <View style={styles.payrollLabelWithBadge}>
              <Text style={styles.payrollLabel}>
                {active.isCurrent
                  ? isJa
                    ? `総年俸 (${active.label})`
                    : `TOTAL SALARY (${active.label})`
                  : isJa
                  ? `確定年俸 (${active.label})`
                  : `COMMITTED (${active.label})`}
              </Text>
              <ApronBadge status={active.apronStatus} isJa={isJa} />
            </View>
            <Text style={styles.payrollSalary}>
              {formatSalaryUsd(active.totalSalary)}
            </Text>
          </View>
          {active.leagueRank != null && (
            <View style={styles.payrollRankBlock}>
              <Text style={styles.payrollLabel}>RANK</Text>
              <Text style={[styles.payrollRank, { color: "#FFFFFF" }]}>
                #{active.leagueRank}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.payrollMetaRow}>
          <Text style={styles.payrollMeta}>
            CAP {formatSalaryUsd(active.salaryCap)}
          </Text>
          <Text style={[styles.payrollMetaDot, { color: "rgba(255,255,255,0.45)" }]}>
            ·
          </Text>
          <Text style={styles.payrollMeta}>
            TAX LINE {formatSalaryUsd(active.taxLine)}
          </Text>
        </View>

        <View style={styles.payrollMetaRow}>
          <Text style={[styles.payrollMeta, { color: "#FF8A00" }]}>
            1ST APRON {formatSalaryUsd(active.firstApron)}
          </Text>
          <Text style={[styles.payrollMetaDot, { color: "rgba(255,255,255,0.45)" }]}>
            ·
          </Text>
          <Text style={[styles.payrollMeta, { color: "#FF2D78" }]}>
            2ND APRON {formatSalaryUsd(active.secondApron)}
          </Text>
        </View>

        <View style={styles.payrollSpacesRow}>
          {active.firstApronSpace != null && (
            <Text
              style={[
                styles.payrollSpace,
                {
                  color:
                    active.firstApronSpace < 0 ? FORM_LOSS : POSITIVE_TEAL,
                },
              ]}
            >
              {isJa ? "1ST APRON余裕" : "1ST APRON SPACE"}{" "}
              {active.firstApronSpace >= 0 ? "+" : ""}
              {formatSalaryUsd(active.firstApronSpace)}
            </Text>
          )}
          {active.secondApronSpace != null && (
            <Text
              style={[
                styles.payrollSpace,
                {
                  color:
                    active.secondApronSpace < 0 ? FORM_LOSS : POSITIVE_TEAL,
                },
              ]}
            >
              {isJa ? "2ND APRON余裕" : "2ND APRON SPACE"}{" "}
              {active.secondApronSpace >= 0 ? "+" : ""}
              {formatSalaryUsd(active.secondApronSpace)}
            </Text>
          )}
        </View>

        {/* Player composition stacked bar */}
        <Text style={styles.payrollBreakdownTitle}>
          {isJa
            ? `選手内訳 (${slices.length}名) · % はCAP比`
            : `BY PLAYER (${slices.length}) · % OF CAP`}
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
          {slices.length === 0 ? (
            <Text style={styles.injuryEmpty}>
              {isJa ? "データがありません" : "No data yet"}
            </Text>
          ) : (
          slices.map((s) => {
            const isTw = s.isTwoWay === true && active.key === CURRENT_NBA_SEASON_KEY;
            const displaySalary = isTw
              ? nbaTwoWaySalaryForSeason(active.key)
              : s.salary;
            const capPct =
              !isTw && s.salary > 0 && active.salaryCap > 0
                ? ((s.salary / active.salaryCap) * 100).toFixed(1)
                : null;
            return (
              <View key={s.key} style={styles.payrollLineRow}>
                <View
                  style={[styles.payrollSwatch, { backgroundColor: s.color }]}
                />
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.payrollLineName} numberOfLines={1}>
                    {s.label}
                  </Text>
                  {s.option && active.key !== CURRENT_NBA_SEASON_KEY ? (
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: "800",
                        color:
                          s.option === "TO"
                            ? "#FFB800"
                            : s.option === "PO"
                            ? "#00F5FF"
                            : "#C084FC",
                        backgroundColor:
                          s.option === "TO"
                            ? "rgba(255,180,0,0.18)"
                            : s.option === "PO"
                            ? "rgba(0,245,255,0.18)"
                            : "rgba(168,85,247,0.18)",
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      {s.option === "TO"
                        ? "TEAM"
                        : s.option === "PO"
                        ? "PLAYER"
                        : s.option === "MO"
                        ? "MUTUAL"
                        : s.option}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  {isTw ? (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "800",
                        color: "rgba(255,255,255,0.6)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        paddingHorizontal: 3,
                        paddingVertical: 1,
                        borderRadius: 2,
                      }}
                    >
                      TW
                    </Text>
                  ) : null}
                  <Text style={styles.payrollLineSalary}>
                    {displaySalary > 0 ? formatSalaryUsd(displaySalary) : "—"}
                  </Text>
                </View>
                <View style={styles.payrollCapPctBlock}>
                  {capPct !== null ? (
                    <Text style={styles.payrollCapPct}>
                      {capPct}% <Text style={styles.payrollCapPctSub}>CAP</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.payrollCapPctSub, { color: "rgba(255,255,255,0.35)" }]}>—</Text>
                  )}
                </View>
              </View>
            );
          })
          )}
        </View>

        {/* Option Badges & Contract Legend */}
        <View style={styles.payrollLegendWrap}>
          <Text style={styles.payrollLegendTitle}>
            {isJa ? "契約オプション / 表記凡例" : "CONTRACT OPTIONS & LEGEND"}
          </Text>
          <View style={styles.payrollLegendList}>
            <View style={styles.payrollLegendItem}>
              <Text
                style={[
                  styles.payrollLegendBadge,
                  {
                    color: "#FFB800",
                    backgroundColor: "rgba(255,180,0,0.18)",
                  },
                ]}
              >
                TEAM
              </Text>
              <Text style={styles.payrollLegendText}>
                {isJa ? "チームオプション（球団に行使権）" : "Team Option (Club decision)"}
              </Text>
            </View>
            <View style={styles.payrollLegendItem}>
              <Text
                style={[
                  styles.payrollLegendBadge,
                  {
                    color: "#00F5FF",
                    backgroundColor: "rgba(0,245,255,0.18)",
                  },
                ]}
              >
                PLAYER
              </Text>
              <Text style={styles.payrollLegendText}>
                {isJa ? "プレイヤーオプション（選手に行使権）" : "Player Option (Player decision)"}
              </Text>
            </View>
            <View style={styles.payrollLegendItem}>
              <Text
                style={[
                  styles.payrollLegendBadge,
                  {
                    color: "#C084FC",
                    backgroundColor: "rgba(168,85,247,0.18)",
                  },
                ]}
              >
                MUTUAL
              </Text>
              <Text style={styles.payrollLegendText}>
                {isJa ? "双方合意オプション（球団・選手両方）" : "Mutual Option (Both agree)"}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function DraftPicksSection({
  teamId,
  accent,
  isJa,
}: {
  teamId: string;
  accent: string;
  isJa: boolean;
}) {
  const draftCapital = useMemo(() => getNbaTeamDraftCapital(teamId), [teamId]);
  const { summary } = draftCapital;
  const frame = hexToRgba(accent, 0.45);

  const [selectedPick, setSelectedPick] = useState<NbaDraftPickEntry | null>(null);

  const flexColor =
    summary.flexibility === "VERY HIGH" || summary.flexibility === "HIGH"
      ? "#00F5FF"
      : summary.flexibility === "MEDIUM"
      ? "#5CF0B5"
      : "#FF2D78";

  return (
    <View style={styles.payrollWrap}>
      <SectionHeader
        title={isJa ? "DRAFT ASSETS (ドラフト指名権・資産)" : "DRAFT ASSETS & CAPITAL"}
        accent={accent}
      />

      {/* ① Summary (資産サマリー) */}
      <View style={[styles.draftSummaryCardWrap, { borderColor: frame }]}>
        {/* Header row with Flexibility */}
        <View style={styles.draftSummaryHeaderRow}>
          <Text style={styles.draftSummaryMainLabel}>
            {isJa ? "ドラフト資産サマリー (2027-2033)" : "ASSETS SUMMARY (7-YEAR)"}
          </Text>
          <View style={styles.draftFlexibilityWrap}>
            <Text style={styles.draftFlexibilityLabel}>{isJa ? "柔軟性" : "FLEX"}</Text>
            <View
              style={[
                styles.draftFlexibilityBadge,
                {
                  backgroundColor: hexToRgba(flexColor, 0.15),
                  borderColor: hexToRgba(flexColor, 0.6),
                },
              ]}
            >
              <Text style={[styles.draftFlexibilityText, { color: flexColor }]}>
                {isJa ? summary.flexibilityJa : summary.flexibility}
              </Text>
            </View>
          </View>
        </View>

        {/* 4 Cards in 2x2 Grid */}
        <View style={styles.draftSummaryGrid2x2}>
          {/* 1st Round */}
          <View style={styles.draftSummaryBox}>
            <Text style={[styles.draftSummaryBoxLabel, { color: "#00F5FF" }]}>
              {isJa ? "1巡目指名権" : "1ST ROUND"}
            </Text>
            <View style={styles.draftSummaryBoxValRow}>
              <Text style={styles.draftSummaryBoxVal}>{summary.total1st}</Text>
              <Text style={styles.draftSummaryBoxUnit}>{isJa ? "本" : "picks"}</Text>
            </View>
            <Text style={styles.draftSummaryBoxSub}>
              {isJa ? "確定 " : "Guar "}
              <Text style={styles.draftSummaryBoxSubBold}>{summary.guaranteed1st}</Text>
              {isJa ? " / 条件付 " : " / Cond "}
              <Text style={[styles.draftSummaryBoxSubBold, { color: "#FFB800" }]}>
                {summary.conditional1st}
              </Text>
            </Text>
          </View>

          {/* 2nd Round */}
          <View style={styles.draftSummaryBox}>
            <Text style={styles.draftSummaryBoxLabel}>
              {isJa ? "2巡目指名権" : "2ND ROUND"}
            </Text>
            <View style={styles.draftSummaryBoxValRow}>
              <Text style={styles.draftSummaryBoxVal}>{summary.total2nd}</Text>
              <Text style={styles.draftSummaryBoxUnit}>{isJa ? "本" : "picks"}</Text>
            </View>
            <Text style={styles.draftSummaryBoxSub}>
              {isJa ? "確定 " : "Guar "}
              <Text style={styles.draftSummaryBoxSubBold}>{summary.guaranteed2nd}</Text>
              {isJa ? " / 条件付 " : " / Cond "}
              <Text style={[styles.draftSummaryBoxSubBold, { color: "#FFB800" }]}>
                {summary.conditional2nd}
              </Text>
            </Text>
          </View>

          {/* Swap Rights */}
          <View style={styles.draftSummaryBox}>
            <Text style={[styles.draftSummaryBoxLabel, { color: "#FFB800" }]}>
              {isJa ? "スワップ権" : "SWAP RIGHTS"}
            </Text>
            <View style={styles.draftSummaryBoxValRow}>
              <Text style={[styles.draftSummaryBoxVal, { color: "#FFB800" }]}>
                {summary.swapRights}
              </Text>
              <Text style={styles.draftSummaryBoxUnit}>{isJa ? "件" : "swaps"}</Text>
            </View>
            <Text style={styles.draftSummaryBoxSub}>
              {isJa ? "有利交換権利" : "Favorable swap"}
            </Text>
          </View>

          {/* Outgoing */}
          <View style={styles.draftSummaryBox}>
            <Text style={[styles.draftSummaryBoxLabel, { color: "#FF2D78" }]}>
              {isJa ? "放出済み" : "OUTGOING"}
            </Text>
            <View style={styles.draftSummaryBoxValRow}>
              <Text style={[styles.draftSummaryBoxVal, { color: "#FF2D78" }]}>
                {summary.outgoingPicks}
              </Text>
              <Text style={styles.draftSummaryBoxUnit}>{isJa ? "本" : "picks"}</Text>
            </View>
            <Text style={styles.draftSummaryBoxSub}>
              {isJa ? "トレード譲渡" : "Traded away"}
            </Text>
          </View>
        </View>
      </View>

      {/* ② Year-by-Year Timeline (年別タイムライン) */}
      <View style={[styles.draftListCard, { borderColor: frame }]}>
        <View style={styles.draftTimelineHeaderRow}>
          <Text style={styles.draftTimelineHeaderTitle}>
            {isJa ? "年別タイムライン (タップで条件詳細)" : "PICKS TIMELINE (TAP FOR DETAILS)"}
          </Text>
          <View style={styles.draftLegendRow}>
            <View style={styles.draftLegendItem}>
              <View style={[styles.draftLegendDot, { backgroundColor: "#00F5FF" }]} />
              <Text style={styles.draftLegendText}>{isJa ? "自前" : "OWN"}</Text>
            </View>
            <View style={styles.draftLegendItem}>
              <View style={[styles.draftLegendDot, { backgroundColor: "#5CF0B5" }]} />
              <Text style={styles.draftLegendText}>{isJa ? "取得" : "FROM"}</Text>
            </View>
            <View style={styles.draftLegendItem}>
              <View style={[styles.draftLegendDot, { backgroundColor: "#FFB800" }]} />
              <Text style={styles.draftLegendText}>SWAP</Text>
            </View>
            <View style={styles.draftLegendItem}>
              <View style={[styles.draftLegendDot, { backgroundColor: "#B388FF" }]} />
              <Text style={styles.draftLegendText}>{isJa ? "保護" : "PROT"}</Text>
            </View>
            <View style={styles.draftLegendItem}>
              <View style={[styles.draftLegendDot, { backgroundColor: "#FF2D78" }]} />
              <Text style={styles.draftLegendText}>{isJa ? "放出" : "OUT"}</Text>
            </View>
          </View>
        </View>

        {draftCapital.years.map((y) => {
          return (
            <View key={y.year} style={styles.draftYearRow}>
              {/* Year Column */}
              <View style={styles.draftYearCol}>
                <Text style={styles.draftYearText}>{y.year}</Text>
              </View>

              {/* Picks Column */}
              <View style={styles.draftPicksCol}>
                {/* 1st Round */}
                <View style={styles.draftRoundGroup}>
                  <Text style={styles.draftRoundLabel}>1ST</Text>
                  <View style={styles.draftChipsWrap}>
                    {y.firstRound.length === 0 ? (
                      <View style={[styles.draftChip, styles.draftChipNone]}>
                        <Text style={styles.draftChipTextNone}>
                          {isJa ? "保有なし" : "None"}
                        </Text>
                      </View>
                    ) : (
                      y.firstRound.map((p) => {
                        return renderNativePickChip(p, isJa, () => setSelectedPick(p));
                      })
                    )}
                  </View>
                </View>

                {/* 2nd Round */}
                <View style={styles.draftRoundGroup}>
                  <Text style={[styles.draftRoundLabel, { color: "rgba(255,255,255,0.4)" }]}>
                    2ND
                  </Text>
                  <View style={styles.draftChipsWrap}>
                    {y.secondRound.length === 0 ? (
                      <View style={[styles.draftChip, styles.draftChipNone]}>
                        <Text style={styles.draftChipTextNone}>
                          {isJa ? "保有なし" : "None"}
                        </Text>
                      </View>
                    ) : (
                      y.secondRound.map((p) => {
                        return renderNativePickChip(p, isJa, () => setSelectedPick(p));
                      })
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* ③ タップで開く詳細モーダル */}
      <Modal
        visible={!!selectedPick}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPick(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedPick(null)}
        >
          <Pressable
            style={styles.draftModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedPick && (
              <>
                {/* Modal Header */}
                <View style={styles.draftModalHeader}>
                  <View style={styles.draftModalHeaderTitles}>
                    <Text style={styles.draftModalSubTitle}>
                      {selectedPick.year} NBA DRAFT •{" "}
                      {selectedPick.round === 1 ? "1ST ROUND" : "2ND ROUND"}
                    </Text>
                    <Text style={styles.draftModalMainTitle}>
                      {isJa
                        ? selectedPick.detailsJa ?? selectedPick.detailsEn
                        : selectedPick.detailsEn ?? selectedPick.detailsJa}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setSelectedPick(null)}
                    style={styles.draftModalCloseBtn}
                  >
                    <Text style={styles.draftModalCloseText}>✕</Text>
                  </Pressable>
                </View>

                {/* Badge tags */}
                <View style={styles.draftModalTagRow}>
                  {selectedPick.badgeType && (
                    <View style={styles.draftModalTagBadge}>
                      <Text style={styles.draftModalTagBadgeText}>
                        {selectedPick.badgeType === "own"
                          ? isJa ? "自前指名権" : "OWN PICK"
                          : selectedPick.badgeType === "from"
                          ? isJa ? `獲得 (via ${selectedPick.fromTeamId ?? ""})` : `VIA ${selectedPick.fromTeamId ?? ""}`
                          : selectedPick.badgeType === "swap"
                          ? isJa ? `スワップ権 (${selectedPick.swapWithTeamId ?? ""})` : `SWAP (${selectedPick.swapWithTeamId ?? ""})`
                          : selectedPick.badgeType === "prot"
                          ? isJa ? "プロテクト付き" : "PROTECTED"
                          : selectedPick.badgeType === "outgoing"
                          ? isJa ? `放出済み (to ${selectedPick.toTeamId ?? ""})` : `OUTGOING (to ${selectedPick.toTeamId ?? ""})`
                          : isJa ? "条件付き" : "CONDITIONAL"}
                      </Text>
                    </View>
                  )}
                  {selectedPick.protection && (
                    <View style={[styles.draftModalTagBadge, { backgroundColor: "rgba(255,184,0,0.15)", borderColor: "rgba(255,184,0,0.4)" }]}>
                      <Text style={[styles.draftModalTagBadgeText, { color: "#FFB800" }]}>
                        {selectedPick.protection}
                      </Text>
                    </View>
                  )}
                </View>

                {(() => {
                  const origin = resolveDraftPickOrigin(selectedPick);
                  const body = (isJa ? origin.textJa : origin.textEn).trim();
                  return (
                    <View style={styles.draftModalBodyBox}>
                      <Text style={styles.draftModalBodyLabel}>
                        {isJa ? origin.labelJa : origin.labelEn}
                      </Text>
                      <Text style={styles.draftOriginBodyText}>
                        {body.length > 0
                          ? body
                          : isJa
                            ? "経緯データなし"
                            : "No origin on file"}
                      </Text>
                    </View>
                  );
                })()}

                {/* Conditions list */}
                <View style={styles.draftModalBodyBox}>
                  <Text style={styles.draftModalBodyLabel}>
                    {isJa ? "行使条件・保護ルール" : "CONDITIONS & CONVEYANCE"}
                  </Text>
                  {selectedPick.conditionsJa && selectedPick.conditionsJa.length > 0 ? (
                    (isJa ? selectedPick.conditionsJa : selectedPick.conditionsEn ?? selectedPick.conditionsJa).map(
                      (c, idx) => (
                        <View key={idx} style={styles.draftConditionItem}>
                          <Text style={styles.draftConditionBullet}>•</Text>
                          <Text style={styles.draftConditionText}>{c}</Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text style={styles.draftConditionText}>
                      {isJa
                        ? selectedPick.detailsJa ?? "追加のプロテクション条件はありません（確定）"
                        : selectedPick.detailsEn ?? "No additional protection conditions (guaranteed)."}
                    </Text>
                  )}
                </View>

                {/* Close Button */}
                <Pressable
                  style={styles.draftModalActionBtn}
                  onPress={() => setSelectedPick(null)}
                >
                  <Text style={styles.draftModalActionBtnText}>
                    {isJa ? "閉じる" : "CLOSE"}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function renderNativePickChip(
  p: NbaDraftPickEntry,
  isJa: boolean,
  onPress: () => void
) {
  const badgeType = p.badgeType ?? "own";
  const isOutgoing = p.kind === "outgoing" || p.isOutgoing || badgeType === "outgoing";
  const isSwap = p.kind.startsWith("swap") || p.isSwap || badgeType === "swap";
  const isProt = badgeType === "prot" || (p.protection && p.protection.toLowerCase() !== "unprotected");
  const isFrom = badgeType === "from" || (!isSwap && !isProt && !isOutgoing && !!p.fromTeamId);

  let bg = "rgba(0,245,255,0.08)";
  let border = "rgba(0,245,255,0.35)";
  let color = "#00F5FF";
  let tagBg = "rgba(0,245,255,0.2)";
  let tagText = isJa ? "自前" : "OWN";

  if (isOutgoing) {
    bg = "rgba(255,45,120,0.06)";
    border = "rgba(255,45,120,0.3)";
    color = "#FF2D78";
    tagBg = "rgba(255,45,120,0.2)";
    tagText = isJa ? "放出" : "OUT";
  } else if (isSwap) {
    bg = "rgba(255,184,0,0.08)";
    border = "rgba(255,184,0,0.4)";
    color = "#FFB800";
    tagBg = "rgba(255,184,0,0.2)";
    tagText = "SWAP";
  } else if (isProt) {
    bg = "rgba(179,136,255,0.08)";
    border = "rgba(179,136,255,0.4)";
    color = "#B388FF";
    tagBg = "rgba(179,136,255,0.2)";
    tagText = p.protectionTag ?? (isJa ? "プロテクト" : "PROT");
  } else if (isFrom) {
    bg = "rgba(92,240,181,0.08)";
    border = "rgba(92,240,181,0.4)";
    color = "#5CF0B5";
    tagBg = "rgba(92,240,181,0.2)";
    tagText = p.fromTeamId ? `FROM ${p.fromTeamId}` : isJa ? "取得" : "FROM";
  }

  const label = isJa
    ? p.shortLabelJa ?? p.detailsJa ?? p.detailsEn
    : p.shortLabelEn ?? p.detailsEn ?? p.detailsJa;

  return (
    <Pressable
      key={p.id}
      onPress={onPress}
      style={[
        styles.draftChip,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: isOutgoing ? 0.65 : 1,
        },
      ]}
    >
      <View style={[styles.draftKindTag, { backgroundColor: tagBg }]}>
        <Text style={[styles.draftKindTagText, { color: color }]}>
          {tagText}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.draftChipText,
          {
            color: color,
            textDecorationLine: isOutgoing ? "line-through" : "none",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function NbaTeamDetailPanelNative({
  language,
  teamId,
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const { bundle } = useLeagueTeamStatsBundle({
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const baseDetail = useMemo(
    () => getNbaTeamDetailPreview(teamId, bundle),
    [teamId, bundle]
  );
  const { detail, aceOut, hasFetchError } = useNbaTeamDetailLiveOverlay({
    teamId: baseDetail.teamId,
    apiBaseUrl: getUniterzApiBaseUrl(),
    base: baseDetail,
  });
  const teamInsights = useMemo(
    () =>
      buildTeamDetailInsights({
        detail,
        seasonRows: bundle.season,
        seasonRow: bundle.season.find((r) => r.teamId === detail.teamId),
        last10Row: bundle.last10.find((r) => r.teamId === detail.teamId),
        aceOut,
      }),
    [detail, bundle.season, bundle.last10, aceOut]
  );
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

  const winPctText = detail.season.winPct.toFixed(3).replace(/^0/, "");
  const last10 = recentFormRecord(detail.recentGames);
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, { paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panel}>
        
        {hasFetchError ? (
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", marginBottom: 8 }}>
            {isJa
              ? "一部データの取得に失敗しました。表示が古い／空の可能性があります。"
              : "Some live data failed to load. Parts may be empty or stale."}
          </Text>
        ) : null}
{/* HEADER */}
        <View style={[styles.headerCard, { borderColor: accent }]}>
          <View style={styles.header}>
            <View style={styles.jerseyFrame}>
              <JerseyMarkSvg
                accent={jerseyPrimary}
                accentEnd={jerseySecondary}
                size={56}
              />
            </View>
            <View style={styles.headerText}>
              <Text
                style={[styles.confSeed, { color: "rgba(255,255,255,0.85)" }]}
                numberOfLines={1}
              >
                {confLine}
              </Text>
              <Text style={styles.city} numberOfLines={1}>
                {detail.cityEn.toUpperCase()}
              </Text>
              <Text style={styles.nick} numberOfLines={1}>
                {detail.nickEn.toUpperCase()}
              </Text>
            </View>
            <TeamHeroStreakBadgeNative
              streak={detail.streak}
              last10={last10}
              isJa={isJa}
            />
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
                <Text style={[styles.recordRankAccent, { color: "#FFFFFF" }]}>
                  {winPctText}
                </Text>
              </View>
            </View>
            <View
              style={[styles.recordRankCard, { borderColor: frameColor }]}
            >
              <Text style={styles.recordRankLabel}>RANK</Text>
              <View style={styles.recordRankValues}>
                <Text style={[styles.recordRankPrimary, { color: "#FFFFFF" }]}>
                  #{String(detail.conferenceRank).padStart(2, "0")}
                </Text>
                <Text style={styles.recordRankAccentMuted}>Seed</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {teamInsights.summary ? (
          <>
            <DetailInsightSummaryNative
              text={isJa ? teamInsights.summary.linesJa : teamInsights.summary.linesEn}
            />
            <View style={{ height: 10 }} />
            <DetailIdentityChipRowNative
              chips={teamInsights.identity}
              accent={accent}
              title="TEAM IDENTITY"
              isJa={isJa}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          </>
        ) : teamInsights.identity.length > 0 ? (
          <>
            <DetailIdentityChipRowNative
              chips={teamInsights.identity}
              accent={accent}
              title="TEAM IDENTITY"
              isJa={isJa}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          </>
        ) : null}

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

        <NbaTeamHowTheyPlayNative
          teamId={detail.teamId}
          accent={accent}
          isJa={isJa}
          bundle={bundle}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={[styles.sectionCard, { borderColor: frameColor }]}>
          <RecentFormSection
            games={detail.recentGames}
            streak={detail.streak}
            accent={accent}
            isJa={isJa}
            trends={teamInsights.trends}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <GameLogsSection
          games={detail.recentGames}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <HeadToHeadSection
          rows={detail.headToHead}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <DetailScheduleSectionNative
          upcomingGames={detail.upcomingGames}
          scheduleDifficulty={teamInsights.scheduleDifficulty}
          accent={accent}
          isJa={isJa}
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
        <View style={[styles.splitRow, { marginTop: 8 }]}>
          <SplitCard
            label="VS .500+"
            wins={detail.strengthSplit.vsOver500.wins}
            losses={detail.strengthSplit.vsOver500.losses}
            accent={accent}
          />
          <SplitCard
            label="VS SUB-.500"
            wins={detail.strengthSplit.vsUnder500.wins}
            losses={detail.strengthSplit.vsUnder500.losses}
            accent={accent}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <PayrollSection
          payroll={detail.payroll}
          rosterBlock={detail.rosterBlock}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <DraftPicksSection
          teamId={detail.teamId}
          accent={accent}
          isJa={isJa}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <SectionHeader title="ROSTER" accent={accent} />
        <View style={[styles.rosterFrame, { borderColor: frameColor }]}>
          <NbaTeamRosterCardNative
            block={detail.rosterBlock}
            onPlayerPress={(player) =>
              onSelectPlayer?.(String(player.id))
            }
          />
        </View>

        <Text
          style={[styles.footerAsOf, { color: "rgba(255,255,255,0.4)" }]}
        >
          {detail.asOfLabel}
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
  heroStreakWrap: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  heroStreakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  heroStreakTag: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroStreakValue: {
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  heroStreakL10: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
  payrollYearTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  payrollYearTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,8,12,0.4)",
    transform: [{ skewX: "-8deg" }],
  },
  payrollYearTabText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
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
  payrollSalaryBlock: { gap: 2, flex: 1 },
  payrollRankBlock: { alignItems: "flex-end", gap: 2 },
  payrollLabelWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  apronBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    transform: [{ skewX: "-8deg" }],
  },
  apronBadgeText: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
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
  payrollSpacesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
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
    gap: 8,
    marginTop: 4,
  },
  payrollLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  payrollSwatch: {
    width: 10,
    height: 10,
    borderRadius: 1,
    transform: [{ skewX: "-12deg" }],
  },
  payrollLineName: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-8deg" }],
  },
  payrollLineSalary: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  payrollLineShare: {
    width: 44,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  payrollCapPctBlock: {
    width: 62,
    alignItems: "flex-end",
  },
  payrollCapPct: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  payrollCapPctSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "700",
  },
  payrollLegendWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 10,
    marginTop: 8,
    gap: 6,
  },
  payrollLegendTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  payrollLegendList: {
    gap: 5,
  },
  payrollLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payrollLegendBadge: {
    fontSize: 8,
    fontWeight: "800",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    overflow: "hidden",
  },
  payrollLegendText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
    flex: 1,
  },
  draftSummaryCardWrap: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  draftSummaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  draftSummaryMainLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  draftFlexibilityWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  draftFlexibilityLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
  },
  draftFlexibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 2,
    transform: [{ skewX: "-6deg" }],
  },
  draftFlexibilityText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
  },
  draftSummaryGrid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  draftSummaryBox: {
    width: "48.5%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 2,
    gap: 3,
  },
  draftSummaryBoxLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  draftSummaryBoxValRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  draftSummaryBoxVal: {
    fontFamily: OXANIUM,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  draftSummaryBoxUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  draftSummaryBoxSub: {
    fontFamily: METRIC_FONT,
    fontSize: 8.5,
    color: "rgba(255,255,255,0.45)",
  },
  draftSummaryBoxSubBold: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  draftTimelineHeaderRow: {
    flexDirection: "column",
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  draftTimelineHeaderTitle: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  draftLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  draftLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  draftLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  draftLegendText: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
  },
  draftListCard: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  draftYearRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  draftYearCol: {
    width: 44,
    paddingTop: 2,
  },
  draftYearText: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
  },
  draftPicksCol: {
    flex: 1,
    gap: 6,
  },
  draftRoundGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  draftRoundLabel: {
    fontFamily: METRIC_FONT,
    color: "#00F5FF",
    fontSize: 9,
    fontWeight: "800",
    width: 24,
    paddingTop: 2,
  },
  draftChipsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  draftChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  draftKindTag: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 1,
  },
  draftKindTagText: {
    fontFamily: METRIC_FONT,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  draftProtectionTag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  draftProtectionTagText: {
    fontFamily: METRIC_FONT,
    fontSize: 7.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  draftChipNone: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  draftChipText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    maxWidth: 160,
  },
  draftChipTextNone: {
    fontFamily: METRIC_FONT,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  draftModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0C0D14",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.5)",
    padding: 18,
    borderRadius: 2,
    gap: 14,
  },
  draftModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    paddingBottom: 10,
  },
  draftModalHeaderTitles: {
    flex: 1,
    gap: 2,
  },
  draftModalSubTitle: {
    fontFamily: METRIC_FONT,
    color: "#00F5FF",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  draftModalMainTitle: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  draftModalCloseBtn: {
    padding: 4,
  },
  draftModalCloseText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "700",
  },
  draftModalTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  draftModalTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  draftModalTagBadgeText: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  draftModalBodyBox: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 2,
    gap: 8,
  },
  draftModalBodyLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  draftOriginBodyText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
  },
  draftConditionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  draftConditionBullet: {
    color: "#00F5FF",
    fontSize: 12,
    lineHeight: 16,
  },
  draftConditionText: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11.5,
    lineHeight: 16,
  },
  draftModalActionBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 2,
  },
  draftModalActionBtnText: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
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
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 50,
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
    paddingVertical: 11,
    gap: 6,
  },
  gameRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.1)",
  },
  gameDate: {
    width: 44,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  gameVs: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "700",
  },
  confTag: {
    color: "rgba(0,245,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
  },
  gameScore: {
    width: 62,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  gameResult: {
    width: 20,
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    transform: [{ skewX: "-8deg" }],
  },
  win: { color: FORM_WIN },
  loss: { color: FORM_LOSS },
  gameHead: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
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
    fontSize: 13,
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
  oppAllowedTovBadge: {
    fontFamily: METRIC_FONT,
    color: "rgba(110,231,183,0.85)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    transform: [{ skewX: "-6deg" }],
  },
  oppAllowedBadgeSpacer: {
    height: 13,
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
