/**
 * Web `/dev/unit-earn-celebrate-preview` 相当
 */
import { useCallback, useRef, useState } from "react";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import UnitEarnCelebrateOverlayNative from "../screens/UnitEarnCelebrateOverlayNative";
import UnitEarnVaultSettleFlyNative, {
  type UnitEarnFlyPayloadNative,
} from "../screens/UnitEarnVaultSettleFlyNative";
import { useCountUp } from "../../../../../../lib/hooks/useCountUp";
import {
  UNIT_EARN_CELEBRATE_MOTION_MS,
  UNIT_EARN_CELEBRATE_PREVIEW_PRESETS,
  type UnitEarnCelebratePresetId,
  unitEarnCelebrateContent,
} from "../../../../../../lib/units/unitEarnCelebrate";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

const PREVIEW_BALANCE_START = 1240;
const UNIT_GOLD = "#f6c344";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onOpenUnitLedger?: () => void;
};

export default function UnitEarnCelebratePreviewScreenNative({
  language,
  onClose,
  onOpenUnitLedger,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [presetId, setPresetId] =
    useState<UnitEarnCelebratePresetId>("monthly-rank-1");
  const [open, setOpen] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [balanceTarget, setBalanceTarget] = useState(PREVIEW_BALANCE_START);
  const [fly, setFly] = useState<UnitEarnFlyPayloadNative | null>(null);

  const cardRef = useRef<View>(null);
  const vaultRef = useRef<View>(null);
  const vaultPulse = useSharedValue(1);

  const content = unitEarnCelebrateContent(presetId, isJa);
  const displayBalance = useCountUp(
    balanceTarget,
    UNIT_EARN_CELEBRATE_MOTION_MS.balanceCountMs,
    true,
    0,
    "target"
  );

  const vaultPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vaultPulse.value }],
  }));

  const applyBalance = useCallback((amount: number) => {
    setBalanceTarget((b) => b + amount);
    vaultPulse.value = withSequence(
      withTiming(1.08, { duration: UNIT_EARN_CELEBRATE_MOTION_MS.vaultPulseMs / 2 }),
      withTiming(1, { duration: UNIT_EARN_CELEBRATE_MOTION_MS.vaultPulseMs / 2 })
    );
  }, [vaultPulse]);

  const replay = useCallback(() => {
    setFly(null);
    setBalanceTarget(PREVIEW_BALANCE_START);
    setOpen(true);
    setReplayKey((k) => k + 1);
  }, []);

  const startFlyThenCredit = useCallback(() => {
    const card = cardRef.current;
    const vault = vaultRef.current;
    if (!card || !vault) {
      applyBalance(content.amount);
      return;
    }
    card.measureInWindow((cx, cy, cw, ch) => {
      vault.measureInWindow((vx, vy, vw, vh) => {
        setFly({
          label: content.amountHero,
          fromX: cx + cw / 2 - 40,
          fromY: cy + ch * 0.38,
          toX: vx + vw / 2 - 40,
          toY: vy + vh / 2 - 16,
        });
      });
    });
  }, [applyBalance, content.amount, content.amountHero]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View ref={cardRef} style={styles.mockCard} collapsable={false}>
        <Text style={styles.mockLabel}>Profile mock</Text>
        <View style={styles.mockInner}>
          <View style={styles.mockAvatar} />
          <Animated.View
            ref={vaultRef}
            style={[styles.vault, vaultPulseStyle]}
            collapsable={false}
          >
            <View style={styles.vaultDisc}>
              <Text style={styles.vaultU}>U</Text>
            </View>
            <Text style={styles.vaultValue}>
              {displayBalance.toLocaleString("en-US")}
            </Text>
          </Animated.View>
        </View>
        <View style={styles.mockLineWide} />
        <View style={styles.mockLineNarrow} />
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
          <Text style={styles.controlsTitle}>Unit earn</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
        >
          {UNIT_EARN_CELEBRATE_PREVIEW_PRESETS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setPresetId(p.id);
                replay();
              }}
              style={[
                styles.presetBtn,
                presetId === p.id && styles.presetBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  presetId === p.id && styles.presetBtnTextActive,
                ]}
              >
                {p.id.replace(/-/g, " ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.hint}>
          {content.title} · {content.amountHero} UNIT
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.replayBtn} onPress={replay}>
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={UNIT_GOLD}
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

      <UnitEarnCelebrateOverlayNative
        open={open}
        presetId={presetId}
        isJa={isJa}
        replayKey={replayKey}
        onClose={() => {
          setOpen(false);
          applyBalance(content.amount);
        }}
        onClaim={() => {
          setOpen(false);
          startFlyThenCredit();
        }}
        onViewHistory={() => {
          setOpen(false);
          applyBalance(content.amount);
          if (onOpenUnitLedger) {
            onOpenUnitLedger();
            return;
          }
          Alert.alert(isJa ? "本番" : "Production", content.historyLabel);
        }}
      />

      <UnitEarnVaultSettleFlyNative
        fly={fly}
        onComplete={() => {
          setFly(null);
          applyBalance(content.amount);
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
  mockCard: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
  },
  mockLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  mockInner: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mockAvatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  vault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  vaultDisc: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: UNIT_GOLD,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: UNIT_GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  vaultU: {
    fontSize: 10,
    fontWeight: "800",
    color: "#241902",
  },
  vaultValue: {
    fontSize: 18,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#ffe9a8",
    fontVariant: ["tabular-nums"],
  },
  mockLineWide: {
    marginTop: 16,
    height: 12,
    width: "66%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mockLineNarrow: {
    marginTop: 8,
    height: 10,
    width: "50%",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  controls: {
    borderTopWidth: 1,
    borderTopColor: "rgba(251,191,36,0.2)",
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
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  controlsTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(251,191,36,0.7)",
    textTransform: "uppercase",
  },
  presetRow: { flexDirection: "row", gap: 6 },
  presetBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  presetBtnActive: {
    borderColor: "rgba(251,191,36,0.5)",
    backgroundColor: "rgba(251,191,36,0.12)",
  },
  presetBtnText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  presetBtnTextActive: { color: "#fde68a" },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.45)" },
  actionRow: { flexDirection: "row", gap: 8 },
  replayBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
    paddingVertical: 12,
  },
  replayBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: UNIT_GOLD,
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
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
});
