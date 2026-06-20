import { useCallback, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { GAMES_HEADER_CONTROL_HEIGHT } from "./gamesMobileLayout";

const NUMERIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

type GamesMonthHeaderNativeProps = {
  month: Date;
  language: "ja" | "en";
  timeZone: string;
  onPrev: () => void;
  onNext: () => void;
  onMoveToToday: () => void;
  canPrev: boolean;
  canNext: boolean;
  navBusy: boolean;
  centerDisabled?: boolean;
};

/** Web `MonthHeader`（gamesHeaderAlign モバイル）相当 */
export default function GamesMonthHeaderNative({
  month,
  language,
  timeZone,
  onPrev,
  onNext,
  onMoveToToday,
  canPrev,
  canNext,
  navBusy,
  centerDisabled = false,
}: GamesMonthHeaderNativeProps) {
  const lastTapMs = useRef(0);

  const y = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(month)
  );
  const m = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, month: "2-digit" }).format(month)
  );
  const enMonthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    year: "numeric",
  }).format(month);

  const prevDisabled = navBusy || !canPrev;
  const nextDisabled = navBusy || !canNext;
  const centerDisabledCombined = centerDisabled;

  const handleCenterPress = useCallback(() => {
    if (centerDisabledCombined) return;
    const now = Date.now();
    if (now - lastTapMs.current < 320) {
      onMoveToToday();
      lastTapMs.current = 0;
    } else {
      lastTapMs.current = now;
    }
  }, [centerDisabledCombined, onMoveToToday]);

  return (
    <View style={s.root}>
      <Pressable
        style={[s.arrowBtn, s.arrowBtnLeft]}
        onPress={onPrev}
        disabled={prevDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: prevDisabled }}
      >
        <Text style={[s.arrowText, prevDisabled && s.arrowTextDisabled]}>←</Text>
      </Pressable>

      <Pressable
        style={s.centerBtn}
        onPress={handleCenterPress}
        disabled={centerDisabledCombined}
        accessibilityRole="button"
        accessibilityState={{ disabled: centerDisabledCombined }}
        accessibilityHint={
          language === "ja"
            ? "ダブルタップで当日の試合日へ"
            : "Double-tap to jump to the game day for today"
        }
      >
        {language === "ja" ? (
          <Text style={[s.centerText, centerDisabledCombined && s.centerTextDisabled]}>
            <Text style={s.centerNum}>{y}</Text>年{" "}
            <Text style={s.centerNum}>{m}</Text>月
          </Text>
        ) : (
          <Text
            style={[
              s.centerText,
              s.centerNum,
              centerDisabledCombined && s.centerTextDisabled,
            ]}
          >
            {enMonthLabel}
          </Text>
        )}
      </Pressable>

      <Pressable
        style={[s.arrowBtn, s.arrowBtnRight]}
        onPress={onNext}
        disabled={nextDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: nextDisabled }}
      >
        <Text style={[s.arrowText, nextDisabled && s.arrowTextDisabled]}>→</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    minHeight: GAMES_HEADER_CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    minHeight: 28,
    minWidth: 24,
    marginTop: -14,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  arrowBtnLeft: {
    left: 8,
  },
  arrowBtnRight: {
    right: 8,
  },
  arrowText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  arrowTextDisabled: {
    color: "rgba(255,255,255,0.25)",
  },
  centerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  centerText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  centerTextDisabled: {
    color: "rgba(255,255,255,0.35)",
  },
  centerNum: {
    fontFamily: NUMERIC_FONT,
  },
});
