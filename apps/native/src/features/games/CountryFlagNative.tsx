import { Image, StyleSheet, View } from "react-native";

export type CountryFlagVariant =
  | "card"
  | "preview"
  | "nextModal"
  | "inline"
  | "clubInline"
  | "fifaInline"
  | "overlay"
  | "result"
  | "bracketTree"
  | "bracketCardChampion"
  | "bracketChampion";

const VARIANT_SIZE: Record<CountryFlagVariant, { width: number; height: number }> =
  {
    card: { width: 72, height: 48 },
    preview: { width: 88, height: 59 },
    nextModal: { width: 53, height: 36 },
    overlay: { width: 72, height: 48 },
    inline: { width: 24, height: 18 },
    clubInline: { width: 14, height: 11 },
    fifaInline: { width: 32, height: 24 },
    result: { width: 67, height: 48 },
    bracketTree: { width: 54, height: 40 },
    bracketCardChampion: { width: 40, height: 28 },
    bracketChampion: { width: 134, height: 90 },
  };

type CountryFlagNativeProps = {
  teamId?: string | null;
  iso2?: string | null;
  variant?: CountryFlagVariant;
  accessibilityLabel?: string;
};

/** Legacy WC flag slot — NBA-only ではプレースホルダのみ */
export default function CountryFlagNative({
  variant = "card",
}: CountryFlagNativeProps) {
  const { width, height } = VARIANT_SIZE[variant];
  const borderRadius = 6;
  return (
    <View
      style={[styles.placeholder, { width, height, borderRadius }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
  },
});
