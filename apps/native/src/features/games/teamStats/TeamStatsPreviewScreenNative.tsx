/** Web `/mobile/team-stats-preview` 相当 */
import { StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaLeagueTeamStatsPanelNative from "./NbaLeagueTeamStatsPanelNative";
import NbaStatsSearchBarNative from "../stats/NbaStatsSearchBarNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onSelectTeam: (teamId: string) => void;
};

export default function TeamStatsPreviewScreenNative({
  language,
  onClose,
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  return (
    <MobilePageShell
      title={isJa ? "TEAM STATS" : "TEAM STATS"}
      eyebrow="STATS"
      subtitle={
        isJa
          ? "共有 API から取得（未 seed 時はモック）。"
          : "Loaded via shared API (mock until seeded)."
      }
      appBackground
      onClose={onClose}
    >
      <View style={styles.search}>
        <NbaStatsSearchBarNative
          kind="team"
          language={language}
          onSelect={(hit) => onSelectTeam(hit.id)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <NbaLeagueTeamStatsPanelNative
          language={language}
          onSelectTeam={onSelectTeam}
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
