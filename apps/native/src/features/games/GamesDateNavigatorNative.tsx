import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import GamesDayStripNative from "./GamesDayStripNative";
import GamesMonthHeaderNative from "./GamesMonthHeaderNative";
import {
  gamesDayStripWrapperEntering,
  gamesMonthHeaderEntering,
} from "./gamesPageMotion";

type Props = {
  dates: Date[];
  selectedDate: Date;
  timeZone: string;
  language: "ja" | "en";
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMoveToToday: () => void;
  canPrevMonth: boolean;
  canNextMonth: boolean;
  monthNavBusy: boolean;
  entranceEnabled: boolean;
  reduceMotion: boolean;
  /** リーグ切替などでページ入場をやり直すキー */
  motionKey: string;
};

/** Web モバイル `GamesPage` の月ヘッダー＋`DayStrip` ブロック相当 */
export default function GamesDateNavigatorNative({
  dates,
  selectedDate,
  timeZone,
  language,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onMoveToToday,
  canPrevMonth,
  canNextMonth,
  monthNavBusy,
  entranceEnabled,
  reduceMotion,
  motionKey,
}: Props) {
  const webMotion = !reduceMotion;

  return (
    <View style={s.root}>
      <Animated.View
        key={`month-${motionKey}`}
        entering={webMotion ? gamesMonthHeaderEntering : undefined}
      >
        <GamesMonthHeaderNative
          month={selectedDate}
          language={language}
          timeZone={timeZone}
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          onMoveToToday={onMoveToToday}
          canPrev={canPrevMonth}
          canNext={canNextMonth}
          navBusy={monthNavBusy}
          centerDisabled={dates.length === 0}
        />
      </Animated.View>
      <Animated.View
        key={`day-strip-wrap-${motionKey}`}
        entering={webMotion ? gamesDayStripWrapperEntering : undefined}
      >
        <GamesDayStripNative
          dates={dates}
          selectedDate={selectedDate}
          timeZone={timeZone}
          onSelect={onSelectDate}
          entranceEnabled={entranceEnabled}
          reduceMotion={reduceMotion}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  /** Web `gamesHeaderMobileShellClass` の gap-1（4px） */
  root: {
    width: "100%",
    gap: 4,
  },
});
