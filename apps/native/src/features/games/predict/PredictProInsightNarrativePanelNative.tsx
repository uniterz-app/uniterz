/**
 * 新 Pro Insight UI — 試合1本 · 4枠短文 · 各枠2本。
 * HOME/AWAY 分割なし（被る事実は1回だけ）。
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeKind,
} from "../../../../../../lib/predict/proInsightNarrativeTypes";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import type { UiStrings } from "../../../../../../lib/i18n/ui";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import {
  OXANIUM_600,
  OXANIUM_800,
  JP_600,
} from "../../profile/reports/reportThemeNative";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import type { GamesLanguage } from "../gamesI18n";

type Props = {
  brief: ProInsightNarrativeBrief;
  language: GamesLanguage;
  homeTeamName?: string;
  awayTeamName?: string;
};

/** セクション見出しの文字色・枠色（既存 ProBrief トーンに合わせる） */
const SECTION_ACCENT: Record<ProInsightNarrativeKind, string> = {
  MATCHUP: "rgba(110,231,183,0.95)",
  SCHEDULE: "rgba(253,230,138,0.95)",
  CONTEXT: "rgba(103,232,249,0.92)",
  "INJURY IMPACT": "rgba(251,113,133,0.95)",
};

function teamNick(teamId: string, fallbackName: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallbackName.trim();
}

function t(strings: UiStrings, language: GamesLanguage): string {
  return L(resolveLocalizedLang(language), strings);
}

export default function PredictProInsightNarrativePanelNative({
  brief,
  language,
  homeTeamName = "",
  awayTeamName = "",
}: Props) {
  const homeNick = teamNick(brief.homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(brief.awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", brief.homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", brief.awayTeamId);

  const note = useMemo(() => {
    if (!brief.sampleNote) return null;
    return t(brief.sampleNote, language);
  }, [brief.sampleNote, language]);

  return (
    <View style={styles.shell}>
      <View style={styles.matchRow}>
        <View style={styles.proBadgeWrap}>
          <ProCyberBadgeNative premium />
        </View>
        <Text style={[styles.matchTeam, { color: awayColor }]} numberOfLines={1}>
          {awayNick}
        </Text>
        <Text style={styles.matchVs}>vs</Text>
        <Text style={[styles.matchTeam, { color: homeColor }]} numberOfLines={1}>
          {homeNick}
        </Text>
      </View>

      {note ? <Text style={styles.sampleNote}>{note}</Text> : null}

      <View style={styles.sections}>
        {brief.sections.map((section, si) => {
          const accent = SECTION_ACCENT[section.kind];
          return (
            <View
              key={section.kind}
              style={[
                styles.section,
                si < brief.sections.length - 1 ? styles.sectionBorder : null,
              ]}
            >
              <View style={[styles.kindWrap, { borderColor: accent }]}>
                <Text style={[styles.kind, { color: accent }]}>
                  {section.kind}
                </Text>
              </View>
              <View style={styles.items}>
                {section.items.map((item, ii) => (
                  <View key={`${section.kind}-${ii}`} style={styles.item}>
                    <Text style={styles.body}>{t(item.body, language)}</Text>
                    {item.evidence.length > 0 ? (
                      <View style={styles.evidenceList}>
                        {item.evidence.map((ev, j) => (
                          <Text key={j} style={styles.evidence}>
                            · {t(ev, language)}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#050508",
    borderWidth: 1,
    borderColor: "rgba(212,175,90,0.35)",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  proBadgeWrap: {
    flexShrink: 0,
    transform: [{ scale: 0.92 }],
  },
  matchTeam: {
    flexShrink: 1,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    transform: [{ skewX: "-8deg" }],
  },
  matchVs: {
    flexShrink: 0,
    fontFamily: OXANIUM_600,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
    textTransform: "lowercase",
    transform: [{ skewX: "-8deg" }],
  },
  sampleNote: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 10,
  },
  sections: {
    gap: 0,
  },
  section: {
    paddingVertical: 12,
    gap: 8,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  kindWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#000",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: "-6deg" }],
  },
  kind: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  items: {
    gap: 10,
  },
  item: {
    gap: 4,
  },
  body: {
    fontFamily: JP_600,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.9)",
    transform: [{ skewX: "-4deg" }],
  },
  evidenceList: {
    gap: 2,
  },
  evidence: {
    fontFamily: OXANIUM_600,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.5)",
  },
});
