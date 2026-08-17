import { Canvas, Fill, ImageShader, useImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  APP_MESH_BG_FALLBACK,
  APP_MESH_BG_TILE_HEIGHT_PX,
  APP_MESH_BG_TILE_WIDTH_PX,
} from "../../../../../lib/app/appMeshBackground";

type Props = {
  /** 互換のため残す */
  lite?: boolean;
};

const MESH = require("../../../assets/bg/app-mesh.png") as number;

/**
 * Web `MobileStaticPageBackground` 相当。
 * メッシュを `fit="fill"` でタイルサイズへ縮小してから repeat する。
 * `fit="none"` だと元画像 698px 周期のままになり、サイズ指定が効かない。
 */
export default function GamesPageBackgroundNative(_props: Props) {
  const { width, height } = useWindowDimensions();
  const image = useImage(MESH);

  if (width <= 0 || height <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: APP_MESH_BG_FALLBACK }]}
      />
    );
  }

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      {image ? (
        <Canvas style={{ width, height }} pointerEvents="none">
          <Fill>
            <ImageShader
              image={image}
              tx="repeat"
              ty="repeat"
              fit="fill"
              x={0}
              y={0}
              width={APP_MESH_BG_TILE_WIDTH_PX}
              height={APP_MESH_BG_TILE_HEIGHT_PX}
            />
          </Fill>
        </Canvas>
      ) : null}
      <LinearGradient
        colors={["rgba(0,0,0,0.22)", "transparent", "transparent", "rgba(0,0,0,0.32)"]}
        locations={[0, 0.18, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_MESH_BG_FALLBACK,
    overflow: "hidden",
  },
});
