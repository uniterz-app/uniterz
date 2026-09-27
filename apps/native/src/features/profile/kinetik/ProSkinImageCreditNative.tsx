/**
 * Web `ProfilePlanProSkinPicker` オーバーレイの画像クレジット行 相当
 */
import { Linking, StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import {
  formatProSkinImageCreditLine,
  proSkinImageCredit,
  proSkinImageLicenseUrl,
} from "../../../../../../lib/profile/proSkinImageCredits";

type Props = {
  variant: string;
  language: string;
  style?: StyleProp<TextStyle>;
};

export default function ProSkinImageCreditNative({
  variant,
  language,
  style,
}: Props) {
  const credit = proSkinImageCredit(variant);
  if (!credit) return null;
  const licenseUrl = proSkinImageLicenseUrl(credit);
  return (
    <Text style={[styles.line, style]}>
      <Text
        onPress={() => void Linking.openURL(credit.sourceUrl)}
        accessibilityRole="link"
      >
        {formatProSkinImageCreditLine(credit, language)}
      </Text>
      {licenseUrl ? (
        <>
          {" "}
          <Text
            style={styles.link}
            onPress={() => void Linking.openURL(licenseUrl)}
            accessibilityRole="link"
          >
            (license)
          </Text>
        </>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: 9,
    lineHeight: 13,
    textAlign: "center",
    color: "rgba(255,255,255,0.38)",
  },
  link: {
    textDecorationLine: "underline",
  },
});
