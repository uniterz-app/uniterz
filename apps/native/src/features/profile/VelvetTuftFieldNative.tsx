/**
 * Web `VelvetTuftField` 相当。
 * JS `sampleVelvetTuft` でタイルを焼き、Skia ImageShader で repeat する。
 * SkSL が失敗すると真っ黒だけになるため、Web と同じサンプラーを使う。
 */
import { useMemo, useState } from "react";
import { PixelRatio, StyleSheet, View, useWindowDimensions } from "react-native";
import {
  AlphaType,
  Canvas,
  ColorType,
  Fill,
  ImageShader,
  Skia,
} from "@shopify/react-native-skia";
import {
  VELVET_BASE,
  VELVET_TILE_H,
  VELVET_TILE_W,
  sampleVelvetTuft,
} from "../../../../../lib/badges/velvetPalette";

function makeQuiltTileImage() {
  const dpr = Math.min(PixelRatio.get(), 2);
  const w = Math.max(1, Math.round(VELVET_TILE_W * dpr));
  const h = Math.max(1, Math.round(VELVET_TILE_H * dpr));
  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const py = y / dpr;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = sampleVelvetTuft(x / dpr, py);
      const i = (y * w + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  return Skia.Image.MakeImage(
    {
      width: w,
      height: h,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    },
    Skia.Data.fromBytes(pixels),
    w * 4,
  );
}

type Props = {
  /** 親の実寸で描く（モーダルなど）。未指定なら画面全体。 */
  contained?: boolean;
};

export default function VelvetTuftFieldNative({ contained }: Props) {
  const win = useWindowDimensions();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const width = contained ? box.width : win.width;
  const height = contained ? box.height : win.height;
  const image = useMemo(() => makeQuiltTileImage(), []);

  return (
    <View
      pointerEvents="none"
      style={styles.root}
      collapsable={false}
      onLayout={
        contained
          ? (e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              setBox((prev) =>
                prev.width === w && prev.height === h ? prev : { width: w, height: h },
              );
            }
          : undefined
      }
    >
      {width > 0 && height > 0 && image ? (
        <Canvas style={{ width, height }} pointerEvents="none">
          <Fill>
            <ImageShader
              image={image}
              tx="repeat"
              ty="repeat"
              fit="fill"
              x={0}
              y={0}
              width={VELVET_TILE_W}
              height={VELVET_TILE_H}
            />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VELVET_BASE,
    overflow: "hidden",
  },
});
