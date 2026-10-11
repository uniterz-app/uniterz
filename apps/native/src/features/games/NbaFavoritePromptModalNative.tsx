/**
 * Native のみ — お気に入り未登録のユーザーがチーム／選手詳細を開いたときに一度だけ出す登録案内。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CYBER_LIST_CYAN } from "../../../../../lib/rankings/cyberRankVisual";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

export type NbaFavoritePromptKind = "team" | "player";

function storageKey(kind: NbaFavoritePromptKind, uid: string): string {
  return `uniterz:nbaFavoritePrompt:${kind}:${uid}`;
}

export async function hasSeenNbaFavoritePrompt(
  kind: NbaFavoritePromptKind,
  uid: string
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(kind, uid))) === "1";
  } catch {
    return true;
  }
}

export async function markNbaFavoritePromptSeen(
  kind: NbaFavoritePromptKind,
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(kind, uid), "1");
  } catch {
    // 端末保存に失敗しても次回もう一度出るだけ
  }
}

type Props = {
  open: boolean;
  kind: NbaFavoritePromptKind;
  language?: "ja" | "en";
  onConfirm: () => void;
  onLater: () => void;
};

export default function NbaFavoritePromptModalNative({
  open,
  kind,
  language = "ja",
  onConfirm,
  onLater,
}: Props) {
  const isJa = language === "ja";
  const isTeam = kind === "team";

  const title = isTeam
    ? isJa
      ? "お気に入りチームを登録しよう"
      : "Pick your favorite team"
    : isJa
      ? "お気に入り選手を登録しよう"
      : "Pick your favorite player";
  const body = isTeam
    ? isJa
      ? "★ をタップすると登録できます。プロフィールに表示されます（1 チームまで）"
      : "Tap ★ to save it. It shows on your profile (1 team)."
    : isJa
      ? "★ をタップすると登録できます。プロフィールに表示されます（1 人まで）"
      : "Tap ★ to save them. They show on your profile (1 player).";
  const confirm = isTeam
    ? isJa
      ? "このチームを登録する"
      : "Save this team"
    : isJa
      ? "この選手を登録する"
      : "Save this player";

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onLater}>
      <Pressable style={styles.backdrop} onPress={onLater}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.starTile}>
            <MaterialCommunityIcons name="star" size={26} color="#FCD34D" />
          </View>
          <Text style={styles.eyebrow}>FAVORITES</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [styles.confirm, pressed ? styles.pressed : null]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="star" size={15} color="#050508" />
            <Text style={styles.confirmText}>{confirm}</Text>
          </Pressable>
          <Pressable
            onPress={onLater}
            style={({ pressed }) => [styles.later, pressed ? styles.pressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.laterText}>{isJa ? "あとで" : "Later"}</Text>
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
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "#0a0a0c",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
    alignItems: "center",
  },
  starTile: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  eyebrow: {
    marginTop: 14,
    color: "rgba(252,211,77,0.8)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 6,
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  confirm: {
    marginTop: 20,
    alignSelf: "stretch",
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: CYBER_LIST_CYAN,
  },
  confirmText: {
    color: "#050508",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  later: {
    marginTop: 6,
    alignSelf: "stretch",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  laterText: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  pressed: {
    opacity: 0.8,
  },
});
