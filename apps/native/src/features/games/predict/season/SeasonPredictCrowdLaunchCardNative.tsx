/** Web `SeasonPredictCrowdLaunchCard` 相当 — 締切前「みんなの予想」解放のお知らせ */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "../../../../theme/tokens";
import { JP_600, JP_700 } from "../../../profile/reports/reportThemeNative";
import UniterzLogoNative from "../../../profile/UniterzLogoNative";
import {
  seasonPredictCrowdLaunchCopy,
  type SeasonPredictCrowdLaunchVariant,
} from "../../../../../../../lib/predict/seasonPredictCrowdLaunch";

type Props = {
  variant: SeasonPredictCrowdLaunchVariant | null;
  language?: string | null;
  onPrimary: () => void;
  onClose: () => void;
};

export default function SeasonPredictCrowdLaunchCardNative({
  variant,
  language,
  onPrimary,
  onClose,
}: Props) {
  const copy = variant ? seasonPredictCrowdLaunchCopy(language, variant) : null;

  return (
    <Modal
      visible={variant != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        {copy ? (
          <View style={styles.card} accessibilityViewIsModal>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <View style={styles.logo}>
              <UniterzLogoNative width={92} />
            </View>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.primary}
              onPress={onPrimary}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryText}>{copy.primary}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.later}
              onPress={onClose}
              style={styles.laterBtn}
            >
              <Text style={styles.laterText}>{copy.later}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const CYBER_CYAN = "#00F5FF";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    backgroundColor: "#07090d",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  eyebrow: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#ffe9a8",
    textAlign: "center",
  },
  logo: {
    marginTop: 10,
    alignItems: "center",
  },
  title: {
    marginTop: 12,
    fontFamily: JP_700,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
  },
  body: {
    marginTop: 10,
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    color: "rgba(226,246,255,0.75)",
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 20,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: CYBER_CYAN,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    fontFamily: JP_700,
    fontSize: 14,
    fontWeight: "800",
    color: "#041018",
  },
  laterBtn: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  laterText: {
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
