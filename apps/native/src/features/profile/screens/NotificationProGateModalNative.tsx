/**
 * 通知設定 — Free が Pro 行を触ったときのゲート。
 * CyberAlert / PRO LEAGUE ティーザーと同系統（角切り HUD + Pro バッジ）。
 */
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { notificationProGateCopy } from "@/lib/notifications/notificationProGateCopy";
import PredictOverlayChamferedFrameNative from "../../games/PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../../games/matchListCyberClipPath";
import UniterzLogoNative from "../UniterzLogoNative";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../../ui/ModalActionButtonNative";
import {
  OXANIUM_700,
  OXANIUM_800,
} from "../reports/reportThemeNative";

type Props = {
  visible: boolean;
  language: string;
  onClose: () => void;
  onSeePro: () => void;
};

const BULLET_ICONS: ComponentProps<typeof MaterialCommunityIcons>["name"][] = [
  "alarm-light-outline",
  "lightbulb-on-outline",
  "file-chart-outline",
];

export default function NotificationProGateModalNative({
  visible,
  language,
  onClose,
  onSeePro,
}: Props) {
  const copy = notificationProGateCopy(language);
  /** 通知ゲートでは通知に直結する先頭 3 件だけ */
  const bullets = copy.bullets.slice(0, 3);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.root} onPress={onClose}>
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

        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <PredictOverlayChamferedFrameNative
            cut={PREDICT_OVERLAY_CYBER_FORM_CUT}
            gradientColors={["#050508", "#0a0804"]}
            gradientLocations={[0, 1]}
            borderColor="rgba(251,191,36,0.38)"
            shadowColor="#fbbf24"
            shadowOpacity={0.14}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollInner}
            >
              <View style={styles.headerBrandRow} pointerEvents="none">
                <View style={styles.headerBrandLine} />
                <UniterzLogoNative width={112} />
                <View style={styles.headerBrandLine} />
              </View>

              <View style={styles.badgeWrap}>
                <ProCyberBadgeNative premium />
              </View>

              <Text style={styles.kicker}>{copy.eyebrow}</Text>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.body}>{copy.body}</Text>

              <View style={styles.bulletPanel}>
                {bullets.map((item, i) => (
                  <View key={item.title} style={styles.bulletRow}>
                    <View style={styles.bulletIcon}>
                      <MaterialCommunityIcons
                        name={BULLET_ICONS[i] ?? "star-four-points-outline"}
                        size={14}
                        color="rgba(253,230,138,0.92)"
                      />
                    </View>
                    <View style={styles.bulletCopy}>
                      <Text style={styles.bulletTitle}>{item.title}</Text>
                      <Text style={styles.bulletDetail}>{item.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.priceStrip}>
                <Text style={styles.price}>
                  {copy.price}
                  <Text style={styles.period}>{copy.period}</Text>
                </Text>
                <Text style={styles.trial}>{copy.trial}</Text>
              </View>

              <View style={styles.actions}>
                <ModalActionRowNative>
                  <ModalActionButtonNative
                    label={copy.dismiss}
                    tone="ghost"
                    onPress={onClose}
                  />
                  <ModalActionButtonNative
                    label={copy.cta}
                    tone="primary"
                    onPress={onSeePro}
                  />
                </ModalActionRowNative>
              </View>
            </ScrollView>
          </PredictOverlayChamferedFrameNative>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.66)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "88%",
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollInner: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    alignItems: "stretch",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
    width: "100%",
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 52,
    height: 1,
    backgroundColor: "rgba(251,191,36,0.55)",
    shadowColor: "#fbbf24",
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  badgeWrap: {
    alignItems: "center",
    transform: [{ scale: 1.25 }],
    marginBottom: 10,
  },
  kicker: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 2.2,
    color: "rgba(253,230,138,0.88)",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontFamily: OXANIUM_800,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.4,
    lineHeight: 24,
    color: "#ffffff",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(203,213,225,0.88)",
    textAlign: "center",
  },
  bulletPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(251,191,36,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletIcon: {
    width: 26,
    height: 26,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  bulletCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulletTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 0.3,
    color: "#fef3c7",
  },
  bulletDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(226,232,240,0.72)",
  },
  priceStrip: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 2,
  },
  price: {
    fontFamily: OXANIUM_800,
    fontSize: 20,
    color: "#fde68a",
  },
  period: {
    fontFamily: OXANIUM_700,
    fontSize: 12,
    color: "rgba(254,243,199,0.7)",
  },
  trial: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(253,230,138,0.85)",
  },
  actions: {
    marginTop: 14,
    width: "100%",
  },
});
