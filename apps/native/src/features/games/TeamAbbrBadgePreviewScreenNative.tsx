/**
 * __DEV__ TeamAbbrBadge サイバー案ギャラリー。
 * Profile サイドメニュー DEV → TeamAbbrBadge
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { OXANIUM_700, OXANIUM_800 } from "../profile/reports/reportThemeNative";
import {
  TEAM_ABBR_BADGE_PREVIEW_SAMPLES,
  TEAM_ABBR_BADGE_VARIANTS,
  TeamAbbrBadgeVariantNative,
  type TeamAbbrBadgeVariantId,
} from "./TeamAbbrBadgeVariantsNative";

type Props = {
  language: string;
  onClose: () => void;
};

function VariantBlock({
  id,
  label,
  note,
}: {
  id: TeamAbbrBadgeVariantId;
  label: string;
  note: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockNote}>{note}</Text>
      <View style={styles.row}>
        {TEAM_ABBR_BADGE_PREVIEW_SAMPLES.map((s) => (
          <View key={`${id}-${s.teamId}`} style={styles.cell}>
            <TeamAbbrBadgeVariantNative
              variant={id}
              teamId={s.teamId}
              abbr={s.abbr}
            />
            <Text style={styles.cellAbbr}>{s.abbr}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TeamAbbrBadgePreviewScreenNative({
  language: _language,
  onClose,
}: Props) {
  return (
    <MobilePageShell
      title="TeamAbbrBadge"
      eyebrow="DEV"
      subtitle="本番は A。候補はプレビューのみ。気に入った案を教えてくれれば接続する。"
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {TEAM_ABBR_BADGE_VARIANTS.map((v) => (
          <VariantBlock
            key={v.id}
            id={v.id}
            label={v.label}
            note={v.note}
          />
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 18,
  },
  block: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  blockLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#00F5FF",
    textTransform: "uppercase",
  },
  blockNote: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "center",
  },
  cell: {
    alignItems: "center",
    gap: 4,
    minWidth: 44,
  },
  cellAbbr: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.35)",
  },
});
