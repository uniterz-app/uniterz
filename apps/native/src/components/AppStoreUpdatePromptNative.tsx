/**
 * App Store の公開版がインストール版より新しいとき、更新モーダルを出す。
 * 更新ボタンは App Store を開き、モーダルは残す（戻ってもう一度押せる）。
 * 「あとで」はこの起動中だけ閉じる。次の起動でまだ古ければ再度出す。
 */
import { useEffect, useState } from "react";
import { Linking, Modal, Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t as i18nT } from "../../../../lib/i18n/t";
import {
  fetchIosAppStoreVersion,
  isStoreVersionNewer,
} from "../../../../lib/app/iosAppStoreVersion";
import { getAppStoreAppId, getAppStoreShareUrl } from "../../../../lib/share/shareAppUrls";
import PredictOverlayChamferedFrameNative from "../features/games/PredictOverlayChamferedFrameNative";
import UniterzLogoNative from "../features/profile/UniterzLogoNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../features/games/matchListCyberClipPath";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../ui/ModalActionButtonNative";
import { useNativeLanguage } from "../i18n/NativeLanguageProvider";

export default function AppStoreUpdatePromptNative() {
  const { language } = useNativeLanguage();
  const copy = i18nT(language).appUpdate;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
    const appId = getAppStoreAppId();
    const installed = Constants.expoConfig?.version ?? null;
    if (!appId || !installed) return;

    let cancelled = false;
    void (async () => {
      const storeVersion = await fetchIosAppStoreVersion(appId);
      if (cancelled) return;
      if (isStoreVersionNewer(installed, storeVersion)) setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openStore = () => {
    const url = getAppStoreShareUrl();
    if (!url) return;
    void Linking.openURL(url);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
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
            borderColor="rgba(0,245,255,0.22)"
            shadowColor="#00f5ff"
            shadowOpacity={0.08}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="download-outline"
                size={28}
                color="rgba(0,245,255,0.72)"
              />
            </View>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.message}>{copy.message}</Text>
            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label={copy.later}
                  tone="ghost"
                  onPress={() => setVisible(false)}
                />
                <ModalActionButtonNative label={copy.cta} tone="primary" onPress={openStore} />
              </ModalActionRowNative>
            </View>
          </PredictOverlayChamferedFrameNative>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 320,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
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
  iconWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
    letterSpacing: 0.15,
  },
  actions: {
    marginTop: 20,
    width: "100%",
  },
});
