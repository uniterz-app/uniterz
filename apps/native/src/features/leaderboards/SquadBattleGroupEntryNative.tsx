/**
 * Web `SquadBattleGroupEntry` 相当 — GROUP スロット一覧用エントリー。
 * アンバー戦闘 HUD。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../../theme/tokens";
import { CommunityCrtSectionLabelNative } from "./CommunityCrtPartsNative";

type Props = {
  language: string;
  onOpen: () => void;
};

const GOLD = "#FBBF24";
const GOLD_SOFT = "#FDE68A";
const TITLE = "#FFF8E7";

export default function SquadBattleGroupEntryNative({ language, onOpen }: Props) {
  const isEn = language === "en";

  return (
    <View style={styles.section}>
      <CommunityCrtSectionLabelNative accent="amber">
        {isEn ? ">> SQUAD BATTLE" : ">> スクワッドバトル"}
      </CommunityCrtSectionLabelNative>

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel="Squad Battle"
        style={({ pressed }) => [styles.cardOuter, pressed && styles.cardPressed]}
      >
        <LinearGradient
          colors={[
            "rgba(62,42,10,0.98)",
            "rgba(14,10,4,0.99)",
            "rgba(36,16,8,0.96)",
            "rgba(18,10,6,0.99)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardFill}
        >
          {/* 斜めハイライト */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,236,179,0.14)",
              "rgba(255,236,179,0.03)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.leftBar} pointerEvents="none" />

          <View style={styles.row}>
            <View style={styles.iconGlow} pointerEvents="none" />
            <LinearGradient
              colors={[
                "rgba(251,191,36,0.32)",
                "rgba(20,12,4,0.95)",
                "rgba(80,40,8,0.55)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <MaterialCommunityIcons
                name="sword-cross"
                size={20}
                color={GOLD_SOFT}
              />
            </LinearGradient>

            <View style={styles.copy}>
              <Text style={styles.title}>Squad Battle</Text>
            </View>

            <View style={styles.enterBtn}>
              <Text style={styles.enterText}>ENTER</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={14}
                color={TITLE}
              />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  cardOuter: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardFill: {
    minHeight: 96,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
    overflow: "hidden",
  },
  leftBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconGlow: {
    position: "absolute",
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: "rgba(251,191,36,0.22)",
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.metricExtra,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: TITLE,
    textShadowColor: "rgba(251,191,36,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  enterText: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    letterSpacing: 1.4,
    color: TITLE,
  },
});
