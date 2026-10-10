/** Web `ReferralPreseasonInviteCard` 相当 — シーズン予想を両方提出した直後の招待カード */
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fonts } from "../../theme/tokens";
import { JP_600, JP_700 } from "../profile/reports/reportThemeNative";
import { fetchMeReferralNative } from "../profile/referralApiNative";
import { cyberAlert } from "../../components/cyberAlert";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import { referralPreseasonInviteCopy } from "../../../../../lib/referral/referralPreseasonBonus";

const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ||
  "https://uniterz.app";

type Props = {
  visible: boolean;
  language?: string | null;
  onClose: () => void;
};

export default function ReferralPreseasonInviteCardNative({
  visible,
  language,
  onClose,
}: Props) {
  const copy = referralPreseasonInviteCopy(language);
  const [busy, setBusy] = useState(false);

  const handleInvite = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await fetchMeReferralNative();
      const path = data.invitePath || data.inviteUrl || "";
      const url = path.startsWith("http")
        ? path
        : `${WEB_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
      onClose();
      // モーダルが閉じ切る前に共有シートを出すと iOS で表示されない
      await new Promise((r) => setTimeout(r, 400));
      await Share.share({ message: copy.shareMessage(data.inviteCode, url), url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e ?? "");
      if (msg) cyberAlert("", msg);
    } finally {
      setBusy(false);
    }
  }, [busy, copy, onClose]);

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.invite}
            disabled={busy}
            onPress={() => void handleInvite()}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed || busy ? styles.pressed : null,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#041018" />
            ) : (
              <Text style={styles.primaryText}>{copy.invite}</Text>
            )}
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

const CYBER_CYAN = "#00F5FF";

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
    borderColor: "rgba(0,245,255,0.35)",
  },
  eyebrow: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#ffe9a8",
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
  primaryBtn: {
    marginTop: 20,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: CYBER_CYAN,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    fontFamily: JP_700,
    fontSize: 14,
    fontWeight: "800",
    color: "#041018",
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
