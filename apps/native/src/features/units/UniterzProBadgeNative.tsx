/** Web `UniterzProBadge` 相当 — 選んだ生成画像の PRO タグ */
import { Image, View } from "react-native";
import {
  UNITERZ_PRO_BADGE_ASSET,
  UNITERZ_PRO_BADGE_GOLD,
} from "@/lib/units/uniterzProBadge";

const BADGE = require("../../../assets/brand/uniterz-pro-badge.png");

type Props = {
  height?: number;
  color?: string;
  tone?: "plain" | "gold";
};

export default function UniterzProBadgeNative({
  height = 18,
  color = "#ffffff",
  tone = "plain",
}: Props) {
  const width = height * UNITERZ_PRO_BADGE_ASSET.aspectRatio;
  const tint = tone === "gold" ? UNITERZ_PRO_BADGE_GOLD.mid : color;

  return (
    <View
      accessibilityLabel="PRO"
      accessibilityRole="image"
      style={{ width, height }}
    >
      <Image
        source={BADGE}
        style={{ width, height, tintColor: tint }}
        resizeMode="contain"
      />
    </View>
  );
}
