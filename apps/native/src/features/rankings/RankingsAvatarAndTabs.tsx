import { Image, Pressable, Text, View } from "react-native";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

export function RankingsAvatarNative({
  photoURL,
  label,
  size = 40,
}: {
  photoURL?: string | null;
  label: string;
  size?: number;
}) {
  const initial = (label.trim().charAt(0) || "?").toUpperCase();
  return (
    <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
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
    <View style={styles.tabGrid2}>
      {items.map((item) => {
        const active = category === item.key;
        return (
          <Pressable
            key={item.key}
            style={[styles.tabChip, active && styles.tabChipActive]}
            onPress={() => onChange(item.key)}
          >
            <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
    <View style={styles.tabGrid5}>
      {items.map((item) => {
        const active = round === item.key;
        return (
          <Pressable
            key={item.key}
            style={[styles.roundChip, active && styles.tabChipActive]}
            onPress={() => onChange(item.key)}
          >
            <Text style={[styles.roundChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
