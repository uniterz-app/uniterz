/** Web `/mobile/player-stats-preview` 相当 (mock) */
import { StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaLeaguePlayerStatLeadersPanelNative from "./NbaLeaguePlayerStatLeadersPanelNative";
import NbaStatsSearchBarNative from "../stats/NbaStatsSearchBarNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSelectPlayer?: (playerId: string) => void;
};

export default function PlayerStatsPreviewScreenNative({
  language,
  onClose,
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  return (
    <MobilePageShell
      title={isJa ? "PLAYER STATS" : "PLAYER STATS"}
      eyebrow="STATS"
      subtitle={
        isJa
          ? "指標トップリーダー（モック）"
          : "Stat leaderboards (mock)."
      }
      appBackground
      onClose={onClose}
    >
      <View style={styles.search}>
        <NbaStatsSearchBarNative
          kind="player"
          language={language}
          onSelect={(hit) => onSelectPlayer?.(hit.id)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <NbaLeaguePlayerStatLeadersPanelNative
          language={language}
          onSelectPlayer={onSelectPlayer}
        />
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  search: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 20,
  },
});
