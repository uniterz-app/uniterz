import { useMemo, type ReactNode } from "react";
import { Circle, Line } from "@shopify/react-native-skia";
import { GAMES_PAGE_FIELD } from "../../../../../lib/games/gamesPageBackgroundSpec";
import {
  NATIVE_FIELD_DOT,
  NATIVE_FIELD_GRID_H,
  NATIVE_FIELD_GRID_V,
} from "./nativeBackgroundPalette";

const DOT_STEP = 18;
const GRID_STEP = 64;

export function useBackgroundDotField(width: number, height: number, opacity: number) {
  return useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const nodes: ReactNode[] = [];
    let i = 0;
    for (let y = DOT_STEP * 0.5; y < height; y += DOT_STEP) {
      for (let x = DOT_STEP * 0.5; x < width; x += DOT_STEP) {
        nodes.push(
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={0.55}
            color={NATIVE_FIELD_DOT}
            opacity={opacity}
          />
        );
        i += 1;
      }
    }
    return nodes;
  }, [width, height, opacity]);
}

export function useBackgroundGridField(
  width: number,
  height: number,
  opacity: number
) {
  return useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const nodes: ReactNode[] = [];
    let i = 0;
    for (let x = 0; x <= width; x += GRID_STEP) {
      nodes.push(
        <Line
          key={`v${i}`}
          p1={{ x, y: 0 }}
          p2={{ x, y: height }}
          color={NATIVE_FIELD_GRID_H}
          strokeWidth={1}
          opacity={opacity}
        />
      );
      i += 1;
    }
    for (let y = 0; y <= height; y += GRID_STEP) {
      nodes.push(
        <Line
          key={`h${i}`}
          p1={{ x: 0, y }}
          p2={{ x: width, y }}
          color={NATIVE_FIELD_GRID_V}
          strokeWidth={1}
          opacity={opacity}
        />
      );
      i += 1;
    }
    return nodes;
  }, [width, height, opacity]);
}

export function gamesPageFieldOpacities(lite: boolean) {
  return {
    dot: lite ? GAMES_PAGE_FIELD.dotOpacityLite : GAMES_PAGE_FIELD.dotOpacity,
    grid: lite ? GAMES_PAGE_FIELD.gridOpacityLite : GAMES_PAGE_FIELD.gridOpacity,
  };
}
