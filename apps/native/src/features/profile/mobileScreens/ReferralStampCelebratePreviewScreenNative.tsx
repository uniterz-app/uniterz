/**
 * Web `/dev/referral-stamp-celebrate-preview` 相当（Native）
 */
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReferralStampCelebrateOverlayNative from "../screens/ReferralStampCelebrateOverlayNative";
import { REFERRAL_REFERRER_MAX_COMPLETED } from "../../../../../../lib/referral/referralRewards";
import { referralStampCelebrateContent } from "../../../../../../lib/referral/referralStampCelebrate";
import {
  REFERRAL_MILESTONE_STAMP_TONE,
  referralStampToneForSlot,
} from "../../../../../../lib/referral/referralStampBoard";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

const SLOTS = Array.from(
  { length: REFERRAL_REFERRER_MAX_COMPLETED },
  (_, i) => i + 1
);

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onOpenInvite?: () => void;
};

export default function ReferralStampCelebratePreviewScreenNative({
  language,
  onClose,
  onOpenInvite,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [slotIndex, setSlotIndex] = useState(3);
  const [open, setOpen] = useState(true);
  const [replayKey, setReplayKey] = useState(0);

  const content = referralStampCelebrateContent(slotIndex, isJa);

  const replay = useCallback(() => {
    setOpen(true);
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.mockProfile} pointerEvents="none">
        <Text style={styles.mockLabel}>Profile mock</Text>
        <View style={styles.mockCard} />
        <View style={styles.mockLineWide} />
        <View style={styles.mockLineNarrow} />
        <View style={styles.mockGrid}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.mockGridCell} />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.controls,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.controlsHeader}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
          <Text style={styles.controlsTitle}>Stamp celebrate</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotRow}
        >
          {SLOTS.map((n) => {
            const active = n === slotIndex;
            const isMs = n in REFERRAL_MILESTONE_STAMP_TONE;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  setSlotIndex(n);
                  setOpen(true);
                  setReplayKey((k) => k + 1);
                }}
                style={[
                  styles.slotBtn,
                  active && styles.slotBtnActive,
                  isMs && !active && styles.slotBtnMilestone,
                ]}
              >
                <Text
                  style={[
                    styles.slotBtnText,
                    active && styles.slotBtnTextActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.hint}>
          {content.description} · {content.unitsLine}
          {content.bonusUnits > 0 ? " · milestone" : ""}
        </Text>
        <Text style={styles.toneHint}>
          tone: {referralStampToneForSlot(slotIndex)}
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.replayBtn} onPress={replay}>
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={CYBER_TAB_CYAN}
            />
            <Text style={styles.replayBtnText}>Replay</Text>
          </Pressable>
          <Pressable
            style={styles.hideBtn}
            onPress={() => setOpen((v) => !v)}
          >
            <Text style={styles.hideBtnText}>{open ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
      </View>

      <ReferralStampCelebrateOverlayNative
        open={open}
        slotIndex={slotIndex}
        isJa={isJa}
        replayKey={replayKey}
        onClose={() => setOpen(false)}
        onViewStampRally={() => {
          if (onOpenInvite) {
            onOpenInvite();
            return;
          }
          Alert.alert(
            isJa ? "本番" : "Production",
            isJa
              ? "招待スタンプラリーへ遷移します"
              : "Navigates to invite stamp rally"
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05080c",
  },
  mockProfile: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    opacity: 0.4,
  },
  mockLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(103,232,249,0.5)",
    textTransform: "uppercase",
  },
  mockCard: {
    marginTop: 16,
    height: 112,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  mockLineWide: {
    marginTop: 12,
    height: 16,
    width: "66%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mockLineNarrow: {
    marginTop: 8,
    height: 12,
    width: "50%",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  mockGrid: {
    marginTop: 24,
    flexDirection: "row",
    gap: 8,
  },
  mockGridCell: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  controls: {
    borderTopWidth: 1,
    borderTopColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(7,11,16,0.96)",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  controlsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(103,232,249,0.7)",
    textTransform: "uppercase",
  },
  slotRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  slotBtn: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
  },
  slotBtnActive: {
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "rgba(34,211,238,0.2)",
  },
  slotBtnMilestone: {
    borderColor: "rgba(251,191,36,0.25)",
  },
  slotBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
  },
  slotBtnTextActive: {
    color: CYBER_TAB_CYAN,
  },
  hint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  toneHint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  replayBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(34,211,238,0.12)",
    paddingVertical: 12,
  },
  replayBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: CYBER_TAB_CYAN,
    textTransform: "uppercase",
  },
  hideBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  hideBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
});
