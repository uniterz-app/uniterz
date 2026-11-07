/**
 * Web `ProfileNbaFavoritesRow` 相当 — チーム1・選手は無料1 / Pro 3。
 * 選手1人までは横1行、2人以上は1行目チーム・2行目選手。FAVORITES 見出しは中央。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Fragment } from "react";
import {
  formatNbaFanSinceInline,
  formatNbaFavoritePlayerInitialLast,
  type NbaFavoritePlayer,
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

/** Games / Result / Rankings / Leaderboards / Profile の各スタックに同名で登録済み */
type FavoritesDetailParamList = {
  TeamDetailPreview: { teamId?: string } | undefined;
  PlayerDetailPreview: { playerId?: string } | undefined;
};

export default function ProfileNbaFavoritesRowNative({
  favorites,
  language = "ja",
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<FavoritesDetailParamList>>();
  const teamId = favorites.favoriteNbaTeamId;
  const players = favorites.favoriteNbaPlayers;
  if (!teamId && players.length === 0) return null;

  const fanSince = formatNbaFanSinceInline(
    favorites.favoriteNbaTeamFanSinceSeason,
    language
  );
  const teamLabel = teamId
    ? compactNbaCardNickname(getNbaTeamNicknameById(teamId), teamId)
    : "";

  const team = teamId ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={teamLabel}
      hitSlop={8}
      onPress={() => navigation.navigate("TeamDetailPreview", { teamId })}
      style={({ pressed }) => [
        styles.teamCluster,
        players.length > 1 ? styles.teamClusterAlone : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.teamName} numberOfLines={1}>
        {teamLabel}
      </Text>
      {fanSince ? (
        <Text style={styles.fanSince} numberOfLines={1}>
          {fanSince}
        </Text>
      ) : null}
    </Pressable>
  ) : null;

  const renderPlayer = (player: NbaFavoritePlayer, maxWidth: `${number}%`) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={player.displayName}
      hitSlop={8}
      onPress={() =>
        navigation.navigate("PlayerDetailPreview", {
          playerId: player.playerId,
        })
      }
      style={({ pressed }) => [
        styles.playerCluster,
        { maxWidth },
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.playerName} numberOfLines={1}>
        {formatNbaFavoritePlayerInitialLast(player.displayName)}
      </Text>
      {player.teamId ? <TeamAbbrBadgeNative teamId={player.teamId} /> : null}
    </Pressable>
  );

  if (players.length <= 1) {
    const player = players[0] ?? null;
    return (
      <View style={styles.wrap} accessibilityLabel="Favorites">
        <Text style={styles.heading}>FAVORITES</Text>
        <View style={styles.row}>
          {team}
          {team && player ? <Text style={styles.dot}>·</Text> : null}
          {player ? renderPlayer(player, "48%") : null}
        </View>
      </View>
    );
  }

  const playerMaxWidth: `${number}%` = players.length >= 3 ? "31%" : "46%";
  return (
    <View style={styles.wrap} accessibilityLabel="Favorites">
      <Text style={styles.heading}>FAVORITES</Text>
      {team ? <View style={styles.row}>{team}</View> : null}
      <View style={[styles.row, team ? styles.playersRow : null]}>
        {players.map((p, i) => (
          <Fragment key={p.playerId}>
            {i > 0 ? <Text style={styles.dot}>·</Text> : null}
            {renderPlayer(p, playerMaxWidth)}
          </Fragment>
        ))}
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
  playersRow: {
    marginTop: 6,
    gap: 8,
  },
  teamCluster: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "48%",
    gap: 6,
  },
  teamClusterAlone: {
    maxWidth: "100%",
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
  pressed: {
    opacity: 0.6,
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
