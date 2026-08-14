/**
 * Web `/mobile/splash-logo-preview` 相当 —
 * サイバーロゴスプラッシュ案の切替プレビュー。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  UNITERZ_LOGO_SPLASH_VARIANTS,
  type UniterzLogoSplashVariantId,
} from "../../../../../../lib/units/uniterzLogoSplash";
import { setAppBrandShelfHidden } from "../../../../../../lib/ui/appBrandShelfVisibility";
import { fonts } from "../../../theme/tokens";
import CyberLogoSplashScreenNative from "../../splash/CyberLogoSplashScreenNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function SplashLogoPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [playKey, setPlayKey] = useState(0);
  const [variantId, setVariantId] =
    useState<UniterzLogoSplashVariantId>("letters");
  const isJa = language === "ja";

  const active = useMemo(
    () =>
      UNITERZ_LOGO_SPLASH_VARIANTS.find((v) => v.id === variantId) ??
      UNITERZ_LOGO_SPLASH_VARIANTS[0],
    [variantId]
  );

  useEffect(() => {
    setAppBrandShelfHidden(true);
    return () => setAppBrandShelfHidden(false);
  }, []);

  const selectVariant = useCallback((id: UniterzLogoSplashVariantId) => {
    setVariantId(id);
    setPlayKey((k) => k + 1);
  }, []);

  const replay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.root}>
      <CyberLogoSplashScreenNative
        key={`${variantId}-${playKey}`}
        playKey={playKey}
        variant={variantId}
      />

      <View
        style={[
          styles.chrome,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12) + 72,
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isJa ? "戻る" : "Back"}
          style={styles.back}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>

        <View style={styles.footer} pointerEvents="box-none">
          <Text style={styles.caption}>
            {active.nameEn} · {active.totalMs}ms
          </Text>
          <Text style={styles.note}>
            {isJa ? active.noteJa : active.noteEn}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipRow}
          >
            {UNITERZ_LOGO_SPLASH_VARIANTS.map((v) => {
              const selected = v.id === variantId;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => selectVariant(v.id)}
                  style={[styles.chip, selected && styles.chipOn]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>
                    {v.nameEn}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={replay}
            accessibilityRole="button"
            style={styles.replayBtn}
          >
            <Text style={styles.replayLabel}>{isJa ? "再生" : "Replay"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#03070b",
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  back: {
    alignSelf: "flex-start",
    marginLeft: 12,
    padding: 10,
  },
  footer: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  caption: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  note: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  chipRow: {
    maxWidth: "100%",
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: {
    borderColor: "#00F5FF",
    backgroundColor: "rgba(0, 245, 255, 0.16)",
  },
  chipLabel: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(103, 232, 249, 0.7)",
  },
  chipLabelOn: {
    color: "#E8FDFF",
  },
  replayBtn: {
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.5)",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 2,
  },
  replayLabel: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#67e8f9",
  },
});
