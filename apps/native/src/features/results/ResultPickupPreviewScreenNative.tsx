/**
 * __DEV__ リザルト一覧カード左辺 `PICK UP` の見た目プレビュー。
 * 本番と同じ `ResultCardDesignFaceNative`（マッチカードと同型の左辺縦ラベル）。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { ResultCardDesignFaceNative } from "./ResultCardDesignPreviewScreenNative";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { OXANIUM_700, OXANIUM_800 } from "../profile/reports/reportThemeNative";
import { MOBILE_RESULT_CARD_MAX_W } from "./resultMobileUiNative";

type Props = {
  language: string;
  onClose: () => void;
};

type OutcomeBadge = "hit" | "perfect" | "upset" | "miss";

type Face = {
  roundLabel: string;
  homeName: string;
  awayName: string;
  homeTeamId: string;
  awayTeamId: string;
  league: string;
  predHome: number;
  predAway: number;
  resultHome: number;
  resultAway: number;
  marketHomePct: number;
  marketAwayPct: number;
  userPick: "home" | "away";
  upsetPoints: number | null;
  totalPoints: number;
  topScorer: string | null;
  topScorerHit: boolean;
  winStreak: number;
  outcomeBadge: OutcomeBadge;
  scoreRel: "top10" | "none";
};

const BASE_FACE: Face = {
  roundLabel: "REGULAR SEASON",
  homeName: "ROCKETS",
  awayName: "LAKERS",
  homeTeamId: "14",
  awayTeamId: "13",
  league: "nba",
  predHome: 110,
  predAway: 108,
  resultHome: 112,
  resultAway: 108,
  marketHomePct: 46.2,
  marketAwayPct: 53.8,
  userPick: "home",
  upsetPoints: 1.8,
  totalPoints: 8.7,
  topScorer: "A.Sengun",
  topScorerHit: true,
  winStreak: 0,
  outcomeBadge: "hit",
  scoreRel: "top10",
};

function PreviewCard({
  label,
  note,
  pickup,
  badge,
  winStreak = 0,
  language,
}: {
  label: string;
  note: string;
  pickup: boolean;
  badge: OutcomeBadge;
  winStreak?: number;
  language: ReturnType<typeof resolveLocalizedLang>;
}) {
  const face: Face = {
    ...BASE_FACE,
    outcomeBadge: badge,
    winStreak,
    upsetPoints: badge === "upset" ? 2.4 : BASE_FACE.upsetPoints,
    topScorerHit: badge !== "miss",
    totalPoints: badge === "perfect" ? 12.4 : badge === "miss" ? 1.2 : 8.7,
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionNote}>{note}</Text>
      <View style={styles.cardWrap}>
        <ResultCardDesignFaceNative
          language={language}
          face={face}
          badge={badge}
          scoreRel={face.scoreRel}
          frameGlow
          showDetailTab
          pickup={pickup}
          animateDraw={false}
        />
      </View>
    </View>
  );
}

export default function ResultPickupPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "リザルト PICK UP",
        en: "Result PICK UP",
        ko: "결과 PICK UP",
        zh: "结果 PICK UP",
        es: "Resultado PICK UP",
        pt: "Resultado PICK UP",
        fr: "Résultat PICK UP",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "本番リザルトカード面 + マッチと同じ左辺 PICK UP。",
        en: "Production result face + match-style left PICK UP.",
        ko: "실제 결과 카드면 + 매치와 같은 왼쪽 PICK UP.",
        zh: "正式结果卡片面 + 与比赛卡相同的左侧 PICK UP。",
        es: "Cara de resultado real + PICK UP izquierdo como match.",
        pt: "Face de resultado real + PICK UP esquerdo como match.",
        fr: "Face résultat réelle + PICK UP gauche comme match.",
      })}
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <PreviewCard
          label="A · Normal HIT"
          note="ピックアップなし（現行）"
          pickup={false}
          badge="hit"
          language={lang}
        />
        <PreviewCard
          label="B · PICK UP + HIT"
          note="左辺 PICK UP · 枠は HIT"
          pickup
          badge="hit"
          language={lang}
        />
        <PreviewCard
          label="C · PICK UP + MISS"
          note="左辺 PICK UP · 枠は MISS"
          pickup
          badge="miss"
          language={lang}
        />
        <PreviewCard
          label="D · PICK UP + STREAK"
          note="左辺 PICK UP · W7 タグ（本番は連勝枠光も）"
          pickup
          badge="hit"
          winStreak={7}
          language={lang}
        />
        <PreviewCard
          label="E · PICK UP + PERFECT"
          note="左辺 PICK UP · 枠は PERFECT"
          pickup
          badge="perfect"
          language={lang}
        />
        <PreviewCard
          label="F · PICK UP + UPSET"
          note="左辺 PICK UP · 枠は UPSET 赤"
          pickup
          badge="upset"
          language={lang}
        />

        <View style={styles.notes}>
          <Text style={styles.notesTitle}>仕様メモ</Text>
          <Text style={styles.notesBody}>
            · カード面は一覧本番と同じ ResultCardDesignFaceNative{"\n"}
            · top=ラウンド / left=PICK UP（マッチと同型）{"\n"}
            · 線色は outcome 優先{"\n"}
            · 本番配線は face.isPickup（post.isPickup / stats.countedForPickup / game）
          </Text>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 48,
    paddingTop: 8,
    gap: 22,
    alignItems: "center",
  },
  section: {
    gap: 6,
    width: "100%",
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
  },
  sectionLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.82)",
    textTransform: "uppercase",
  },
  sectionNote: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 2,
  },
  cardWrap: {
    width: "100%",
  },
  notes: {
    width: "100%",
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesTitle: {
    fontFamily: OXANIUM_700,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  notesBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
  },
});
