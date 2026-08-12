/** Team Detail 再構築プレビュー */
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaTeamDetailPanelNative from "./NbaTeamDetailPanelNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  teamId?: string;
  onSelectPlayer?: (playerId: string) => void;
};

export default function TeamDetailPreviewScreenNative({
  language,
  onClose,
  teamId,
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  return (
    <MobilePageShell
      title={isJa ? "Team Detail" : "Team Detail"}
      eyebrow="PREVIEW"
      subtitle={
        isJa
          ? "再構築プレビュー · 指標リーグ順位つき"
          : "Rebuild preview · metrics with league ranks"
      }
      appBackground
      onClose={onClose}
    >
      <NbaTeamDetailPanelNative
        language={language}
        teamId={teamId}
        onSelectPlayer={onSelectPlayer}
      />
    </MobilePageShell>
  );
}
