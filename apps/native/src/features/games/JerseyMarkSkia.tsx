import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
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
  buildThinTripleStripeDots,
  isBlackBodyPrimary,
  JERSEY_FRAME_WHITE,
} from "../../../../../lib/jersey/jerseyThinTripleStripes";
import type { JerseyDotDensity } from "../../../../../lib/jersey/jerseyDensity";
import {
  JERSEY_PATH_D,
  VIEWBOX_H,
  VIEWBOX_W,
  accentRgbForJerseyGlow,
  buildJerseyHalftoneDotList,
  jerseyStrokeWidthForSize,
} from "./jerseyHalftoneModel";
import {
  getCachedJerseyPicture,
  jerseyPictureCacheKey,
  setCachedJerseyPicture,
} from "./jerseyPictureCache";

type JerseyMarkSkiaProps = {
  accent: string;
  accentEnd?: string;
  size?: number;
  density?: JerseyDotDensity;
};

function normalizeHexKey(s: string): string {
  return s.trim().replace(/^#/, "").toLowerCase();
}

function buildJerseyPicture(
  size: number,
  accent: string,
  accentEnd: string | undefined,
  density: JerseyDotDensity
): SkPicture | null {
  const jerseyPath = Skia.Path.MakeFromSVGString(JERSEY_PATH_D);
  if (!jerseyPath) return null;

  const stripeMode =
    !!accentEnd && normalizeHexKey(accent) !== normalizeHexKey(accentEnd);
  const bodyDots = buildJerseyHalftoneDotList(
    size,
    accent,
    stripeMode ? undefined : accentEnd,
    { density }
  );
  const stripe =
    stripeMode && accentEnd
      ? buildThinTripleStripeDots(accentEnd, density)
      : null;
  const blackFrame = isBlackBodyPrimary(accent);
  const strokeW = jerseyStrokeWidthForSize(size);

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(
    Skia.XYWHRect(0, 0, VIEWBOX_W, VIEWBOX_H)
  );
  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  canvas.save();
  canvas.clipPath(jerseyPath, ClipOp.Intersect, true);

  for (const dot of bodyDots) {
    paint.setStyle(PaintStyle.Fill);
    paint.setColor(Skia.Color(dot.fill));
    paint.setAlphaf(1);
    canvas.drawCircle(dot.cx, dot.cy, dot.r, paint);
  }

  if (stripe) {
    canvas.save();
    canvas.rotate(stripe.rotateDeg, stripe.cx, stripe.cy);
    for (const dot of stripe.dots) {
      paint.setColor(Skia.Color(dot.fill));
      paint.setAlphaf(dot.opacity);
      canvas.drawCircle(dot.cx, dot.cy, dot.r, paint);
    }
    canvas.restore();
  }
  canvas.restore();

  if (blackFrame) {
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    paint.setColor(Skia.Color(JERSEY_FRAME_WHITE));
    paint.setAlphaf(0.65);
    paint.setStrokeWidth(strokeW * 0.55);
    canvas.drawPath(jerseyPath, paint);
  }

  return recorder.finishRecordingAsPicture();
}

export default function JerseyMarkSkia({
  accent,
  accentEnd,
  size = 56,
  density = "coarse",
}: JerseyMarkSkiaProps) {
  const picture = useMemo(() => {
    const key = jerseyPictureCacheKey(size, accent, accentEnd, density);
    const hit = getCachedJerseyPicture(key);
    if (hit) return hit;
    const built = buildJerseyPicture(size, accent, accentEnd, density);
    if (built) setCachedJerseyPicture(key, built);
    return built;
  }, [size, accent, accentEnd, density]);
  const glow = useMemo(
    () => accentRgbForJerseyGlow(accent, accentEnd),
    [accent, accentEnd]
  );
  const glowColor = `rgb(${glow.r},${glow.g},${glow.b})`;

  const scale = Math.min(size / VIEWBOX_W, size / VIEWBOX_H);
  const tx = (size - VIEWBOX_W * scale) / 2;
  const ty = (size - VIEWBOX_H * scale) / 2;

  if (!picture) return null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: glowColor,
        },
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
          <Picture picture={picture} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
});
