/** Web グループ詳細ヘッダー — タイトル / メモ / 競技条件をサイバー HUD で分離 */
import { StyleSheet, Text, View } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { COMMUNITY_GROUP_PANEL_PADDING_X } from "../../../../../lib/communities/communityGroupShell";
import { leagueLabel, metricLabel, communityRankingPeriodValue, rankingTeamsLabel } from "../../../../../lib/communities/labels";
import type { CommunityGroupSummary } from "./communityApiNative";
import MatchListCyberClipNative from "../games/MatchListCyberClipNative";
import { communityMono } from "./communityCrtThemeNative";
import CommunityGroupZoneLabelNative from "./CommunityGroupZoneLabelNative";

type Props = {
  summary: CommunityGroupSummary;
  language: Language;
  overlay?: boolean;
};

type ConditionItem = {
  key: string;
  label: string;
  value: string;
  accent?: "cyan" | "amber" | "emerald";
  wide?: boolean;
};

function ConditionChip({
  label,
  value,
  accent = "cyan",
  wide = false,
  overlay = false,
}: {
  label: string;
  value: string;
  accent?: "cyan" | "amber" | "emerald";
  wide?: boolean;
  overlay?: boolean;
}) {
  const accentStyle =
    accent === "amber" ? styles.chipAccentAmber : accent === "emerald" ? styles.chipAccentEmerald : styles.chipAccentCyan;

  return (
    <View style={[styles.chip, overlay && styles.chipOverlay, wide && styles.chipWide]}>
      <View style={[styles.chipAccent, accentStyle]} />
      <View style={styles.chipBody}>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={styles.chipValue} numberOfLines={wide ? 2 : 1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function CommunityGroupHeaderPanelNative({
  summary,
  language,
  overlay = false,
}: Props) {
  const labels =
    language === "en"
      ? {
          title: "TITLE",
          memo: "MEMO",
          conditions: "CONDITIONS",
          members: "MEMBERS",
          league: "LEAGUE",
          metric: "METRIC",
          period: "PERIOD",
          teams: "TEAMS",
          ended: "This group has ended.",
        }
      : {
          title: "TITLE",
          memo: "MEMO",
          conditions: "競技条件",
          members: "参加人数",
          league: "リーグ",
          metric: "指標",
          period: "集計期間",
          teams: "対象チーム",
          ended: "このグループは終了しています。",
        };

  const teamsValue = rankingTeamsLabel(summary.rankingTeamIds ?? [], language);
  const conditions: ConditionItem[] = [
    {
      key: "members",
      label: labels.members,
      value: String(summary.memberCount ?? 0),
      accent: "emerald",
    },
    {
      key: "league",
      label: labels.league,
      value: leagueLabel(summary.rankingLeague ?? "all", language),
      accent: "cyan",
    },
    {
      key: "metric",
      label: labels.metric,
      value: metricLabel(summary.rankingMetric, language),
      accent: "amber",
    },
    {
      key: "period",
      label: labels.period,
      value: communityRankingPeriodValue(summary.rankingStartDateKey, language),
      accent: "cyan",
    },
  ];

  if (teamsValue) {
    conditions.push({
      key: "teams",
      label: labels.teams,
      value: teamsValue,
      accent: "cyan",
      wide: true,
    });
  }

  const body = (
    <View style={[styles.inner, overlay && styles.innerOverlay]}>
        <View style={styles.zone}>
          <CommunityGroupZoneLabelNative>{labels.title}</CommunityGroupZoneLabelNative>
          <Text style={styles.groupName}>{summary.name}</Text>
        </View>

        <View style={[styles.zoneDivider, overlay && styles.zoneDividerOverlay]} />
        <View style={styles.zone}>
          <CommunityGroupZoneLabelNative>{labels.memo}</CommunityGroupZoneLabelNative>
          <Text style={styles.description}>
            {summary.description?.trim() || "—"}
          </Text>
        </View>

        <View style={[styles.zoneDivider, overlay && styles.zoneDividerOverlay]} />
        <View style={styles.zone}>
          <CommunityGroupZoneLabelNative>{labels.conditions}</CommunityGroupZoneLabelNative>
          <View style={styles.chipGrid}>
            {conditions.map((item) => (
              <ConditionChip
                key={item.key}
                label={item.label}
                value={item.value}
                accent={item.accent}
                wide={item.wide}
                overlay={overlay}
              />
            ))}
          </View>
        </View>

        {summary.archived ? (
          <View style={styles.endedRow}>
            <View style={styles.endedDot} />
            <Text style={styles.endedText}>{labels.ended}</Text>
          </View>
        ) : null}
      </View>
  );

  if (overlay) {
    return <View style={styles.overlayShell}>{body}</View>;
  }

  return <MatchListCyberClipNative style={styles.shell}>{body}</MatchListCyberClipNative>;
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: 16,
  },
  overlayShell: {
    position: "relative",
    zIndex: 2,
  },
  inner: {
    paddingHorizontal: COMMUNITY_GROUP_PANEL_PADDING_X,
    paddingVertical: 14,
  },
  innerOverlay: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  zone: {
    gap: 8,
  },
  zoneDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  zoneDividerOverlay: {
    marginVertical: 9,
  },
  groupName: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    color: "rgba(248,250,252,0.96)",
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 21,
    color: "rgba(255,255,255,0.68)",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: -COMMUNITY_GROUP_PANEL_PADDING_X,
  },
  chip: {
    width: "48%",
    flexGrow: 0,
    flexBasis: "48%",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
    backgroundColor: "rgba(2,8,18,0.72)",
    minHeight: 52,
    overflow: "visible",
  },
  chipOverlay: {
    backgroundColor: "rgba(2,8,18,0.38)",
    borderColor: "rgba(34,211,238,0.2)",
  },
  chipWide: {
    width: "100%",
    flexBasis: "100%",
  },
  chipAccent: {
    width: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 5,
  },
  chipAccentCyan: {
    backgroundColor: "rgba(34,211,238,0.85)",
    shadowColor: "#22d3ee",
  },
  chipAccentAmber: {
    backgroundColor: "rgba(251,191,36,0.85)",
    shadowColor: "#fbbf24",
  },
  chipAccentEmerald: {
    backgroundColor: "rgba(52,211,153,0.85)",
    shadowColor: "#34d399",
  },
  chipBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  chipLabel: {
    fontFamily: communityMono,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.55)",
  },
  chipValue: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    color: "rgba(224,242,254,0.95)",
  },
  endedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,191,36,0.18)",
  },
  endedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(251,191,36,0.85)",
  },
  endedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(251,191,36,0.9)",
  },
});
