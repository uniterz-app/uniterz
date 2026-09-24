/** Player Detail（Games スタック · STATS/チーム詳細/予想から） */
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaPlayerDetailPanelNative from "./NbaPlayerDetailPanelNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  playerId?: string;
  /** Profile DEV メニュー。シードモックで SHOT CHART を表示 */
  useDevMock?: boolean;
};

export default function PlayerDetailPreviewScreenNative({
  language,
  onClose,
  playerId,
  useDevMock = false,
}: Props) {
  const isJa = language === "ja";
  return (
    <MobilePageShell
      title={isJa ? "Player Detail" : "Player Detail"}
      eyebrow={useDevMock ? "DEV" : "STATS"}
      subtitle={
        useDevMock
          ? isJa
            ? "モック · ショットチャート確認"
            : "Mock · shot chart preview"
          : isJa
            ? "シーズン · 試合ログ · 契約 · ショット"
            : "Season · game logs · contract · shot chart"
      }
      appBackground
      edgeBack
      onClose={onClose}
    >
      <NbaPlayerDetailPanelNative
        language={language}
        playerId={playerId}
        useDevMock={useDevMock}
      />
    </MobilePageShell>
  );
}
