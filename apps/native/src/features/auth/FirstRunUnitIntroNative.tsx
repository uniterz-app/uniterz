/** 登録直後の 1 枚（通知の確認より前）。UNIT の流れを 3 行で伝える。 */
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import PredictOverlayChamferedFrameNative from "../games/PredictOverlayChamferedFrameNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../games/matchListCyberClipPath";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../ui/ModalActionButtonNative";
import { unitIntroCopy } from "../../../../../lib/onboarding/unitIntroCopy";

type Props = {
  visible: boolean;
  language: string;
  onNext: () => void;
};

export default function FirstRunUnitIntroNative({ visible, language, onNext }: Props) {
  const c = unitIntroCopy(language);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNext}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />

        <View style={styles.cardWrap}>
          <PredictOverlayChamferedFrameNative
            cut={PREDICT_OVERLAY_CYBER_FORM_CUT}
            gradientColors={["#000000", "#000000"]}
            gradientLocations={[0, 1]}
            borderColor="rgba(0,245,255,0.28)"
            shadowColor="#00f5ff"
            shadowOpacity={0.1}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>

            <Text style={styles.title}>{c.introTitle}</Text>

            <View style={styles.list}>
              {c.introLines.map((line, i) => (
                <View key={i} style={styles.line}>
                  <Text style={styles.num}>{i + 1}</Text>
                  <Text style={styles.lineText}>{line}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative label={c.introNext} tone="primary" onPress={onNext} />
              </ModalActionRowNative>
            </View>
          </PredictOverlayChamferedFrameNative>
        </View>
      </View>
    </Modal>
  );
}

const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    width: "100%",
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 52,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  list: {
    marginTop: 14,
    gap: 12,
  },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  num: {
    width: 18,
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,245,255,0.95)",
    textAlign: "center",
  },
  lineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(226,232,240,0.95)",
  },
  actions: {
    marginTop: 18,
    width: "100%",
  },
});
