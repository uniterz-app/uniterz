import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SeriesId } from "../../../../../../lib/playoff-bracket";
import { colors } from "../../../theme/tokens";

type Team = {
  code: string;
  seed: number;
};

type Props = {
  seriesId: SeriesId;
  teams: [Team, Team];
  winner?: string;
  games?: number;
  disabled?: boolean;
  cardHeight?: number;
  cardPaddingY?: number;
  rowGap?: number;
  onSelectWinner: (seriesId: SeriesId, teamCode: string) => void;
  onSelectGames: (seriesId: SeriesId, games: number) => void;
};

export default function PlayoffSeriesCardNative({
  seriesId,
  teams,
  winner,
  games,
  disabled = false,
  cardHeight = 116,
  cardPaddingY = 10,
  rowGap = 6,
  onSelectWinner,
  onSelectGames,
}: Props) {
  const rowH = (cardHeight - cardPaddingY * 2 - rowGap) / 2;

  return (
    <View
      style={[
        styles.card,
        {
          height: cardHeight,
          paddingTop: cardPaddingY,
          paddingBottom: cardPaddingY,
          opacity: disabled ? 0.72 : 1,
        },
      ]}
    >
      <View style={styles.grid}>
        <View style={{ gap: rowGap }}>
          {teams.map((team) => {
            const isWinner = winner === team.code;
            return (
              <Pressable
                key={team.code}
                disabled={disabled}
                onPress={() => onSelectWinner(seriesId, team.code)}
                style={[styles.teamRow, { height: rowH }, isWinner && styles.teamRowWinner]}
              >
                <Text style={styles.seed}>{team.seed}</Text>
                <Text style={styles.teamCode}>{team.code}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.gamesGrid, { height: cardHeight - cardPaddingY * 2 }]}>
          {[4, 5, 6, 7].map((g) => {
            const selected = games === g;
            return (
              <Pressable
                key={g}
                disabled={disabled}
                onPress={() => onSelectGames(seriesId, g)}
                style={[styles.gameBtn, selected && styles.gameBtnSelected]}
              >
                <Text style={[styles.gameBtnText, selected && styles.gameBtnTextSelected]}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0d1015",
    paddingHorizontal: 10,
    shadowColor: "rgba(255,255,255,0.18)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 2,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  teamRowWinner: {
    backgroundColor: "rgba(31, 111, 235, 0.18)",
  },
  seed: {
    width: 14,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "500",
  },
  teamCode: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  gamesGrid: {
    width: 76,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignContent: "space-between",
  },
  gameBtn: {
    width: "47%",
    height: "47%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0b0d10",
    alignItems: "center",
    justifyContent: "center",
  },
  gameBtnSelected: {
    borderColor: "rgba(31, 111, 235, 0.35)",
    backgroundColor: "rgba(31, 111, 235, 0.18)",
  },
  gameBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
  },
  gameBtnTextSelected: {
    color: colors.textPrimary,
  },
});
