/**
 * Web `ProCyberBadge` 相当 — 選んだ UNITERZ PRO タグ。
 */
import { View } from "react-native";
import UniterzProBadgeNative from "../../units/UniterzProBadgeNative";

type Props = {
  /** プロフィールカード用 — 一段大 */
  premium?: boolean;
  /** マイランクカード — compact より少しだけ大きく */
  emphasized?: boolean;
  compact?: boolean;
};

export default function ProCyberBadgeNative({
  premium = false,
  emphasized = false,
  compact = false,
}: Props) {
  const markHeight = premium ? 22 : emphasized ? 20 : compact ? 16 : 18;

  return (
    <View style={{ transform: [{ translateY: -2 }] }}>
      <UniterzProBadgeNative height={markHeight} tone="gold" />
    </View>
  );
}
