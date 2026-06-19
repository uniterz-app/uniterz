import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatWcConfederation,
  formatWcRoundReached,
  getWcTeamProfile,
} from "../../../../../../lib/wc/teams";
import { teamIdToCountryName } from "../../../../../../lib/wc/wcCountry";
import CountryFlagNative from "../CountryFlagNative";
import WcFormationPanelNative from "./WcFormationPanelNative";
import type { GamesLanguage, GamesTexts } from "../gamesI18n";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  language: GamesLanguage;
  t: GamesTexts;
};

type TeamSide = "home" | "away";

function TeamCardNative({
  teamId,
  fallbackName,
  language,
  t,
}: {
  teamId: string;
  fallbackName: string;
  language: GamesLanguage;
  t: GamesTexts;
}) {
  const profile = getWcTeamProfile(teamId);
  const displayName =
    teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ?? fallbackName;
  const description =
    language === "ja" ? profile?.description?.ja : profile?.description?.en;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <CountryFlagNative teamId={teamId} variant="inline" />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <View style={styles.metaGrid}>
        {profile?.fifaRank != null ? (
          <MetaRow label="FIFA" value={`#${profile.fifaRank}`} />
        ) : null}
        <MetaRow
          label={t.confederationLabel}
          value={
            profile?.confederation
              ? formatWcConfederation(profile.confederation, language)
              : "—"
          }
        />
        {profile?.manager ? (
          <MetaRow label={t.managerLabel} value={profile.manager} />
        ) : null}
        {profile?.lastWcResult ? (
          <MetaRow
            label={t.lastWcLabel}
            value={`${profile.lastWcResult.year} ${formatWcRoundReached(
              profile.lastWcResult.round,
              language
            )}`}
          />
        ) : null}
      </View>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      <WcFormationPanelNative teamId={teamId} t={t} />
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/** Web `WcTeamProfilePanel` モバイル相当（簡略版） */
export default function WcTeamProfilePanelNative({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  language,
  t,
}: Props) {
  const [side, setSide] = useState<TeamSide>("home");

  useEffect(() => {
    setSide("home");
  }, [homeTeamId, awayTeamId]);

  const homeDisplay =
    teamIdToCountryName(homeTeamId, language === "ja" ? "ja" : "en") ?? homeName;
  const awayDisplay =
    teamIdToCountryName(awayTeamId, language === "ja" ? "ja" : "en") ?? awayName;
  const activeTeamId = side === "home" ? homeTeamId : awayTeamId;
  const activeName = side === "home" ? homeName : awayName;

  return (
    <View style={styles.root}>
      <View style={styles.sideTabs}>
        {(
          [
            { side: "home" as const, teamId: homeTeamId, label: homeDisplay },
            { side: "away" as const, teamId: awayTeamId, label: awayDisplay },
          ] as const
        ).map((item) => {
          const active = side === item.side;
          return (
            <Pressable
              key={item.side}
              onPress={() => setSide(item.side)}
              style={[styles.sideTab, active && styles.sideTabActive]}
            >
              <CountryFlagNative teamId={item.teamId} variant="inline" />
              <Text
                style={[styles.sideTabText, active && styles.sideTabTextActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TeamCardNative
        teamId={activeTeamId}
        fallbackName={activeName}
        language={language}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  sideTabs: {
    flexDirection: "row",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 8,
  },
  sideTab: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sideTabActive: {
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  sideTabText: {
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  sideTabTextActive: {
    color: "#fff",
  },
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  metaGrid: { gap: 6 },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  metaLabel: {
    width: 72,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  description: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 19,
  },
});
