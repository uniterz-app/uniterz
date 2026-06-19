import { Image, StyleSheet, View } from "react-native";
import { teamIdToCountryName } from "../../../../../lib/wc/wcCountry";
import { flagImageUriFromIso2, wcFlagImageUri } from "./wcFlagImageUri";

export type CountryFlagVariant =
  | "card"
  | "preview"
  | "nextModal"
  | "inline"
  | "clubInline"
  | "fifaInline"
  | "overlay"
  | "result";

/** Web `MatchCard` / `PredictNextGameModal` の国旗枠サイズに合わせた 4:3 系 */
const VARIANT_SIZE: Record<CountryFlagVariant, { width: number; height: number }> =
  {
    card: { width: 72, height: 48 },
    preview: { width: 88, height: 59 },
    nextModal: { width: 53, height: 36 },
    /** Web `inPredictOverlay` WC 試合終了（`w-[4.5rem] h-[3rem]` dense 寄り） */
    overlay: { width: 72, height: 48 },
    /** Web `CountryFlag variant=inline` 既定（h-[1.125rem] w-[1.5rem]） */
    inline: { width: 24, height: 18 },
    /** Web WC キープレイヤーのクラブ国旗（w-[0.9rem]） */
    clubInline: { width: 14, height: 11 },
    /** Web WC FIFA ランクカードの国旗（h-[1.5rem] w-[2rem]） */
    fifaInline: { width: 32, height: 24 },
    /** リザルト詳細（Web `MobileResultMatchHeader` `h-[3rem] w-[4.2rem]`） */
    result: { width: 67, height: 48 },
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
  const borderRadius =
    variant === "inline" || variant === "clubInline"
      ? 1
      : variant === "fifaInline"
        ? 3
        : 6;
  const uri = iso2 ? flagImageUriFromIso2(iso2) : wcFlagImageUri(teamId);
  const countryName =
    accessibilityLabel ?? teamIdToCountryName(teamId, "en") ?? "Country flag";

  if (!uri) {
    return (
      <View
        style={[styles.placeholder, { width, height, borderRadius }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View style={[styles.outer, { width, height, borderRadius }]}>
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
