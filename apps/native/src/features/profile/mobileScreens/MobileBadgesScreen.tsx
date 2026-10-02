/**
 * Web `app/mobile/badges/page.tsx` に相当。
 */
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import MobilePageShell from "./MobilePageShell";
import ProfileBadgeDetailModal from "../ProfileBadgeDetailModal";
import BadgePaletteNative from "../BadgePaletteNative";
import VelvetTuftFieldNative from "../VelvetTuftFieldNative";
import {
  useNativeProfileBadges,
  type ResolvedBadgeNative,
} from "../useNativeProfileBadges";
import { VELVET_BASE } from "@/lib/badges/velvetPalette";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  language: string;
  uid: string | undefined;
  onClose: () => void;
};

export default function MobileBadgesScreen({ language, uid, onClose }: Props) {
  const lang = resolveLocalizedLang(language);
  const { resolvedBadges, loading } = useNativeProfileBadges(uid);
  const [selected, setSelected] = useState<ResolvedBadgeNative | null>(null);

  const subtitle = L(lang, {
    ja: "獲得したバッジを一覧できます。タップで詳細を表示します。",
    en: "Browse badges you’ve earned. Tap one for details.",
    ko: "획득한 배지를 볼 수 있습니다. 탭하면 상세가 표시됩니다.",
    zh: "可浏览已获得的徽章。点按查看详情。",
    es: "Consulta las insignias que has ganado. Toca para ver detalles.",
    pt: "Veja as medalhas que você ganhou. Toque para detalhes.",
    fr: "Parcourez vos badges. Touchez pour les détails.",
  });
  const loadingLabel = L(lang, {
    ja: "読み込み中",
    en: "Loading",
    ko: "불러오는 중",
    zh: "加载中",
    es: "Cargando",
    pt: "Carregando",
    fr: "Chargement",
  });
  const emptyLabel = L(lang, {
    ja: "まだ獲得バッジがありません。",
    en: "No badges yet.",
    ko: "아직 획득한 배지가 없습니다.",
    zh: "还没有徽章。",
    es: "Aún no hay insignias.",
    pt: "Ainda sem medalhas.",
    fr: "Pas encore de badges.",
  });

  if (loading) {
    return (
      <View style={styles.page}>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <VelvetTuftFieldNative />
        </View>
        <MobilePageShell
          title="BADGES"
          subtitle={subtitle}
          onClose={onClose}
          appBackground
        >
          <View style={styles.center}>
            <CandleChartLoaderNative label={loadingLabel} />
          </View>
        </MobilePageShell>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <VelvetTuftFieldNative />
      </View>
      <MobilePageShell
        title="BADGES"
        subtitle={subtitle}
        onClose={onClose}
        appBackground
      >
        <ScrollView contentContainerStyle={styles.listPad}>
          <BadgePaletteNative
            badges={resolvedBadges}
            language={lang}
            emptyLabel={emptyLabel}
            onSelect={setSelected}
          />
        </ScrollView>
        <ProfileBadgeDetailModal
          visible={!!selected}
          badge={selected}
          language={lang}
          onClose={() => setSelected(null)}
        />
      </MobilePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: VELVET_BASE,
  },
  listPad: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, minHeight: 200 },
});
