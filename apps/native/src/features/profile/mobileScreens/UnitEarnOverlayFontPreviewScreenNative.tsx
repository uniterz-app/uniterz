/**
 * Web `UnitEarnOverlayFontPreviewPage` 相当 —
 * Unit 獲得オーバーレイのフォント案プレビュー。
 */
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  UNIT_EARN_OVERLAY_FONT_SAMPLE,
  UNIT_EARN_OVERLAY_FONT_VARIANTS,
  type UnitEarnOverlayFontId,
} from "../../../../../../lib/units/unitEarnOverlayFontPreview";
import { formatUnitEarnRankOrdinal } from "../../../../../../lib/units/formatUnitEarnRank";
import {
  AUDIOWIDE,
  BEBAS,
  CHAKRA_700,
  EXO2_800,
  JP_600,
  JP_700,
  MICHROMA,
  ORBITRON_800,
  OXANIUM_800,
  RAJDHANI,
} from "../reports/reportThemeNative";
import UnitCoinDiscNative from "../UnitCoinDiscNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

const CYBER_CYAN = "#00F5FF";
const ALFA = "AlfaSlabOne_400Regular";
const MONTSERRAT = "Montserrat_900Black_Italic";

type FontPair = {
  title: string;
  sub: string;
  rank: string;
  amount: string;
  claim: string;
  amountLetterSpacing?: number;
  rankLetterSpacing?: number;
  claimLetterSpacing?: number;
};

function fontPair(id: UnitEarnOverlayFontId): FontPair | null {
  switch (id) {
    case "noto-michroma":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: MICHROMA as string,
        amount: MICHROMA as string,
        claim: MICHROMA as string,
        amountLetterSpacing: 1,
        rankLetterSpacing: 1.2,
        claimLetterSpacing: 1.8,
      };
    case "noto-orbitron":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: ORBITRON_800 as string,
        amount: ORBITRON_800 as string,
        claim: ORBITRON_800 as string,
        amountLetterSpacing: 1.2,
        rankLetterSpacing: 1.6,
        claimLetterSpacing: 2.4,
      };
    case "noto-audiowide":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: AUDIOWIDE as string,
        amount: AUDIOWIDE as string,
        claim: AUDIOWIDE as string,
        amountLetterSpacing: 0.8,
        claimLetterSpacing: 1.6,
      };
    case "noto-chakra":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: CHAKRA_700 as string,
        amount: CHAKRA_700 as string,
        claim: CHAKRA_700 as string,
      };
    case "noto-exo2":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: EXO2_800 as string,
        amount: EXO2_800 as string,
        claim: EXO2_800 as string,
      };
    case "current":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: OXANIUM_800 as string,
        amount: OXANIUM_800 as string,
        claim: OXANIUM_800 as string,
      };
    case "noto-rajdhani":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: RAJDHANI as string,
        amount: RAJDHANI as string,
        claim: RAJDHANI as string,
      };
    case "noto-bebas":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: BEBAS as string,
        amount: BEBAS as string,
        claim: BEBAS as string,
        amountLetterSpacing: 1.2,
        rankLetterSpacing: 1.6,
        claimLetterSpacing: 2.6,
      };
    case "noto-alfa":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: ALFA,
        amount: ALFA,
        claim: ALFA,
      };
    case "noto-montserrat":
      return {
        title: JP_700 as string,
        sub: JP_600 as string,
        rank: MONTSERRAT,
        amount: MONTSERRAT,
        claim: MONTSERRAT,
      };
    default:
      return null;
  }
}

