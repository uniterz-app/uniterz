/**
 * Web `ProfileNbaFavoritesRow` 相当 — 縦積み・フッター寄り。
 * FAVORITES / チームフルネーム + ファン歴 / 選手 A.EDWARDS + badge
 * 選手バッジは列揃え（最長名に合わせて左クラスタ）
 */
import { StyleSheet, Text, View } from "react-native";
import {
  formatNbaFanSinceInline,
  formatNbaFavoritePlayerInitialLast,
  type NbaFavorites,
} from "../../../../../../lib/profile/nbaFavorites";
import { getNbaTeamFullNameById } from "../../../../../../lib/nba-team-names";
import TeamAbbrBadgeNative from "../../games/TeamAbbrBadgeNative";

const OXANIUM_EXTRA = "Oxanium_800ExtraBold";
const PLAYER_ROW_H = 22;

type Props = {
  favorites: NbaFavorites;
  language?: "ja" | "en";
};

export default function ProfileNbaFavoritesRowNative({
  favorites,
  language = "ja",
}: Props) {
  const teamId = favorites.favoriteNbaTeamId;
  const players = favorites.favoriteNbaPlayers;
  if (!teamId && players.length === 0) return null;

  const fanSince = formatNbaFanSinceInline(
    favorites.favoriteNbaTeamFanSinceSeason,
    language
  );

  return (
    <View style={styles.wrap} accessibilityLabel="Favorites">
      <Text style={styles.heading}>FAVORITES</Text>
      <View style={styles.col}>
        {teamId ? (
          <View style={styles.teamRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {getNbaTeamFullNameById(teamId)}
            </Text>
            {fanSince ? (
              <Text style={styles.fanSince} numberOfLines={1}>
                {fanSince}
              </Text>
            ) : null}
          </View>
        ) : null}
        {players.length > 0 ? (
          <View style={styles.playersGrid}>
            <View style={styles.playerNamesCol}>
              {players.map((p) => (
                <View key={p.playerId} style={styles.playerNameCell}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {formatNbaFavoritePlayerInitialLast(p.displayName)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.playerBadgesCol}>
              {players.map((p) => (
                <View key={p.playerId} style={styles.playerBadgeCell}>
                  {p.teamId ? (
                    <TeamAbbrBadgeNative teamId={p.teamId} />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  heading: {
    marginBottom: 6,
    color: "rgba(255,255,255,0.75)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  col: {
    gap: 6,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 6,
  },
  teamName: {
    flexShrink: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.85)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  fanSince: {
    flexShrink: 0,
    color: "rgba(255,255,255,0.65)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  playersGrid: {
    flexDirection: "row",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 6,
  },
  playerNamesCol: {
    flexShrink: 1,
    minWidth: 0,
    gap: 6,
  },
  playerBadgesCol: {
    flexShrink: 0,
    gap: 6,
  },
  playerNameCell: {
    height: PLAYER_ROW_H,
    justifyContent: "center",
  },
  playerBadgeCell: {
    height: PLAYER_ROW_H,
    justifyContent: "center",
  },
  playerName: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
});
