/**
 * __DEV__ — Free が PRO LEAGUE タブを開いたときのゲート UI プレビュー。
 * 本番は RankingsHomeScreen の `openProLocked` で同じコンポーネントを表示。
 */
import { ScrollView, StyleSheet } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { RankingsProLeagueTeaserNative } from "./RankingsProLeagueTeaserNative";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

type Props = {
  language: import("./rankingsTexts").RankingsLanguage;
  onClose: () => void;
  onPressSubscribe?: () => void;
};

export default function ProLeagueTeaserPreviewScreenNative({
  language,
  onClose,
  onPressSubscribe,
}: Props) {
  const lang = resolveLocalizedLang(language);

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "PRO LEAGUE ゲート",
        en: "PRO LEAGUE Gate",
        ko: "PRO LEAGUE 게이트",
        zh: "PRO LEAGUE 入口",
        es: "Puerta PRO LEAGUE",
        pt: "Portão PRO LEAGUE",
        fr: "Portail PRO LEAGUE",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "Free ユーザーが PRO LEAGUE タブを押したときの表示（モーダルではなく画面内ティーザー）",
        en: "What Free users see when opening the PRO LEAGUE tab (in-page teaser, not a modal)",
        ko: "Free 사용자가 PRO LEAGUE 탭을 열 때 표시(모달 아닌 화면 내 티저)",
        zh: "Free 用户打开 PRO LEAGUE 标签时的显示（页内预告，非弹窗）",
        es: "Lo que ven los Free al abrir la pestaña PRO LEAGUE (teaser en página)",
        pt: "O que Free vê ao abrir a aba PRO LEAGUE (teaser na página)",
        fr: "Ce que voient les Free en ouvrant l’onglet PRO LEAGUE (teaser page)",
      })}
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RankingsProLeagueTeaserNative
          language={language}
          onPressSubscribe={
            onPressSubscribe ??
            (() => {
              /* preview */
            })
          }
          onBackToPickUp={onClose}
        />
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingBottom: 48,
    paddingTop: 8,
    flexGrow: 1,
  },
});