function FontDemo({
  id,
  isJa,
}: {
  id: UnitEarnOverlayFontId;
  isJa: boolean;
}) {
  const pair = fontPair(id);
  if (!pair) return null;

  const title = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.titleJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.titleEn;
  const subtitle = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.subtitleJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.subtitleEn;
  const claim = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.claimJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.claimEn;
  const rankText = formatUnitEarnRankOrdinal(
    UNIT_EARN_OVERLAY_FONT_SAMPLE.rank
  );

  return (
    <View style={styles.demo}>
      <View style={styles.demoScrim} />
      <Text style={[styles.context, { fontFamily: pair.title }]}>{title}</Text>
      <Text style={[styles.sub, { fontFamily: pair.sub }]}>{subtitle}</Text>
      <Text
        style={[
          styles.rank,
          {
            fontFamily: pair.rank,
            letterSpacing: pair.rankLetterSpacing ?? 0,
          },
        ]}
      >
        {rankText}
      </Text>
      <View style={styles.prize}>
        <UnitCoinDiscNative size={40} />
        <Text
          style={[
            styles.amount,
            {
              fontFamily: pair.amount,
              letterSpacing: pair.amountLetterSpacing ?? 0,
            },
          ]}
        >
          <Text style={styles.plus}>+</Text>
          {UNIT_EARN_OVERLAY_FONT_SAMPLE.amount}
        </Text>
      </View>
      <View style={styles.claim}>
        <Text
          style={[
            styles.claimText,
            {
              fontFamily: isJa ? pair.title : pair.claim,
              letterSpacing: isJa
                ? 1.4
                : (pair.claimLetterSpacing ?? 2.2),
            },
          ]}
        >
          {claim}
        </Text>
      </View>
    </View>
  );
}

export default function UnitEarnOverlayFontPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const variants = UNIT_EARN_OVERLAY_FONT_VARIANTS.filter((v) => v.native);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>{isJa ? "戻る" : "Back"}</Text>
        </Pressable>
        <Text style={styles.topTitle}>
          {isJa ? "Unit 獲得フォント案" : "Unit earn fonts"}
        </Text>
        <View style={{ width: 52 }} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.lead}>
          {isJa
            ? "ANGULAR が角張り枠。Web 専用案は /mobile/unit-earn-font-preview で。"
            : "ANGULAR = squared fonts. Full set on Web preview."}
        </Text>
        {variants.map((v) => (
          <View
            key={v.id}
            style={[
              styles.card,
              v.current ? styles.cardCurrent : null,
              v.angular && !v.current ? styles.cardAngular : null,
            ]}
          >
            <View style={styles.cardHead}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>
                  {isJa ? v.nameJa : v.nameEn}
                </Text>
                {v.current ? (
                  <Text style={styles.currentBadge}>CURRENT</Text>
                ) : null}
                {v.angular ? (
                  <Text style={styles.angularBadge}>ANGULAR</Text>
                ) : null}
              </View>
              <Text style={styles.cardNote}>
                {isJa ? v.noteJa : v.noteEn}
              </Text>
              <Text style={styles.stack}>
                {v.titleStack} · {v.metricStack}
              </Text>
            </View>
            <FontDemo id={v.id} isJa={isJa} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05080c",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backBtn: {
    minWidth: 52,
  },
  backText: {
    fontFamily: JP_700,
    fontSize: 14,
    color: CYBER_CYAN,
  },
  topTitle: {
    fontFamily: MICHROMA,
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.6,
  },
  scroll: {
    paddingHorizontal: 14,
    gap: 16,
  },
  lead: {
    fontFamily: JP_600,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0a1218",
    overflow: "hidden",
  },
  cardCurrent: {
    borderColor: "rgba(0,245,255,0.35)",
  },
  cardAngular: {
    borderColor: "rgba(196,181,253,0.35)",
  },
  cardHead: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontFamily: MICHROMA,
    fontSize: 13,
    color: "#fff",
  },
  currentBadge: {
    fontFamily: MICHROMA,
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(207,250,254,0.9)",
    backgroundColor: "rgba(0,245,255,0.14)",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  angularBadge: {
    fontFamily: MICHROMA,
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(237,233,254,0.9)",
    backgroundColor: "rgba(167,139,250,0.18)",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardNote: {
    marginTop: 4,
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
  },
  stack: {
    marginTop: 4,
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  demo: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  demoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  context: {
    fontSize: 16,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.94)",
    textAlign: "center",
    zIndex: 1,
  },
  sub: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(226,246,255,0.78)",
    textAlign: "center",
    zIndex: 1,
  },
  rank: {
    marginTop: 12,
    fontSize: 32,
    color: "#cffafe",
    textAlign: "center",
    zIndex: 1,
  },
  prize: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  amount: {
    fontSize: 48,
    color: "#ffe9a8",
  },
  plus: {
    color: "#f6c344",
  },
  claim: {
    marginTop: 28,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.85)",
    backgroundColor: CYBER_CYAN,
    paddingHorizontal: 28,
    paddingVertical: 12,
    zIndex: 1,
  },
  claimText: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#041018",
  },
});
