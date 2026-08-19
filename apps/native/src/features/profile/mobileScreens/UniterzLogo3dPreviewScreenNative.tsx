/**
 * Web `/mobile/uniterz-logo-3d` 相当 — Blender 平面ワードマーク GLB の確認用。
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UniterzLogo3dPreviewCanvasNative from "../../dev/UniterzLogo3dPreviewCanvasNative";
import {
  ensureLogoFlat3dGltfParsed,
  type LogoFlat3dModelId,
} from "../../dev/logoFlat3dGlbCache";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

const TABS: readonly { id: LogoFlat3dModelId; label: string }[] = [
  { id: "joined", label: "結合" },
  { id: "letters", label: "文字分け" },
];

export default function UniterzLogo3dPreviewScreenNative({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [modelId, setModelId] = useState<LogoFlat3dModelId>("joined");
  const [glOk, setGlOk] = useState(true);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  useEffect(() => {
    void ensureLogoFlat3dGltfParsed("joined");
    void ensureLogoFlat3dGltfParsed("letters");
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        style={styles.back}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </Pressable>

      <View style={styles.header} pointerEvents="none">
        <Text style={styles.kicker}>Logo 3D</Text>
        <Text style={styles.title}>Blender の立体</Text>
        <Text style={styles.lead}>
          平面ワードマークを押し出した GLB。文字分けは 7 文字を離して表示します。
        </Text>
      </View>

      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setStage({ w: Math.round(width), h: Math.round(height) });
        }}
      >
        {!glOk ? (
          <Text style={styles.fallback}>
            3D はこのビルドでは使えません。expo-gl 入りで再ビルドしてください。
          </Text>
        ) : stage.w > 8 && stage.h > 8 ? (
          <UniterzLogo3dPreviewCanvasNative
            modelId={modelId}
            width={stage.w}
            height={stage.h}
            onUnavailable={() => setGlOk(false)}
          />
        ) : null}
      </View>

      <View style={[styles.tabs, { paddingBottom: insets.bottom + 16 }]}>
        {TABS.map((tab) => {
          const on = tab.id === modelId;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setModelId(tab.id)}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#03070b" },
  back: {
    alignSelf: "flex-start",
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    zIndex: 2,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  kicker: {
    color: "rgba(165, 243, 252, 0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  lead: {
    marginTop: 6,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
  },
  stage: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#03070b",
  },
  fallback: {
    marginTop: 48,
    paddingHorizontal: 24,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  tabs: {
    zIndex: 2,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 12,
    alignItems: "center",
  },
  tabOn: {
    borderColor: "rgba(103, 232, 249, 0.5)",
    backgroundColor: "rgba(103, 232, 249, 0.15)",
  },
  tabLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  tabLabelOn: {
    color: "rgb(207, 250, 254)",
  },
});
