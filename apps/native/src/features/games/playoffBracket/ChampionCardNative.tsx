import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { League } from "../../../../../../lib/leagues";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import type { BracketCardHitStatus } from "./playoffBracketHitLogic";
import Svg, { Path } from "react-native-svg";

function getShortName(teamId?: string | null) {
  if (!teamId) return "TBD";
  const raw = String(teamId).trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, "-");
  return TEAM_SHORT[raw] ?? TEAM_SHORT[normalized] ?? raw.toUpperCase();
}

function getHitColors(hitStatus: Exclude<BracketCardHitStatus, "none">) {
  if (hitStatus === "winnerAndGames") {
    return { color: "#36e6ff", border: "rgba(54, 230, 255, 0.95)" };
  }
  return { color: "#ff9f2f", border: "rgba(255, 159, 47, 0.95)" };
}

function HitCheck({ hitStatus }: { hitStatus: Exclude<BracketCardHitStatus, "none"> }) {
  const hit = getHitColors(hitStatus);
  return (
    <View style={[styles.hitCheck, { borderColor: hit.border }]}>
      <Svg width={10} height={10} viewBox="0 0 24 24">
        <Path
          d="M5 12.5L9.2 16.5L19 7.5"
          stroke={hit.color}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

type Props = {
  teamId?: string | null;
  league?: League;
  hitStatus?: BracketCardHitStatus;
  rouletteTeamIds?: string[];
};

export default function ChampionCardNative({
  teamId,
  league = "nba",
  hitStatus = "none",
  rouletteTeamIds = [],
}: Props) {
  const color = getTeamPrimaryColor(league, teamId);
  const [displayTeamId, setDisplayTeamId] = useState<string | null | undefined>(teamId);

  const roulettePool = useMemo(() => {
    return Array.from(
      new Set(
        rouletteTeamIds
          .map((id) => String(id ?? "").trim().toUpperCase())
          .filter((id) => id.length > 0)
      )
    );
  }, [rouletteTeamIds]);

  useEffect(() => {
    const target = String(teamId ?? "").trim().toUpperCase();
    if (!target || roulettePool.length === 0) {
      setDisplayTeamId(teamId);
      return;
    }

    const order = [...roulettePool].sort(() => Math.random() - 0.5);
    let idx = 0;
    setDisplayTeamId(order[0] ?? target);

    const id = setInterval(() => {
      idx += 1;
      if (idx < order.length) {
        setDisplayTeamId(order[idx]);
        return;
      }
      clearInterval(id);
      setDisplayTeamId(target);
    }, 72);

    return () => clearInterval(id);
  }, [teamId, roulettePool]);

  const name = getShortName(displayTeamId ?? teamId);

  return (
    <View style={styles.wrap}>
      <View style={styles.crownBlock}>
        <MaterialCommunityIcons name="crown" size={17} color="#ffd84d" />
        <Text style={styles.crownLabel}>CHAMPION</Text>
      </View>
      <View style={[styles.card, { borderColor: color, shadowColor: color }]}>
        {hitStatus !== "none" ? <HitCheck hitStatus={hitStatus} /> : null}
        <Text style={styles.name}>{name}</Text>
      </View>
    </View>
  );
}

const bebas = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "sans-serif",
});

const styles = StyleSheet.create({
  wrap: {
    width: 120,
    alignItems: "center",
  },
  crownBlock: {
    alignItems: "center",
    marginBottom: 5,
    gap: 2,
  },
  crownLabel: {
    fontFamily: bebas,
    fontSize: 16,
    letterSpacing: 1.2,
    color: "#ffd84d",
  },
  card: {
    width: 120,
    height: 54,
    backgroundColor: "#071122",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  name: {
    fontFamily: bebas,
    fontSize: 30,
    letterSpacing: 1.2,
    color: "#ffd84d",
    includeFontPadding: false,
  },
  hitCheck: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(6, 12, 24, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
});
