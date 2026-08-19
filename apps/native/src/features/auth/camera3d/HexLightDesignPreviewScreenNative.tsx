/**
 * __DEV__ ランディング六角ライト 10 案。本番未接続。
 */
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../../games/matchCardTypography";
import {
  HEX_LIGHT_GALLERY,
  HexLightPatternTile,
  type HexLightPatternMeta,
} from "./hexLightDesignPreviewPatterns";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function PatternBlock({
  meta,
  ja,
  width,
  clock,
}: {
  meta: HexLightPatternMeta;
  ja: boolean;
  width: number;
  clock: ReturnType<typeof useSharedValue<number>>;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.code}>{meta.code}</Text>
        <Text style={styles.name}>{ja ? meta.nameJa : meta.nameEn}</Text>
      </View>
      <Text style={styles.note}>{ja ? meta.noteJa : meta.noteEn}</Text>
      <HexLightPatternTile id={meta.id} width={width} height={248} clock={clock} />
    </View>
  );
}

export default function HexLightDesignPreviewScreenNative({ language, onClose }: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();
  const [tileW, setTileW] = useState(0);
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );
  }, [clock]);

  const onLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (Math.abs(w - tileW) < 1) return;
    setTileW(w);
  };

  return (
    <MobilePageShell
      title="HEX LIGHT"
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "枠の線が動くんじゃない。1位と同じく、短い光が辺の上を滑る。"
          : "Not a moving outline. A short light slides on the edges, like rank-1."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(28, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {ja
            ? "伝え方:「1位の行みたいに、枠の上を小さい光が滑っていく」。近い番号を送ってください。"
            : "A small light sliding on the frame, like rank-1. Send the closest number."}
        </Text>
        <View onLayout={onLayout}>
          {HEX_LIGHT_GALLERY.map((meta) => (
            <PatternBlock
              key={meta.id}
              meta={meta}
              ja={ja}
              width={tileW}
              clock={clock}
            />
          ))}
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 18,
  },
  lead: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
    marginBottom: 4,
  },
  block: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    backgroundColor: "rgba(5,8,14,0.55)",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    marginBottom: 14,
  },
  blockHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  code: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#4ff7f4",
  },
  name: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 20,
    letterSpacing: 1.2,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  note: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    lineHeight: 15,
    color: "rgba(148,163,184,0.88)",
    marginTop: -2,
  },
});
