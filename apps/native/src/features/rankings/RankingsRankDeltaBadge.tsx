import { Platform, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

/**
 * 順位変動（Unicode は OS で絵文字化しやすいので MCI の矢印＋数字のみ。枠で囲まない）
 * 色味は Web `RankDeltaBadge`（上: yellow-300 系、下: white/60 系）に寄せる
 */
export function RankDeltaBadgeNative({
  delta,
  size = "sm",
}: {
  delta?: number | null;
  /** 自分カード中央の大きい順位横は md */
  size?: "sm" | "md";
}) {
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
    return null;
  }
  const up = delta > 0;
  const amount = Math.abs(Math.trunc(delta));
  const isMd = size === "md";
  const iconSize = isMd ? 15 : 11;
  const fontSize = isMd ? 13 : 10;
  const iconColor = up ? "rgba(253,224,71,0.96)" : "rgba(226,232,240,0.72)";
  const textColor = up ? "rgba(253,224,71,0.96)" : "rgba(255,255,255,0.6)";

  return (
    <View
      style={[styles.rankDeltaInline, isMd && styles.rankDeltaInlineMd]}
      accessibilityRole="text"
      accessibilityLabel={up ? `順位アップ ${amount}` : `順位ダウン ${amount}`}
    >
      <MaterialCommunityIcons
        name={up ? "arrow-top-right" : "arrow-bottom-right"}
        size={iconSize}
        color={iconColor}
      />
      <Text
        style={[styles.rankDeltaInlineAmount, { fontSize, color: textColor }]}
        maxFontSizeMultiplier={1.2}
      >
        {amount}
      </Text>
    </View>
  );
}
