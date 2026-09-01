/** Player Detail（Games スタック · STATS/チーム詳細/予想から） */
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaPlayerDetailPanelNative from "./NbaPlayerDetailPanelNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  playerId?: string;
};

export default function PlayerDetailPreviewScreenNative({
  language,
  onClose,
  playerId,
}: Props) {
  const isJa = language === "ja";
  return (
    <MobilePageShell
      title={isJa ? "Player Detail" : "Player Detail"}
      eyebrow="STATS"
      subtitle={
        isJa
          ? "シーズン · 試合ログ · 契約 · ショット"
          : "Season · game logs · contract · shot chart"
      }
      appBackground
      edgeBack
      onClose={onClose}
    >
      <NbaPlayerDetailPanelNative language={language} playerId={playerId} />
    </MobilePageShell>
  );
}
