/**
 * DEV: ジャージ D/E/H 斜めライン × 30 チーム。
 * 地 = primary · ライン = secondary · 枠は黒地のみ薄い白。
 * FlatList + Skia Picture で軽量化。本番は thin_triple（D）を採用済み。
 */
import { memo, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Canvas,
  ClipOp,
  Group,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
} from "@shopify/react-native-skia";
import type { SkPicture } from "@shopify/react-native-skia";
import {
  JERSEY_PATH_D,
  VIEWBOX_H,
  VIEWBOX_W,
  buildJerseyHalftoneDotList,
  jerseyStrokeWidthForSize,
} from "../jerseyHalftoneModel";
import {
  buildThinTripleStripeDots,
  isBlackBodyPrimary,
  JERSEY_FRAME_WHITE,
} from "../../../../../../lib/jersey/jerseyThinTripleStripes";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../lib/team-colors";
import {
  NBA_EAST_TEAM_IDS,
  NBA_WEST_TEAM_IDS,
} from "../../../../../../lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "../../../../../../lib/team-short";

const ALL_TEAMS = [...NBA_EAST_TEAM_IDS, ...NBA_WEST_TEAM_IDS].sort((a, b) =>
  (TEAM_SHORT[a] ?? a).localeCompare(TEAM_SHORT[b] ?? b)
);

const MARK_SIZE = 64;

type StripeVariantId = "thin_triple" | "edge_piping" | "fade_band";
type ViewMode = "compare" | StripeVariantId;

type StripeVariant = {
  id: StripeVariantId;
  code: "D" | "E" | "H";
  blurb: string;
};

const VARIANTS: readonly StripeVariant[] = [
  { id: "thin_triple", code: "D", blurb: "細いレーシング3本" },
  { id: "edge_piping", code: "E", blurb: "縁取り＋内側サッシュ" },
  { id: "fade_band", code: "H", blurb: "幅広フェード帯" },
] as const;

type StripeDot = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

function pushDotBand(
  out: StripeDot[],
  opts: {
    y0: number;
    y1: number;
    stepX: number;
    stepY: number;
    r: number;
    fill: string;
    opacityAt?: (t: number) => number;
    radiusAt?: (t: number) => number;
  }
) {
  const { y0, y1, stepX, stepY, r, fill } = opts;
  const span = Math.max(1e-6, y1 - y0);
  let row = 0;
  for (let y = y0; y <= y1 + 1e-6; y += stepY, row += 1) {
    const t = (y - y0) / span;
    const opacity = opts.opacityAt ? opts.opacityAt(t) : 0.95;
    if (opacity < 0.04) continue;
    const rr = r * (opts.radiusAt ? opts.radiusAt(t) : 1);
    const xOff = (row % 2) * stepX * 0.5;
    for (let x = -42; x <= 142; x += stepX) {
      out.push({ cx: x + xOff, cy: y, r: rr, fill, opacity });
    }
  }
}

function buildStripeDots(
  variant: StripeVariantId,
  primary: string,
  secondary: string
): { rotateDeg: number; cx: number; cy: number; dots: StripeDot[] } {
  if (variant === "thin_triple") {
    return buildThinTripleStripeDots(secondary);
  }

  const dots: StripeDot[] = [];

  if (variant === "edge_piping") {
    pushDotBand(dots, {
      y0: 28,
      y1: 30.5,
      stepX: 3.2,
      stepY: 2.4,
      r: 1.05,
      fill: secondary,
    });
    pushDotBand(dots, {
      y0: 36,
      y1: 52,
      stepX: 3.8,
      stepY: 3.2,
      r: 1.35,
      fill: primary,
      opacityAt: () => 0.55,
    });
    pushDotBand(dots, {
      y0: 53.5,
      y1: 56,
      stepX: 3.2,
      stepY: 2.4,
      r: 1.05,
      fill: secondary,
    });
    return { rotateDeg: -26, cx: 44, cy: 48, dots };
  }

  pushDotBand(dots, {
    y0: 28,
    y1: 64,
    stepX: 3.6,
    stepY: 3.2,
    r: 1.55,
    fill: secondary,
    opacityAt: (t) => {
      const edge = Math.min(t, 1 - t);
      return Math.max(0, Math.min(0.92, edge * 3.2));
    },
    radiusAt: (t) => {
      const edge = Math.min(t, 1 - t);
      return 0.55 + Math.min(1, edge * 2.4) * 0.45;
    },
  });
  return { rotateDeg: -30, cx: 44, cy: 50, dots };
}

