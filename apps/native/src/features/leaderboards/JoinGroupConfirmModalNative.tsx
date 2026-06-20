import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import type { JoinGroupPreview } from "./communityApiNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";

type Props = {
  visible: boolean;
  preview: JoinGroupPreview | null;
  alreadyMember?: boolean;
  language: Language;
  busy?: boolean;
  onBack: () => void;
  onJoin: () => void;
};

export default function JoinGroupConfirmModalNative({
  visible,
  preview,
  alreadyMember = false,
  language,
  busy = false,
  onBack,
  onJoin,
}: Props) {
  const m = t(language);
  if (!preview) return null;

  const competition = formatCommunityCompetitionLine(
    {
      rankingLeague: preview.rankingLeague ?? "all",
      rankingMetric: preview.rankingMetric,
      rankingTeamIds: preview.rankingTeamIds,
    },
    language
  );

  const title = language === "en" ? "Join this group?" : "このグループに参加しますか？";

  return (
    <CommunityModalBackdropNative visible={visible} onClose={busy ? () => {} : onBack}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.previewCard}>
          <View style={styles.hero}>
            {preview.headerImageUrl ? (
              <Image source={{ uri: preview.headerImageUrl }} style={styles.heroImage} />
            ) : (
              <Text style={styles.heroEmpty}>—</Text>
            )}
          </View>
          <View style={styles.previewBody}>
            <Field label={m.community.groupName} value={preview.name} large />
            <Field label={m.rankings.owner} value={preview.ownerDisplayName} />
            <Field
              label={m.community.groupDescriptionLabel}
              value={preview.description?.trim() || (language === "en" ? "No description." : "説明はありません。")}
            />
            <Field label={m.rankings.competingOn} value={competition} />
            <Field
              label={m.community.members}
              value={m.rankings.nMembers.replace("{n}", String(preview.memberCount))}
              accent
            />
            {alreadyMember ? (
              <Text style={styles.alreadyMember}>{m.community.alreadyMember}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            disabled={busy}
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && communityPressableTapStyle(true)]}
          >
            <Text style={styles.backText}>{m.common.back}</Text>
          </Pressable>
          {!alreadyMember ? (
            <Pressable
              disabled={busy}
              onPress={onJoin}
              style={({ pressed }) => [styles.joinBtn, pressed && communityPressableTapStyle(true)]}
            >
              <Text style={styles.joinText}>{busy ? m.community.joining : m.community.joinGroup}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </CommunityModalBackdropNative>
  );
}

function Field({
  label,
  value,
  large,
  accent,
}: {
  label: string;
  value: string;
  large?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, large && styles.fieldValueLarge, accent && styles.fieldAccent]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    overflow: "hidden",
  },
  hero: {
    aspectRatio: 16 / 9,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroEmpty: {
    fontSize: 28,
    color: "rgba(255,255,255,0.2)",
  },
  previewBody: {
    padding: 16,
    gap: 12,
  },
  field: {},
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  fieldValue: {
    marginTop: 2,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  fieldValueLarge: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  fieldAccent: {
    fontWeight: "700",
    color: "rgba(167,243,208,0.9)",
  },
  alreadyMember: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "rgba(34,211,238,0.1)",
    padding: 10,
    fontSize: 13,
    color: "rgba(165,243,252,0.9)",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  joinBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingVertical: 10,
    alignItems: "center",
  },
  joinText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(236,253,245,0.95)",
  },
});
