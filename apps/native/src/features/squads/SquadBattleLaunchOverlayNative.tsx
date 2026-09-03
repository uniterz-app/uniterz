/**
 * Web `SquadBattleLaunchOverlay` 相当。開催告知のたたき台。
 */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../theme/tokens";
import {
  SQUAD_BATTLE_LAUNCH_CTA,
  SQUAD_BATTLE_LAUNCH_FACTS,
  SQUAD_BATTLE_LAUNCH_KICKER,
  SQUAD_BATTLE_LAUNCH_LEAD,
  SQUAD_BATTLE_LAUNCH_LATER,
  SQUAD_BATTLE_LAUNCH_TITLE,
  SQUAD_INVITE_DEADLINE_PREFIX,
} from "../../../../../lib/squads/squadBattleUiCopy";
import { SQUAD_GOLD_NATIVE } from "../../../../../lib/squads/squadBattleGoldTheme";
import { markSquadBattleLaunchSeenNative } from "./squadBattleLaunchSeenNative";

type Props = {
  visible: boolean;
  onClose: () => void;
  onEnter: () => void;
  deadlineLabel?: string | null;
  battleId?: string | null;
};

export default function SquadBattleLaunchOverlayNative({
  visible,
  onClose,
  onEnter,
  deadlineLabel,
  battleId,
}: Props) {
  const deadline = deadlineLabel?.trim() || null;

  async function dismiss() {
    await markSquadBattleLaunchSeenNative(battleId);
    onClose();
  }

  async function enter() {
    await markSquadBattleLaunchSeenNative(battleId);
    onEnter();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        void dismiss();
      }}
    >
      <Pressable style={styles.backdrop} onPress={() => void dismiss()}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={["rgba(42,30,10,0.98)", "rgba(10,8,5,0.99)"]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.inner}>
            <View style={styles.kickerRow}>
              <View style={styles.dot} />
              <Text style={styles.kicker}>{SQUAD_BATTLE_LAUNCH_KICKER}</Text>
            </View>
            <Text style={styles.title}>{SQUAD_BATTLE_LAUNCH_TITLE}</Text>
            <Text style={styles.lead}>{SQUAD_BATTLE_LAUNCH_LEAD}</Text>
            <Text style={styles.deadline}>
              {deadline
                ? `${SQUAD_INVITE_DEADLINE_PREFIX} ${deadline}`
                : SQUAD_INVITE_DEADLINE_PREFIX}
            </Text>
            <View style={styles.facts}>
              {SQUAD_BATTLE_LAUNCH_FACTS.map((fact) => (
                <View key={fact.kicker} style={styles.factRow}>
                  <Text style={styles.factKicker}>{fact.kicker}</Text>
                  <Text style={styles.factValue}>{fact.value}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => {
                void enter();
              }}
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={SQUAD_BATTLE_LAUNCH_CTA}
            >
              <Text style={styles.ctaText}>{SQUAD_BATTLE_LAUNCH_CTA}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void dismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={SQUAD_BATTLE_LAUNCH_LATER}
            >
              <Text style={styles.later}>{SQUAD_BATTLE_LAUNCH_LATER}</Text>
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
    backgroundColor: "rgba(5,3,8,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.45)",
  },
  inner: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
  },
  kicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.8)",
  },
  title: {
    fontFamily: fonts.metricExtra,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#FFF7E6",
  },
  lead: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.62)",
  },
  deadline: {
    marginTop: 16,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(254,243,199,0.7)",
  },
  facts: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,191,36,0.2)",
    paddingTop: 12,
  },
  factRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  factKicker: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.5)",
  },
  factValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.7)",
  },
  cta: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: SQUAD_GOLD_NATIVE.acc,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.accOn,
  },
  later: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
});
