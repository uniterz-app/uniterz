/**
 * __DEV__ 下部ナビ見た目案ギャラリー。本番は未接続。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../features/profile/mobileScreens/MobilePageShell";
import { MATCH_CARD_METRIC_FONT } from "../features/games/matchCardTypography";
import { useBottomTabBarInsets } from "./useBottomTabBarInsets";
import {
  NAV_BAR_PREVIEW_GALLERY,
  NAV_BAR_PREVIEW_SECTIONS,
  NavBarPreviewBlock,
} from "./navBarDesignPreviewPatterns";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function NavBarDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();
  const { bottomContentReserveY } = useBottomTabBarInsets();

  return (
    <MobilePageShell
      title="NAV BAR"
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "下部ナビ 16 案。タップで選択状態を確認。本番は未反映。"
          : "16 bottom-nav proposals. Tap tabs to preview active. Not wired to production."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(28, bottomContentReserveY, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {ja
            ? "シンプル → 普通 → 今の浮遊 → 競技 HUD。アイコン構成は本番と同じ 5 タブ。"
            : "Simple → standard → current float → competitive HUD. Same 5 tabs as production."}
        </Text>
        {NAV_BAR_PREVIEW_SECTIONS.map((section) => {
          const items = NAV_BAR_PREVIEW_GALLERY.filter(
            (meta) => meta.category === section.category
          );
          return (
            <View key={section.category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {ja ? section.titleJa : section.titleEn}
              </Text>
              {items.map((meta) => (
                <NavBarPreviewBlock key={meta.id} meta={meta} ja={ja} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 18,
  },
  lead: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(79,247,244,0.78)",
  },
});
