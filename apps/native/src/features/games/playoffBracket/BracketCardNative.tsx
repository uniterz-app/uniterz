import { Platform, StyleSheet, Text, View } from "react-native";
import type { League } from "../../../../../../lib/leagues";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import type { BracketCardHitStatus } from "./playoffBracketHitLogic";
import Svg, { Path } from "react-native-svg";

const SCALE = 0.375;
const CARD_W = 160 * SCALE;
const CARD_H = 72 * SCALE;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }
  return { r: 255, g: 255, b: 255 };
}

function lighten(hex: string, amount = 0.18) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function getShortName(teamId?: string | null) {
  if (!teamId) return "TBD";
  const raw = String(teamId).trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, "-");
  return TEAM_SHORT[raw] ?? TEAM_SHORT[normalized] ?? raw.toUpperCase();
}

function isFourWins(wins?: number | string) {
  if (wins === 4) return true;
  if (typeof wins === "string" && wins.trim() === "4") return true;
  return false;
}

function getHitColors(hitStatus: Exclude<BracketCardHitStatus, "none">) {
  if (hitStatus === "winnerAndGames") {
    return { color: "#36e6ff", border: "rgba(54, 230, 255, 0.95)", glow: "rgba(54, 230, 255, 0.58)" };
  }
  return { color: "#ff9f2f", border: "rgba(255, 159, 47, 0.95)", glow: "rgba(255, 159, 47, 0.52)" };
}

function HitCheck({ hitStatus }: { hitStatus: Exclude<BracketCardHitStatus, "none"> }) {
  const hit = getHitColors(hitStatus);
  const box = 18 * SCALE;
  const svg = 10 * SCALE;

  return (
    <View
      style={[
        styles.hitCheck,
        {
          width: box,
          height: box,
          borderColor: hit.border,
          shadowColor: hit.glow,
        },
      ]}
    >
      <Svg width={svg} height={svg} viewBox="0 0 24 24">
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
  wins?: number | string;
  league?: League;
  hitStatus?: BracketCardHitStatus;
};

export default function BracketCardNative({
  teamId,
  wins,
  league = "nba",
  hitStatus = "none",
}: Props) {
  const primary = getTeamPrimaryColor(league, teamId);
  const border = lighten(primary, 0.08);
  const win4 = isFourWins(wins);
  const winsGlow = win4 ? "rgba(255, 216, 77, 0.55)" : primary;

  return (
    <View
      style={[
        styles.card,
        {
          width: CARD_W,
          height: CARD_H,
          borderColor: border,
          shadowColor: primary,
          shadowOpacity: win4 ? 0.55 : 0.25,
          shadowRadius: win4 ? 10 : 4,
        },
      ]}
    >
      {hitStatus !== "none" ? <HitCheck hitStatus={hitStatus} /> : null}
      <View style={styles.inner}>
        <Text style={[styles.name, { fontSize: 38 * SCALE }]}>{getShortName(teamId)}</Text>
        <Text style={[styles.colon, { fontSize: 30 * SCALE }]}>:</Text>
        <Text
          style={[
            styles.wins,
            {
              fontSize: 30 * SCALE,
              color: win4 ? "#ffd84d" : "#f8fbff",
              textShadowColor: winsGlow,
            },
          ]}
        >
          {wins ?? ""}
        </Text>
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
  card: {
    backgroundColor: "rgba(7, 17, 34, 0.9)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 * SCALE,
  },
  name: {
    fontFamily: bebas,
    color: "#f8fbff",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  colon: {
    fontFamily: bebas,
    color: "#f8fbff",
    opacity: 0.85,
    includeFontPadding: false,
  },
  wins: {
    fontFamily: bebas,
    includeFontPadding: false,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  hitCheck: {
    position: "absolute",
    top: 3 * SCALE,
    right: 3 * SCALE,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(6, 12, 24, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
