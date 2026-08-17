/**
 * Web `SquadBattleGroupEntry` 相当 — GROUP スロット一覧用エントリー。
 * アンバー戦闘 HUD。
 */
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../../theme/tokens";
import { CommunityCrtSectionLabelNative } from "./CommunityCrtPartsNative";
import {
  squadBattleEntryStatusChip,
  type SquadBattleUiPhase,
} from "../../../../../lib/squads/squadBattleUiCopy";

type Props = {
  language: string;
  onOpen: () => void;
  /** 開催フェーズ（未指定は BATTLE） */
  phase?: SquadBattleUiPhase;
  /** 自分の順位（バトル中チップ用） */
  myRank?: number | null;
  /** ENTRY 締切ラベル */
  deadlineLabel?: string | null;
};

const GOLD = "#FBBF24";
const TITLE = "#FFF8E7";

/** Web `/squad-battle/icon.png` 相当 */
const SQUAD_BATTLE_ICON = require("../../../assets/squad-battle/icon.png");

export default function SquadBattleGroupEntryNative({
  language,
  onOpen,
  phase = "battle",
  myRank = null,
  deadlineLabel = null,
}: Props) {
  const isEn = language === "en";
  const statusChip = squadBattleEntryStatusChip({
    phase,
    myRank,
    deadlineLabel,
  });

  const chipBoxStyle =
    statusChip.tone === "idle"
      ? styles.statusChipIdle
      : statusChip.tone === "entry"
        ? styles.statusChipEntry
        : statusChip.tone === "reward"
          ? styles.statusChipReward
          : styles.statusChipBattle;
  const chipTextStyle =
    statusChip.tone === "idle"
      ? styles.statusChipTextIdle
      : statusChip.tone === "entry"
        ? styles.statusChipTextEntry
        : statusChip.tone === "reward"
          ? styles.statusChipTextReward
          : styles.statusChipTextBattle;

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

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              {/* 枠は画像内に焼き込み済み — UI 側に枠を重ねない */}
              <Image
                source={SQUAD_BATTLE_ICON}
                style={styles.iconImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>

            <View style={styles.copy}>
              <Text style={styles.title}>Squad Battle</Text>
              <View style={[styles.statusChip, chipBoxStyle]}>
                <Text style={[styles.statusChipText, chipTextStyle]}>
                  {statusChip.label}
                </Text>
              </View>
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
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    overflow: "hidden",
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  iconImage: {
    width: 44,
    height: 44,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    fontFamily: fonts.metricExtra,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: TITLE,
    textShadowColor: "rgba(251,191,36,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  statusChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusChipIdle: {
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusChipEntry: {
    borderColor: "rgba(252,211,77,0.45)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  statusChipReward: {
    borderColor: "rgba(253,230,138,0.5)",
    backgroundColor: "rgba(252,211,77,0.2)",
  },
  statusChipBattle: {
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(245,158,11,0.15)",
  },
  statusChipText: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  statusChipTextIdle: {
    color: "rgba(255,255,255,0.55)",
  },
  statusChipTextEntry: {
    color: "rgba(254,243,199,1)",
  },
  statusChipTextReward: {
    color: "rgba(255,251,235,1)",
  },
  statusChipTextBattle: {
    color: "rgba(255,251,235,1)",
  },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
  },
  enterText: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.4,
    color: TITLE,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
