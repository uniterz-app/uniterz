/** 無料ユーザーがピックアップ以外の試合を予想したあとの Pro 案内（見た目は `DayCompleteInviteModalNative` と同系） */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";
import { JP_600, JP_700 } from "../profile/reports/reportThemeNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import { openProSubscribeNative } from "../../navigation/navigationRef";
import {
  isProLeagueUpsellDue,
  proLeagueUpsellCopy,
  proLeagueUpsellStorageKey,
} from "../../../../../lib/pro/proLeagueUpsell";
import { PRO_LEAGUE_ATMOSPHERE } from "../../../../../lib/rankings/proLeagueAtmosphere";

export async function readProLeagueUpsellDueNative(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(proLeagueUpsellStorageKey(uid));
    return isProLeagueUpsellDue(raw == null ? null : Number(raw));
  } catch {
    return false;
  }
}

export async function writeProLeagueUpsellShownNative(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(proLeagueUpsellStorageKey(uid), String(Date.now()));
  } catch {
    // 無視
  }
}

type Props = {
  visible: boolean;
  language?: string | null;
  onClose: () => void;
};

export default function ProLeagueUpsellModalNative({
  visible,
  language,
  onClose,
}: Props) {
  const copy = proLeagueUpsellCopy(language);

  const handleSeePro = useCallback(() => {
    onClose();
    // モーダルが閉じ切る前に次の画面を重ねると iOS で表示されない
    setTimeout(() => openProSubscribeNative(), 400);
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <View style={styles.logo}>
            <UniterzLogoNative width={92} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Text style={styles.trial}>{copy.trial}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.cta}
            onPress={handleSeePro}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.primaryText}>{copy.cta}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.later}
            onPress={onClose}
            style={styles.laterBtn}
          >
            <Text style={styles.laterText}>{copy.later}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const GOLD = PRO_LEAGUE_ATMOSPHERE.gold;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    backgroundColor: "#07090d",
    borderWidth: 1,
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
  },
  eyebrow: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: GOLD,
    textAlign: "center",
  },
  logo: {
    marginTop: 10,
    alignItems: "center",
  },
  title: {
    marginTop: 12,
    fontFamily: JP_700,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
  },
  body: {
    marginTop: 10,
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    color: "rgba(226,246,255,0.75)",
    textAlign: "center",
  },
  trial: {
    marginTop: 8,
    fontFamily: JP_600,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    color: "#ffe9a8",
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 20,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: GOLD,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    fontFamily: JP_700,
    fontSize: 14,
    fontWeight: "800",
    color: PRO_LEAGUE_ATMOSPHERE.ink,
  },
  laterBtn: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  laterText: {
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
