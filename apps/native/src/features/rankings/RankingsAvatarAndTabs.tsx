import { Image, Text, View, type ImageStyle, type ViewStyle } from "react-native";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

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
  const initial = (label.trim().charAt(0) || "?").toUpperCase();
  const radius = square ? 4 : size / 2;
  const boxStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };
  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };
  return (
    <View style={[styles.avatarWrap, boxStyle, square && styles.avatarSquare]}>
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={imageStyle} />
      ) : (
        <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
      )}
    </View>
  );
}

export function RankingsCategoryTabsNative({
  category,
  onChange,
  language,
}: {
  category: "playoffs" | "bracket";
  onChange: (value: "playoffs" | "bracket") => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const items = [
    { key: "playoffs" as const, label: t.playoffs },
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
