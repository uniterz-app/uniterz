/** Player Detail 叩き台プレビュー */
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
      eyebrow="PREVIEW"
      subtitle={
        isJa
          ? "叩き台 · シーズン / 試合ログ / 契約"
          : "Draft · season / game logs / contract"
      }
      appBackground
      edgeBack
      onClose={onClose}
    >
      <NbaPlayerDetailPanelNative language={language} playerId={playerId} />
    </MobilePageShell>
  );
}
