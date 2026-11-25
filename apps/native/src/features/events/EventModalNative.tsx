import { useState } from "react";
import {
  Image,
  type LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import type { ImageSourcePropType } from "react-native";
import type { EventNoticeContent } from "../../../../../lib/events/eventNoticeTypes";
import { eventModalLayoutFor } from "../../../../../lib/events/eventModalLayout";
import type {
  EventModalPrizeKind,
  EventModalPrizePlace,
} from "../../../../../lib/events/eventModalLayout";
import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";
import {
  DECEMBER_2026_CHRISTMAS_NOTICE_ID,
  DECEMBER_2026_CUP_NOTICE_ID,
  DECEMBER_2026_MONTHLY_NOTICE_ID,
} from "../../../../../lib/campaigns/december2026Campaign";
import PredictOverlayChamferedFrameNative from "../games/PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../games/matchListCyberClipPath";
import ResultCyberFrameDecorNative from "../results/ResultCyberFrameDecorNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../ui/ModalActionButtonNative";
import {
  JP_400,
  JP_600,
  JP_700,
  ORBITRON_800,
  OXANIUM_700,
} from "../profile/reports/reportThemeNative";

const HERO: Record<string, ImageSourcePropType> = {
  [DECEMBER_2026_MONTHLY_NOTICE_ID]: require("../../../assets/events/dec-monthly-hero.jpg"),
  [DECEMBER_2026_CUP_NOTICE_ID]: require("../../../assets/events/dec-cup-hero.jpg"),
  [DECEMBER_2026_CHRISTMAS_NOTICE_ID]: require("../../../assets/events/dec-christmas-hero.jpg"),
};

const PRIZE: Partial<Record<EventModalPrizeKind, ImageSourcePropType>> = {
  "mega-box": require("../../../assets/events/prize-mega-box.jpg"),
  ballers: require("../../../assets/events/prize-ballers.jpg"),
  packs: require("../../../assets/events/prize-packs.jpg"),
  tee: require("../../../assets/events/prize-tee-gold.jpg"),
};

const PLACE_COLOR: Record<EventModalPrizePlace, string> = {
  1: "#fcd34d",
  2: "#e2e8f0",
  3: "#d6a36a",
  100: "#67e8f9",
  500: "#67e8f9",
};

function placeLabel(place: EventModalPrizePlace): string {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  return String(place);
}

export default function EventModalNative({
  event,
  language,
  onClose,
}: {
  event: EventNoticeContent;
  language: Language;
  onClose: () => void;
}) {
  const layout = eventModalLayoutFor(event.id);
  const closeLabel = t(language).common.ok;
  const en = language === "en";
  const reduceMotion = useReducedMotion();
  const hero = HERO[event.id];
  const { width: winW, height: winH } = useWindowDimensions();
  const cardW = Math.min(340, winW - 40);
  const heroH = Math.min(108, Math.round(cardW * 0.32));
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });

  function onFrameLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - frameSize.w) < 0.5 && Math.abs(height - frameSize.h) < 0.5) {
      return;
    }
    setFrameSize({ w: width, h: height });
  }

  if (!layout) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.root}>
          <Pressable style={styles.scrim} onPress={onClose} />
          <View style={styles.fallback}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.rule}>{event.description}</Text>
            <ModalActionRowNative>
              <ModalActionButtonNative label={closeLabel} onPress={onClose} />
            </ModalActionRowNative>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 32 : 24}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <Pressable style={styles.scrim} onPress={onClose} />

        <View
          style={[styles.cardWrap, { width: cardW, maxHeight: winH * 0.86 }]}
          onLayout={onFrameLayout}
          collapsable={false}
        >
          <PredictOverlayChamferedFrameNative
            cut={PREDICT_OVERLAY_CYBER_FORM_CUT}
            gradientColors={["#05070c", "#000000"]}
            gradientLocations={[0, 1]}
            borderColor="rgba(0,245,255,0.55)"
            borderWidth={1.25}
            shadowColor="#00f5ff"
            shadowOpacity={reduceMotion ? 0 : 0.28}
            shadowRadius={reduceMotion ? 0 : 32}
            overflowHidden
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={88} />
              <View style={styles.headerBrandLine} />
            </View>

            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.kicker}>{en ? layout.kickerEn : layout.kickerJa}</Text>
              <Text style={styles.title}>{en ? layout.titleEn : layout.titleJa}</Text>
              <Text style={styles.rule}>{en ? layout.ruleEn : layout.ruleJa}</Text>

              {hero ? (
                <Image
                  source={hero}
                  style={[styles.hero, { height: heroH }]}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : null}

              <View style={styles.podium}>
                {layout.prizes.map((row) => {
                  const photo = PRIZE[row.kind];
                  const tone = PLACE_COLOR[row.place];
                  const consolation = row.place === 100 || row.place === 500;
                  return (
                    <View key={`${row.place}-${row.kind}`} style={styles.prizeRow}>
                      <Text
                        style={[
                          styles.place,
                          consolation && styles.placeConsolation,
                          { color: tone },
                        ]}
                      >
                        {placeLabel(row.place)}
                      </Text>
                      <View style={[styles.prizeThumb, { borderColor: `${tone}66` }]}>
                        {photo ? (
                          <Image source={photo} style={styles.prizeImg} resizeMode="cover" />
                        ) : (
                          <MaterialCommunityIcons name="tshirt-crew" size={22} color={tone} />
                        )}
                      </View>
                      <View style={styles.prizeText}>
                        <Text style={styles.prizeName} numberOfLines={1}>
                          {en ? row.labelEn : row.labelJa}
                        </Text>
                        <Text style={styles.prizeHint} numberOfLines={2}>
                          {en ? row.hintEn : row.hintJa}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.target}>{en ? layout.targetEn : layout.targetJa}</Text>
              <Text style={styles.footer}>{en ? layout.footerEn : layout.footerJa}</Text>
            </ScrollView>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative label={closeLabel} onPress={onClose} />
              </ModalActionRowNative>
            </View>
          </PredictOverlayChamferedFrameNative>
          {frameSize.w > 0 && frameSize.h > 0 ? (
            <ResultCyberFrameDecorNative
              width={frameSize.w}
              height={frameSize.h}
              cornerColor="rgba(0,245,255,0.9)"
              topLineColors={[
                "transparent",
                "rgba(0,245,255,0.95)",
                "rgba(103,232,249,0.72)",
                "transparent",
              ]}
              topGlowColors={[
                "rgba(0,245,255,0.2)",
                "rgba(0,245,255,0.07)",
                "transparent",
              ]}
              shellContext="predictOverlay"
            />
          ) : null}
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
    paddingHorizontal: 18,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  cardWrap: {
    flexShrink: 1,
    position: "relative",
    overflow: "visible",
  },
  card: {
    width: "100%",
    flexShrink: 1,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
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
    maxWidth: 56,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.55)",
  },
  kicker: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 2.4,
    color: "#67e8f9",
    textAlign: "center",
  },
  title: {
    marginTop: 2,
    fontFamily: JP_700,
    fontSize: 18,
    lineHeight: 24,
    color: "#f8fafc",
    textAlign: "center",
  },
  rule: {
    marginTop: 4,
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(226,232,240,0.78)",
    textAlign: "center",
  },
  hero: {
    marginTop: 10,
    width: "100%",
    backgroundColor: "#05070c",
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyScrollContent: {
    paddingBottom: 2,
  },
  podium: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(0,245,255,0.04)",
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  place: {
    fontFamily: ORBITRON_800,
    fontSize: 14,
    width: 48,
    letterSpacing: 0.2,
  },
  placeConsolation: {
    fontSize: 12,
  },
  prizeThumb: {
    width: 40,
    height: 40,
    borderWidth: 1,
    backgroundColor: "#07090d",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  prizeImg: {
    width: "100%",
    height: "100%",
  },
  prizeText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  prizeName: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(248,250,252,0.96)",
  },
  prizeHint: {
    fontFamily: JP_400,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(186,198,214,0.88)",
  },
  target: {
    marginTop: 12,
    fontFamily: JP_600,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(165,243,252,0.88)",
    textAlign: "center",
  },
  footer: {
    marginTop: 4,
    fontFamily: JP_400,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(148,163,184,0.9)",
    textAlign: "center",
  },
  actions: {
    marginTop: 12,
    width: "100%",
  },
  fallback: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0B0F17",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    padding: 18,
  },
});
