/** Team Detail（Games スタック · STATS/順位表/予想から） */
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
      eyebrow="GAMES"
      subtitle={
        isJa
          ? "成績 · 指標 · ロスター · ペイロール"
          : "Record · metrics · roster · payroll"
      }
      appBackground
      edgeBack
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
