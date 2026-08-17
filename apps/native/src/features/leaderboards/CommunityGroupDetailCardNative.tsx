/** グループ詳細の共通シェル — カード枠＋中身（戻りは右端 BACK タブ） */
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { COMMUNITY_GROUP_HERO_BG } from "../../../../../lib/communities/communityGroupHeroLayout";
import { COMMUNITY_GROUP_DETAIL_CARD_RADIUS } from "../../../../../lib/communities/communityGroupShell";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function CommunityGroupDetailCardNative({
  children,
  style,
}: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
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
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.16)",
  },
});
