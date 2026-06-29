/** Web `WcBracketUserCard` 相当 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import type { Language } from "@/lib/i18n/language";
import CountryFlagNative from "../../CountryFlagNative";
import { RankingsAvatarNative } from "../../../rankings/RankingsUiParts";
import { colors, fonts } from "../../../../theme/tokens";

type Props = {
  row: WcBracketLeaderboardRow;
  language?: Language;
  onPress?: () => void;
  onEditPress?: () => void;
};

function statusLabel(row: WcBracketLeaderboardRow) {
  if (row.alive) return "ALIVE";
  if (row.firstMissMatchId) return `OUT ${row.firstMissMatchId}`;
  return "OUT";
}

export default function WcBracketUserCardNative({
  row,
  language = "ja",
  onPress,
  onEditPress,
}: Props) {
  const isPro = row.plan === "pro";
  const displayName = row.displayName || "User";
  const handle = row.handle ?? null;
  const championTeamId =
    row.championTeamId?.trim() || row.championPick?.trim() || null;
  const interactive = Boolean(onPress || onEditPress);

  const mainBody = (
    <>
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          {isPro ? (
            <>
              <View style={styles.proRingOuter} />
              <View style={styles.proRingInner} />
            </>
          ) : null}
          <RankingsAvatarNative
            photoURL={row.photoURL}
            label={displayName}
            size={36}
          />
        </View>

        <View style={styles.nameCol}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            {isPro ? <Text style={styles.proBadge}>PRO</Text> : null}
          </View>
          {handle ? (
            <Text style={styles.handle} numberOfLines={1}>
              @{handle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.championCol}>
        <MaterialCommunityIcons
          name="trophy"
          size={16}
          color="rgba(251,191,36,0.85)"
        />
        {championTeamId ? (
          <CountryFlagNative
            teamId={championTeamId}
            variant="bracketCardChampion"
          />
        ) : (
          <View style={styles.championPlaceholder}>
            <Text style={styles.championPlaceholderText}>—</Text>
          </View>
        )}
      </View>
    </>
  );

  const statusBlock = (
    <View style={styles.statusCol}>
      <Text style={[styles.status, row.alive && styles.statusAlive]}>
        {statusLabel(row)}
      </Text>
      {onEditPress ? (
        <Pressable
          onPress={onEditPress}
          accessibilityRole="button"
          accessibilityLabel={
            language === "ja" ? "ブラケットを編集" : "Edit bracket"
          }
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={14}
            color="rgba(165,243,252,0.9)"
          />
        </Pressable>
      ) : null}
    </View>
  );

  const content = (
    <View style={styles.rowInner}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.mainPress,
            pressed && styles.pressed,
          ]}
        >
          {mainBody}
        </Pressable>
      ) : (
        <View style={styles.mainPress}>{mainBody}</View>
      )}
      {statusBlock}
    </View>
  );

  return (
    <View
      style={[
        styles.shell,
        !row.alive && styles.shellOut,
        interactive && styles.shellInteractive,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1.5,
    borderColor: "#00f5ff",
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#00f5ff",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  shellOut: {
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "#050505",
    shadowColor: "#ffffff",
    shadowOpacity: 0.04,
  },
  shellInteractive: {
    opacity: 1,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  mainPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarWrap: {
    position: "relative",
    width: 36,
    height: 36,
  },
  proRingOuter: {
    position: "absolute",
    inset: -3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
  },
  proRingInner: {
    position: "absolute",
    inset: -1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  displayName: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  proBadge: {
    color: "rgba(252,211,77,0.95)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: fonts.metric,
  },
  handle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  championCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  championPlaceholder: {
    width: 40,
    height: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  championPlaceholderText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  status: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  statusAlive: {
    color: "#00F5FF",
  },
  editBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.08)",
  },
});
