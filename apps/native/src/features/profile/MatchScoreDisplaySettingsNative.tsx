/** Web `MatchScoreDisplaySettings` 相当 — 設定画面のスコア表示トグル（押した瞬間に保存） */
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import { useMatchScoreDisplayPrefsNative } from "../games/useMatchScoreDisplayPrefsNative";
import {
  matchScoreDisplayCopy,
  type MatchScoreDisplayPrefKey,
} from "../../../../../lib/games/matchScoreDisplayPrefs";

export default function MatchScoreDisplaySettingsNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const { prefs, updatePref } = useMatchScoreDisplayPrefsNative(fUser?.uid);
  const copy = matchScoreDisplayCopy(language);

  const rows: Array<{ key: MatchScoreDisplayPrefKey; title: string; desc: string }> = [
    { key: "showLiveScore", title: copy.liveTitle, desc: copy.liveDesc },
    { key: "showFinalScore", title: copy.finalTitle, desc: copy.finalDesc },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{copy.section}</Text>
      <Text style={styles.sectionHint}>{copy.hint}</Text>
      {rows.map((row, i) => (
        <View key={row.key} style={[styles.row, i > 0 && styles.rowBorder]}>
          <View style={styles.textCol}>
            <Text style={styles.title}>{row.title}</Text>
            <Text style={styles.desc}>{row.desc}</Text>
          </View>
          <Switch
            value={prefs[row.key]}
            onValueChange={(value) => void updatePref(row.key, value)}
            disabled={!fUser}
            trackColor={{
              false: "rgba(51,65,85,0.9)",
              true: "rgba(6,182,212,0.55)",
            }}
            thumbColor={
              Platform.OS === "android"
                ? prefs[row.key]
                  ? "#67e8f9"
                  : "#94a3b8"
                : undefined
            }
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: "#a5f3fc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 4,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  desc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 15,
  },
});
