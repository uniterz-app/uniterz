/**
 * Web `app/mobile/badges/page.tsx` に相当。
 */
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import MobilePageShell from "./MobilePageShell";
import ProfileBadgeDetailModal from "../ProfileBadgeDetailModal";
import BadgePaletteNative from "../BadgePaletteNative";
import {
  useNativeProfileBadges,
  type ResolvedBadgeNative,
} from "../useNativeProfileBadges";

const COLS = 4;
const GAP = 10;

type Props = {
  language: "ja" | "en";
  uid: string | undefined;
  onClose: () => void;
};

export default function MobileBadgesScreen({ language, uid, onClose }: Props) {
  const isJa = language === "ja";
  const { width } = useWindowDimensions();
  const { resolvedBadges, loading } = useNativeProfileBadges(uid);
  const [selected, setSelected] = useState<ResolvedBadgeNative | null>(null);

  const cell = useMemo(() => {
    const inner = width - 32 - (COLS - 1) * GAP;
    return Math.floor(inner / COLS);
  }, [width]);

  if (loading) {
    return (
      <MobilePageShell
        title={isJa ? "バッジパレット" : "Badge Palette"}
        onClose={onClose}
      >
        <View style={styles.center}>
          <CandleChartLoaderNative label={isJa ? "読み込み中" : "Loading"} />
        </View>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title={isJa ? "バッジパレット" : "Badge Palette"} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.listPad}>
        <BadgePaletteNative
          badges={resolvedBadges}
          cellSize={cell}
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
  );
}

const styles = StyleSheet.create({
  listPad: {
    padding: 16,
    paddingBottom: 40,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, minHeight: 200 },
  muted: { color: "rgba(248,250,252,0.5)", fontSize: 14 },
});
