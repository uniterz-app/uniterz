/**
 * Games 日付ストリップ用の月カレンダー。試合のある日だけ押せて、選ぶとその日へ飛ぶ。
 */
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

const OX = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
}) as string;

const ACCENT = "#22d3ee";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: string;
  /** 試合のある日（YYYY-MM-DD、日付ストリップと同じタイムゾーン） */
  gameDayKeys: readonly string[];
  /** 日付キー → その日の試合数。未取得なら null（数は出さない） */
  gameCountByKey?: Record<string, number> | null;
  selectedKey: string;
  todayKey: string;
  onSelectKey: (key: string) => void;
};

function monthOf(key: string): string {
  return key.slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 日曜始まりの 6 週以内グリッド。月外は null */
function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function monthTitle(month: string, lang: ReturnType<typeof resolveLocalizedLang>) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  if (lang === "ja" || lang === "zh") return `${y}年 ${m}月`;
  if (lang === "ko") return `${y}년 ${m}월`;
  const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `${name.toUpperCase()} ${y}`;
}

export default function GamesCalendarSheetNative({
  visible,
  onClose,
  language,
  gameDayKeys,
  gameCountByKey,
  selectedKey,
  todayKey,
  onSelectKey,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const [month, setMonth] = useState(() => monthOf(selectedKey));

  useEffect(() => {
    if (visible) setMonth(monthOf(selectedKey));
  }, [visible, selectedKey]);

  const gameSet = useMemo(() => new Set(gameDayKeys), [gameDayKeys]);
  const [minMonth, maxMonth] = useMemo(() => {
    if (gameDayKeys.length === 0) return [month, month];
    const sorted = [...gameDayKeys].sort();
    return [monthOf(sorted[0]!), monthOf(sorted[sorted.length - 1]!)];
  }, [gameDayKeys, month]);

  const cells = useMemo(() => monthGrid(month), [month]);
  const canPrev = month > minMonth;
  const canNext = month < maxMonth;

  const weekdays =
    lang === "ja"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : lang === "zh"
        ? ["日", "一", "二", "三", "四", "五", "六"]
        : lang === "ko"
          ? ["일", "월", "화", "수", "목", "금", "토"]
          : ["S", "M", "T", "W", "T", "F", "S"];

  const title = L(lang, {
    ja: "日付を選ぶ",
    en: "PICK A DATE",
    ko: "날짜 선택",
    zh: "选择日期",
    es: "ELEGIR FECHA",
    pt: "ESCOLHER DATA",
    fr: "CHOISIR UNE DATE",
  });
  const todayLabel = L(lang, {
    ja: "今日",
    en: "TODAY",
    ko: "오늘",
    zh: "今天",
    es: "HOY",
    pt: "HOJE",
    fr: "AUJ.",
  });

  const countLabel = (n: number) =>
    lang === "ja"
      ? `${n}試合`
      : lang === "ko"
        ? `${n}경기`
        : lang === "zh"
          ? `${n}场`
          : `${n} G`;

  const jumpToday = () => {
    const sorted = [...gameDayKeys].sort();
    const next = sorted.find((k) => k >= todayKey) ?? sorted[sorted.length - 1];
    if (next) {
      onSelectKey(next);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(140)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View entering={ZoomIn.duration(180)} style={styles.card}>
            <View style={styles.headRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color="rgba(224,250,254,0.75)"
                />
              </Pressable>
            </View>

            <View style={styles.monthRow}>
              <Pressable
                onPress={() => canPrev && setMonth((m) => shiftMonth(m, -1))}
                disabled={!canPrev}
                hitSlop={10}
                style={!canPrev ? styles.navDisabled : null}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={ACCENT} />
              </Pressable>
              <Text style={styles.monthText}>{monthTitle(month, lang)}</Text>
              <Pressable
                onPress={() => canNext && setMonth((m) => shiftMonth(m, 1))}
                disabled={!canNext}
                hitSlop={10}
                style={!canNext ? styles.navDisabled : null}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color={ACCENT} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((w, i) => (
                <Text
                  key={`${w}-${i}`}
                  style={[
                    styles.weekText,
                    i === 0 ? styles.sun : i === 6 ? styles.sat : null,
                  ]}
                >
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((key, i) => {
                if (!key) return <View key={`empty-${i}`} style={styles.cell} />;
                const hasGame = gameSet.has(key);
                const selected = key === selectedKey;
                const isToday = key === todayKey;
                const count = hasGame ? (gameCountByKey?.[key] ?? 0) : 0;
                return (
                  <View key={key} style={styles.cell}>
                    <Pressable
                      disabled={!hasGame}
                      onPress={() => {
                        onSelectKey(key);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.day,
                        hasGame ? styles.dayGame : null,
                        isToday ? styles.dayToday : null,
                        selected ? styles.daySelected : null,
                        pressed ? styles.dayPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          hasGame ? styles.dayTextGame : styles.dayTextOff,
                          selected ? styles.dayTextSelected : null,
                        ]}
                      >
                        {Number(key.slice(8))}
                      </Text>
                      {count > 0 ? (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.countText,
                            selected ? styles.countTextSelected : null,
                          ]}
                        >
                          {countLabel(count)}
                        </Text>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={jumpToday}
              style={({ pressed }) => [styles.todayBtn, pressed ? styles.dayPressed : null]}
            >
              <Text style={styles.todayBtnText}>{todayLabel}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    backgroundColor: "#05080e",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: OX,
    fontSize: 12,
    letterSpacing: 1.6,
    color: "rgba(165,243,252,0.9)",
  },
  monthRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navDisabled: {
    opacity: 0.25,
  },
  monthText: {
    fontFamily: OX,
    fontSize: 17,
    color: "#fff",
    letterSpacing: 1,
  },
  weekRow: {
    marginTop: 12,
    flexDirection: "row",
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    fontFamily: OX,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  sun: { color: "rgba(248,113,113,0.75)" },
  sat: { color: "rgba(96,165,250,0.8)" },
  grid: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  dayGame: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: "#FBBF24",
  },
  daySelected: {
    backgroundColor: "#9333EA",
    borderColor: "#C084FC",
  },
  dayPressed: {
    opacity: 0.7,
  },
  dayText: {
    fontFamily: OX,
    fontSize: 14,
  },
  dayTextGame: { color: "#fff" },
  dayTextOff: { color: "rgba(255,255,255,0.22)" },
  dayTextSelected: { color: "#fff" },
  countText: {
    fontFamily: OX,
    fontSize: 9,
    letterSpacing: 0.2,
    color: ACCENT,
  },
  countTextSelected: { color: "#F3E8FF" },
  todayBtn: {
    marginTop: 10,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 4,
  },
  todayBtnText: {
    fontFamily: OX,
    fontSize: 12,
    letterSpacing: 1.4,
    color: "#FBBF24",
  },
});
