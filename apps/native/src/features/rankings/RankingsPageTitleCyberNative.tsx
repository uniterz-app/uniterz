import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { PRO_LEAGUE_ATMOSPHERE } from "../../../../../lib/rankings/proLeagueAtmosphere";
import { RANKING_TITLE_FONT } from "./rankingsUiTheme";

type Props = {
  title: string;
  /** ヘッダー内埋め込み（flex 拡張しない） */
  embedded?: boolean;
  /** Web `size` — sm ≈ 22 / md ≈ 26。未指定は従来の 18（ランキング見出し） */
  size?: "sm" | "md";
  /** Web `tone` — PRO LEAGUE は紫金 */
  tone?: "default" | "pro-league";
  style?: StyleProp<ViewStyle>;
};

/** Web `RankingsPageTitleCyber` horizon-chrome の簡易ネイティブ版 */
export function RankingsPageTitleCyberNative({
  title,
  embedded = false,
  size,
  tone = "default",
  style,
}: Props) {
  const fontSize = size === "md" ? 26 : size === "sm" ? 24 : 18;
  const pro = tone === "pro-league";
  return (
    <View
      style={[styles.wrap, embedded && styles.wrapEmbedded, style]}
      accessibilityRole="header"
    >
      <Text
        style={[
          styles.title,
          pro ? styles.titlePro : null,
          { fontSize, paddingRight: Math.round(fontSize * 0.28) },
        ]}
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    transform: [{ skewX: "-10deg" }],
  },
  wrapEmbedded: {
    flex: 0,
    minHeight: 0,
    alignSelf: "center",
  },
  title: {
    fontFamily: RANKING_TITLE_FONT,
    letterSpacing: 5,
    textAlign: "center",
    color: "#BFF8FF",
    /** 大きい radius は矩形ハローになりやすいので弱く短く */
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(34,211,238,0.35)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
      },
      android: {
        textShadowColor: "rgba(34,211,238,0.28)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
      },
      default: {},
    }),
  },
  titlePro: {
    color: PRO_LEAGUE_ATMOSPHERE.titleNative,
    ...Platform.select({
      ios: {
        textShadowColor: PRO_LEAGUE_ATMOSPHERE.titleNativeShadow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
      android: {
        textShadowColor: PRO_LEAGUE_ATMOSPHERE.titleNativeShadow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
      },
      default: {},
    }),
  },
});
