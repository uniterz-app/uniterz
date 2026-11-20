/** 初回の予想を投稿した直後の UNIT 案内。ランキングへの導線つき。 */
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import PredictOverlayChamferedFrameNative from "../games/PredictOverlayChamferedFrameNative";
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
  onRankings: () => void;
  onClose: () => void;
};

export default function FirstPostUnitModalNative({
  visible,
  language,
  onRankings,
  onClose,
}: Props) {
  const c = unitIntroCopy(language);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
            <Text style={styles.title}>{c.firstPostTitle}</Text>
            <Text style={styles.body}>{c.firstPostBody}</Text>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label={c.firstPostClose}
                  tone="ghost"
                  onPress={onClose}
                />
                <ModalActionButtonNative
                  label={c.firstPostCta}
                  tone="primary"
                  onPress={onRankings}
                />
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
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  body: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "rgba(226,232,240,0.95)",
  },
  actions: {
    marginTop: 18,
    width: "100%",
  },
});
