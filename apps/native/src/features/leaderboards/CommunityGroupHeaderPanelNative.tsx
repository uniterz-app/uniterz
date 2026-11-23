/** グループ詳細カバー — 名前・メモ・固定メタ（切替は ViewBar） */
import { StyleSheet, Text, View } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { COMMUNITY_GROUP_PANEL_PADDING_X } from "../../../../../lib/communities/communityGroupShell";
import {
  communityRankingPeriodValue,
  rankingTeamsLabel,
} from "../../../../../lib/communities/labels";
import type { CommunityPeriodType } from "../../../../../lib/communities/types";
import type { CommunityGroupSummary } from "./communityApiNative";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import { communityMono } from "./communityCrtThemeNative";

type Props = {
  summary: CommunityGroupSummary;
  language: Language;
  /** 画像上に重ねるとき */
  overlay?: boolean;
};

type MetaCell = {
  key: string;
  label: string;
  value: string;
};

export default function CommunityGroupHeaderPanelNative({
  summary,
  language,
  overlay = false,
}: Props) {
  const teamsValue = rankingTeamsLabel(summary.rankingTeamIds ?? [], language);
  const period = communityRankingPeriodValue(summary.rankingStartDateKey, language, {
    periodType: summary.periodType as CommunityPeriodType,
    rankingEndDateKey: summary.rankingEndDateKey,
    rankingPeriodMonthKey: summary.rankingPeriodMonthKey,
    rankingSeasonKey: summary.rankingSeasonKey,
  });

  const labels =
    language === "en"
      ? {
          members: "MEMBERS",
          period: "PERIOD",
          teams: "TEAMS",
          ended: "ENDED",
        }
      : {
          members: "人数",
          period: "期間",
          teams: "チーム",
          ended: "終了",
        };

  const metaCells: MetaCell[] = [
    {
      key: "members",
      label: labels.members,
      value: String(summary.memberCount ?? 0),
    },
    {
      key: "period",
      label: labels.period,
      value: period,
    },
  ];
  if (teamsValue) {
    metaCells.push({
      key: "teams",
      label: labels.teams,
      value: teamsValue,
    });
  }

  const memo = summary.description?.trim() ?? "";

  return (
    <View style={[styles.root, overlay && styles.rootOverlay]}>
      <View style={styles.titleBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {summary.name}
        </Text>
        <View style={styles.titleRule} />
        {memo ? (
          <Text style={styles.memo} numberOfLines={2}>
            {memo}
          </Text>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {metaCells.map((cell, i) => (
          <View
            key={cell.key}
            style={[styles.metaCell, i > 0 && styles.metaCellBorder]}
          >
            <Text style={styles.metaLabel}>{cell.label}</Text>
            <Text style={styles.metaValue} numberOfLines={2}>
              {cell.value}
            </Text>
          </View>
        ))}
      </View>

      {summary.archived ? (
        <View style={styles.endedBadge}>
          <Text style={styles.endedText}>{labels.ended}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: COMMUNITY_GROUP_PANEL_PADDING_X,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 14,
  },
  rootOverlay: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  titleBlock: {
    gap: 8,
  },
  name: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.4,
    color: "#F8FAFC",
  },
  titleRule: {
    width: 40,
    height: 2,
    backgroundColor: "#00F5FF",
  },
  memo: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: "rgba(255,255,255,0.62)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.28)",
    paddingTop: 10,
  },
  metaCell: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  metaCellBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "rgba(255,255,255,0.14)",
    paddingLeft: 10,
    paddingRight: 0,
  },
  metaLabel: {
    fontFamily: communityMono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(0,245,255,0.72)",
  },
  metaValue: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 0.2,
    color: "rgba(248,250,252,0.95)",
  },
  endedBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  endedText: {
    fontFamily: communityMono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(251,191,36,0.95)",
  },
});
