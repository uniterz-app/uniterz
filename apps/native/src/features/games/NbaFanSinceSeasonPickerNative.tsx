/**
 * Web `NbaFanSinceSeasonPicker` 相当 — ファン歴シーズン選択。
 */
import { useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nbaFanSinceSeasonKeys } from "../../../../../lib/profile/nbaFavorites";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonShortLabel,
} from "../../../../../lib/rankings/nbaSeason";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

type Props = {
  open: boolean;
  language?: "ja" | "en";
  teamLabel?: string;
  initialSeason?: string;
  onPick: (seasonKey: string) => void;
  onCancel: () => void;
};

export default function NbaFanSinceSeasonPickerNative({
  open,
  language = "ja",
  teamLabel,
  initialSeason = CURRENT_NBA_SEASON_KEY,
  onPick,
  onCancel,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const seasons = useMemo(() => nbaFanSinceSeasonKeys(), []);
  const initialIndex = Math.max(
    0,
    seasons.findIndex((k) => k === initialSeason)
  );

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.sheet,
            { marginBottom: Math.max(12, insets.bottom) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>FAN SINCE</Text>
            <Text style={styles.title}>
              {teamLabel
                ? isJa
                  ? `${teamLabel} のファンはいつから？`
                  : `Fan of ${teamLabel} since…`
                : isJa
                  ? "いつからファン？"
                  : "Fan since…"}
            </Text>
          </View>
          <FlatList
            data={seasons}
            keyExtractor={(k) => k}
            style={styles.list}
            initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
            getItemLayout={(_, index) => ({
              length: 48,
              offset: 48 * index,
              index,
            })}
            renderItem={({ item }) => {
              const active = item === initialSeason;
              return (
                <Pressable
                  onPress={() => onPick(item)}
                  style={[styles.row, active ? styles.rowActive : null]}
                >
                  <Text
                    style={[
                      styles.rowLabel,
                      active ? styles.rowLabelActive : null,
                    ]}
                  >
                    {nbaSeasonShortLabel(item)}
                  </Text>
                  <Text
                    style={[
                      styles.rowMeta,
                      active ? styles.rowMetaActive : null,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
          <Pressable onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>
              {isJa ? "キャンセル" : "Cancel"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 16,
  },
  sheet: {
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "#0a0a0c",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: {
    color: "rgba(252,211,77,0.9)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  title: {
    marginTop: 6,
    color: "#fff",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    transform: [{ skewX: "-8deg" }],
  },
  list: {
    maxHeight: 320,
  },
  row: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  rowActive: {
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  rowLabel: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 15,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  rowLabelActive: {
    color: "#FEF3C7",
  },
  rowMeta: {
    color: "rgba(255,255,255,0.45)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
  },
  rowMetaActive: {
    color: "rgba(253,230,138,0.7)",
  },
  cancel: {
    margin: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
