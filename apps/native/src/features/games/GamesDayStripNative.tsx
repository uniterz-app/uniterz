import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated from "react-native-reanimated";
import { toDateKeyInTimeZone } from "../../utils/date";
import DayStripChipNative from "./DayStripChipNative";
import {
  DAY_STRIP_GAP_PX,
  DAY_STRIP_H_PAD,
  DAY_STRIP_SUPPRESS_SNAP_INIT_MS,
  DAY_STRIP_SUPPRESS_SNAP_MS,
  DAY_STRIP_VISIBLE_COUNT,
} from "./gamesDayStripTokens";
import { gamesDayStripChipEnter } from "./predictMotion";

type GamesDayStripNativeProps = {
  dates: Date[];
  selectedDate: Date;
  timeZone: string;
  onSelect: (date: Date) => void;
  entranceEnabled: boolean;
  reduceMotion: boolean;
};

/** Web `DayStrip` 相当：全試合日・横スクロール・中央スナップ選択 */
export default function GamesDayStripNative({
  dates,
  selectedDate,
  timeZone,
  onSelect,
  entranceEnabled,
  reduceMotion,
}: GamesDayStripNativeProps) {
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Map<number, { x: number; width: number }>>(new Map());
  const scrollingByCode = useRef(false);
  const suppressSnapPickUntil = useRef(0);
  const firstAlignRef = useRef(true);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOffsetX = useRef(0);
  const { width: windowWidth } = useWindowDimensions();

  const selectedKey = toDateKeyInTimeZone(selectedDate, timeZone);
  const todayKey = toDateKeyInTimeZone(new Date(), timeZone);

  const distributeFewDays =
    DAY_STRIP_VISIBLE_COUNT > 0 &&
    dates.length > 0 &&
    dates.length < DAY_STRIP_VISIBLE_COUNT;

  const slotWidth = useMemo(() => {
    if (distributeFewDays) return undefined;
    const inner = windowWidth - DAY_STRIP_H_PAD * 2;
    return (inner - (DAY_STRIP_VISIBLE_COUNT - 1) * DAY_STRIP_GAP_PX) / DAY_STRIP_VISIBLE_COUNT;
  }, [distributeFewDays, windowWidth]);

  const scrollToIndex = useCallback(
    (idx: number, animated: boolean, suppressMs = DAY_STRIP_SUPPRESS_SNAP_MS) => {
      const layout = chipLayouts.current.get(idx);
      let x: number;
      if (layout) {
        x = Math.max(0, layout.x + layout.width / 2 - windowWidth / 2);
      } else {
        x = Math.max(
          0,
          idx * (48 + DAY_STRIP_GAP_PX) - (windowWidth - 48) / 2
        );
      }
      scrollingByCode.current = true;
      suppressSnapPickUntil.current = Date.now() + suppressMs;
      scrollRef.current?.scrollTo({ x, animated });
      setTimeout(() => {
        scrollingByCode.current = false;
      }, animated ? 120 : 50);
    },
    [windowWidth]
  );

  useEffect(() => {
    if (dates.length === 0) return;
    const keys = dates.map((d) => toDateKeyInTimeZone(d, timeZone));
    let scrollKey: string;
    if (firstAlignRef.current && keys.includes(todayKey)) {
      scrollKey = todayKey;
      firstAlignRef.current = false;
    } else {
      scrollKey = selectedKey;
      if (firstAlignRef.current) firstAlignRef.current = false;
    }
    const idx = keys.indexOf(scrollKey);
    if (idx < 0) return;
    scrollToIndex(idx, false, DAY_STRIP_SUPPRESS_SNAP_INIT_MS);
  }, [dates, selectedKey, todayKey, timeZone, scrollToIndex]);

  const snapToNearest = useCallback(() => {
    if (Date.now() < suppressSnapPickUntil.current) return;
    if (scrollingByCode.current) return;
    if (dates.length === 0) return;

    const offsetX = lastOffsetX.current;
    const stripCenterX = offsetX + windowWidth / 2;

    let bestIdx = 0;
    let bestDist = Infinity;
    dates.forEach((_, i) => {
      const layout = chipLayouts.current.get(i);
      if (!layout) return;
      const cx = layout.x + layout.width / 2;
      const dist = Math.abs(cx - stripCenterX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });

    const nearestDate = dates[bestIdx];
    if (!nearestDate) return;
    const nearestKey = toDateKeyInTimeZone(nearestDate, timeZone);
    if (nearestKey === selectedKey) return;

    scrollingByCode.current = true;
    onSelect(nearestDate);
    scrollToIndex(bestIdx, false);
  }, [dates, onSelect, scrollToIndex, selectedKey, timeZone, windowWidth]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffsetX.current = event.nativeEvent.contentOffset.x;
      if (scrollingByCode.current) return;
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(snapToNearest, 130);
    },
    [snapToNearest]
  );

  const handleChipLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    chipLayouts.current.set(index, { x, width });
  }, []);

  const dayStripChipEnter = (chipIndex: number) =>
    reduceMotion || !entranceEnabled ? undefined : gamesDayStripChipEnter(chipIndex);

  function handleChipPress(day: Date) {
    scrollingByCode.current = true;
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    onSelect(day);
    setTimeout(() => {
      scrollingByCode.current = false;
    }, 180);
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={snapToNearest}
      onScrollEndDrag={snapToNearest}
      contentContainerStyle={[
        s.scrollContent,
        distributeFewDays && s.scrollContentFewDays,
      ]}
    >
      {dates.map((day, chipIdx) => {
        const dayKey = toDateKeyInTimeZone(day, timeZone);
        const selected = dayKey === selectedKey;
        const isTodayChip = dayKey === todayKey;
        const dayNum = Number(
          new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(day)
        );

        return (
          <Animated.View
            key={dayKey}
            entering={dayStripChipEnter(chipIdx)}
            style={[s.chipSlot, slotWidth != null ? { width: slotWidth } : null]}
            onLayout={(e) => handleChipLayout(chipIdx, e)}
          >
            <DayStripChipNative
              dayNum={dayNum}
              selected={selected}
              isToday={isTodayChip}
              onPress={() => handleChipPress(day)}
            />
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: DAY_STRIP_GAP_PX,
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: DAY_STRIP_H_PAD,
  },
  scrollContentFewDays: {
    flexGrow: 1,
    justifyContent: "space-evenly",
  },
  chipSlot: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
