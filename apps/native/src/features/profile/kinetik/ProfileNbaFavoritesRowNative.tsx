/**
 * Web `ProfileNbaFavoritesRow` 相当 — チーム1・選手1・横並び。
 * FAVORITES 見出しは中央。
 */
import { StyleSheet, Text, View } from "react-native";
import {
  formatNbaFanSinceInline,
  formatNbaFavoritePlayerInitialLast,
  type NbaFavorites,
} from "../../../../../../lib/profile/nbaFavorites";
import {
  compactNbaCardNickname,
  getNbaTeamNicknameById,
} from "../../../../../../lib/nba-team-names";
import TeamAbbrBadgeNative from "../../games/TeamAbbrBadgeNative";

const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

type Props = {
  favorites: NbaFavorites;
  language?: "ja" | "en";
};

export default function ProfileNbaFavoritesRowNative({
  favorites,
  language = "ja",
}: Props) {
  const teamId = favorites.favoriteNbaTeamId;
  const player = favorites.favoriteNbaPlayers[0] ?? null;
  if (!teamId && !player) return null;

  const fanSince = formatNbaFanSinceInline(
    favorites.favoriteNbaTeamFanSinceSeason,
    language
  );
  const teamLabel = teamId
    ? compactNbaCardNickname(getNbaTeamNicknameById(teamId), teamId)
    : "";

  return (
    <View style={styles.wrap} accessibilityLabel="Favorites">
      <Text style={styles.heading}>FAVORITES</Text>
      <View style={styles.row}>
        {teamId ? (
          <View style={styles.teamCluster}>
            <Text style={styles.teamName} numberOfLines={1}>
              {teamLabel}
            </Text>
            {fanSince ? (
              <Text style={styles.fanSince} numberOfLines={1}>
                {fanSince}
              </Text>
            ) : null}
          </View>
        ) : null}
        {teamId && player ? <Text style={styles.dot}>·</Text> : null}
        {player ? (
          <View style={styles.playerCluster}>
            <Text style={styles.playerName} numberOfLines={1}>
              {formatNbaFavoritePlayerInitialLast(player.displayName)}
            </Text>
            {player.teamId ? (
              <TeamAbbrBadgeNative teamId={player.teamId} />
            ) : null}
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
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
    transform: [{ skewX: "-8deg" }],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    maxWidth: "100%",
  },
  teamCluster: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "48%",
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
  dot: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    flexShrink: 0,
  },
  playerCluster: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "48%",
    gap: 6,
  },
  playerName: {
    flexShrink: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.85)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
});
