import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  nbaStatsWindowChipLabel,
  nbaStatsWindowHasMonth,
  nbaStatsWindowId,
  nbaStatsWindowListLabel,
  nbaStatsWindowSection,
  toggleNbaStatsMonth,
  type NbaStatsWindow,
} from "../../../../../../lib/nba/nbaStatsWindow";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

type Props = {
  windows: readonly NbaStatsWindow[];
  value: NbaStatsWindow;
  onChange: (next: NbaStatsWindow) => void;
  accent: string;
  language?: string;
};

const SECTION_LABEL = {
  season: { ja: "全体", en: "OVERALL" },
  month: { ja: "月", en: "MONTH" },
  last: { ja: "直近", en: "RECENT" },
} as const;

export default function NbaStatsWindowChipsNative({
  windows,
  value,
  onChange,
  accent,
  language,
}: Props) {
  const [open, setOpen] = useState(false);
  if (windows.length <= 1) return null;
  const ja = language === "ja";
  const lang = ja ? "ja" : "en";
  const activeId = nbaStatsWindowId(value);
  const groups = useMemo(() => {
    const out: Array<{
      section: ReturnType<typeof nbaStatsWindowSection>;
      items: NbaStatsWindow[];
    }> = [];
    for (const window of windows) {
      const section = nbaStatsWindowSection(window);
      const last = out[out.length - 1];
      if (!last || last.section !== section) out.push({ section, items: [window] });
      else last.items.push(window);
    }
    return out;
  }, [windows]);

  const pickExclusive = (next: NbaStatsWindow) => {
    onChange(next);
    setOpen(false);
  };

  const pickMonth = (month: number) => {
    onChange(toggleNbaStatsMonth(value, month));
  };

  const rowActive = (window: NbaStatsWindow): boolean => {
    if (window.kind === "months" && window.months.length === 1) {
      return nbaStatsWindowHasMonth(value, window.months[0]!);
    }
    return nbaStatsWindowId(window) === activeId;
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ja ? "期間を選ぶ" : "Choose period"}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: accent }]}
      >
        <Text style={[styles.triggerLabel, { color: accent }]}>
          {nbaStatsWindowChipLabel(value, lang)}
        </Text>
        <Text style={[styles.chev, { color: accent }]}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { borderColor: accent }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.eyebrow}>WINDOW</Text>
              <Text style={styles.title}>
                {ja ? "どの期間の数字？" : "Which stretch?"}
              </Text>
              <Text style={styles.hint}>
                {ja ? "月は複数選べる。直近はひとつ。" : "Months stack. Recent is one pick."}
              </Text>
            </View>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((group) => (
                <View key={group.section}>
                  <Text style={[styles.section, { color: accent }]}>
                    {ja ? SECTION_LABEL[group.section].ja : SECTION_LABEL[group.section].en}
                  </Text>
                  {group.items.map((window) => {
                    const id = nbaStatsWindowId(window);
                    const active = rowActive(window);
                    const monthOnly =
                      window.kind === "months" && window.months.length === 1
                        ? window.months[0]!
                        : null;
                    return (
                      <Pressable
                        key={id}
                        onPress={() =>
                          monthOnly != null
                            ? pickMonth(monthOnly)
                            : pickExclusive(window)
                        }
                        style={[
                          styles.row,
                          active ? { backgroundColor: accent } : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowLabel,
                            { color: active ? "#050508" : "#fff" },
                          ]}
                        >
                          {nbaStatsWindowListLabel(window, lang)}
                        </Text>
                        <Text
                          style={[
                            styles.rowMeta,
                            {
                              color: active
                                ? "rgba(5,5,8,0.55)"
                                : "rgba(255,255,255,0.4)",
                            },
                          ]}
                        >
                          {monthOnly != null
                            ? active
                              ? "✓"
                              : ""
                            : nbaStatsWindowChipLabel(window, lang)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.done, { backgroundColor: accent }]}
            >
              <Text style={styles.doneText}>{ja ? "完了" : "Done"}</Text>
            </Pressable>
            <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelText}>
                {ja ? "キャンセル" : "Cancel"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  triggerLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chev: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 16,
  },
  sheet: {
    maxHeight: "70%",
    borderWidth: 1,
    backgroundColor: "#0a0a0c",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  title: {
    marginTop: 6,
    color: "#fff",
    fontFamily: METRIC_FONT,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    transform: [{ skewX: "-8deg" }],
  },
  hint: {
    marginTop: 6,
    color: "rgba(255,255,255,0.45)",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingVertical: 6,
  },
  section: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "700",
    transform: [{ skewX: "-6deg" }],
  },
  rowMeta: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  done: {
    alignItems: "center",
    paddingVertical: 14,
  },
  doneText: {
    color: "#050508",
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cancel: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
  },
});
