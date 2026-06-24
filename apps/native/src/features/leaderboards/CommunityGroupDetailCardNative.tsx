/** グループ詳細の共通シェル — 「一覧へ」＋カード枠＋中身 */
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { COMMUNITY_GROUP_HERO_BG } from "../../../../../lib/communities/communityGroupHeroLayout";
import { COMMUNITY_GROUP_DETAIL_CARD_RADIUS } from "../../../../../lib/communities/communityGroupShell";
import CommunityGroupListBackHeaderNative from "./CommunityGroupListBackHeaderNative";

type Props = {
  language: Language;
  onBack: () => void;
  children: ReactNode;
  style?: ViewStyle;
};

export default function CommunityGroupDetailCardNative({
  language,
  onBack,
  children,
  style,
}: Props) {
  return (
    <View style={[styles.card, style]}>
      <CommunityGroupListBackHeaderNative language={language} onPress={onBack} />
      {children}
    </View>
  );
}

/** Modal 内 safe area — insets.top が 0 のときの下限 */
export function communityGroupOverlayTopInset(top: number): number {
  const fallback = Platform.OS === "ios" ? 47 : 24;
  return Math.max(top, fallback);
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
    borderRadius: COMMUNITY_GROUP_DETAIL_CARD_RADIUS,
    overflow: "hidden",
  },
});
