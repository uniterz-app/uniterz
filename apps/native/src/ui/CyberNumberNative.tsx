/**
 * Web `CyberNumber` 相当 — Alfa Slab One。
 * Native の textShadow は矩形に化けやすいので、ごく弱いグローに抑える。
 * suffix（pts）は小さめ・シアン固定。本体は color で上書き可。
 */
import {
  Platform,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { RANKING_SCORE_FONT } from "../features/rankings/rankingsUiTheme";

export const CYBER_NUMBER_COLORS = {
  main: "#22D3EE",
  highlight: "#C8F7FF",
  glow: "#008CFF",
  background: "#020609",
  /** pts など単位ラベル（常にシアン） */
  suffix: "#22D3EE",
} as const;

type SizeToken = "sm" | "md" | "lg";

const SIZE_PX: Record<SizeToken, number> = {
  sm: 15,
  md: 20,
  lg: 28,
};

const SKEW = [{ skewX: "-10deg" as const }, { scaleX: 0.96 }];

export type CyberNumberNativeProps = {
  value: number | string;
  size?: SizeToken | number;
  glowIntensity?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  /** 数字本体の右上に小さく置く記号（例: "+"）。prefix とは別 */
  cornerSign?: string;
  format?: boolean;
  /** 本体数字の色（順位パレットなど） */
  color?: string;
};

function resolveBody(
  value: number | string,
  prefix: string,
  format: boolean
): string {
  if (typeof value === "number") {
    const body = format
      ? Math.round(value).toLocaleString("en-US")
      : String(Math.round(value));
    return `${prefix}${body}`;
  }
  return `${prefix}${value}`;
}

/** 金色など不透明色でも矩形グローにならないよう、弱い半透明シャドウだけ使う */
function softShadow(
  color: string,
  intensity: number
): {
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
} | Record<string, never> {
  if (intensity <= 0.05) return {};
  // Android は textShadow が矩形になりやすいので無効化
  if (Platform.OS === "android") return {};
  const alpha = Math.min(0.35, 0.18 + intensity * 0.12);
  return {
    textShadowColor:
      color.startsWith("rgba") || color.startsWith("rgb")
        ? color
        : color.length === 7
          ? `${color}${Math.round(alpha * 255)
              .toString(16)
              .padStart(2, "0")}`
          : `rgba(255,255,255,${alpha})`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1.5 + intensity * 1.5,
  };
}

/** Web `CyberNumber` 相当 */
export default function CyberNumberNative({
  value,
  size = "md",
  glowIntensity = 0.72,
  style,
  prefix = "",
  suffix = "",
  cornerSign = "",
  format = true,
  color,
}: CyberNumberNativeProps) {
  const body = resolveBody(value, prefix, format);
  const fontSize = typeof size === "number" ? size : SIZE_PX[size];
  const intensity = Math.min(1, Math.max(0, glowIntensity));
  const lineHeight = Math.round(fontSize * 1.35);
  const suffixSize = Math.max(9, Math.round(fontSize * 0.58));
  const cornerSize = Math.max(8, Math.round(fontSize * 0.58));
  const bodyColor = color ?? CYBER_NUMBER_COLORS.main;

  const weight = Platform.select({
    ios: { fontWeight: "400" as const },
    android: { fontWeight: "400" as const },
    default: {},
  });

  const bodyStyle = [
    {
      fontFamily: RANKING_SCORE_FONT,
      fontSize,
      lineHeight,
      letterSpacing: 0.4,
      fontVariant: ["tabular-nums" as const],
      textAlign: "right" as const,
      includeFontPadding: false,
      color: bodyColor,
      transform: SKEW,
      ...softShadow(bodyColor, intensity * 0.55),
      ...weight,
    },
    style,
  ];

  // cornerSign あり: View で数字右上に記号。suffix は別 Text（字体は明示指定）
  if (cornerSign) {
    return (
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <View style={{ position: "relative", paddingRight: Math.round(cornerSize * 0.55) }}>
          <Text style={bodyStyle} maxFontSizeMultiplier={1.1}>
            {body}
          </Text>
          <Text
            aria-hidden
            style={{
              position: "absolute",
              top: -Math.round(fontSize * 0.28),
              right: 0,
              fontFamily: RANKING_SCORE_FONT,
              fontSize: cornerSize,
              lineHeight: cornerSize,
              color: bodyColor,
              includeFontPadding: false,
              ...softShadow(bodyColor, intensity * 0.55),
              ...weight,
            }}
            maxFontSizeMultiplier={1.1}
          >
            {cornerSign}
          </Text>
        </View>
        {suffix ? (
          <Text
            style={{
              fontFamily: RANKING_SCORE_FONT,
              fontSize: suffixSize,
              lineHeight: Math.round(suffixSize * 1.35),
              letterSpacing: 0.5,
              color: CYBER_NUMBER_COLORS.suffix,
              includeFontPadding: false,
              transform: SKEW,
              ...weight,
            }}
            maxFontSizeMultiplier={1.1}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    );
  }

  // ネスト Text で字体を継承（分離 Text だと suffix がフォールバック字体になる端末がある）
  return (
    <Text style={bodyStyle} maxFontSizeMultiplier={1.1}>
      {body}
      {suffix ? (
        <Text
          style={{
            fontFamily: RANKING_SCORE_FONT,
            fontSize: suffixSize,
            lineHeight: Math.round(suffixSize * 1.35),
            letterSpacing: 0.5,
            color: CYBER_NUMBER_COLORS.suffix,
            includeFontPadding: false,
            ...weight,
          }}
          maxFontSizeMultiplier={1.1}
        >
          {suffix}
        </Text>
      ) : null}
    </Text>
  );
}
