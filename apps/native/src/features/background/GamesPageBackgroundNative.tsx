import { useSyncExternalStore } from "react";
import { Canvas, Fill, ImageShader, useImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  APP_MESH_BG_FALLBACK,
  APP_MESH_BG_TILE_HEIGHT_PX,
  APP_MESH_BG_TILE_WIDTH_PX,
} from "../../../../../lib/app/appMeshBackground";
import {
  PRO_LEAGUE_MESH_BG_FALLBACK,
  PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX,
  PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX,
} from "../../../../../lib/rankings/proLeagueMeshBackground";
import {
  getAppPageAtmosphere,
  subscribeAppPageAtmosphere,
} from "../../../../../lib/ui/appPageAtmosphere";

type Props = {
  /** 互換のため残す */
  lite?: boolean;
};

const RING = require("../../../assets/bg/app-mesh.png") as number;
const PRO_MESH = require("../../../assets/bg/pro-league-mesh.png") as number;

/**
 * Web `MobileStaticPageBackground` 相当。
 * PRO LEAGUE 中は穴あきメタル（ヘッダー下まで同じ柄）。
 */
export default function GamesPageBackgroundNative(_props: Props) {
  const { width, height } = useWindowDimensions();
  const atmosphere = useSyncExternalStore(
    subscribeAppPageAtmosphere,
    getAppPageAtmosphere,
    () => "default" as const
  );
  const pro = atmosphere === "pro-league";
  const image = useImage(pro ? PRO_MESH : RING);

  if (width <= 0 || height <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: pro
              ? PRO_LEAGUE_MESH_BG_FALLBACK
              : APP_MESH_BG_FALLBACK,
          },
        ]}
      />
    );
  }

  const tileW = pro
    ? PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX
    : APP_MESH_BG_TILE_WIDTH_PX;
  const tileH = pro
    ? PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX
    : APP_MESH_BG_TILE_HEIGHT_PX;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        {
          backgroundColor: pro
            ? PRO_LEAGUE_MESH_BG_FALLBACK
            : APP_MESH_BG_FALLBACK,
        },
      ]}
      collapsable={false}
    >
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
              width={tileW}
              height={tileH}
            />
          </Fill>
        </Canvas>
      ) : null}
      {pro ? (
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.28)",
            "transparent",
            "transparent",
            "rgba(0,0,0,0.38)",
          ]}
          locations={[0, 0.16, 0.78, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