function buildJerseyPicture(
  size: number,
  primary: string,
  secondary: string,
  variant: StripeVariantId
): SkPicture | null {
  const jerseyPath = Skia.Path.MakeFromSVGString(JERSEY_PATH_D);
  if (!jerseyPath) return null;

  const bodyDots = buildJerseyHalftoneDotList(size, primary, undefined, {
    disablePseudoLight: false,
    densityScale: 1.1,
  });
  const stripe = buildStripeDots(variant, primary, secondary);

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(
    Skia.XYWHRect(0, 0, VIEWBOX_W, VIEWBOX_H)
  );
  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  canvas.save();
  canvas.clipPath(jerseyPath, ClipOp.Intersect, true);

  for (const dot of bodyDots) {
    paint.setColor(Skia.Color(dot.fill));
    paint.setAlphaf(1);
    canvas.drawCircle(dot.cx, dot.cy, dot.r, paint);
  }

  canvas.save();
  canvas.rotate(stripe.rotateDeg, stripe.cx, stripe.cy);
  for (const dot of stripe.dots) {
    paint.setColor(Skia.Color(dot.fill));
    paint.setAlphaf(dot.opacity);
    canvas.drawCircle(dot.cx, dot.cy, dot.r, paint);
  }
  canvas.restore();
  canvas.restore();

  // 黒地だけ薄い白枠（シルエット補足）
  if (isBlackBodyPrimary(primary)) {
    const strokeW = jerseyStrokeWidthForSize(size) * 0.55;
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    paint.setColor(Skia.Color(JERSEY_FRAME_WHITE));
    paint.setAlphaf(0.65);
    paint.setStrokeWidth(strokeW);
    canvas.drawPath(jerseyPath, paint);
  }

  return recorder.finishRecordingAsPicture();
}

const JerseyVariantMark = memo(function JerseyVariantMark({
  size,
  teamId,
  variant,
}: {
  size: number;
  teamId: string;
  variant: StripeVariantId;
}) {
  const primary = getTeamJerseyPrimaryColor("nba", teamId);
  const secondary = getTeamJerseySecondaryColor("nba", teamId);

  const picture = useMemo(
    () => buildJerseyPicture(size, primary, secondary, variant),
    [size, primary, secondary, variant]
  );

  const scale = Math.min(size / VIEWBOX_W, size / VIEWBOX_H);
  const tx = (size - VIEWBOX_W * scale) / 2;
  const ty = (size - VIEWBOX_H * scale) / 2;

  if (!picture) return <View style={{ width: size, height: size }} />;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
          <Picture picture={picture} />
        </Group>
      </Canvas>
    </View>
  );
});

const TeamRow = memo(function TeamRow({
  teamId,
  mode,
}: {
  teamId: string;
  mode: ViewMode;
}) {
  const abbr = (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
  const primary = getTeamJerseyPrimaryColor("nba", teamId);
  const secondary = getTeamJerseySecondaryColor("nba", teamId);
  const variants: StripeVariantId[] =
    mode === "compare"
      ? ["thin_triple", "edge_piping", "fade_band"]
      : [mode];

  return (
    <View style={styles.teamRow}>
      <View style={styles.teamMeta}>
        <Text style={styles.teamAbbr}>{abbr}</Text>
        <View style={styles.swatchRow}>
          <View style={[styles.swatch, { backgroundColor: primary }]} />
          <View style={[styles.swatch, { backgroundColor: secondary }]} />
        </View>
      </View>
      <View style={styles.marksRow}>
        {variants.map((v) => (
          <View key={v} style={styles.markCell}>
            {mode === "compare" ? (
              <Text style={styles.markCode}>
                {VARIANTS.find((x) => x.id === v)?.code}
              </Text>
            ) : null}
            <JerseyVariantMark size={MARK_SIZE} teamId={teamId} variant={v} />
          </View>
        ))}
      </View>
    </View>
  );
});

export default function JerseyDiagonalDesignPreviewScreenNative() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [mode, setMode] = useState<ViewMode>("compare");

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#E8EEF8" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>DEV · JERSEY · 30 TEAMS</Text>
          <Text style={styles.title}>D / E / H</Text>
          <Text style={styles.sub}>
            地 primary · ライン secondary · 枠は黒のみ
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        <Pressable
          onPress={() => setMode("compare")}
          style={[
            styles.modeChip,
            mode === "compare" ? styles.modeChipOn : null,
          ]}
        >
          <Text
            style={[
              styles.modeChipText,
              mode === "compare" ? styles.modeChipTextOn : null,
            ]}
          >
            COMPARE
          </Text>
        </Pressable>
        {VARIANTS.map((v) => {
          const on = mode === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => setMode(v.id)}
              style={[styles.modeChip, on ? styles.modeChipOn : null]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  on ? styles.modeChipTextOn : null,
                ]}
              >
                {v.code} · {v.blurb}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendHint}>
          スウォッチ: 地 / ライン（黒地だけ白枠）
        </Text>
      </View>

      <FlatList
        data={ALL_TEAMS}
        keyExtractor={(id) => id}
        extraData={mode}
        renderItem={({ item }) => <TeamRow teamId={item} mode={mode} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 28 },
        ]}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  backBtn: { padding: 6 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(0,245,255,0.75)",
  },
  title: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    color: "#F4F7FC",
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  modeRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeChipOn: {
    borderColor: "#00F5FF",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  modeChipText: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.4,
  },
  modeChipTextOn: { color: "#00F5FF" },
  legend: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  legendHint: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },
  list: { paddingHorizontal: 10 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(8,10,14,0.95)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  teamMeta: {
    width: 56,
    gap: 6,
  },
  teamAbbr: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 16,
    color: "#F4F7FC",
    letterSpacing: 0.5,
  },
  swatchRow: { flexDirection: "row", gap: 3 },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  marksRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  markCell: { alignItems: "center", gap: 2 },
  markCode: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(0,245,255,0.7)",
    letterSpacing: 0.8,
  },
});
