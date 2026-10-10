/** Web `NbaSeasonStandingsMarketPanel` 相当 — フル表 + 行タップで帯% */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TeamTint } from "./NbaSeasonStandingsViewPanelNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../../rankings/CyberSlantedTabNative";
import type { NbaConferenceId } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { getNbaTeamNicknameById } from "../../../../../../../lib/nba-team-names";
import {
  buildStandingsCrowdBoard,
  standingsDetailBandWidths,
  type SeasonStandingsCrowdBoardRow,
  type SeasonStandingsMarketSnapshot,
} from "../../../../../../../lib/predict/seasonPredictMarket";
import {
  seasonPredictPredictedRankBandsHeading,
  seasonPredictStandingsBandLabel,
  seasonPredictStandingsMarketHint,
  seasonPredictSubmissionCountLabel,
  type SeasonPredictUiLang,
} from "../../../../../../../lib/predict/seasonPredictUiCopy";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  market: SeasonStandingsMarketSnapshot;
  language?: SeasonPredictUiLang;
};

type Band = "straight" | "playin" | "out";

const OX = "Oxanium_700Bold";

function bandForRank(rank: number): Band {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function bandRankColor(band: Band): string {
  if (band === "straight") return "#fff";
  if (band === "playin") return "#2DFF6E";
  return "rgba(255,255,255,0.35)";
}

function DetailBands({
  row,
  language = "ja",
}: {
  row: SeasonStandingsCrowdBoardRow;
  language?: SeasonPredictUiLang;
}) {
  const bands = standingsDetailBandWidths(row.detailBandPct);
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>
        {seasonPredictPredictedRankBandsHeading(language)}
      </Text>
      <View style={styles.stackBar}>
        {bands.map((b) =>
          b.pct > 0 ? (
            <View
              key={b.id}
              style={{
                width: `${b.pct}%`,
                backgroundColor: b.color,
                height: "100%",
              }}
            />
          ) : null
        )}
      </View>
      <View style={styles.detailGrid}>
        {bands.map((b) => (
          <View key={b.id} style={styles.detailCell}>
            <Text style={styles.detailBandLabel}>
              {seasonPredictStandingsBandLabel(language, b)}
            </Text>
            <Text style={styles.detailPct}>
              {b.pct.toFixed(0)}
              <Text style={styles.detailPctUnit}>%</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TeamListRow({
  row,
  expanded,
  onToggle,
  language = "ja",
  isLast,
}: {
  row: SeasonStandingsCrowdBoardRow;
  expanded: boolean;
  onToggle: () => void;
  language?: SeasonPredictUiLang;
  isLast: boolean;
}) {
  const band = bandForRank(row.boardRank);
  const name = (
    getNbaTeamNicknameById(row.teamId) ?? row.teamId
  ).toUpperCase();

  return (
    <View style={!isLast ? styles.rowBorder : null}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          styles.rowBtn,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={styles.rankCol}>
          <Text style={[styles.rankNum, { color: bandRankColor(band) }]}>
            {row.boardRank}
          </Text>
        </View>
        <View style={styles.teamCol}>
          <TeamTint teamId={row.teamId} />
          <Text style={styles.teamName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.avgHint}>AVG {row.avgRank.toFixed(1)}</Text>
          <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </Pressable>
      {expanded ? <DetailBands row={row} language={language} /> : null}
    </View>
  );
}

export default function NbaSeasonStandingsMarketPanelNative({
  market,
  language = "ja",
}: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const teamRows = conference === "east" ? market.east : market.west;
  const board = useMemo(
    () => buildStandingsCrowdBoard(teamRows),
    [teamRows]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Standings market · {market.season}</Text>
      <View style={styles.countRow}>
        <Text style={styles.countNum}>
          {market.submissionCount.toLocaleString()}
        </Text>
        <Text style={styles.countLabel}>
          {seasonPredictSubmissionCountLabel(language)}
        </Text>
      </View>
      <Text style={styles.lead}>
        {seasonPredictStandingsMarketHint(language)}
      </Text>

      <View style={{ marginVertical: 10 }}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="EAST"
            active={conference === "east"}
            onPress={() => {
              setConference("east");
              setExpandedTeamId(null);
            }}
            compact
            fontWeight="700"
          />
          <CyberSlantedTabNative
            label="WEST"
            active={conference === "west"}
            onPress={() => {
              setConference("west");
              setExpandedTeamId(null);
            }}
            compact
            fontWeight="700"
          />
        </CyberSlantedTabBarNative>
      </View>

      <View style={styles.table}>
        {board.map((row, i) => (
          <TeamListRow
            key={row.teamId}
            row={row}
            expanded={expandedTeamId === row.teamId}
            onToggle={() =>
              setExpandedTeamId((cur) =>
                cur === row.teamId ? null : row.teamId
              )
            }
            language={language}
            isLast={i === board.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(6,10,16,0.96)",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#a5f3fc",
    textTransform: "uppercase",
  },
  countRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  countNum: {
    fontFamily: OX,
    fontSize: 28,
    fontWeight: "900",
    color: "#a5f3fc",
    fontVariant: ["tabular-nums"],
  },
  countLabel: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
  },
  lead: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  table: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(0,0,0,0.55)",
    overflow: "hidden",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowBtn: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rankCol: {
    width: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },
  rankNum: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  teamCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  teamName: {
    ...MATCH_CARD_BRACKET_TEXT,
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  avgHint: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  chevron: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(103,232,249,0.6)",
  },
  detail: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 8,
    gap: 6,
  },
  detailLabel: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  stackBar: {
    height: 8,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  detailGrid: {
    flexDirection: "row",
    gap: 4,
  },
  detailCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  detailBandLabel: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  detailPct: {
    fontFamily: OX,
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
  },
  detailPctUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
});
