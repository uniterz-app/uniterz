import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatWcConfederation,
  formatWcRoundReached,
  getWcTeamProfile,
  type WcRoundReached,
  type WcTeamProfile,
} from "../../../../../../lib/wc/teams";
import { teamIdToCountryName } from "../../../../../../lib/wc/wcCountry";
import {
  formatLeagueCountryName,
  getClubLeagueIso2,
} from "../../../../../../lib/wc/clubLeagueCountry";
import {
  getWcKeyPlayers,
  isWcCaptainUnconfirmed,
  type WcKeyPlayer,
} from "../../../../../../lib/wc/rosters";
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
  const nickname =
    language === "ja" ? profile?.nickname?.ja : profile?.nickname?.en;
  const description =
    language === "ja" ? profile?.description?.ja : profile?.description?.en;
  const keyPlayers = getWcKeyPlayers(teamId);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <CountryFlagNative teamId={teamId} variant="wcProfile" />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[styles.nickname, !nickname && styles.nicknameEmpty]}
            numberOfLines={1}
          >
            {nickname ?? " "}
          </Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <StatNative
          label="FIFA"
          value={profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"}
          delta={fifaDelta(profile)}
        />
        <StatNative
          label={t.wcAppShort}
          value={profile?.wcAppearances != null ? `${profile.wcAppearances}` : "—"}
        />
        <StatNative
          label={t.titlesShort}
          value={profile?.wcTitles != null ? `${profile.wcTitles}` : "—"}
        />
        <StatNative
          label={t.lastShort}
          value={
            profile?.lastWcResult
              ? lastResultShort(profile.lastWcResult.round, profile.lastWcResult.year, language)
              : "—"
          }
        />
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.metaGrid}>
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
        {isCaptainUnconfirmedNotice(teamId) ? (
          <MetaRow label={t.keyPlayerCaptainShort} value={t.captainNotConfirmed} />
        ) : null}
        {profile?.lastWcResult ? (
          <MetaRow
            label={t.lastWcLabel}
            value={`${profile.lastWcResult.year} · ${formatWcRoundReached(
              profile.lastWcResult.round,
              language
            )}`}
          />
        ) : null}
      </View>
      <WcFormationPanelNative teamId={teamId} t={t} />
      <KeyPlayersNative players={keyPlayers} language={language} t={t} />
    </View>
  );
}

function StatNative({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { dir: "up" | "down" | "flat"; n?: number } | null;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        {delta && delta.dir !== "flat" ? (
          <Text
            style={[
              styles.statDelta,
              delta.dir === "up" ? styles.statDeltaUp : styles.statDeltaDown,
            ]}
            numberOfLines={1}
          >
            {delta.dir === "up" ? "▲" : "▼"}
            {delta.n ? delta.n : ""}
          </Text>
        ) : null}
      </View>
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

function KeyPlayersNative({
  players,
  language,
  t,
}: {
  players: WcKeyPlayer[];
  language: GamesLanguage;
  t: GamesTexts;
}) {
  if (players.length === 0) return null;

  return (
    <View style={styles.keyPlayers}>
      <Text style={styles.sectionLabel}>{t.keyPlayers}</Text>
      <View style={styles.keyPlayerTable}>
        <View style={styles.keyPlayerHeader}>
          <Text style={styles.keyPlayerPosHeader}>{t.keyPlayerPos}</Text>
          <Text style={styles.keyPlayerNameHeader}>
            {t.keyPlayerName} · {t.keyPlayerClub}
          </Text>
        </View>
        {players.map((player) => (
          <KeyPlayerRowNative
            key={`${player.pos}-${player.name}`}
            player={player}
            language={language}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

function KeyPlayerRowNative({
  player,
  language,
  t,
}: {
  player: WcKeyPlayer;
  language: GamesLanguage;
  t: GamesTexts;
}) {
  const leagueIso2 = getClubLeagueIso2(player.club, player.leagueIso2);
  const leagueLabel = leagueIso2 ? formatLeagueCountryName(leagueIso2, language) : null;

  return (
    <View style={styles.keyPlayerRow}>
      <Text style={styles.keyPlayerPos}>{player.pos}</Text>
      <View style={styles.keyPlayerInfo}>
        <View style={styles.keyPlayerNameRow}>
          <Text style={styles.keyPlayerName} numberOfLines={1}>
            {player.name}
          </Text>
          {player.captain ? (
            <Text accessibilityLabel={t.keyPlayerCaptain} style={styles.captainBadge}>
              {t.keyPlayerCaptainShort}
            </Text>
          ) : null}
        </View>
        {player.club ? (
          <View style={styles.clubRow}>
            {leagueIso2 ? (
              <CountryFlagNative
                iso2={leagueIso2}
                variant="inline"
                accessibilityLabel={leagueLabel ?? undefined}
              />
            ) : null}
            <Text style={styles.clubText} numberOfLines={1}>
              {player.club}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function isCaptainUnconfirmedNotice(teamId: string): boolean {
  return isWcCaptainUnconfirmed(teamId);
}

function fifaDelta(
  p: WcTeamProfile | null
): { dir: "up" | "down" | "flat"; n?: number } | null {
  if (!p || p.fifaRank == null || p.fifaRankPrev == null) return null;
  const diff = p.fifaRankPrev - p.fifaRank;
  if (diff > 0) return { dir: "up", n: diff };
  if (diff < 0) return { dir: "down", n: -diff };
  return { dir: "flat" };
}

const ROUND_SHORT_JA: Record<WcRoundReached, string> = {
  Group: "GS",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3rd": "3rd",
  Final: "2nd",
  W: "W",
};

const ROUND_SHORT_EN: Record<WcRoundReached, string> = {
  Group: "GS",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3rd": "3rd",
  Final: "2nd",
  W: "Win",
};

function lastResultShort(round: WcRoundReached, year: number, language: GamesLanguage): string {
  const map = language === "en" ? ROUND_SHORT_EN : ROUND_SHORT_JA;
  return `${map[round]} '${String(year).slice(-2)}`;
}

/** Web `WcTeamProfilePanel` 相当 */
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
              <CountryFlagNative teamId={item.teamId} variant="wcTab" />
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
    gap: 10,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  nickname: {
    minHeight: 14,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: 14,
  },
  nicknameEmpty: {
    opacity: 0,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  statValueRow: {
    marginTop: 2,
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  statValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  statDelta: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  statDeltaUp: {
    color: "#34d399",
  },
  statDeltaDown: {
    color: "#fb7185",
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
  keyPlayers: {
    gap: 8,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  keyPlayerTable: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },
  keyPlayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  keyPlayerPosHeader: {
    width: 36,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  keyPlayerNameHeader: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  keyPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  keyPlayerPos: {
    width: 36,
    height: 22,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    lineHeight: 22,
    textAlign: "center",
    textTransform: "uppercase",
  },
  keyPlayerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  keyPlayerNameRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  keyPlayerName: {
    minWidth: 0,
    flexShrink: 1,
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
  },
  captainBadge: {
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "rgba(252,211,77,0.92)",
    color: "rgba(0,0,0,0.85)",
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 12,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  clubRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clubText: {
    minWidth: 0,
    flexShrink: 1,
    color: "rgba(255,255,255,0.56)",
    fontSize: 10.5,
    fontWeight: "600",
  },
});
