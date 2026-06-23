import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SkeletonScanNative } from "../../../components/SkeletonScanNative";
import {
  formatWcPastResultDate,
  selectWcTeamPastResults,
  type WcTeamPastResultRow,
} from "../../../../../../lib/wc/wcSeasonGameRecord";
import { teamIdToCountryName } from "../../../../../../lib/wc/wcCountry";
import CountryFlagNative from "../CountryFlagNative";
import {
  MATCH_CARD_JP_BOLD_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../matchCardTypography";
import type { GamesLanguage, GamesTexts } from "../gamesI18n";
import { useWcSeasonGamesNative } from "./useWcSeasonGamesNative";

const DEFAULT_SEASON = "2025-26";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  currentGameId?: string | null;
  season?: string | null;
  language: GamesLanguage;
  t: GamesTexts;
};

type TeamSide = "home" | "away";

function summarizeRecord(rows: readonly WcTeamPastResultRow[]): string {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const row of rows) {
    if (row.outcome === "W") wins += 1;
    else if (row.outcome === "D") draws += 1;
    else losses += 1;
  }
  return `${wins}-${draws}-${losses}`;
}

/** Web `WcPastResultsPanel` 相当 */
export default function WcPastResultsPanelNative({
  homeTeamId,
  awayTeamId,
  currentGameId,
  season,
  language,
  t,
}: Props) {
  const effectiveSeason = season ?? DEFAULT_SEASON;
  const { games, loading, error } = useWcSeasonGamesNative(effectiveSeason);
  const [side, setSide] = useState<TeamSide>("home");

  useEffect(() => {
    setSide("home");
  }, [homeTeamId, awayTeamId, currentGameId]);

  const homeRows = useMemo(() => {
    if (games == null) return null;
    return selectWcTeamPastResults(games, homeTeamId, {
      excludeGameId: currentGameId,
    });
  }, [games, homeTeamId, currentGameId]);

  const awayRows = useMemo(() => {
    if (games == null) return null;
    return selectWcTeamPastResults(games, awayTeamId, {
      excludeGameId: currentGameId,
    });
  }, [games, awayTeamId, currentGameId]);

  const homeDisplay =
    teamIdToCountryName(homeTeamId, language === "ja" ? "ja" : "en") ?? homeTeamId;
  const awayDisplay =
    teamIdToCountryName(awayTeamId, language === "ja" ? "ja" : "en") ?? awayTeamId;

  const activeTeamId = side === "home" ? homeTeamId : awayTeamId;
  const activeLabel = side === "home" ? homeDisplay : awayDisplay;
  const activeRows = side === "home" ? homeRows : awayRows;

  return (
    <View style={styles.root}>
      <View style={styles.sideTabs}>
        {(
          [
            { side: "home" as const, teamId: homeTeamId, label: homeDisplay },
            { side: "away" as const, teamId: awayTeamId, label: awayDisplay },
          ] as const
        ).map((item) => {
          const active = side === item.side;
          return (
            <Pressable
              key={item.side}
              onPress={() => setSide(item.side)}
              style={[styles.sideTab, active && styles.sideTabActive]}
            >
              <CountryFlagNative teamId={item.teamId} variant="inline" />
              <Text
                style={[styles.sideTabText, active && styles.sideTabTextActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TeamResultsCardNative
        teamId={activeTeamId}
        label={activeLabel}
        rows={activeRows}
        loading={loading}
        error={error}
        language={language}
        t={t}
      />
    </View>
  );
}

function TeamResultsCardNative({
  teamId,
  label,
  rows,
  loading,
  error,
  language,
  t,
}: {
  teamId: string;
  label: string;
  rows: WcTeamPastResultRow[] | null;
  loading: boolean;
  error: string | null;
  language: GamesLanguage;
  t: GamesTexts;
}) {
  const recordLabel = rows && rows.length > 0 ? summarizeRecord(rows) : null;

  return (
    <View style={styles.cardShell}>
      <View style={styles.cardHeader}>
        <CountryFlagNative teamId={teamId} variant="inline" />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {label}
        </Text>
        {recordLabel ? (
          <Text style={styles.recordLabel}>{recordLabel}</Text>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        {loading || rows == null ? (
          <View style={styles.skeletonWrap}>
            {[0, 1].map((i) => (
              <SkeletonScanNative key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : error ? (
          <Text style={styles.note}>{t.standingsLoadFailed}</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.note}>{t.pastResultsEmpty}</Text>
        ) : (
          rows.map((row, index) => (
            <ResultRowNative
              key={`${teamId}-${row.gameId}`}
              row={row}
              language={language}
              isLast={index === rows.length - 1}
            />
          ))
        )}
      </View>
    </View>
  );
}

function ResultRowNative({
  row,
  language,
  isLast,
}: {
  row: WcTeamPastResultRow;
  language: GamesLanguage;
  isLast: boolean;
}) {
  const opponentName =
    teamIdToCountryName(row.opponentTeamId, language === "ja" ? "ja" : "en") ??
    row.opponentTeamId;

  const scoreStyle =
    row.outcome === "W"
      ? styles.scoreWin
      : row.outcome === "D"
        ? styles.scoreDraw
        : styles.scoreLoss;

  const rowStyle =
    row.outcome === "W"
      ? styles.rowWin
      : row.outcome === "D"
        ? styles.rowDraw
        : styles.rowLoss;

  return (
    <View style={[styles.row, rowStyle, isLast && styles.rowLast]}>
      <Text style={styles.rowDate}>
        {formatWcPastResultDate(row.startAtMs, language === "ja" ? "ja" : "en")}
      </Text>
      <View style={styles.opponentCell}>
        <CountryFlagNative teamId={row.opponentTeamId} variant="inline" />
        <Text style={styles.opponent} numberOfLines={1}>
          {opponentName}
        </Text>
      </View>
      <Text style={[styles.score, scoreStyle]}>
        {row.goalsFor}–{row.goalsAgainst}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  sideTabs: {
    flexDirection: "row",
    gap: 6,
  },
  sideTab: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sideTabActive: {
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  sideTabText: {
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: MATCH_CARD_JP_BOLD_FONT,
    includeFontPadding: false,
  },
  sideTabTextActive: {
    color: "#fff",
  },
  cardShell: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: MATCH_CARD_JP_BOLD_FONT,
    includeFontPadding: false,
  },
  recordLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  cardBody: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    borderLeftWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowWin: {
    borderLeftColor: "rgba(52,211,153,0.85)",
    backgroundColor: "rgba(52,211,153,0.08)",
  },
  rowDraw: {
    borderLeftColor: "rgba(103,232,249,0.55)",
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  rowLoss: {
    borderLeftColor: "rgba(251,113,133,0.85)",
    backgroundColor: "rgba(251,113,133,0.08)",
  },
  rowDate: {
    width: 34,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  opponentCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opponent: {
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: MATCH_CARD_JP_BOLD_FONT,
    includeFontPadding: false,
  },
  score: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  scoreWin: {
    color: "#86efac",
    textShadowColor: "rgba(52,211,153,0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  scoreDraw: {
    color: "rgba(207,250,254,0.95)",
    textShadowColor: "rgba(34,211,238,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreLoss: {
    color: "#fda4af",
    textShadowColor: "rgba(251,113,133,0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  note: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontFamily: MATCH_CARD_JP_BOLD_FONT,
    includeFontPadding: false,
  },
  skeletonWrap: {
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  skeletonRow: {
    height: 40,
    borderRadius: 0,
  },
});
