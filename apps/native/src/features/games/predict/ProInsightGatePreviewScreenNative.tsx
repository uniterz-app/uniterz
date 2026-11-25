/**
 * __DEV__ — 初回無料の案内モーダル + ゲート。
 * 本番の案内は予想ページを開いたとき（PRO PICK タブの前）。
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import ProPickFirstFreeModalNative from "./ProPickFirstFreeModalNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { JP_600 } from "../../profile/reports/reportThemeNative";
import type { ProInsightPredictKitRecord } from "../../../../../../lib/nba/insights/predictKit/predictKitTypes";

/** DEV プレビュー用。数字は今季の公開 kitRecord（検証 + 本番採点）に合わせる */
const PREVIEW_KIT_RECORD: ProInsightPredictKitRecord = {
  games: 248,
  hits: 165,
  strongGames: 68,
  strongHits: 58,
  scorerGames: 248,
  scorerHits: 111,
  basis: "backtest",
  liveGames: 78,
};

type Props = {
  language: string;
  onClose: () => void;
  onPressSubscribe?: () => void;
};

export default function ProInsightGatePreviewScreenNative({
  language,
  onClose,
  onPressSubscribe,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "PRO PICK 初回無料",
        en: "PRO PICK first free",
        ko: "PRO PICK 첫 무료",
        zh: "PRO PICK 首次免费",
        es: "Primer PRO PICK gratis",
        pt: "Primeiro PRO PICK grátis",
        fr: "Premier PRO PICK gratuit",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "予想ページを開いたとき。PRO PICK タブの前。既読には書かない。",
        en: "When the pick page opens, before the PRO PICK tab. Preview does not mark it seen.",
        ko: "예상 페이지를 열 때. PRO PICK 탭 앞. 미리보기는 읽음으로 쓰지 않음.",
        zh: "打开预测页时、在 PRO PICK 标签前。预览不记已读。",
        es: "Al abrir el palpite, antes de la pestaña PRO PICK. El preview no marca leído.",
        pt: "Ao abrir o palpite, antes da aba PRO PICK. O preview não marca como visto.",
        fr: "À l’ouverture de la page de pronostic, avant l’onglet PRO PICK. L’aperçu ne marque pas lu.",
      })}
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [styles.reopen, pressed && styles.reopenPressed]}
        >
          <Text style={styles.reopenLabel}>
            {L(lang, {
              ja: "案内モーダルを出す",
              en: "Show notice modal",
              ko: "안내 모달 열기",
              zh: "打开提示",
              es: "Mostrar aviso",
              pt: "Mostrar aviso",
              fr: "Afficher l’avis",
            })}
          </Text>
        </Pressable>
        <View style={styles.card}>
          <PredictProBriefPanelNative
            brief={null}
            language={lang === "ja" ? "ja" : "en"}
            homeTeamId="nba-lakers"
            awayTeamId="nba-celtics"
            homeTeamName={lang === "ja" ? "レイカーズ" : "Lakers"}
            awayTeamName={lang === "ja" ? "セルティックス" : "Celtics"}
            locked
            onPressProPickUnlock={() => {
              /* preview: 広告 CTA */
            }}
            onPressUpgrade={
              onPressSubscribe ??
              (() => {
                /* preview */
              })
            }
            kitRecord={PREVIEW_KIT_RECORD}
          />
        </View>
      </ScrollView>
      <ProPickFirstFreeModalNative
        visible={modalOpen}
        language={language}
        match={{
          homeTitle: "LAKERS",
          awayTitle: "CELTICS",
          kickoff: "8:00",
          homePalette: { primary: "#552583", secondary: "#FDB927" },
          awayPalette: { primary: "#007A33", secondary: "#BA9653" },
          leagueRaw: "nba",
          homeSide: { teamId: "nba-lakers" },
          awaySide: { teamId: "nba-celtics" },
        }}
        onLater={() => setModalOpen(false)}
        onOpenFree={() => setModalOpen(false)}
      />
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 8,
    flexGrow: 1,
  },
  reopen: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.35)",
    backgroundColor: "rgba(252,211,77,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  reopenPressed: {
    backgroundColor: "rgba(252,211,77,0.16)",
  },
  reopenLabel: {
    color: "#fde68a",
    fontFamily: JP_600,
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
});
