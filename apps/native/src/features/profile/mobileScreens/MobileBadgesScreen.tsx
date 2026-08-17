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

type Props = {
  language: "ja" | "en";
  uid: string | undefined;
  onClose: () => void;
};

export default function MobileBadgesScreen({ language, uid, onClose }: Props) {
  const isJa = language === "ja";
  const { resolvedBadges, loading } = useNativeProfileBadges(uid);
  const [selected, setSelected] = useState<ResolvedBadgeNative | null>(null);

  const subtitle = isJa
    ? "獲得したバッジを一覧できます。タップで詳細を表示します。"
    : "Browse badges you’ve earned. Tap one for details.";

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
            <CandleChartLoaderNative label={isJa ? "読み込み中" : "Loading"} />
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
            language={language}
            emptyLabel={isJa ? "まだ獲得バッジがありません。" : "No badges yet."}
            onSelect={setSelected}
          />
        </ScrollView>
        <ProfileBadgeDetailModal
          visible={!!selected}
          badge={selected}
          language={language}
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
