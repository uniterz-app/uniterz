/**
 * __DEV__ — 初回無料の案内モーダル + ゲート。
 * 本番のモーダルは予想オーバーレイを開いたとき（PRO PICK タブの前）。
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import ProPickFirstFreeModalNative from "./ProPickFirstFreeModalNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { JP_600 } from "../../profile/reports/reportThemeNative";

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
  const [modalOpen, setModalOpen] = useState(true);

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
        ja: "予想送信直後。次の試合案内の代わり。既読には書かない。",
        en: "Right after a pick, instead of next-game. Preview does not mark it seen.",
        ko: "예상 직후. 다음 경기 안내 대신. 미리보기는 읽음으로 쓰지 않음.",
        zh: "提交预测后、代替下一场提示。预览不记已读。",
        es: "Tras el palpite, en lugar del siguiente partido. El preview no marca leído.",
        pt: "Após o palpite, no lugar do próximo jogo. O preview não marca como visto.",
        fr: "Juste après le pronostic, à la place du match suivant. L’aperçu ne marque pas lu.",
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
            firstFreeAvailable
            onPressProPickUnlock={() => {
              /* preview: 初回無料 CTA */
            }}
            onPressUpgrade={
              onPressSubscribe ??
              (() => {
                /* preview */
              })
            }
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
