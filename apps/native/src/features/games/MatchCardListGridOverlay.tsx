import { useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import {
  LIST_CARD_GRID_LAYER_OPACITY,
  LIST_CARD_GRID_LINE_COLOR,
  RESULT_DETAIL_SHELL_GRID_LAYER_OPACITY,
  RESULT_DETAIL_SHELL_GRID_LINE_COLOR,
  RESULT_LIST_CARD_GRID_LAYER_OPACITY,
  RESULT_LIST_CARD_GRID_LINE_COLOR,
  listCardShellGridLineColorAtY,
  shellGridHorizontalLineTopsCentered,
  shellGridVerticalLineLeftsCentered,
} from "./matchCardShellGrid";

/** `GameCardList` の `CardGridOverlay` と同一（試合一覧・リザルト一覧などで共用） */
export type MatchCardListGridOverlayStyles = {
  cardGridOverlay: ViewStyle;
  cardGridLineVertical: ViewStyle;
  cardGridLineHorizontal: ViewStyle;
};

export type MatchCardListGridTone = "gameList" | "resultList" | "resultDetail";

export function MatchCardListGridOverlay({
  styles,
  tone = "gameList",
}: {
  styles: MatchCardListGridOverlayStyles;
  /** `resultList`：一覧カード / `resultDetail`：詳細のガラスシェル内（より薄く） */
  tone?: MatchCardListGridTone;
}) {
  const layerOpacity =
    tone === "resultDetail"
      ? RESULT_DETAIL_SHELL_GRID_LAYER_OPACITY
      : tone === "resultList"
        ? RESULT_LIST_CARD_GRID_LAYER_OPACITY
        : LIST_CARD_GRID_LAYER_OPACITY;
  const lineColor =
    tone === "resultDetail"
      ? RESULT_DETAIL_SHELL_GRID_LINE_COLOR
      : tone === "resultList"
        ? RESULT_LIST_CARD_GRID_LINE_COLOR
        : LIST_CARD_GRID_LINE_COLOR;
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const verticalLineLeftPx = useMemo(
    () => shellGridVerticalLineLeftsCentered(gridSize.width),
    [gridSize.width]
  );
  const horizontalLineTopsPx = useMemo(
    () => shellGridHorizontalLineTopsCentered(gridSize.height),
    [gridSize.height]
  );

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (
      Math.abs(width - gridSize.width) < 0.5 &&
      Math.abs(height - gridSize.height) < 0.5
    ) {
      return;
    }
    setGridSize({ width, height });
  }

  const h = gridSize.height;
  const useListGradientGrid = tone === "gameList" && h > 0;

  return (
    <View pointerEvents="none" style={styles.cardGridOverlay} onLayout={handleLayout}>
      {/** Web MatchCard と同じくレイヤー全体に opacity を掛ける */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: layerOpacity }]}
      >
        {verticalLineLeftPx.map((leftPx) =>
          useListGradientGrid ? (
            <LinearGradient
              key={`v-${leftPx}`}
              colors={[
                listCardShellGridLineColorAtY(0),
                listCardShellGridLineColorAtY(1),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.cardGridLineVertical,
                { left: leftPx, top: 0, bottom: 0, backgroundColor: "transparent" },
              ]}
            />
          ) : (
            <View
              key={`v-${leftPx}`}
              style={[
                styles.cardGridLineVertical,
                { left: leftPx, backgroundColor: lineColor },
              ]}
            />
          )
        )}
        {horizontalLineTopsPx.map((topPx) => (
          <View
            key={`h-${topPx}`}
            style={[
              styles.cardGridLineHorizontal,
              {
                top: topPx,
                backgroundColor: useListGradientGrid
                  ? listCardShellGridLineColorAtY((topPx + 0.5) / h)
                  : lineColor,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
