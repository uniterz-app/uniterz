import { Image, StyleSheet, View } from "react-native";
import { teamIdToCountryName } from "../../../../../lib/wc/wcCountry";
import { flagImageUriFromIso2, wcFlagImageUri } from "./wcFlagImageUri";

export type CountryFlagVariant =
  | "card"
  | "preview"
  | "nextModal"
  | "inline"
  | "result";

/** Web `MatchCard` / `PredictNextGameModal` の国旗枠サイズに合わせた 4:3 系 */
const VARIANT_SIZE: Record<CountryFlagVariant, { width: number; height: number }> =
  {
    card: { width: 72, height: 48 },
    preview: { width: 88, height: 59 },
    nextModal: { width: 53, height: 36 },
    /** リザルト得点者予想行（Web `CountryFlag variant=inline`） */
    inline: { width: 17, height: 12 },
    /** リザルト一覧（Web `ResultCard` mobileScheduleDense `h-[2.8rem] w-[3.8rem]`） */
    result: { width: 61, height: 45 },
  };

type CountryFlagNativeProps = {
  teamId?: string | null;
  iso2?: string | null;
  variant?: CountryFlagVariant;
  accessibilityLabel?: string;
};

/** WC 試合カード・予想モーダル用の国旗（Web `CountryFlag` 相当） */
export default function CountryFlagNative({
  teamId,
  iso2,
  variant = "card",
  accessibilityLabel,
}: CountryFlagNativeProps) {
  const { width, height } = VARIANT_SIZE[variant];
  const uri = iso2 ? flagImageUriFromIso2(iso2) : wcFlagImageUri(teamId);
  const countryName =
    accessibilityLabel ?? teamIdToCountryName(teamId, "en") ?? "Country flag";

  if (!uri) {
    return (
      <View
        style={[styles.placeholder, { width, height }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View style={[styles.outer, { width, height }]}>
      <Image
        source={{ uri }}
        style={{ width, height }}
        resizeMode="cover"
        accessibilityLabel={countryName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.42,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholder: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
  },
});
