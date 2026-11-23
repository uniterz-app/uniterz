/**
 * __DEV__ — 12月イベントモーダル（月間 / カップ / クリスマス）の見た目確認。
 * 既読には書かない。期間外も出せる。
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import EventModalNative from "./EventModalNative";
import { DECEMBER_2026_EVENT_NOTICES } from "../../../../../lib/campaigns/december2026Campaign";
import type { EventNoticeContent } from "../../../../../lib/events/eventNoticeTypes";
import type { Language } from "../../../../../lib/i18n/language";
import { JP_600, JP_700 } from "../profile/reports/reportThemeNative";

const LABELS = ["月間", "NBAカップ", "クリスマス"] as const;

export default function EventModalPreviewScreenNative({
  language,
  onClose,
}: {
  language: Language;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<EventNoticeContent | null>(null);

  return (
    <MobilePageShell title="12月イベント" onClose={onClose} eyebrow="DEV">
      <View style={styles.body}>
        <Text style={styles.hint}>期間外も出せる。OK しても既読にしない。</Text>
        {DECEMBER_2026_EVENT_NOTICES.map((event, i) => (
          <Pressable
            key={event.id}
            onPress={() => setPicked(event)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.rowLabel}>{LABELS[i] ?? event.title}</Text>
            <Text style={styles.rowTitle}>{event.title}</Text>
          </Pressable>
        ))}
      </View>
      {picked ? (
        <EventModalNative
          event={picked}
          language={language}
          onClose={() => setPicked(null)}
        />
      ) : null}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: JP_600,
    fontSize: 12,
    marginBottom: 4,
  },
  row: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: "rgba(0,245,255,0.14)",
  },
  rowLabel: {
    color: "#00f5ff",
    fontFamily: JP_700,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  rowTitle: {
    color: "#f8fafc",
    fontFamily: JP_700,
    fontSize: 16,
  },
});
