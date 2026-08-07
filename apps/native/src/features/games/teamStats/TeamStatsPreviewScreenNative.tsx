/** Web `/mobile/team-stats-preview` 相当 */
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaLeagueTeamStatsPanelNative from "../teamStats/NbaLeagueTeamStatsPanelNative";

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
      <NbaLeagueTeamStatsPanelNative
        language={language}
        onSelectTeam={onSelectTeam}
      />
    </MobilePageShell>
  );
}
