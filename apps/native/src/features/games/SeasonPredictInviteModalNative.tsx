/**
 * Web `SeasonPredictInviteModal` 相当 — シーズン予想の案内（Games チュートリアル後に 1 回だけ）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  seasonPredictInviteCopy,
  seasonPredictInviteStorageKey,
} from "../../../../../lib/predict/seasonPredictInvite";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

export async function readSeasonPredictInviteSeenNative(
  uid: string
): Promise<boolean> {
  try {
    return (
      (await AsyncStorage.getItem(seasonPredictInviteStorageKey(uid))) === "1"
    );
  } catch {
    return true;
  }
}

export async function writeSeasonPredictInviteSeenNative(
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(seasonPredictInviteStorageKey(uid), "1");
  } catch {
    // 無視
  }
}

type Props = {
  open: boolean;
  language?: string | null;
  awardsLabel: string;
  standingsLabel: string;
  awardsPending: boolean;
  standingsPending: boolean;
  onAwards: () => void;
  onStandings: () => void;
  onLater: () => void;
};

export default function SeasonPredictInviteModalNative({
  open,
  language,
  awardsLabel,
  standingsLabel,
  awardsPending,
  standingsPending,
  onAwards,
  onStandings,
  onLater,
}: Props) {
  const insets = useSafeAreaInsets();
  const copy = seasonPredictInviteCopy(language);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onLater}>
      <Pressable style={styles.backdrop} onPress={onLater}>
        <Pressable
          style={[styles.sheet, { marginBottom: Math.max(12, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
            <Text style={styles.deadline}>
              <Text style={styles.deadlineLabel}>{copy.deadlineLabel}</Text>
              {"  "}
              {copy.deadline}
            </Text>
          </View>
          <View style={styles.actions}>
            {awardsPending ? (
              <Pressable
                onPress={onAwards}
                style={({ pressed }) => [styles.btn, styles.btnAction, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnActionText}>{awardsLabel}</Text>
              </Pressable>
            ) : null}
            {standingsPending ? (
              <Pressable
                onPress={onStandings}
                style={({ pressed }) => [styles.btn, styles.btnAction, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnActionText}>{standingsLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onLater}
              style={({ pressed }) => [styles.btn, styles.btnLater, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnLaterText}>{copy.later}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "#0a0a0c",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyebrow: {
    color: "rgba(252,211,77,0.85)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 15,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  body: {
    marginTop: 8,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 19,
  },
  deadline: {
    marginTop: 12,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    lineHeight: 17,
  },
  deadlineLabel: {
    color: "rgba(252,211,77,0.85)",
  },
  actions: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    padding: 8,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingVertical: 12,
    borderWidth: 1,
  },
  btnAction: {
    borderColor: "rgba(252,211,77,0.45)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  btnLater: {
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnActionText: {
    color: "#FEF3C7",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  btnLaterText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
