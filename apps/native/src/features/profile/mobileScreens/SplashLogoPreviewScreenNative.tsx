/**
 * DEV — Void Corona スプラッシュ案 A〜W プレビュー（U 欠番）。
 * 真フルスクリーン（ブランド棚・タブバーをレイアウトから外す）。
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
  acquireAppBrandShelfCollapsed,
  setAppBrandShelfHidden,
} from "@/lib/ui/appBrandShelfVisibility";
import {
  VOID_CORONA_CONCEPTS,
  type VoidCoronaConceptId,
} from "@/lib/splash/voidCoronaConcepts";
import { fonts } from "../../../theme/tokens";
import VoidCoronaSplashHostNative from "../../splash/voidCorona/VoidCoronaSplashHostNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function SplashLogoPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const isJa = language === "ja";
  const [concept, setConcept] = useState<VoidCoronaConceptId>("A");
  const [playKey, setPlayKey] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [playing, setPlaying] = useState(true);

  const meta = useMemo(
    () => VOID_CORONA_CONCEPTS.find((c) => c.id === concept)!,
    [concept]
  );

  useEffect(() => {
    // hold（高さ残し）だと上に空帯が出て全体がズレて見える → collapse で外す
    setAppBrandShelfHidden(true);
    const releaseCollapse = acquireAppBrandShelfCollapsed();
    return () => {
      releaseCollapse();
      setAppBrandShelfHidden(false);
    };
  }, []);

  const replay = useCallback(() => {
    setPlaying(true);
    setPlayKey((k) => k + 1);
  }, []);

  const selectConcept = useCallback((id: VoidCoronaConceptId) => {
    setConcept(id);
    setPlaying(true);
    setPlayKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.root}>
      {/* Skia Canvas が UI より前面に出ないよう、演出は下層に固定 */}
      {playing ? (
        <View style={styles.stage} pointerEvents="none">
          <VoidCoronaSplashHostNative
            concept={concept}
            playKey={playKey}
            onComplete={() => {
              /* 完了後も最後のフレームを維持（ホールド） */
            }}
          />
        </View>
      ) : null}

      {chromeVisible ? (
        <View
          pointerEvents="box-none"
          style={[styles.chrome, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isJa ? "戻る" : "Back"}
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>Void Corona · DEV · generated</Text>
              <Text style={styles.title} numberOfLines={1}>
                {meta.id}. {isJa ? meta.nameJa : meta.nameEn}
              </Text>
            </View>
            <Pressable
              onPress={() => setChromeVisible(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isJa ? "UIを隠す" : "Hide UI"}
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="eye-off-outline"
                size={20}
                color="rgba(255,255,255,0.75)"
              />
            </Pressable>
          </View>

          <Text style={styles.note}>{isJa ? meta.noteJa : meta.noteEn}</Text>
          <Text style={styles.meta}>
            {meta.totalMs}ms · {isJa ? "タップでUI再表示" : "Tap to show UI"}
          </Text>
        </View>
      ) : (
        <Pressable
          style={styles.revealHit}
          onPress={() => setChromeVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={isJa ? "UIを表示" : "Show UI"}
        />
      )}

      {chromeVisible ? (
        <View
          style={[
            styles.dock,
            {
              paddingBottom: Math.max(insets.bottom, 10) + 10,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {VOID_CORONA_CONCEPTS.map((c) => {
              const active = c.id === concept;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => selectConcept(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipId, active && styles.chipIdActive]}>
                    {c.id}
                  </Text>
                  <Text
                    style={[styles.chipLabel, active && styles.chipLabelActive]}
                    numberOfLines={1}
                  >
                    {isJa ? c.nameJa : c.nameEn}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={replay}
            style={styles.replay}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "再生" : "Replay"}
          >
            <MaterialCommunityIcons name="replay" size={18} color="#041018" />
            <Text style={styles.replayLabel}>
              {isJa ? "もう一度再生" : "Replay"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  revealHit: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  chrome: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 14,
    zIndex: 100,
    elevation: 100,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  kicker: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(159, 232, 230, 0.75)",
  },
  title: {
    fontFamily: fonts.metric,
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  note: {
    marginTop: 10,
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    color: "rgba(255,255,255,0.72)",
    maxWidth: 360,
  },
  meta: {
    marginTop: 4,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.38)",
  },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(159, 232, 230, 0.18)",
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  chip: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(159, 232, 230, 0.28)",
    backgroundColor: "rgba(8, 16, 20, 0.72)",
    gap: 2,
  },
  chipActive: {
    borderColor: "#9FE8E6",
    backgroundColor: "rgba(159, 232, 230, 0.16)",
  },
  chipId: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(159, 232, 230, 0.7)",
  },
  chipIdActive: {
    color: "#9FE8E6",
  },
  chipLabel: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
  },
  chipLabelActive: {
    color: "#fff",
  },
  replay: {
    alignSelf: "stretch",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#9FE8E6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  replayLabel: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#041018",
  },
});
