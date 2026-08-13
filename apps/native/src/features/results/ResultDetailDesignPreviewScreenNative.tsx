/**
 * __DEV__ リザルト詳細プレビュー。本番と同じ `ResultDetailBodyNative` を使う。
 */
import { ScrollView } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { buildResultDetailDesignPreviewView } from "./resultDetailDesignPreviewMock";
import ResultDetailBodyNative from "./ResultDetailBodyNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onOpenProfile?: (handle: string) => void;
};

export default function ResultDetailDesignPreviewScreenNative({
  language,
  onClose,
  onOpenProfile,
}: Props) {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const ja = language === "ja";
  const view = buildResultDetailDesignPreviewView();

  return (
    <MobilePageShell
      title={ja ? "リザルト詳細" : "Result Detail"}
      eyebrow="PREVIEW"
      subtitle={
        ja
          ? "この試合 · 最多得点者の円グラフ付き"
          : "This match · top scorer donut"
      }
      appBackground
      edgeBack
      onClose={onClose}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomContentReserveY + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ResultDetailBodyNative
          language={language}
          view={view}
          onOpenProfile={onOpenProfile}
        />
      </ScrollView>
    </MobilePageShell>
  );
}
