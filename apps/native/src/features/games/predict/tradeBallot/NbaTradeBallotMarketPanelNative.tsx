/** トレードバレット — みんなの予想（選手投票率 + 行き先 Top3） */
import { StyleSheet, Text, View } from "react-native";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { TeamTint } from "../season/NbaSeasonStandingsViewPanelNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import {
  awardCandidateLabel,
  tradeBallotTeamById,
  type NbaAwardCandidate,
  type NbaTradeBallotPrediction,
} from "../../../../../../../lib/predict/nbaTradeBallotPredict";
import type {
  NbaTradeBallotMarketPlayerRow,
  NbaTradeBallotMarketSnapshot,
} from "../../../../../../../lib/predict/nbaTradeBallotMarket";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  market: NbaTradeBallotMarketSnapshot;
  mine?: {
    prediction: NbaTradeBallotPrediction | null;
    catalog?: readonly NbaAwardCandidate[];
  } | null;
};

const OX = "Oxanium_700Bold";

function minePlayerIds(
  prediction: NbaTradeBallotPrediction | null | undefined
): Set<string> {
  const ids = new Set<string>();
  if (!prediction) return ids;
  for (const p of prediction.picks) {
    const id = typeof p.playerId === "string" ? p.playerId.trim() : "";
    if (id) ids.add(id);
  }
  return ids;
}

function YourPicksBlock({
  prediction,
  catalog,
  marketPlayers,
}: {
  prediction: NbaTradeBallotPrediction;
  catalog: readonly NbaAwardCandidate[];
  marketPlayers: readonly NbaTradeBallotMarketPlayerRow[];
}) {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const rankById = new Map(
    marketPlayers.map((p, i) => [p.playerId, { rank: i + 1, pct: p.pct }])
  );

  return (
    <View style={{ gap: 6, marginBottom: 14 }}>
      <Text style={styles.sectionLabel}>Your picks</Text>
      {prediction.picks.map((pick, index) => {
        const playerId =
          typeof pick.playerId === "string" ? pick.playerId.trim() : "";
        const player = playerId ? byId.get(playerId) : null;
        const dest = tradeBallotTeamById(pick.toTeamId);
        const market = playerId ? rankById.get(playerId) : null;
        const fromTeamId = player?.teamAbbr
          ? nbaTeamIdFromBracketCode(player.teamAbbr)
          : null;
        return (
          <View key={`mine-${index}`} style={styles.youRow}>
            <TeamTint teamId={fromTeamId} />
            <Text style={styles.youSlot}>
              #{String(index + 1).padStart(2, "0")}
            </Text>
            <Text style={[styles.name, styles.youName]} numberOfLines={1}>
              {player ? awardCandidateLabel(player) : "—"}
            </Text>
            {dest ? (
              <TeamAbbrBadgeNative abbr={dest.abbr} teamId={dest.teamId} />
            ) : null}
            <Text style={styles.youPct}>
              {market ? `${market.pct.toFixed(1)}%` : "—"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function NbaTradeBallotMarketPanelNative({
  market,
  mine,
}: Props) {
  const myIds = minePlayerIds(mine?.prediction);
  const showMissing = mine != null && mine.prediction == null;

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Trade market · {market.season}</Text>
      <View style={styles.countRow}>
        <Text style={styles.countNum}>
          {market.submissionCount.toLocaleString()}
        </Text>
        <Text style={styles.countLabel}>ballots</Text>
      </View>
      <Text style={styles.lead}>
        移籍しそうと選ばれた選手の割合。各選手の下は行き先の上位 3。投票率は締切後に公開（いまはモック）。
      </Text>
      {showMissing ? (
        <Text style={styles.missing}>
          まだ提出していません。提出すると自分の枠が上に出ます。
        </Text>
      ) : null}

      {mine?.prediction ? (
        <YourPicksBlock
          prediction={mine.prediction}
          catalog={mine.catalog ?? []}
          marketPlayers={market.players}
        />
      ) : null}

      <Text style={[styles.sectionLabel, { marginTop: 4 }]}>
        Most picked to be traded
      </Text>
      <View style={{ gap: 12, marginTop: 6 }}>
        {market.players.map((row, i) => {
          const isMine = myIds.has(row.playerId);
          const fromTeamId = row.fromTeamAbbr
            ? nbaTeamIdFromBracketCode(row.fromTeamAbbr)
            : null;
          return (
            <View key={row.playerId}>
              <View
                style={[styles.pickRow, isMine ? styles.pickRowMine : null]}
              >
                <TeamTint teamId={fromTeamId} />
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={styles.pickMain}>
                  <Text style={styles.name} numberOfLines={1}>
                    {row.name}
                  </Text>
                  {row.fromTeamAbbr ? (
                    <TeamAbbrBadgeNative
                      abbr={row.fromTeamAbbr}
                      teamId={fromTeamId ?? undefined}
                    />
                  ) : null}
                </View>
                <Text style={styles.pct}>{row.pct.toFixed(1)}%</Text>
              </View>
              <View style={styles.destList}>
                {row.destinations.map((d) => (
                  <View key={`${row.playerId}-${d.teamId}`} style={styles.destRow}>
                    <Text style={styles.destArrow}>→</Text>
                    <TeamAbbrBadgeNative abbr={d.teamAbbr} teamId={d.teamId} />
                    <Text style={styles.destPct}>{d.pct.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "#000000",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(253,230,138,0.9)",
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
    color: "rgba(253,230,138,0.95)",
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
  missing: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(165,243,252,0.85)",
  },
  sectionLabel: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  youRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.08)",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  youSlot: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(165,243,252,0.95)",
  },
  youName: { flex: 1 },
  youPct: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(165,243,252,0.9)",
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickRowMine: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.06)",
  },
  rank: {
    width: 14,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.35)",
  },
  pickMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    ...MATCH_CARD_BRACKET_TEXT,
    flexShrink: 1,
    fontSize: 12,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "rgba(255,255,255,0.9)",
  },
  pct: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(254,243,199,0.9)",
  },
  destList: {
    marginTop: 4,
    marginLeft: 28,
    gap: 4,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  destArrow: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
  },
  destPct: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
});
