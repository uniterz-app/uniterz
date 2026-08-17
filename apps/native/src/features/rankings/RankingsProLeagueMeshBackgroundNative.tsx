/**
 * Web `.rankings-atmosphere--pro-league` 相当。
 * PRO LEAGUE ボードだけ穴あきメタルをタイルする。
 */
import { Canvas, Fill, ImageShader, useImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  PRO_LEAGUE_MESH_BG_FALLBACK,
  PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX,
  PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX,
} from "../../../../../lib/rankings/proLeagueMeshBackground";

const MESH = require("../../../assets/bg/pro-league-mesh.png") as number;

export default function RankingsProLeagueMeshBackgroundNative() {
  const { width, height } = useWindowDimensions();
  const image = useImage(MESH);

  if (width <= 0 || height <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: PRO_LEAGUE_MESH_BG_FALLBACK }]}
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
              width={PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX}
              height={PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX}
            />
          </Fill>
        </Canvas>
      ) : null}
      <LinearGradient
        colors={["rgba(0,0,0,0.28)", "transparent", "transparent", "rgba(0,0,0,0.38)"]}
        locations={[0, 0.16, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRO_LEAGUE_MESH_BG_FALLBACK,
    overflow: "hidden",
    zIndex: 0,
  },
});
