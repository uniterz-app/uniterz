/** Web `/mobile/player-stats-preview` 相当 (mock) */
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaLeaguePlayerStatLeadersPanelNative from "./NbaLeaguePlayerStatLeadersPanelNative";

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
      title={isJa ? "リーグ Player Stats" : "League Player Stats"}
      eyebrow="STATS"
      subtitle={
        isJa
          ? "指標トップリーダー（モック）"
          : "Stat leaderboards (mock)."
      }
      appBackground
      onClose={onClose}
    >
      <NbaLeaguePlayerStatLeadersPanelNative
        language={language}
        onSelectPlayer={onSelectPlayer}
      />
    </MobilePageShell>
  );
}
