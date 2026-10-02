import { Image, View, type ImageStyle, type ViewStyle } from "react-native";
import Svg, { Circle, Polygon } from "react-native-svg";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

/** Web `KinetikAvatarGlyph` / プロフィール未設定アバターと同一 */
const GLYPH_ACCENT = "#ccff00";
const GLYPH_FILL = "rgba(204, 255, 0, 0.12)";

export function RankingsDefaultAvatarGlyphNative({ size }: { size: number }) {
  const glyphSize = Math.max(12, Math.round(size * 0.62));
  return (
    <View
      style={{
        width: glyphSize,
        height: glyphSize,
        alignItems: "center",
        justifyContent: "center",
        // Web `drop-shadow(0 0 4px rgba(204,255,0,0.36))` 相当
        shadowColor: "rgba(204, 255, 0, 0.36)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      }}
    >
      <Svg width={glyphSize} height={glyphSize} viewBox="0 0 40 40">
        <Polygon
          points="20,9 31.5,29 8.5,29"
          fill={GLYPH_FILL}
          stroke={GLYPH_ACCENT}
          strokeWidth={1.35}
        />
        <Circle cx={20} cy={21.5} r={2.8} fill={GLYPH_ACCENT} />
      </Svg>
    </View>
  );
}

export function RankingsAvatarNative({
  photoURL,
  label,
  size = 40,
  square = false,
}: {
  photoURL?: string | null;
  label: string;
  size?: number;
  square?: boolean;
}) {
  const uri = typeof photoURL === "string" ? photoURL.trim() : "";
  const radius = square ? 4 : size / 2;
  const boxStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    // Web `RankingsAvatarCircle` — square `#0a0c14` / circle `#0f2d35`
    backgroundColor: uri ? undefined : square ? "#0a0c14" : "#0f2d35",
  };
  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };
  return (
    <View
      accessibilityLabel={label}
      style={[styles.avatarWrap, boxStyle, square && styles.avatarSquare]}
    >
      {uri ? (
        <Image source={{ uri }} style={imageStyle} />
      ) : (
        <RankingsDefaultAvatarGlyphNative size={size} />
      )}
    </View>
  );
}

export function RankingsCategoryTabsNative({
  category,
  onChange,
  language,
  league = "nba",
}: {
  category: "playoffs" | "bracket";
  onChange: (value: "playoffs" | "bracket") => void;
  language: RankingsLanguage;
  league?: "nba" | "wc";
}) {
  const t = rankingsTexts(language);
  const playoffsLabel = league === "wc" ? t.worldCup : t.playoffs;
  const items = [
    { key: "playoffs" as const, label: playoffsLabel },
    { key: "bracket" as const, label: t.bracket },
  ];
  return (
    <CyberSlantedTabBarNative fill>
      {items.map((item) => {
        const active = category === item.key;
        return (
          <CyberSlantedTabNative
            key={item.key}
            label={item.label}
            active={active}
            fill
            onPress={() => onChange(item.key)}
          />
        );
      })}
    </CyberSlantedTabBarNative>
  );
}

export function PlayoffRoundTabsNative({
  round,
  onChange,
  language,
}: {
  round: PlayoffRoundKey;
  onChange: (round: PlayoffRoundKey) => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const items: Array<{ key: PlayoffRoundKey; label: string }> = [
    { key: "overall", label: t.roundTotal },
    { key: "r1", label: t.roundFirst },
    { key: "r2", label: t.roundSecond },
    { key: "cf", label: t.roundCF },
    { key: "finals", label: t.roundFinals },
  ];
  return (
    <CyberSlantedTabBarNative fill>
      {items.map((item) => {
        const active = round === item.key;
        return (
          <CyberSlantedTabNative
            key={item.key}
            label={item.label}
            active={active}
            fill
            compact
            onPress={() => onChange(item.key)}
          />
        );
      })}
    </CyberSlantedTabBarNative>
  );
}
